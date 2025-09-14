defmodule Streampai.Fake.Base do
  @moduledoc """
  Base module providing common patterns and utilities for fake data generation
  across different widget types. Contains shared helper functions and data pools
  used by specific fake data modules.
  """

  alias StreampaiWeb.Utils.PlatformUtils

  @doc """
  Generates a random platform with standardized structure.
  """
  def generate_platform do
    platform_name = Enum.random(PlatformUtils.supported_platforms())

    %{
      name: PlatformUtils.platform_name(platform_name),
      color: PlatformUtils.platform_color(platform_name),
      icon: Atom.to_string(platform_name),
      initial: PlatformUtils.platform_initial(platform_name)
    }
  end

  @doc """
  Generates a unique ID for events and messages.
  """
  def generate_id do
    System.unique_integer([:positive])
  end

  @doc """
  Generates a secure random hex ID.
  """
  def generate_hex_id(length \\ 8) do
    length
    |> :crypto.strong_rand_bytes()
    |> Base.encode16()
    |> String.downcase()
  end

  @doc """
  Generates a random username from common pools.
  """
  def generate_username do
    Enum.random(usernames())
  end

  @doc """
  Generates a random timestamp within a specified range.
  """
  def generate_timestamp(minutes_back \\ 120) do
    minutes_ago = :rand.uniform(minutes_back)
    DateTime.add(DateTime.utc_now(), -minutes_ago * 60, :second)
  end

  @doc """
  Generates realistic donation amounts with weighted distribution.
  Small amounts are more common than large ones.
  """
  def generate_donation_amount do
    case_result =
      case Enum.random(1..100) do
        # $1-6 (50% chance)
        n when n <= 50 -> Enum.random([1, 2, 3, 5]) + :rand.uniform()
        # $5-21 (30% chance)
        n when n <= 80 -> Enum.random([5, 10, 15, 20]) + :rand.uniform()
        # $25-101 (15% chance)
        n when n <= 95 -> Enum.random([25, 50, 75, 100]) + :rand.uniform()
        # $100-1001 (5% chance)
        _ -> Enum.random([100, 200, 500, 1000]) + :rand.uniform()
      end

    Float.round(case_result, 2)
  end

  @doc """
  Returns boolean value with specified probability (0.0 to 1.0).
  """
  def random_boolean(probability \\ 0.5) do
    :rand.uniform() < probability
  end

  @doc """
  Selects a random item from a list or returns nil with specified probability.
  """
  def maybe_random(list, probability \\ 0.5) do
    if random_boolean(probability), do: Enum.random(list)
  end

  # Shared data pools

  @doc """
  Common username pool used across all widget types.
  """
  def usernames do
    [
      "viewer123",
      "YouTubeFan",
      "generousviewer",
      "streamer_fan",
      "chat_lover",
      "gamer_pro",
      "support_user",
      "new_follower",
      "long_time_viewer",
      "donation_helper",
      "mod_user",
      "subscriber_vip",
      "casual_watcher",
      "emote_spammer",
      "question_asker",
      "compliment_giver",
      "stream_regular",
      "first_timer",
      "comeback_viewer",
      "community_member",
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
  end

  @doc """
  Common emotes used across chat and alerts.
  """
  def emotes do
    ["😂", "❤️", "🔥", "💯", "👏", "🎉", "😮", "🤩", "💪", "🙌", "👑", "⚡", "🚀", "💎", "🎮"]
  end

  @doc """
  Common message tone adjectives for generating variety.
  """
  def message_tones do
    [
      "positive",
      "excited",
      "grateful",
      "supportive",
      "encouraging",
      "friendly",
      "enthusiastic"
    ]
  end
end
