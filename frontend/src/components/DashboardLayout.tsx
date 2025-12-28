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
				<div class="flex h-screen items-center justify-center bg-gray-50">
					<div class="text-center">
						<div class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
						<p class="text-gray-600">{t("common.loading")}</p>
					</div>
				</div>
			}
			when={isFullyLoaded()}>
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
					class={`flex flex-1 flex-col transition-all duration-300 ${
						sidebarCollapsed() ? "md:ml-20" : "md:ml-64"
					}`}>
					{/* Top Header */}
					<Header
						breadcrumbItems={breadcrumbItems}
						onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
						pageTitle={pageTitle}
						prefs={prefs}
						user={user()}
					/>

					{/* Main Content Area */}
					<main class="flex-1 overflow-y-auto bg-gray-50 p-6">
						{props.children}
					</main>
				</div>
			</div>
		</Show>
	);
}
