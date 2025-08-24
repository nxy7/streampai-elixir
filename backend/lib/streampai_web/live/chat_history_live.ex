defmodule StreampaiWeb.ChatHistoryLive do
  use StreampaiWeb.BaseLive

  def mount_page(socket, _params, _session) do
    {:ok, socket, layout: false}
  end

  def render(assigns) do
    ~H"""
    <.dashboard_layout {assigns} current_page="chat-history" page_title="Chat History">
      <div class="max-w-7xl mx-auto">
        <!-- Filters -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Filter Chat Messages</h3>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Platform</label>
              <select class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option>All Platforms</option>
                <option>Twitch</option>
                <option>YouTube</option>
                <option>Facebook</option>
                <option>Kick</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <select class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 3 months</option>
                <option>All time</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Message Type</label>
              <select class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option>All Messages</option>
                <option>Regular Chat</option>
                <option>Donations</option>
                <option>Subscriptions</option>
                <option>Follows</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search messages..."
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
        
    <!-- Chat Messages -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">Recent Messages</h3>
          </div>
          <div class="divide-y divide-gray-200">
            <!-- Sample Messages -->
            <div class="p-6">
              <div class="flex items-start space-x-3">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <span class="text-white font-medium text-xs">T</span>
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center space-x-2 mb-1">
                    <span class="text-sm font-medium text-gray-900">viewer123</span>
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                      Twitch
                    </span>
                    <span class="text-xs text-gray-500">2 minutes ago</span>
                  </div>
                  <p class="text-sm text-gray-600">Great stream! Love the new overlay design 🎉</p>
                </div>
              </div>
            </div>

            <div class="p-6">
              <div class="flex items-start space-x-3">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <span class="text-white font-medium text-xs">Y</span>
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center space-x-2 mb-1">
                    <span class="text-sm font-medium text-gray-900">YouTubeFan</span>
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      YouTube
                    </span>
                    <span class="text-xs text-gray-500">5 minutes ago</span>
                  </div>
                  <p class="text-sm text-gray-600">Just subscribed! Keep up the amazing content</p>
                </div>
              </div>
            </div>

            <div class="p-6">
              <div class="flex items-start space-x-3">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <span class="text-white font-medium text-xs">T</span>
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center space-x-2 mb-1">
                    <span class="text-sm font-medium text-gray-900">generousviewer</span>
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                      Twitch
                    </span>
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      Donation: $5.00
                    </span>
                    <span class="text-xs text-gray-500">8 minutes ago</span>
                  </div>
                  <p class="text-sm text-gray-600">
                    Thanks for the entertainment! Here's a little something for coffee ☕
                  </p>
                </div>
              </div>
            </div>
          </div>
          
    <!-- Pagination -->
          <div class="px-6 py-4 border-t border-gray-200">
            <div class="flex items-center justify-between">
              <p class="text-sm text-gray-700">
                Showing <span class="font-medium">1</span>
                to <span class="font-medium">3</span>
                of <span class="font-medium">97</span>
                messages
              </p>
              <div class="flex items-center space-x-2">
                <button class="bg-gray-100 text-gray-400 px-3 py-2 rounded-lg text-sm cursor-not-allowed">
                  Previous
                </button>
                <button class="bg-purple-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-purple-700 transition-colors">
                  Next
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
