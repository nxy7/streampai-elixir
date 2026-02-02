import type { JSX } from "solid-js";

export interface NavItem {
  url: string;
  labelKey: string;
  icon: JSX.Element;
  comingSoon?: boolean;
}

export interface NavSection {
  titleKey: string;
  items: NavItem[];
}

// Icon components for navigation
export const DashboardIcon = () => (
  <svg
    aria-hidden="true"
    class="sidebar-icon h-6 w-6 shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
    />
    <path
      d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
    />
  </svg>
);

export const AnalyticsIcon = () => (
  <svg
    aria-hidden="true"
    class="sidebar-icon h-6 w-6 shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
    />
  </svg>
);

export const StreamIcon = () => (
  <svg
    aria-hidden="true"
    class="sidebar-icon h-6 w-6 shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
    />
  </svg>
);

export const ChatHistoryIcon = () => (
  <svg
    aria-hidden="true"
    class="sidebar-icon h-6 w-6 shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
    />
  </svg>
);

export const ViewersIcon = () => (
  <svg
    aria-hidden="true"
    class="sidebar-icon h-6 w-6 shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
    />
    <path
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
    />
  </svg>
);

export const StreamHistoryIcon = () => (
  <svg
    aria-hidden="true"
    class="sidebar-icon h-6 w-6 shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
    />
  </svg>
);

export const WidgetsIcon = () => (
  <svg
    aria-hidden="true"
    class="sidebar-icon h-6 w-6 shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      d="M19 11H5m14-7H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
    />
  </svg>
);

export const SmartCanvasIcon = () => (
  <svg
    aria-hidden="true"
    class="sidebar-icon h-6 w-6 shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
    />
  </svg>
);

export const SettingsIcon = () => (
  <svg
    aria-hidden="true"
    class="sidebar-icon h-6 w-6 shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
    />
    <path
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
    />
  </svg>
);

export const UsersIcon = () => (
  <svg
    aria-hidden="true"
    class="sidebar-icon h-6 w-6 shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
    />
  </svg>
);

