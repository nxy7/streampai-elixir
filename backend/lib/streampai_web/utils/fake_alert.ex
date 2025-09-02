defmodule StreampaiWeb.Utils.FakeAlert do
  @moduledoc """
  Utility module for generating fake alert events for testing and demonstration purposes.
  Similar to FakeChat but for donation/alert widgets.
  """

  @alert_types [:donation, :follow, :subscription, :raid]
  @platforms [
    %{icon: "twitch", color: "bg-purple-600"},
    %{icon: "youtube", color: "bg-red-600"},
    %{icon: "facebook", color: "bg-blue-600"},
    %{icon: "kick", color: "bg-green-600"}
  ]

  @usernames [
    "StreamFan2024",
    "GamerGirl97",
    "ProPlayer123",
    "ChatMaster",
    "NightOwl88",
    "PixelWarrior",
    "RetroGaming",
    "StreamSniper",
    "LootHunter",
    "BossRaider",
    "EpicViewer",
    "ControllerKing",
    "KeyboardNinja",
    "MouseWizard",
    "HeadsetHero",
    "CameraMan",
    "MicrophoneMaster",
    "StreamlabsPro",
    "OBSExpert",
    "TwitchPrime",
    "YouTubeGaming",
    "FacebookGaming",
    "DiscordMod",
    "RedditUser"
  ]

  @donation_messages [
    "Great stream! Keep it up!",
    "Love your content!",
    "Thanks for the entertainment!",
    "You're awesome!",
    "Best streamer ever!",
    "Hope this helps with the setup!",
    "Amazing gameplay!",
    "Can't wait for the next stream!",
    "You deserve this!",
    "Thanks for making my day!",
    "Keep being amazing!",
    "Your content is incredible!",
    "So glad I found your stream!",
    "You're hilarious!",
    "Best part of my day!",
    "Thanks for all you do!",
    "You've got this!",
    "Loving the vibes!",
    "Your energy is contagious!",
    "Thanks for the laughs!"
  ]

  @subscription_messages [
    "Happy to support!",
    "Love being part of the community!",
    "Worth every penny!",
    "Can't wait for subscriber perks!",
    "Here for the long haul!",
    "Best decision ever!",
    "Your content is worth it!",
    "Proud to be a subscriber!",
    "Thanks for all you do!",
    "Keep up the amazing work!"
  ]

  def default_config do
    %{
      animation_type: "fade",
      display_duration: 5,
      sound_enabled: true,
      sound_volume: 75,
      show_message: true,
      show_amount: true,
      font_size: "medium",
      alert_position: "center"
    }
  end

  def generate_event do
    type = Enum.random(@alert_types)
    platform = Enum.random(@platforms)
    username = Enum.random(@usernames)

    base_event = %{
      id: generate_id(),
      type: type,
      username: username,
      timestamp: DateTime.utc_now(),
      platform: platform
    }

    case type do
      :donation ->
        amount = generate_donation_amount()

        Map.merge(base_event, %{
          amount: amount,
          currency: "$",
          message: if(Enum.random([true, false]), do: Enum.random(@donation_messages), else: nil)
        })

      :subscription ->
        Map.merge(base_event, %{
          message:
            if(Enum.random([true, false]), do: Enum.random(@subscription_messages), else: nil)
        })

      :follow ->
        Map.merge(base_event, %{
          message: if(Enum.random(1..10) == 1, do: "Thanks for the follow!", else: nil)
        })

      :raid ->
        viewers = Enum.random(5..500)

        Map.merge(base_event, %{
          message: "Raiding with #{viewers} viewers!"
        })
    end
  end

  defp generate_donation_amount do
    # Generate realistic donation amounts with weighted distribution
    case Enum.random(1..100) do
      # $1-6
      n when n <= 50 -> Enum.random([1, 2, 3, 5]) + :rand.uniform()
      # $5-21
      n when n <= 80 -> Enum.random([5, 10, 15, 20]) + :rand.uniform()
      # $25-101
      n when n <= 95 -> Enum.random([25, 50, 75, 100]) + :rand.uniform()
      # $100-1001
      _ -> Enum.random([100, 200, 500, 1000]) + :rand.uniform()
    end
    |> Float.round(2)
  end

  defp generate_id do
    :crypto.strong_rand_bytes(8) |> Base.encode16() |> String.downcase()
  end
end
