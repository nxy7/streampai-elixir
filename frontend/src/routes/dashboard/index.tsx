import { Title } from "@solidjs/meta";
import { Show, For, createSignal, createMemo } from "solid-js";
import { A } from "@solidjs/router";
import { useCurrentUser, getLoginUrl } from "~/lib/auth";
import {
  useUserPreferencesForUser,
  useRecentUserChatMessages,
  useRecentUserStreamEvents,
  useRecentUserLivestreams,
  useDashboardStats,
  useUserStreamEvents,
  useUserChatMessages,
} from "~/lib/useElectric";
import { card, text, badge } from "~/styles/design-system";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function getEventIcon(type: string) {
  switch (type) {
    case "donation":
      return (
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "follow":
      return (
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      );
    case "subscription":
      return (
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      );
    case "raid":
      return (
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    default:
      return (
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
  }
}

function getEventColor(type: string) {
  switch (type) {
    case "donation": return "bg-green-100 text-green-600";
    case "follow": return "bg-pink-100 text-pink-600";
    case "subscription": return "bg-yellow-100 text-yellow-600";
    case "raid": return "bg-purple-100 text-purple-600";
    default: return "bg-blue-100 text-blue-600";
  }
}

function getStreamStatusBadge(status: string) {
  switch (status) {
    case "live": return badge.success;
    case "ended": return badge.default;
    default: return badge.warning;
  }
}

// Feature 1: Stream Health Monitor Component
function StreamHealthMonitor() {
  // Simulated stream health data - in production this would come from actual stream metrics
  const [connectionQuality] = createSignal<"excellent" | "good" | "fair" | "poor">("excellent");
  const [bitrate] = createSignal(6000);
  const [droppedFrames] = createSignal(0);
  const [uptime] = createSignal("2h 34m");

  const qualityColor = () => {
    switch (connectionQuality()) {
      case "excellent": return "text-green-500";
      case "good": return "text-blue-500";
      case "fair": return "text-yellow-500";
      case "poor": return "text-red-500";
    }
  };

  const qualityBg = () => {
    switch (connectionQuality()) {
      case "excellent": return "bg-green-500";
      case "good": return "bg-blue-500";
      case "fair": return "bg-yellow-500";
      case "poor": return "bg-red-500";
    }
  };

  return (
    <div class={`${card.base} p-4`} data-testid="stream-health-monitor">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold text-gray-900 flex items-center gap-2">
          <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Stream Health
        </h3>
        <div class={`flex items-center gap-1.5 px-2 py-1 rounded-full ${qualityBg()} bg-opacity-10`}>
          <div class={`w-2 h-2 rounded-full ${qualityBg()} animate-pulse`} />
          <span class={`text-xs font-medium capitalize ${qualityColor()}`}>{connectionQuality()}</span>
        </div>
      </div>
      <div class="grid grid-cols-3 gap-3">
        <div class="text-center p-2 bg-gray-50 rounded-lg">
          <p class="text-lg font-bold text-gray-900">{bitrate()} kbps</p>
          <p class="text-xs text-gray-500">Bitrate</p>
        </div>
        <div class="text-center p-2 bg-gray-50 rounded-lg">
          <p class="text-lg font-bold text-gray-900">{droppedFrames()}</p>
          <p class="text-xs text-gray-500">Dropped</p>
        </div>
        <div class="text-center p-2 bg-gray-50 rounded-lg">
          <p class="text-lg font-bold text-gray-900">{uptime()}</p>
          <p class="text-xs text-gray-500">Uptime</p>
        </div>
      </div>
    </div>
  );
}

// Feature 2: Quick Actions Floating Panel
function QuickActionsPanel(props: { onTestAlert: () => void }) {
  const [isExpanded, setIsExpanded] = createSignal(false);

  return (
    <div class="fixed bottom-6 right-6 z-50" data-testid="quick-actions-panel">
      <Show when={isExpanded()}>
        <div class="absolute bottom-16 right-0 bg-white rounded-xl shadow-xl border border-gray-200 p-3 min-w-[200px] animate-fade-in">
          <div class="space-y-2">
            <button
              onClick={props.onTestAlert}
              class="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-purple-50 text-gray-700 hover:text-purple-700 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span class="text-sm font-medium">Test Alert</span>
            </button>
            <A
              href="/dashboard/widgets"
              class="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-purple-50 text-gray-700 hover:text-purple-700 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
              </svg>
              <span class="text-sm font-medium">Widgets</span>
            </A>
            <A
              href="/dashboard/stream"
              class="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 text-gray-700 hover:text-green-700 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span class="text-sm font-medium">Go Live</span>
            </A>
            <A
              href="/dashboard/settings"
              class="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span class="text-sm font-medium">Settings</span>
            </A>
          </div>
        </div>
      </Show>
      <button
        onClick={() => setIsExpanded(!isExpanded())}
        class={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isExpanded()
            ? "bg-gray-700 rotate-45"
            : "bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        }`}
      >
        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}

// Feature 3: Viewer Engagement Score Component
function ViewerEngagementScore(props: {
  chatMessages: number;
  follows: number;
  donations: number;
  totalDonationAmount: number;
}) {
  const engagementScore = createMemo(() => {
    // Calculate engagement score based on various metrics
    // Weighted formula: chat activity (30%), follows (30%), donations count (20%), donation value (20%)
    const chatScore = Math.min(props.chatMessages / 100, 1) * 30;
    const followScore = Math.min(props.follows / 50, 1) * 30;
    const donationCountScore = Math.min(props.donations / 20, 1) * 20;
    const donationValueScore = Math.min(props.totalDonationAmount / 500, 1) * 20;
    return Math.round(chatScore + followScore + donationCountScore + donationValueScore);
  });

  const scoreColor = () => {
    const score = engagementScore();
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-gray-600";
  };

  const scoreGradient = () => {
    const score = engagementScore();
    if (score >= 80) return "from-green-500 to-emerald-500";
    if (score >= 60) return "from-blue-500 to-cyan-500";
    if (score >= 40) return "from-yellow-500 to-orange-500";
    return "from-gray-400 to-gray-500";
  };

  const scoreLabel = () => {
    const score = engagementScore();
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Growing";
    return "Building";
  };

  return (
    <div class={`${card.base} p-4`} data-testid="engagement-score">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-semibold text-gray-900 flex items-center gap-2">
          <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          Engagement Score
        </h3>
        <span class={`text-xs font-medium px-2 py-1 rounded-full bg-gray-100 ${scoreColor()}`}>
          {scoreLabel()}
        </span>
      </div>
      <div class="flex items-center gap-4">
        <div class={`relative w-16 h-16 rounded-full bg-linear-to-r ${scoreGradient()} p-1`}>
          <div class="w-full h-full rounded-full bg-white flex items-center justify-center">
            <span class={`text-xl font-bold ${scoreColor()}`}>{engagementScore()}</span>
          </div>
        </div>
        <div class="flex-1">
          <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              class={`h-full bg-linear-to-r ${scoreGradient()} transition-all duration-500`}
              style={{ width: `${engagementScore()}%` }}
            />
          </div>
          <div class="flex justify-between mt-2 text-xs text-gray-500">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Feature 4: Stream Goals Tracker Component
function StreamGoalsTracker(props: {
  currentFollowers: number;
  currentDonations: number;
  currentMessages: number;
}) {
  // Example goals - in production these would be configurable
  const goals = [
    {
      id: "followers",
      label: "Daily Followers",
      current: Math.min(props.currentFollowers, 100),
      target: 100,
      icon: "heart",
      color: "pink"
    },
    {
      id: "donations",
      label: "Donation Goal",
      current: Math.min(props.currentDonations, 500),
      target: 500,
      icon: "dollar",
      color: "green",
      prefix: "$"
    },
    {
      id: "chat",
      label: "Chat Activity",
      current: Math.min(props.currentMessages, 1000),
      target: 1000,
      icon: "chat",
      color: "blue"
    },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case "pink": return { bg: "bg-pink-500", light: "bg-pink-100", text: "text-pink-600" };
      case "green": return { bg: "bg-green-500", light: "bg-green-100", text: "text-green-600" };
      case "blue": return { bg: "bg-blue-500", light: "bg-blue-100", text: "text-blue-600" };
      default: return { bg: "bg-gray-500", light: "bg-gray-100", text: "text-gray-600" };
    }
  };

  return (
    <div class={card.base} data-testid="stream-goals">
      <div class="px-4 py-3 border-b border-gray-100">
        <h3 class="font-semibold text-gray-900 flex items-center gap-2">
          <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          Stream Goals
        </h3>
      </div>
      <div class="p-4 space-y-4">
        <For each={goals}>
          {(goal) => {
            const colors = getColorClasses(goal.color);
            const percentage = Math.round((goal.current / goal.target) * 100);
            return (
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-700">{goal.label}</span>
                  <span class={`text-sm font-bold ${colors.text}`}>
                    {goal.prefix || ""}{goal.current} / {goal.prefix || ""}{goal.target}
                  </span>
                </div>
                <div class={`h-2 rounded-full overflow-hidden ${colors.light}`}>
                  <div
                    class={`h-full rounded-full ${colors.bg} transition-all duration-500`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <Show when={percentage >= 100}>
                  <div class="flex items-center gap-1 text-xs text-green-600">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Goal reached!
                  </div>
                </Show>
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
}

// Feature 5: Activity Feed with Filters
type EventFilter = "all" | "donation" | "follow" | "subscription" | "raid";

function ActivityFeed(props: {
  events: Array<{
    id: string;
    type: string;
    data: Record<string, unknown>;
    inserted_at: string;
  }>;
}) {
  const [filter, setFilter] = createSignal<EventFilter>("all");

  const filteredEvents = createMemo(() => {
    const f = filter();
    if (f === "all") return props.events.slice(0, 10);
    return props.events.filter(e => e.type === f).slice(0, 10);
  });

  const filterButtons: { value: EventFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "donation", label: "Donations" },
    { value: "follow", label: "Follows" },
    { value: "subscription", label: "Subs" },
    { value: "raid", label: "Raids" },
  ];

  return (
    <div class={card.base} data-testid="activity-feed">
      <div class="px-4 py-3 border-b border-gray-100">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-gray-900 flex items-center gap-2">
            <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Activity Feed
          </h3>
          <span class="text-xs text-gray-500">{filteredEvents().length} events</span>
        </div>
        <div class="flex gap-1 flex-wrap">
          <For each={filterButtons}>
            {(btn) => (
              <button
                onClick={() => setFilter(btn.value)}
                class={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                  filter() === btn.value
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                data-testid={`filter-${btn.value}`}
              >
                {btn.label}
              </button>
            )}
          </For>
        </div>
      </div>
      <div class="max-h-[300px] overflow-y-auto">
        <Show
          when={filteredEvents().length > 0}
          fallback={
            <div class="px-4 py-8 text-center">
              <svg class="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p class="text-gray-500 text-sm">No {filter() === "all" ? "" : filter()} events</p>
            </div>
          }
        >
          <div class="divide-y divide-gray-50">
            <For each={filteredEvents()}>
              {(event) => (
                <div class="px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3">
                  <div class={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${getEventColor(event.type)}`}>
                    {getEventIcon(event.type)}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="font-medium text-gray-900 text-sm capitalize">{event.type}</span>
                      <span class="text-gray-400 text-xs">{formatTimeAgo(event.inserted_at)}</span>
                    </div>
                    <p class="text-gray-500 text-xs truncate">
                      {(event.data?.username as string) || "Anonymous"}
                      <Show when={event.type === "donation" && event.data?.amount}>
                        {" - "}${Number(event.data?.amount).toFixed(2)}
                      </Show>
                    </p>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, isLoading } = useCurrentUser();
  const prefs = useUserPreferencesForUser(() => user()?.id);
  const greeting = getGreeting();

  // User-scoped data
  const recentMessages = useRecentUserChatMessages(() => user()?.id, 5);
  const recentEvents = useRecentUserStreamEvents(() => user()?.id, 5);
  const recentStreams = useRecentUserLivestreams(() => user()?.id, 3);
  const stats = useDashboardStats(() => user()?.id);

  // Full events list for Activity Feed
  const allEventsQuery = useUserStreamEvents(() => user()?.id);
  const allEvents = createMemo(() => {
    const events = allEventsQuery.data();
    return [...events].sort(
      (a, b) => new Date(b.inserted_at).getTime() - new Date(a.inserted_at).getTime()
    );
  });

  // Alert test handler
  const [showTestAlert, setShowTestAlert] = createSignal(false);
  const handleTestAlert = () => {
    setShowTestAlert(true);
    setTimeout(() => setShowTestAlert(false), 3000);
  };

  return (
    <>
      <Title>Dashboard - Streampai</Title>
      <Show
        when={!isLoading()}
        fallback={
          <div class="flex items-center justify-center min-h-screen bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900">
            <div class="text-white text-xl">Loading...</div>
          </div>
        }
      >
        <Show
          when={user()}
          fallback={
            <div class="min-h-screen bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
              <div class="text-center py-12">
                <h2 class="text-2xl font-bold text-white mb-4">
                  Not Authenticated
                </h2>
                <p class="text-gray-300 mb-6">
                  Please sign in to access the dashboard.
                </p>
                <a
                  href={getLoginUrl()}
                  class="inline-block px-6 py-3 bg-linear-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                >
                  Sign In
                </a>
              </div>
            </div>
          }
        >
          <>
            <div class="space-y-6">
              {/* Header with greeting */}
              <div class="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                <div>
                  <h1 class="text-3xl font-bold text-gray-900 mb-2">
                    {greeting}, {prefs.data()?.name || user()?.name || "Streamer"}!
                  </h1>
                  <p class="text-gray-600">
                    Welcome to your Streampai dashboard.
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class={`${card.base} p-4`}>
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div>
                      <p class="text-2xl font-bold text-gray-900">{stats.totalMessages()}</p>
                      <p class="text-sm text-gray-500">Messages</p>
                    </div>
                  </div>
                </div>

                <div class={`${card.base} p-4`}>
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <div>
                      <p class="text-2xl font-bold text-gray-900">{stats.uniqueViewers()}</p>
                      <p class="text-sm text-gray-500">Viewers</p>
                    </div>
                  </div>
                </div>

                <div class={`${card.base} p-4`}>
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                      <svg class="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <div>
                      <p class="text-2xl font-bold text-gray-900">{stats.followCount()}</p>
                      <p class="text-sm text-gray-500">Followers</p>
                    </div>
                  </div>
                </div>

                <div class={`${card.base} p-4`}>
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p class="text-2xl font-bold text-gray-900">
                        ${stats.totalDonations().toFixed(2)}
                      </p>
                      <p class="text-sm text-gray-500">Donations</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* New Features Row: Stream Health, Engagement Score, Goals */}
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StreamHealthMonitor />
                <ViewerEngagementScore
                  chatMessages={stats.totalMessages()}
                  follows={stats.followCount()}
                  donations={stats.donationCount()}
                  totalDonationAmount={stats.totalDonations()}
                />
                <StreamGoalsTracker
                  currentFollowers={stats.followCount()}
                  currentDonations={stats.totalDonations()}
                  currentMessages={stats.totalMessages()}
                />
              </div>

              {/* Main Content Grid */}
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Chat Messages */}
                <div class={card.base}>
                  <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 class={text.h3}>Recent Chat</h3>
                    <A href="/dashboard/chat-history" class="text-sm text-purple-600 hover:text-purple-700">
                      View all
                    </A>
                  </div>
                  <div class="divide-y divide-gray-100">
                    <Show
                      when={recentMessages().length > 0}
                      fallback={
                        <div class="px-6 py-8 text-center">
                          <svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <p class="text-gray-500 text-sm">No chat messages yet</p>
                          <p class="text-gray-400 text-xs mt-1">Messages will appear here during streams</p>
                        </div>
                      }
                    >
                      <For each={recentMessages()}>
                        {(msg) => (
                          <div class="px-6 py-3 hover:bg-gray-50">
                            <div class="flex items-start gap-3">
                              <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                                <span class="text-purple-600 text-sm font-medium">
                                  {msg.sender_username[0].toUpperCase()}
                                </span>
                              </div>
                              <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-2">
                                  <span class="font-medium text-gray-900 text-sm">
                                    {msg.sender_username}
                                  </span>
                                  <Show when={msg.sender_is_moderator}>
                                    <span class={badge.info}>Mod</span>
                                  </Show>
                                  <span class="text-gray-400 text-xs">
                                    {formatTimeAgo(msg.inserted_at)}
                                  </span>
                                </div>
                                <p class="text-gray-600 text-sm truncate">{msg.message}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </For>
                    </Show>
                  </div>
                </div>

                {/* Recent Events */}
                <div class={card.base}>
                  <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 class={text.h3}>Recent Events</h3>
                    <A href="/dashboard/stream-history" class="text-sm text-purple-600 hover:text-purple-700">
                      View all
                    </A>
                  </div>
                  <div class="divide-y divide-gray-100">
                    <Show
                      when={recentEvents().length > 0}
                      fallback={
                        <div class="px-6 py-8 text-center">
                          <svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <p class="text-gray-500 text-sm">No events yet</p>
                          <p class="text-gray-400 text-xs mt-1">Donations, follows, and subs will show here</p>
                        </div>
                      }
                    >
                      <For each={recentEvents()}>
                        {(event) => (
                          <div class="px-6 py-3 hover:bg-gray-50">
                            <div class="flex items-center gap-3">
                              <div class={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${getEventColor(event.type)}`}>
                                {getEventIcon(event.type)}
                              </div>
                              <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-2">
                                  <span class="font-medium text-gray-900 text-sm capitalize">
                                    {event.type}
                                  </span>
                                  <span class="text-gray-400 text-xs">
                                    {formatTimeAgo(event.inserted_at)}
                                  </span>
                                </div>
                                <p class="text-gray-600 text-sm truncate">
                                  <Show
                                    when={event.data?.username}
                                    fallback="Anonymous"
                                  >
                                    {event.data?.username as string}
                                  </Show>
                                  <Show when={event.type === "donation" && event.data?.amount}>
                                    {" - "}${Number(event.data?.amount).toFixed(2)}
                                  </Show>
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </For>
                    </Show>
                  </div>
                </div>
              </div>

              {/* Activity Feed with Filters */}
              <ActivityFeed events={allEvents()} />

              {/* Recent Streams */}
              <div class={card.base}>
                <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 class={text.h3}>Recent Streams</h3>
                  <A href="/dashboard/stream-history" class="text-sm text-purple-600 hover:text-purple-700">
                    View all
                  </A>
                </div>
                <Show
                  when={recentStreams().length > 0}
                  fallback={
                    <div class="px-6 py-8 text-center">
                      <svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <p class="text-gray-500 text-sm">No streams yet</p>
                      <p class="text-gray-400 text-xs mt-1">Your stream history will appear here</p>
                    </div>
                  }
                >
                  <div class="divide-y divide-gray-100">
                    <For each={recentStreams()}>
                      {(stream) => (
                        <A
                          href={`/dashboard/stream-history/${stream.id}`}
                          class="block px-6 py-4 hover:bg-gray-50"
                        >
                          <div class="flex items-center justify-between">
                            <div class="flex items-center gap-4">
                              <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <div>
                                <h4 class="font-medium text-gray-900">
                                  {stream.title || "Untitled Stream"}
                                </h4>
                                <p class="text-sm text-gray-500">
                                  {stream.started_at
                                    ? new Date(stream.started_at).toLocaleDateString()
                                    : "Not started"}
                                </p>
                              </div>
                            </div>
                            <span class={getStreamStatusBadge(stream.status)}>
                              {stream.status}
                            </span>
                          </div>
                        </A>
                      )}
                    </For>
                  </div>
                </Show>
              </div>

              {/* Quick Actions */}
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <A
                  href="/dashboard/widgets"
                  class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-purple-200 transition-all group"
                >
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-linear-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                      </svg>
                    </div>
                    <div>
                      <h3 class="font-semibold text-gray-900">Widgets</h3>
                      <p class="text-sm text-gray-500">Customize your overlays</p>
                    </div>
                  </div>
                </A>

                <A
                  href="/dashboard/analytics"
                  class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-purple-200 transition-all group"
                >
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-linear-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 class="font-semibold text-gray-900">Analytics</h3>
                      <p class="text-sm text-gray-500">View your stats</p>
                    </div>
                  </div>
                </A>

                <A
                  href="/dashboard/settings"
                  class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-purple-200 transition-all group"
                >
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-linear-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 class="font-semibold text-gray-900">Settings</h3>
                      <p class="text-sm text-gray-500">Configure your account</p>
                    </div>
                  </div>
                </A>
              </div>
            </div>

            {/* Quick Actions Floating Panel */}
            <QuickActionsPanel onTestAlert={handleTestAlert} />

            {/* Test Alert Notification */}
            <Show when={showTestAlert()}>
              <div
                class="fixed top-4 right-4 z-50 bg-linear-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-xl shadow-2xl animate-slide-in"
                data-testid="test-alert"
              >
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <div>
                    <p class="font-bold">Test Alert!</p>
                    <p class="text-sm opacity-90">Your alerts are working correctly.</p>
                  </div>
                </div>
              </div>
            </Show>
          </>
        </Show>
      </Show>
    </>
  );
}
