defmodule StreampaiWeb.ChatHistoryLive do
  use StreampaiWeb.BaseLive

  def mount_page(socket, _params, _session) do
    # Generate sample chat messages using Ash.Seed
    chat_messages = generate_sample_messages()
    
    socket = assign(socket, :chat_messages, chat_messages)
    {:ok, socket, layout: false}
  end
  
  defp generate_sample_messages do
    platforms = [:twitch, :youtube]
    usernames = [
      "viewer123", "YouTubeFan", "generousviewer", "streamer_fan",
      "chat_lover", "gamer_pro", "support_user", "new_follower",
      "long_time_viewer", "donation_helper", "mod_user", "subscriber_vip",
      "casual_watcher", "emote_spammer", "question_asker", "compliment_giver",
      "stream_regular", "first_timer", "comeback_viewer", "community_member"
    ]
    
    messages = [
      "Great stream! Love the new overlay design 🎉",
      "Just subscribed! Keep up the amazing content",
      "Thanks for the entertainment! Here's a little something for coffee ☕",
      "First time here, really enjoying the stream!",
      "That was an amazing play! 🔥",
      "Can you play my song request next?",
      "Love the new setup! Looks professional",
      "Been watching for 3 years, still the best content!",
      "Your stream helped me through tough times, thank you ❤️",
      "Just followed! When do you usually stream?",
      "That game looks fun, might buy it myself",
      "Your commentary is hilarious! 😂",
      "Stream quality is crystal clear today!",
      "Can't wait for the next stream!",
      "This is exactly what I needed after work",
      "Your community is so welcoming!",
      "Thanks for answering my question earlier!",
      "The new intro music is perfect!",
      "You should totally speedrun this game",
      "Chat is moving so fast today! Hi everyone! 👋"
    ]
    
    # Generate 20 sample messages
    1..20
    |> Enum.map(fn i ->
      platform = Enum.random(platforms)
      username = Enum.random(usernames)
      message = Enum.random(messages)
      minutes_ago = :rand.uniform(120) # Random between 1-120 minutes
      
      %{
        id: "msg_#{i}",
        username: username,
        message: message,
        platform: platform,
        minutes_ago: minutes_ago,
        is_donation: :rand.uniform(10) == 1, # 10% chance of donation
        donation_amount: if(:rand.uniform(10) == 1, do: Enum.random([5.00, 10.00, 25.00, 50.00]), else: nil)
      }
    end)
    |> Enum.sort_by(& &1.minutes_ago) # Sort by time, most recent first
  end
  
  # Helper functions for platform styling
  defp platform_color(:twitch), do: "bg-purple-500"
  defp platform_color(:youtube), do: "bg-red-500"
  
  defp platform_initial(:twitch), do: "T"
  defp platform_initial(:youtube), do: "Y"
  
  defp platform_name(:twitch), do: "Twitch"
  defp platform_name(:youtube), do: "YouTube"
  
  defp platform_badge_color(:twitch), do: "bg-purple-100 text-purple-800"
  defp platform_badge_color(:youtube), do: "bg-red-100 text-red-800"
  
  defp format_time_ago(minutes) when minutes < 1, do: "just now"
  defp format_time_ago(minutes) when minutes < 60, do: "#{minutes} minutes ago"
  defp format_time_ago(minutes), do: "#{div(minutes, 60)} hours ago"

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
            <%= for message <- @chat_messages do %>
              <div class="p-6">
                <div class="flex items-start space-x-3">
                  <div class="flex-shrink-0">
                    <div class={"w-8 h-8 rounded-full flex items-center justify-center #{platform_color(message.platform)}"}>
                      <span class="text-white font-medium text-xs">
                        <%= platform_initial(message.platform) %>
                      </span>
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-2 mb-1">
                      <span class="text-sm font-medium text-gray-900"><%= message.username %></span>
                      <span class={"inline-flex items-center px-2 py-0.5 rounded text-xs font-medium #{platform_badge_color(message.platform)}"}>
                        <%= platform_name(message.platform) %>
                      </span>
                      <%= if message.is_donation && message.donation_amount do %>
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Donation: $<%= :erlang.float_to_binary(message.donation_amount, decimals: 2) %>
                        </span>
                      <% end %>
                      <span class="text-xs text-gray-500">
                        <%= format_time_ago(message.minutes_ago) %>
                      </span>
                    </div>
                    <p class="text-sm text-gray-600"><%= message.message %></p>
                  </div>
                </div>
              </div>
            <% end %>
          </div>
          
    <!-- Pagination -->
          <div class="px-6 py-4 border-t border-gray-200">
            <div class="flex items-center justify-between">
              <p class="text-sm text-gray-700">
                Showing <span class="font-medium">1</span>
                to <span class="font-medium"><%= length(@chat_messages) %></span>
                of <span class="font-medium"><%= length(@chat_messages) %></span>
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
