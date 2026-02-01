import { useLocation, useNavigate } from "@solidjs/router";
import {
  type JSX,
  Show,
  createEffect,
  createMemo,
  createSignal,
} from "solid-js";
import { useTranslation } from "~/i18n";
import { useCurrentUser } from "~/lib/auth";
import {
  BreadcrumbProvider,
  useBreadcrumbContext,
} from "~/lib/BreadcrumbContext";
import { useUserPreferencesForUser } from "~/lib/useElectric";
import Header from "./dashboard/Header";
import { getCurrentPage, pageTitleKeyMap } from "./dashboard/navConfig";
import Sidebar, { MobileSidebar } from "./dashboard/Sidebar";

interface DashboardLayoutProps {
  children: JSX.Element;
}

export default function DashboardLayout(props: DashboardLayoutProps) {
  return (
    <BreadcrumbProvider>
      <DashboardLayoutInner>{props.children}</DashboardLayoutInner>
    </BreadcrumbProvider>
  );
}

function SupportChatButton() {
  const [open, setOpen] = createSignal(false);

  return (
    <div class="fixed right-4 bottom-4 z-50">
      {/* Panel - positioned above button, always in DOM for transitions */}
      <div
        class={`absolute right-0 bottom-12 w-72 origin-bottom-right rounded-xl border border-neutral-200 bg-white shadow-lg transition-all duration-200 ease-out ${
          open()
            ? "scale-100 opacity-100"
            : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        <div class="flex items-center justify-between border-neutral-100 border-b px-4 py-3">
          <span class="font-medium text-neutral-900 text-sm">
            Chat with Streampai
          </span>
          <button
            class="text-neutral-400 transition-colors hover:text-neutral-600"
            onClick={() => setOpen(false)}
            type="button"
          >
            <svg
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M6 18L18 6M6 6l12 12"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
              />
            </svg>
          </button>
        </div>
        <div class="px-4 py-8 text-center">
          <p class="text-neutral-400 text-sm">Coming soon</p>
        </div>
      </div>

      {/* Button - always stays in place */}
      <button
        class={`flex h-10 w-10 items-center justify-center rounded-full shadow-md transition-all duration-200 ${
          open()
            ? "bg-neutral-200 text-neutral-600 hover:bg-neutral-300"
            : "bg-primary text-white hover:bg-primary-hover"
        }`}
        onClick={() => setOpen(!open())}
        title="Support chat"
        type="button"
      >
        <svg
          class={`h-5 w-5 transition-transform duration-200 ${open() ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <Show
            fallback={
              <path
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
              />
            }
            when={open()}
          >
            <path
              d="M6 18L18 6M6 6l12 12"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
            />
          </Show>
        </svg>
      </button>
    </div>
  );
}

function DashboardLayoutInner(props: DashboardLayoutProps) {
  const { t } = useTranslation();
  const { user, isLoading } = useCurrentUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = createSignal(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = createSignal(false);
  const { items: breadcrumbItems } = useBreadcrumbContext();

  // Redirect to login if user is not authenticated
  createEffect(() => {
    if (!isLoading() && !user()) {
      navigate("/login", { replace: true });
    }
  });

  // Use Electric-synced preferences for real-time avatar/name updates
  const prefs = useUserPreferencesForUser(() => user()?.id);

  // Auto-detect current page from URL
  const currentPage = createMemo(() => getCurrentPage(location.pathname));

  // Extract page title from current page (translated)
  const pageTitle = createMemo(() => {
    const page = currentPage();
    const key = pageTitleKeyMap[page] || "dashboardNav.dashboard";
    return t(key);
  });

  // Wait for auth to complete before rendering
  // Electric sync (prefs) can load in the background - header shows skeleton fallback
  const isFullyLoaded = () => !isLoading() && user();

  return (
    <Show
      fallback={
        <div class="flex h-screen items-center justify-center bg-neutral-50">
          <div class="text-center">
            <div class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary" />
            <p class="text-neutral-600">{t("common.loading")}</p>
          </div>
        </div>
      }
      when={isFullyLoaded()}
    >
      <div class="flex h-screen">
        {/* Mobile sidebar backdrop */}
        <Show when={mobileSidebarOpen()}>
          <button
            aria-label={t("dashboard.closeSidebar")}
            class="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
            type="button"
          />
        </Show>

        {/* Desktop Sidebar */}
        <Sidebar
          collapsed={sidebarCollapsed}
          currentPage={currentPage}
          isAdmin={user()?.role === "admin"}
          isModerator={user()?.isModerator ?? false}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed())}
        />

        {/* Mobile Sidebar */}
        <MobileSidebar
          collapsed={sidebarCollapsed}
          currentPage={currentPage}
          isAdmin={user()?.role === "admin"}
          isModerator={user()?.isModerator ?? false}
          onClose={() => setMobileSidebarOpen(false)}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed())}
          open={mobileSidebarOpen}
        />

        {/* Main Content Wrapper */}
        <div
          class={`flex min-w-0 flex-1 flex-col transition-all duration-300 ${
            sidebarCollapsed() ? "md:ml-20" : "md:ml-72"
          }`}
        >
          {/* Top Header */}
          <Header
            breadcrumbItems={breadcrumbItems}
            onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
            pageTitle={pageTitle}
            prefs={prefs}
            user={user()}
          />

          {/* Main Content Area */}
          <main class="flex-1 overflow-y-auto overflow-x-hidden bg-neutral-50 p-6">
            {props.children}
          </main>
        </div>

        <SupportChatButton />
      </div>
    </Show>
  );
}
