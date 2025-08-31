defmodule StreampaiWeb.Utils.FakeChat do
  @moduledoc """
  Utilities for generating fake chat messages for demo and testing purposes.
  """
  alias StreampaiWeb.Utils.ColorUtils

  @doc """
  Generates a list of initial fake messages.
  """
  def initial_messages(count \\ nil) do
    message_count = count || Enum.random(10..15)
    
    1..message_count
    |> Enum.map(fn _ -> generate_message() end)
  end

  @doc """
  Generates a single fake chat message.
  """
  def generate_message do
    username = Enum.random(usernames())
    platform = Enum.random(platforms())
    
    %{
      id: System.unique_integer([:positive]),
      username: username,
      content: Enum.random(messages()),
      badge: Enum.random(badges()),
      badge_color: Enum.random(badge_colors()),
      username_color: ColorUtils.username_color(username),
      platform: platform,
      emotes: Enum.take_random(emotes(), Enum.random(0..2)),
      timestamp: DateTime.utc_now()
    }
  end

  @doc """
  Returns default widget configuration.
  """
  def default_config do
    %{
      show_badges: true,
      show_emotes: true,
      hide_bots: false,
      show_timestamps: false,
      show_platform: true,
      max_messages: 25,
      message_fade_time: 60,
      font_size: "medium"
    }
  end

  # Private data pools

  defp usernames do
    [
      "Alice", "Bob", "Charlie"
    ]
  end

  defp messages do
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

  defp badges do
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


  defp platforms do
    [
      %{name: "Twitch", color: "bg-purple-500", icon: "twitch"},
      %{name: "YouTube", color: "bg-red-500", icon: "youtube"},
      %{name: "Facebook", color: "bg-blue-600", icon: "facebook"},
      %{name: "Kick", color: "bg-green-500", icon: "kick"}
    ]
  end

  defp emotes do
    ["😂", "❤️", "🔥", "💯", "👏", "🎉", "😮", "🤩", "💪", "🙌", "👑", "⚡", "🚀", "💎", "🎮"]
  end
end