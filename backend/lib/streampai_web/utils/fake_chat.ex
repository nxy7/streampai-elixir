defmodule StreampaiWeb.Utils.FakeChat do
  @moduledoc """
  Utilities for generating fake chat messages for demo and testing purposes.
  """

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
    %{
      id: System.unique_integer([:positive]),
      username: Enum.random(usernames()),
      content: Enum.random(messages()),
      badge: Enum.random(badges()),
      badge_color: Enum.random(badge_colors()),
      username_color: Enum.random(username_colors()),
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
      max_messages: 25,
      message_fade_time: 60,
      font_size: "medium"
    }
  end

  # Private data pools

  defp usernames do
    [
      "StreamWatcher92", "GamingLegend", "ChatMaster", "PixelHunter", "LiveViewer",
      "TwitchFan", "StreamLover", "GamerGirl123", "ProPlayer", "ChatBot9000",
      "ViewerOne", "StreamSniper", "GameMaster", "DigitalNinja", "StreamKing",
      "ChatLurker", "GamingGuru", "LiveFeed", "StreamStar", "GameChaser",
      "PixelWarrior", "StreamGeek", "GameAddict", "ChatHero", "ViewerPro",
      "StreamBuddy", "GameWizard", "DigitalDragon", "StreamFox", "GamingBeast"
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

  defp username_colors do
    [
      "text-purple-400", "text-blue-400", "text-green-400", "text-yellow-400",
      "text-pink-400", "text-red-400", "text-indigo-400", "text-cyan-400",
      "text-orange-400", "text-lime-400", "text-emerald-400", "text-sky-400"
    ]
  end

  defp emotes do
    ["😂", "❤️", "🔥", "💯", "👏", "🎉", "😮", "🤩", "💪", "🙌", "👑", "⚡", "🚀", "💎", "🎮"]
  end
end