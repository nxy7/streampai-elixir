import { Title } from "@solidjs/meta";
import { Show, For } from "solid-js";
import { A } from "@solidjs/router";
import { useCurrentUser, getLoginUrl } from "~/lib/auth";
import {
  useUserPreferencesForUser,
  useRecentUserChatMessages,
  useRecentUserStreamEvents,
  useRecentUserLivestreams,
  useDashboardStats,
} from "~/lib/useElectric";
import { usePresence } from "~/lib/socket";
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

export default function Dashboard() {
  const { user, isLoading } = useCurrentUser();
  const prefs = useUserPreferencesForUser(() => user()?.id);
  const { users: onlineUsers } = usePresence();
  const greeting = getGreeting();

  // User-scoped data
  const recentMessages = useRecentUserChatMessages(() => user()?.id, 5);
  const recentEvents = useRecentUserStreamEvents(() => user()?.id, 5);
  const recentStreams = useRecentUserLivestreams(() => user()?.id, 3);
  const stats = useDashboardStats(() => user()?.id);

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
              {/* Header with greeting and online status */}
              <div class="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                <div class="flex items-start justify-between">
                  <div>
                    <h1 class="text-3xl font-bold text-gray-900 mb-2">
                      {greeting}, {prefs.data()?.name || user()?.name || "Streamer"}!
                    </h1>
                    <p class="text-gray-600">
                      Welcome to your Streampai dashboard.
                    </p>
                  </div>
                  <div class="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-200">
                    <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span class="text-sm text-green-700 font-medium">
                      {onlineUsers().length} online
                    </span>
                  </div>
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
          </>
        </Show>
      </Show>
    </>
  );
}
