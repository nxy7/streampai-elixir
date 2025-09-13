defmodule StreampaiWeb.DashboardWidgetsLive do
  @moduledoc false
  use StreampaiWeb.BaseLive

  def mount_page(socket, _params, _session) do
    {:ok, assign(socket, :page_title, "Widgets"), layout: false}
  end

  def render(assigns) do
    ~H"""
    <.dashboard_layout
      {assigns}
      current_page="widgets"
      page_title="Widgets"
      show_action_button={true}
      action_button_text="Add Widget"
    >
      <div class="max-w-7xl mx-auto">
        <!-- Widget Categories -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <!-- Chat Widgets -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-medium text-gray-900">Chat Widgets</h3>
              <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <div class="space-y-3">
              <.link
                navigate={~p"/widgets/chat"}
                class="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <h4 class="font-medium text-sm">Live Chat Overlay</h4>
                <p class="text-xs text-gray-500">Display live chat on stream</p>
              </.link>
              <div class="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <h4 class="font-medium text-sm">Chat Commands</h4>
                <p class="text-xs text-gray-500">Show recent commands used</p>
              </div>
              <div class="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <h4 class="font-medium text-sm">Word Cloud</h4>
                <p class="text-xs text-gray-500">Most used words in chat</p>
              </div>
            </div>
          </div>
          
    <!-- Donation/Alert Widgets -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-medium text-gray-900">Alerts & Donations</h3>
              <svg
                class="w-5 h-5 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <div class="space-y-3">
              <.link
                navigate={~p"/widgets/alertbox"}
                class="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <h4 class="font-medium text-sm">Alertbox Widget</h4>
                <p class="text-xs text-gray-500">Show donation, follow & subscription alerts</p>
              </.link>
              <div class="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <h4 class="font-medium text-sm">Donation Goal</h4>
                <p class="text-xs text-gray-500">Track donation progress</p>
              </div>
              <div class="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <h4 class="font-medium text-sm">Top Donators</h4>
                <p class="text-xs text-gray-500">Display biggest supporters</p>
              </div>
            </div>
          </div>
          
    <!-- Analytics Widgets -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-medium text-gray-900">Stream Stats</h3>
              <svg
                class="w-5 h-5 text-purple-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div class="space-y-3">
              <div class="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <h4 class="font-medium text-sm">Viewer Count</h4>
                <p class="text-xs text-gray-500">Current viewer statistics</p>
              </div>
              <div class="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <h4 class="font-medium text-sm">Follower Count</h4>
                <p class="text-xs text-gray-500">Real-time follower updates</p>
              </div>
              <div class="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <h4 class="font-medium text-sm">Stream Uptime</h4>
                <p class="text-xs text-gray-500">How long you've been live</p>
              </div>
            </div>
          </div>
        </div>
        
    <!-- Active Widgets -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">Active Widgets</h3>
          </div>
          <div class="p-6">
            <div class="text-center py-12">
              <svg
                class="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M19 11H5a2 2 0 00-2 2v14a2 2 0 002 2h14m-6 4h18a2 2 0 002-2V13a2 2 0 00-2-2H23a2 2 0 00-2 2v18z"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">No widgets configured</h3>
              <p class="mt-1 text-sm text-gray-500">
                Get started by adding widgets from the categories above.
              </p>
              <div class="mt-6">
                <button class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                  Browse Widget Library
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </.dashboard_layout>
    """
  end
end
