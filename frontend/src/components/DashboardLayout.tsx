import { A } from "@solidjs/router";
import { createSignal, Show, JSX } from "solid-js";
import { useCurrentUser, getLogoutUrl } from "~/lib/auth";

interface DashboardLayoutProps {
  children: JSX.Element;
  currentPage?: string;
  pageTitle: string;
}

export default function DashboardLayout(props: DashboardLayoutProps) {
  const { user } = useCurrentUser();
  const [sidebarCollapsed, setSidebarCollapsed] = createSignal(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = createSignal(false);

  const navSections = [
    {
      title: "Overview",
      items: [
        {
          url: "/dashboard",
          label: "Dashboard",
          icon: (
            <svg class="sidebar-icon w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z" />
            </svg>
          ),
        },
        {
          url: "/dashboard/analytics",
          label: "Analytics",
          icon: (
            <svg class="sidebar-icon w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          ),
        },
      ],
    },
    {
      title: "Streaming",
      items: [
        {
          url: "/dashboard/stream",
          label: "Stream",
          icon: (
            <svg class="sidebar-icon w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          ),
        },
        {
          url: "/dashboard/chat-history",
          label: "Chat History",
          icon: (
            <svg class="sidebar-icon w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          ),
        },
        {
          url: "/dashboard/viewers",
          label: "Viewers",
          icon: (
            <svg class="sidebar-icon w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          ),
        },
        {
          url: "/dashboard/stream-history",
          label: "Stream History",
          icon: (
            <svg class="sidebar-icon w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        },
      ],
    },
    {
      title: "Widgets",
      items: [
        {
          url: "/dashboard/widgets",
          label: "Widgets",
          icon: (
            <svg class="sidebar-icon w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14-7H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z" />
            </svg>
          ),
        },
        {
          url: "/dashboard/smart-canvas",
          label: "Smart Canvas",
          icon: (
            <svg class="sidebar-icon w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          ),
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          url: "/dashboard/settings",
          label: "Settings",
          icon: (
            <svg class="sidebar-icon w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
        },
      ],
    },
  ];

  return (
    <div class="flex h-screen">
      {/* Mobile sidebar backdrop */}
      <Show when={mobileSidebarOpen()}>
        <div
          class="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      </Show>

      {/* Sidebar */}
      <div
        class={`sidebar fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out bg-gray-900 text-white flex flex-col overflow-y-auto ${
          sidebarCollapsed() ? "w-20" : "w-64"
        } ${
          mobileSidebarOpen() ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
        style={{
          "scrollbar-width": "none",
          "-ms-overflow-style": "none",
        }}
      >
        {/* Sidebar Header */}
        <div class="flex items-center justify-center p-4 border-b border-gray-700 relative">
          <A href="/" class="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <img src="/images/logo-white.png" alt="Streampai Logo" class="w-8 h-8" />
            <Show when={!sidebarCollapsed()}>
              <span class="text-xl font-bold text-white">Streampai</span>
            </Show>
          </A>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed())}
            class="hidden md:block absolute right-2 p-1.5 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <Show
                when={!sidebarCollapsed()}
                fallback={
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                }
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </Show>
            </svg>
          </button>
        </div>

        {/* Main Navigation */}
        <nav class="flex-1 mt-6">
          {navSections.map((section) => (
            <div class="px-4 mb-8">
              <Show when={!sidebarCollapsed()}>
                <h3 class="sidebar-text text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  {section.title}
                </h3>
              </Show>
              <div class="space-y-2">
                {section.items.map((item) => (
                  <A
                    href={item.url}
                    class={`nav-item flex items-center p-3 rounded-lg transition-colors ${
                      props.currentPage === item.label.toLowerCase().replace(" ", "-")
                        ? "bg-purple-600 text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    } ${sidebarCollapsed() ? "justify-center" : ""}`}
                    title={item.label}
                  >
                    {item.icon}
                    <Show when={!sidebarCollapsed()}>
                      <span class="sidebar-text ml-3">{item.label}</span>
                    </Show>
                  </A>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Logout Section */}
        <div class="p-4 border-t border-gray-700 space-y-2">
          <Show when={user()?.isModerator}>
            <A
              href="/dashboard/moderate"
              class={`nav-item flex items-center p-3 rounded-lg text-gray-300 hover:bg-blue-600 hover:text-white transition-colors w-full ${
                sidebarCollapsed() ? "justify-center" : ""
              }`}
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <Show when={!sidebarCollapsed()}>
                <span class="sidebar-text ml-3">Moderate</span>
              </Show>
            </A>
          </Show>

          <a
            href={getLogoutUrl()}
            class={`nav-item flex items-center p-3 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors w-full ${
              sidebarCollapsed() ? "justify-center" : ""
            }`}
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <Show when={!sidebarCollapsed()}>
              <span class="sidebar-text ml-3">Sign Out</span>
            </Show>
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div
        class={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
          sidebarCollapsed() ? "md:ml-20" : "md:ml-64"
        }`}
      >
        {/* Top Bar */}
        <header class="bg-white shadow-sm border-b border-gray-200">
          <div class="flex items-center justify-between px-6 py-4">
            <div class="flex items-center space-x-4">
              <button
                onClick={() => setMobileSidebarOpen(!mobileSidebarOpen())}
                class="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <h1 class="text-2xl font-semibold text-gray-900">{props.pageTitle}</h1>
            </div>

            <div class="flex items-center space-x-4">
              <div class="flex items-center space-x-3">
                <A
                  href="/dashboard/settings"
                  class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center overflow-hidden hover:bg-purple-600 transition-colors cursor-pointer"
                  title="Go to Settings"
                >
                  <Show
                    when={user()?.displayAvatar}
                    fallback={
                      <span class="text-white font-medium text-sm">
                        {user()?.email?.[0]?.toUpperCase() || "U"}
                      </span>
                    }
                  >
                    <img
                      src={user()!.displayAvatar!}
                      alt="User Avatar"
                      class="w-full h-full object-cover"
                    />
                  </Show>
                </A>
                <div class="hidden md:block">
                  <p class="text-sm font-medium text-gray-900">
                    {user()?.email || "Unknown User"}
                  </p>
                  <p class="text-xs text-gray-500">Free Plan</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main class="flex-1 overflow-y-auto bg-gray-50 p-6">
          {props.children}
        </main>
      </div>
    </div>
  );
}
