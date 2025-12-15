import { Title } from "@solidjs/meta";
import { Show, For } from "solid-js";
import { useCurrentUser, getLoginUrl } from "~/lib/auth";
import { button, card, text, input } from "~/styles/design-system";

export default function Settings() {
  const { user, isLoading } = useCurrentUser();

  const platformConnections = [
    {
      name: "Twitch",
      platform: "twitch",
      connected: false,
      color: "from-purple-600 to-purple-700",
    },
    {
      name: "YouTube",
      platform: "youtube",
      connected: false,
      color: "from-red-600 to-red-700",
    },
    {
      name: "Facebook",
      platform: "facebook",
      connected: false,
      color: "from-blue-600 to-blue-700",
    },
    {
      name: "Kick",
      platform: "kick",
      connected: false,
      color: "from-green-600 to-green-700",
    },
  ];

  const currencies = ["USD", "EUR", "GBP", "CAD", "AUD"];

  return (
    <>
      <Title>Settings - Streampai</Title>
      <Show
        when={!isLoading()}
        fallback={
          <div class="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
            <div class="text-white text-xl">Loading...</div>
          </div>
        }
      >
        <Show
          when={user()}
          fallback={
            <div class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
              <div class="text-center py-12">
                <h2 class="text-2xl font-bold text-white mb-4">
                  Not Authenticated
                </h2>
                <p class="text-gray-300 mb-6">
                  Please sign in to access settings.
                </p>
                <a
                  href={getLoginUrl()}
                  class="inline-block px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                >
                  Sign In
                </a>
              </div>
            </div>
          }
        >
          <>
            <div class="max-w-6xl mx-auto space-y-6">
              {/* Subscription Widget Placeholder */}
              <div class="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-sm p-6 text-white">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-xl font-bold mb-2">Free Plan</h3>
                    <p class="text-purple-100">
                      Get started with basic features
                    </p>
                  </div>
                  <button class="bg-white text-purple-600 px-6 py-2 rounded-lg font-semibold hover:bg-purple-50 transition-colors">
                    Upgrade to Pro
                  </button>
                </div>
              </div>

              {/* Account Settings */}
              <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-6">
                  Account Settings
                </h3>
                <div class="space-y-6">
                  {/* Email */}
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user()?.email || ""}
                      class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
                      readonly
                    />
                    <p class="text-xs text-gray-500 mt-1">
                      Your email address cannot be changed
                    </p>
                  </div>

                  {/* Display Name */}
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Display Name
                    </label>
                    <div class="relative">
                      <input
                        type="text"
                        value={user()?.name || ""}
                        placeholder="Enter display name"
                        class="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10"
                      />
                    </div>
                    <p class="text-xs text-gray-500 mt-1">
                      Name must be 3-30 characters and contain only letters,
                      numbers, and underscores
                    </p>
                    <div class="mt-3">
                      <button class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm">
                        Update Name
                      </button>
                    </div>
                  </div>

                  {/* Avatar Upload Section */}
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Profile Avatar
                    </label>
                    <div class="flex items-center space-x-4">
                      <div class="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center overflow-hidden">
                        <Show
                          when={user()?.displayAvatar}
                          fallback={
                            <span class="text-white font-bold text-2xl">
                              {user()?.name?.[0]?.toUpperCase() || "U"}
                            </span>
                          }
                        >
                          <img
                            src={user()!.displayAvatar!}
                            alt="Avatar"
                            class="w-full h-full object-cover"
                          />
                        </Show>
                      </div>
                      <div class="flex-1">
                        <button class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm">
                          Upload New Avatar
                        </button>
                        <p class="text-xs text-gray-500 mt-1">
                          JPG, PNG or GIF. Max size 5MB. Recommended: 256x256px
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Streaming Platforms */}
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Streaming Platforms
                    </label>
                    <div class="space-y-2">
                      <For each={platformConnections}>
                        {(connection) => (
                          <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div class="flex items-center space-x-3">
                              <div
                                class={`w-10 h-10 bg-gradient-to-r ${connection.color} rounded-lg flex items-center justify-center`}
                              >
                                <span class="text-white font-bold text-sm">
                                  {connection.name[0]}
                                </span>
                              </div>
                              <div>
                                <p class="font-medium text-gray-900">
                                  {connection.name}
                                </p>
                                <p class="text-sm text-gray-500">
                                  {connection.connected
                                    ? "Connected"
                                    : "Not connected"}
                                </p>
                              </div>
                            </div>
                            <button
                              class={
                                connection.connected
                                  ? "text-red-600 hover:text-red-700 text-sm font-medium"
                                  : "bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                              }
                            >
                              {connection.connected ? "Disconnect" : "Connect"}
                            </button>
                          </div>
                        )}
                      </For>
                    </div>
                  </div>
                </div>
              </div>

              {/* Donation Page */}
              <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-6">
                  Donation Page
                </h3>
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Public Donation URL
                    </label>
                    <div class="flex items-center space-x-3">
                      <input
                        type="text"
                        value={`http://localhost:4000/u/${user()?.name || ""}`}
                        class="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
                        readonly
                      />
                      <button class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
                        Copy URL
                      </button>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">
                      Share this link with your viewers so they can support you
                      with donations
                    </p>
                  </div>

                  <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                    <div class="flex items-center space-x-3">
                      <div class="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center overflow-hidden">
                        <Show
                          when={user()?.displayAvatar}
                          fallback={
                            <span class="text-white font-bold">
                              {user()?.name?.[0]?.toUpperCase() || "U"}
                            </span>
                          }
                        >
                          <img
                            src={user()!.displayAvatar!}
                            alt="Avatar"
                            class="w-10 h-10 rounded-full object-cover"
                          />
                        </Show>
                      </div>
                      <div>
                        <h4 class="font-medium text-gray-900">
                          Support {user()?.name}
                        </h4>
                        <p class="text-sm text-gray-600">
                          Public donation page
                        </p>
                      </div>
                    </div>
                    <a
                      href={`http://localhost:4000/u/${user()?.name || ""}`}
                      target="_blank"
                      class="text-purple-600 hover:text-purple-700 font-medium text-sm"
                    >
                      Preview →
                    </a>
                  </div>
                </div>
              </div>

              {/* Donation Settings */}
              <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-6">
                  Donation Settings
                </h3>
                <form class="space-y-4">
                  <div class="grid md:grid-cols-3 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Amount
                      </label>
                      <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span class="text-gray-500 text-sm">USD</span>
                        </div>
                        <input
                          type="number"
                          placeholder="No minimum"
                          class="w-full border border-gray-300 rounded-lg pl-12 pr-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <p class="text-xs text-gray-500 mt-1">
                        Leave empty for no minimum
                      </p>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Amount
                      </label>
                      <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span class="text-gray-500 text-sm">USD</span>
                        </div>
                        <input
                          type="number"
                          placeholder="No maximum"
                          class="w-full border border-gray-300 rounded-lg pl-12 pr-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <p class="text-xs text-gray-500 mt-1">
                        Leave empty for no maximum
                      </p>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        Currency
                      </label>
                      <select class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                        <For each={currencies}>
                          {(currency) => (
                            <option value={currency}>{currency}</option>
                          )}
                        </For>
                      </select>
                    </div>
                  </div>

                  {/* Default TTS Voice */}
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Default TTS Voice
                    </label>
                    <select class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                      <option value="random">
                        🎲 Random (different voice each time)
                      </option>
                      <option value="google_en_us_male">
                        Google TTS - English (US) Male
                      </option>
                      <option value="google_en_us_female">
                        Google TTS - English (US) Female
                      </option>
                    </select>
                    <p class="text-xs text-gray-500 mt-1">
                      This voice will be used when donors don't select a voice,
                      and for donations from streaming platforms
                    </p>
                  </div>

                  {/* Info box */}
                  <div class="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <svg
                      class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div class="text-sm text-blue-800">
                      <p class="font-medium mb-1">How donation limits work:</p>
                      <ul class="space-y-1 text-blue-700">
                        <li>
                          • Set limits to control the donation amounts your
                          viewers can send
                        </li>
                        <li>
                          • Both fields are optional - leave empty to allow any
                          amount
                        </li>
                        <li>
                          • Preset buttons and custom input will be filtered
                          based on your limits
                        </li>
                        <li>
                          • Changes apply immediately to your donation page
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div class="pt-4">
                    <button
                      type="submit"
                      class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                    >
                      Save Donation Settings
                    </button>
                  </div>
                </form>
              </div>

              {/* Role Invitations */}
              <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-6">
                  Role Invitations
                </h3>
                <div class="text-center py-8 text-gray-500">
                  <svg
                    class="w-12 h-12 mx-auto mb-3 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <p class="text-sm">No pending role invitations</p>
                  <p class="text-xs text-gray-400 mt-1">
                    You'll see invitations here when streamers invite you to
                    moderate their channels
                  </p>
                </div>
              </div>

              {/* My Roles in Other Channels */}
              <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-6">
                  My Roles in Other Channels
                </h3>
                <div class="text-center py-8 text-gray-500">
                  <svg
                    class="w-12 h-12 mx-auto mb-3 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                    />
                  </svg>
                  <p class="text-sm">
                    You don't have any roles in other channels
                  </p>
                  <p class="text-xs text-gray-400 mt-1">
                    Roles granted to you by other streamers will appear here
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div class="relative">
                <div class="absolute inset-0 flex items-center">
                  <div class="w-full border-t border-gray-300"></div>
                </div>
                <div class="relative flex justify-center text-sm">
                  <span class="px-2 bg-gray-50 text-gray-500">
                    Channel Management
                  </span>
                </div>
              </div>

              {/* Role Management */}
              <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-6">
                  Role Management
                </h3>

                {/* Invite User Form */}
                <div class="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 class="font-medium text-gray-900 mb-3">Invite User</h4>
                  <form class="space-y-3">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <input
                          type="text"
                          placeholder="Enter username"
                          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <select class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                          <option value="moderator">Moderator</option>
                          <option value="manager">Manager</option>
                        </select>
                      </div>
                      <div>
                        <button
                          type="submit"
                          class="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                        >
                          Send Invitation
                        </button>
                      </div>
                    </div>
                  </form>
                  <div class="mt-3 p-3 bg-blue-50 rounded-lg">
                    <div class="flex">
                      <svg
                        class="w-5 h-5 text-blue-500 flex-shrink-0 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div class="text-sm text-blue-800">
                        <p class="font-medium">Role Permissions:</p>
                        <ul class="mt-1 text-blue-700 text-xs space-y-1">
                          <li>
                            • <strong>Moderator:</strong> Can moderate chat and
                            manage stream settings
                          </li>
                          <li>
                            • <strong>Manager:</strong> Can manage channel
                            operations and configurations
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Current Roles */}
                <div class="text-center py-8 text-gray-500">
                  <svg
                    class="w-12 h-12 mx-auto mb-3 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <p class="text-sm">No roles granted yet</p>
                  <p class="text-xs text-gray-400 mt-1">
                    Users you've granted permissions to will appear here
                  </p>
                </div>
              </div>

              {/* Notification Preferences */}
              <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-6">
                  Notification Preferences
                </h3>
                <div class="space-y-4">
                  <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p class="font-medium text-gray-900">
                        Email Notifications
                      </p>
                      <p class="text-sm text-gray-600">
                        Receive notifications about important events
                      </p>
                    </div>
                    <button class="relative inline-flex h-6 w-11 items-center rounded-full bg-purple-600">
                      <span class="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition" />
                    </button>
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
