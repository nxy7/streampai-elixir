import { Title } from "@solidjs/meta";
import { Show } from "solid-js";
import { useCurrentUser, getLoginUrl } from "~/lib/auth";
import { useUserPreferencesForUser } from "~/lib/useElectric";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { user, isLoading } = useCurrentUser();
  const prefs = useUserPreferencesForUser(() => user()?.id);
  const greeting = getGreeting();

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
              <div class="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                <h1 class="text-3xl font-bold text-gray-900 mb-2">
                  {greeting}, {prefs.data()?.name || user()?.name || "Streamer"}!
                </h1>
                <p class="text-gray-600">
                  Welcome to your Streampai dashboard.
                </p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <div class="flex items-center space-x-3 mb-4">
                    <div class="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <svg
                        class="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 class="text-gray-900 font-semibold">Profile</h3>
                      <p class="text-gray-600 text-sm">Account information</p>
                    </div>
                  </div>
                  <div class="space-y-2 text-sm">
                    <div>
                      <span class="text-gray-600">Email:</span>
                      <span class="text-gray-900 ml-2">{user()?.email}</span>
                    </div>
                    <div>
                      <span class="text-gray-600">Name:</span>
                      <span class="text-gray-900 ml-2">{prefs.data()?.name || user()?.name}</span>
                    </div>
                    <Show
                      when={
                        user()?.hoursStreamedLast30Days !== null &&
                        user()?.hoursStreamedLast30Days !== undefined
                      }
                    >
                      <div>
                        <span class="text-gray-600">Hours Streamed (30d):</span>
                        <span class="text-gray-900 ml-2">
                          {user()?.hoursStreamedLast30Days}h
                        </span>
                      </div>
                    </Show>
                  </div>
                </div>

                <div class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <div class="flex items-center space-x-3 mb-4">
                    <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                      <svg
                        class="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 class="text-gray-900 font-semibold">Stream</h3>
                      <p class="text-gray-600 text-sm">Start your broadcast</p>
                    </div>
                  </div>
                  <p class="text-gray-700 text-sm">
                    Stream management features coming soon. Connect your
                    platforms and go live across multiple services.
                  </p>
                </div>

                <div class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <div class="flex items-center space-x-3 mb-4">
                    <div class="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                      <svg
                        class="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 class="text-gray-900 font-semibold">Analytics</h3>
                      <p class="text-gray-600 text-sm">View your stats</p>
                    </div>
                  </div>
                  <p class="text-gray-700 text-sm">
                    Track your growth across all platforms with detailed
                    analytics and insights.
                  </p>
                </div>

                <Show
                  when={
                    user()?.storageQuota !== null &&
                    user()?.storageQuota !== undefined
                  }
                >
                  <div class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <div class="flex items-center space-x-3 mb-4">
                      <div class="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                        <svg
                          class="w-6 h-6 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 class="text-gray-900 font-semibold">Storage</h3>
                        <p class="text-gray-600 text-sm">Manage your files</p>
                      </div>
                    </div>
                    <div class="space-y-2">
                      <div class="flex justify-between text-sm">
                        <span class="text-gray-600">Usage</span>
                        <span class="text-gray-900">
                          {user()?.storageUsedPercent?.toFixed(1)}%
                        </span>
                      </div>
                      <div class="w-full bg-gray-200 rounded-full h-2">
                        <div
                          class="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              user()?.storageUsedPercent || 0,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </Show>

                <div class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <div class="flex items-center space-x-3 mb-4">
                    <div class="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                      <svg
                        class="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 class="text-gray-900 font-semibold">Widgets</h3>
                      <p class="text-gray-600 text-sm">Customize your stream</p>
                    </div>
                  </div>
                  <p class="text-gray-700 text-sm">
                    Beautiful, customizable widgets for donations, follows,
                    chat, and more.
                  </p>
                </div>

                <div class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <div class="flex items-center space-x-3 mb-4">
                    <div class="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center">
                      <svg
                        class="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 class="text-gray-900 font-semibold">Settings</h3>
                      <p class="text-gray-600 text-sm">
                        Configure your account
                      </p>
                    </div>
                  </div>
                  <p class="text-gray-700 text-sm">
                    Manage your preferences, connections, and account settings.
                  </p>
                </div>
              </div>

              <div class="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-8">
                <h2 class="text-2xl font-bold text-gray-900 mb-4">
                  Quick Start Guide
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div class="flex items-start space-x-3">
                    <div class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                      1
                    </div>
                    <div>
                      <h3 class="text-gray-900 font-semibold mb-1">
                        Connect Platforms
                      </h3>
                      <p class="text-gray-700 text-sm">
                        Link your Twitch, YouTube, and other streaming accounts.
                      </p>
                    </div>
                  </div>
                  <div class="flex items-start space-x-3">
                    <div class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                      2
                    </div>
                    <div>
                      <h3 class="text-gray-900 font-semibold mb-1">
                        Configure Your Stream
                      </h3>
                      <p class="text-gray-700 text-sm">
                        Set up your stream title, description, and thumbnail.
                      </p>
                    </div>
                  </div>
                  <div class="flex items-start space-x-3">
                    <div class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                      3
                    </div>
                    <div>
                      <h3 class="text-gray-900 font-semibold mb-1">Go Live</h3>
                      <p class="text-gray-700 text-sm">
                        Start broadcasting to all your platforms at once!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        </Show>
      </Show>
    </>
  );
}