export const SupportIcon = () => (
  <svg
    aria-hidden="true"
    class="sidebar-icon h-6 w-6 shrink-0"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    viewBox="0 0 24 24"
  >
    <path
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

export const NotificationsIcon = () => (
  <svg
    aria-hidden="true"
    class="sidebar-icon h-6 w-6 shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
    />
  </svg>
);

export const ModerateIcon = () => (
  <svg
    aria-hidden="true"
    class="h-5 w-5 shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
    />
  </svg>
);

export const LogoutIcon = () => (
  <svg
    aria-hidden="true"
    class="h-5 w-5 shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
    />
  </svg>
);

export const TimerIcon = () => (
  <svg
    aria-hidden="true"
    class="sidebar-icon h-6 w-6 shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
    />
  </svg>
);

export const HooksIcon = () => (
  <svg
    aria-hidden="true"
    class="sidebar-icon h-6 w-6 shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
    />
  </svg>
);

export const ChatBotIcon = () => (
  <svg
    aria-hidden="true"
    class="sidebar-icon h-6 w-6 shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a2.25 2.25 0 01-1.59.659H9.06a2.25 2.25 0 01-1.591-.659L5 14.5m14 0V17a2 2 0 01-2 2H7a2 2 0 01-2-2v-2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
    />
  </svg>
);

export const ClipsIcon = () => (
  <svg
    aria-hidden="true"
    class="sidebar-icon h-6 w-6 shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
    />
    <path
      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
    />
  </svg>
);

export const ScheduleIcon = () => (
  <svg
    aria-hidden="true"
    class="sidebar-icon h-6 w-6 shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
    />
  </svg>
);

export const MenuIcon = () => (
  <svg
    aria-hidden="true"
    class="h-6 w-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      d="M4 6h16M4 12h16M4 18h16"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
    />
  </svg>
);

// Navigation sections configuration
export const getNavSections = (): NavSection[] => [
  {
    titleKey: "sidebar.overview",
    items: [
      {
        url: "/dashboard",
        labelKey: "dashboardNav.dashboard",
        icon: <DashboardIcon />,
      },
      {
        url: "/dashboard/analytics",
        labelKey: "dashboardNav.analytics",
        icon: <AnalyticsIcon />,
      },
    ],
  },
  {
    titleKey: "sidebar.streaming",
    items: [
      {
        url: "/dashboard/stream",
        labelKey: "dashboardNav.stream",
        icon: <StreamIcon />,
      },
      {
        url: "/dashboard/chat-history",
        labelKey: "dashboardNav.chatHistory",
        icon: <ChatHistoryIcon />,
      },
      {
        url: "/dashboard/viewers",
        labelKey: "dashboardNav.viewers",
        icon: <ViewersIcon />,
      },
      {
        url: "/dashboard/stream-history",
        labelKey: "dashboardNav.streamHistory",
        icon: <StreamHistoryIcon />,
      },
    ],
  },
  {
    titleKey: "sidebar.widgets",
    items: [
      {
        url: "/dashboard/widgets",
        labelKey: "dashboardNav.widgets",
        icon: <WidgetsIcon />,
      },
      {
        url: "/dashboard/scenes",
        labelKey: "dashboardNav.scenes",
        icon: <SmartCanvasIcon />,
      },
    ],
  },
  {
    titleKey: "sidebar.tools",
    items: [
      {
        url: "/dashboard/tools/timers",
        labelKey: "dashboardNav.timers",
        icon: <TimerIcon />,
      },
      {
        url: "/dashboard/tools/hooks",
        labelKey: "dashboardNav.hooks",
        icon: <HooksIcon />,
        comingSoon: true,
      },
      {
        url: "/dashboard/tools/chatbot",
        labelKey: "dashboardNav.chatBot",
        icon: <ChatBotIcon />,
        comingSoon: true,
      },
      {
        url: "/dashboard/tools/clips",
        labelKey: "dashboardNav.streamClips",
        icon: <ClipsIcon />,
        comingSoon: true,
      },
      {
        url: "/dashboard/tools/schedule",
        labelKey: "dashboardNav.schedule",
        icon: <ScheduleIcon />,
        comingSoon: true,
      },
    ],
  },
  {
    titleKey: "sidebar.account",
    items: [
      {
        url: "/dashboard/settings",
        labelKey: "dashboardNav.settings",
        icon: <SettingsIcon />,
      },
    ],
  },
];

export const getAdminSections = (): NavSection[] => [
  {
    titleKey: "sidebar.admin",
    items: [
      {
        url: "/dashboard/admin/users",
        labelKey: "dashboardNav.users",
        icon: <UsersIcon />,
      },
      {
        url: "/dashboard/admin/notifications",
        labelKey: "dashboardNav.notifications",
        icon: <NotificationsIcon />,
      },
      {
        url: "/dashboard/admin/support",
        labelKey: "dashboardNav.support",
        icon: <SupportIcon />,
      },
    ],
  },
];

// Map URL path to current page identifier
export const getCurrentPage = (pathname: string): string => {
  if (pathname === "/dashboard") return "dashboard";
  if (pathname.startsWith("/dashboard/analytics")) return "analytics";
  if (pathname.startsWith("/dashboard/stream-history")) return "stream-history";
  if (pathname.startsWith("/dashboard/stream")) return "stream";
  if (pathname.startsWith("/dashboard/chat-history")) return "chat-history";
  if (pathname.startsWith("/dashboard/viewers")) return "viewers";
  if (pathname.startsWith("/dashboard/widgets")) return "widgets";
  if (pathname.startsWith("/dashboard/scenes")) return "scenes";
  if (pathname.startsWith("/dashboard/tools/timers")) return "timers";
  if (pathname.startsWith("/dashboard/tools")) return "tools";
  if (pathname.startsWith("/dashboard/settings")) return "settings";
  if (pathname.startsWith("/dashboard/admin/users")) return "users";
  if (pathname.startsWith("/dashboard/admin/notifications"))
    return "notifications";
  if (pathname.startsWith("/dashboard/admin/support")) return "support";
  return "";
};

// Page title translation key map
export const pageTitleKeyMap: Record<string, string> = {
  dashboard: "dashboardNav.dashboard",
  analytics: "dashboardNav.analytics",
  stream: "dashboardNav.stream",
  "chat-history": "dashboardNav.chatHistory",
  viewers: "dashboardNav.viewers",
  "stream-history": "dashboardNav.streamHistory",
  widgets: "dashboardNav.widgets",
  scenes: "dashboardNav.scenes",
  timers: "dashboardNav.timers",
  tools: "sidebar.tools",
  settings: "dashboardNav.settings",
  users: "dashboardNav.users",
  notifications: "dashboardNav.notifications",
  support: "dashboardNav.support",
};
