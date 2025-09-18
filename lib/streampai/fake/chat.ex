defmodule Streampai.Fake.Chat do
  @moduledoc """
  Utilities for generating fake chat messages for demo and testing purposes.
  """
  alias Streampai.Fake.Base
  alias StreampaiWeb.Utils.ColorUtils

  @doc """
  Generates a list of initial fake messages.
  """
  def initial_messages(count \\ nil) do
    message_count = count || Enum.random(10..15)

    Enum.map(1..message_count, fn _ -> generate_message() end)
  end

  @doc """
  Generates a single fake chat message.
  """
  def generate_message do
    username = Base.generate_username()
    platform = Base.generate_platform()

    %{
      id: Base.generate_id(),
      username: username,
      content: Enum.random(messages()),
      badge: Enum.random(badges()),
      badge_color: Enum.random(badge_colors()),
      username_color: ColorUtils.username_color(username),
      platform: platform,
      emotes: Enum.take_random(Base.emotes(), Enum.random(0..2)),
      timestamp: DateTime.utc_now()
    }
  end

  @doc """
  Generates chat history messages in the format used by DashboardChatHistoryLive.
  """
  def generate_chat_history_messages(count \\ 20) do
    1..count
    |> Enum.map(fn i ->
      # Limited to platforms with chat history support
      platform = Enum.random([:twitch, :youtube])
      username = Base.generate_username()
      message = Enum.random(messages())
      minutes_ago = :rand.uniform(120)

      %{
        id: "msg_#{i}",
        viewer_id: "viewer_#{:rand.uniform(50)}",
        username: username,
        message: message,
        platform: platform,
        minutes_ago: minutes_ago,
        is_donation: Base.random_boolean(0.1),
        donation_amount: if(Base.random_boolean(0.1), do: Base.generate_donation_amount())
      }
    end)
    |> Enum.sort_by(& &1.minutes_ago)
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

  defp messages do
    [
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
      "Chat is moving so fast today! Hi everyone! 👋",
      "Amazing gameplay!",
      "Keep it up!",
      "That was insane!",
      "Nice play!",
      "How do you do that?",
      "POGGERS",
      "This is so entertaining",
      "You're the best!",
      "That clutch was amazing",
      "Your setup is incredible",
      "Love your content",
      "That move was clean",
      "You've improved so much!",
      "Thanks for the tips!",
      "You deserve more viewers",
      "That was hilarious",
      "I'm learning so much",
      "Your skills are unreal",
      "What's your next game?",
      "This stream made my day",
      "You're so good at this",
      "That strategy works!",
      "Can you teach me that combo?",
      "Your stream always cheers me up",
      "That was a pro move!",
      "I can't stop watching",
      "You make it look easy",
      "Best streamer ever!",
      "Your energy is infectious",
      "That comeback was epic!",
      "I'm taking notes",
      "You inspired me to try this game",
      "Stream more often!",
      "Your community is awesome",
      "Thanks for being entertaining",
      "That was smooth",
      "You're cracked at this game",
      "That play should be in highlights",
      "I'm here every stream",
      "Your dedication shows",
      "That was beautiful",
      "You never disappoint",
      "Stream goals right there",
      "That timing was perfect"
    ]
  end

  defp badges do
    ["SUB", "MOD", "VIP", "NEW", "👑", "⭐", "🔥", "💎", "🎮", "🏆"]
  end

  defp badge_colors do
    [
      # Subscriber
      "bg-purple-500 text-white",
      # Moderator
      "bg-green-500 text-white",
      # VIP
      "bg-yellow-500 text-black",
      # Regular
      "bg-blue-500 text-white",
      # Special
      "bg-red-500 text-white",
      # Premium
      "bg-pink-500 text-white",
      # Donator
      "bg-orange-500 text-white",
      # Supporter
      "bg-indigo-500 text-white"
    ]
  end
end
