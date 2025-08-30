defmodule StreampaiWeb.Components.ChatWidget do
  @moduledoc """
  LiveView for displaying livestream chat messages.
  
  Shows fake chat messages in a loop for demonstration purposes.
  Can display up to 50 messages with realistic streaming chat behavior.
  """
  use StreampaiWeb, :live_view
  
  @impl true
  def mount(_params, _session, socket) do
    if connected?(socket) do
      # Start generating fake messages every 2-5 seconds
      schedule_next_message()
    end
    
    {:ok, 
     socket
     |> assign(:messages, initial_messages())
     |> assign(:max_messages, 50),
     layout: false
    }
  end
  
  @impl true
  def handle_info(:generate_message, socket) do
    new_message = generate_fake_message()
    
    updated_messages = 
      [new_message | socket.assigns.messages]
      |> Enum.take(socket.assigns.max_messages)
    
    # Schedule the next message
    schedule_next_message()
    
    {:noreply, assign(socket, :messages, updated_messages)}
  end
  
  @impl true
  def render(assigns) do
    ~H"""
    <div class="chat-widget bg-gray-900 text-white rounded-lg overflow-hidden h-96 flex flex-col">
      <!-- Header -->
      <div class="bg-purple-600 px-4 py-2 flex items-center justify-between">
        <h3 class="font-semibold text-sm">Live Chat</h3>
        <div class="flex items-center space-x-2">
          <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span class="text-xs">LIVE</span>
        </div>
      </div>
      
      <!-- Chat Messages Container -->
      <div class="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-800">
        <%= for message <- @messages do %>
          <div class="chat-message flex items-start space-x-2 text-sm">
            <!-- User Badge/Avatar -->
            <div class={[
              "px-2 py-1 rounded text-xs font-semibold flex-shrink-0",
              message.badge_color
            ]}>
              {message.badge}
            </div>
            
            <!-- Message Content -->
            <div class="flex-1 min-w-0">
              <span class={[
                "font-semibold",
                message.username_color
              ]}>
                {message.username}:
              </span>
              <span class="ml-1 text-gray-100">{message.content}</span>
              
              <!-- Emotes/Reactions -->
              <%= if message.emotes != [] do %>
                <div class="inline-flex ml-2 space-x-1">
                  <%= for emote <- message.emotes do %>
                    <span class="text-yellow-400">{emote}</span>
                  <% end %>
                </div>
              <% end %>
            </div>
          </div>
        <% end %>
      </div>
      
      <!-- Footer -->
      <div class="bg-gray-700 px-4 py-2 text-xs text-gray-300">
        Viewing {length(@messages)} recent messages
      </div>
    </div>
    """
  end
  
  # Private functions for generating fake chat data
  
  defp schedule_next_message do
    # Random interval between 1-4 seconds for realistic chat flow  
    delay = Enum.random(1000..4000)
    Process.send_after(self(), :generate_message, delay)
  end
  
  defp initial_messages do
    # Generate 10-15 initial messages
    1..Enum.random(10..15)
    |> Enum.map(fn _ -> generate_fake_message() end)
    |> Enum.reverse()
  end
  
  defp generate_fake_message do
    %{
      id: System.unique_integer([:positive]),
      username: Enum.random(fake_usernames()),
      content: Enum.random(fake_messages()),
      badge: Enum.random(fake_badges()),
      badge_color: Enum.random(badge_colors()),
      username_color: Enum.random(username_colors()),
      emotes: Enum.take_random(fake_emotes(), Enum.random(0..2)),
      timestamp: DateTime.utc_now()
    }
  end
  
  defp fake_usernames do
    [
      "StreamWatcher92", "GamingLegend", "ChatMaster", "PixelHunter", "LiveViewer",
      "TwitchFan", "StreamLover", "GamerGirl123", "ProPlayer", "ChatBot9000",
      "ViewerOne", "StreamSniper", "GameMaster", "DigitalNinja", "StreamKing",
      "ChatLurker", "GamingGuru", "LiveFeed", "StreamStar", "GameChaser",
      "PixelWarrior", "StreamGeek", "GameAddict", "ChatHero", "ViewerPro",
      "StreamBuddy", "GameWizard", "DigitalDragon", "StreamFox", "GamingBeast"
    ]
  end
  
  defp fake_messages do
    [
      "Great stream!", "Amazing gameplay!", "Keep it up!", "First time here, love it!",
      "That was insane!", "Nice play!", "How do you do that?", "POGGERS",
      "This is so entertaining", "You're the best!", "That clutch was amazing",
      "Just followed!", "Been watching for hours", "Your setup is incredible",
      "Love your content", "That move was clean", "You've improved so much!",
      "Thanks for the tips!", "This game looks fun", "Your commentary is great",
      "Just subscribed!", "You deserve more viewers", "That was hilarious",
      "I'm learning so much", "Your skills are unreal", "What's your next game?",
      "This stream made my day", "You're so good at this", "That strategy works!",
      "Can you teach me that combo?", "Your stream always cheers me up",
      "That was a pro move!", "I can't stop watching", "You make it look easy",
      "Best streamer ever!", "Your energy is infectious", "That comeback was epic!",
      "I'm taking notes", "You inspired me to try this game", "Stream more often!",
      "Your community is awesome", "Thanks for being entertaining", "That was smooth",
      "You're cracked at this game", "That play should be in highlights",
      "I'm here every stream", "Your dedication shows", "That was beautiful",
      "You never disappoint", "Stream goals right there", "That timing was perfect"
    ]
  end
  
  defp fake_badges do
    ["SUB", "MOD", "VIP", "NEW", "👑", "⭐", "🔥", "💎", "🎮", "🏆"]
  end
  
  defp badge_colors do
    [
      "bg-purple-500 text-white",  # Subscriber
      "bg-green-500 text-white",   # Moderator  
      "bg-yellow-500 text-black",  # VIP
      "bg-blue-500 text-white",    # Regular
      "bg-red-500 text-white",     # Special
      "bg-pink-500 text-white",    # Premium
      "bg-orange-500 text-white",  # Donator
      "bg-indigo-500 text-white"   # Supporter
    ]
  end
  
  defp username_colors do
    [
      "text-purple-400", "text-blue-400", "text-green-400", "text-yellow-400",
      "text-pink-400", "text-red-400", "text-indigo-400", "text-cyan-400",
      "text-orange-400", "text-lime-400", "text-emerald-400", "text-sky-400"
    ]
  end
  
  defp fake_emotes do
    ["😂", "❤️", "🔥", "💯", "👏", "🎉", "😮", "🤩", "💪", "🙌", "👑", "⚡", "🚀", "💎", "🎮"]
  end
end