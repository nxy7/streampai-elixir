defmodule Streampai.Fake.StreamEvent do
  @moduledoc """
  Fake data generation for StreamEvent resources.
  Used for testing, development, and demonstrations.
  """

  alias Streampai.Stream.StreamEvent

  @usernames [
    "viewer123",
    "gaming_fan",
    "streamer_supporter",
    "chat_legend",
    "awesome_viewer",
    "night_owl",
    "coffee_drinker",
    "pixel_warrior",
    "stream_enthusiast",
    "friendly_viewer",
    "generous_fan",
    "new_follower",
    "subscriber_user",
    "friendly_streamer",
    "community_member"
  ]

  @chat_messages [
    "Hello everyone!",
    "Great stream!",
    "Keep it up!",
    "This is amazing!",
    "Love this game!",
    "First time here, loving it!",
    "Been watching for hours",
    "You're so good at this!",
    "Can't wait for the next stream",
    "This community is awesome!"
  ]

  @donation_messages [
    "Great stream! Keep it up!",
    "Love your content!",
    "Thanks for the entertainment!",
    "You deserve this!",
    "Amazing gameplay!",
    "Keep being awesome!",
    "Love the community here!",
    "Thanks for all you do!"
  ]

  @raid_messages [
    "Go show some love!",
    "Amazing streamer over here!",
    "Check out this awesome stream!",
    "You'll love this content!",
    "Great vibes in this stream!"
  ]

  @sub_messages [
    "Love this community!",
    "Been watching for months!",
    "Best streamer on the platform!",
    "Keep up the great work!",
    "So glad I found this stream!"
  ]

  @emotes [
    %{name: "Kappa", url: "https://static-cdn.jtvnw.net/emoticons/v1/25/1.0"},
    %{name: "PogChamp", url: "https://static-cdn.jtvnw.net/emoticons/v1/88/1.0"},
    %{name: "LUL", url: "https://static-cdn.jtvnw.net/emoticons/v1/425618/1.0"},
    %{name: "EZ", url: "https://static-cdn.jtvnw.net/emoticons/v1/9802/1.0"},
    %{name: "5Head", url: "https://static-cdn.jtvnw.net/emoticons/v1/354/1.0"}
  ]

  @doc """
  Creates sample events for a given livestream_id.
  Returns {livestream_id, created_events}.
  """
  def create_sample_events(livestream_id \\ nil) do
    livestream_id = livestream_id || Ecto.UUID.generate()

    events = [
      generate_chat_message(livestream_id),
      generate_donation(livestream_id),
      generate_follow(livestream_id),
      generate_subscription(livestream_id),
      generate_raid(livestream_id)
    ]

    created_events =
      Enum.map(events, fn event_data ->
        {:ok, event} = StreamEvent.create(event_data)
        event
      end)

    {livestream_id, created_events}
  end

  @doc """
  Generates a fake chat message event.
  """
  def generate_chat_message(livestream_id) do
    username = Enum.random(@usernames)
    message = Enum.random(@chat_messages)
    emotes = if :rand.uniform(3) == 1, do: [Enum.random(@emotes)], else: []

    %{
      type: :chat_message,
      data: %{
        username: username,
        message: message,
        is_moderator: :rand.uniform(10) == 1,
        is_subscriber: :rand.uniform(4) == 1,
        emotes: emotes
      },
      livestream_id: livestream_id,
      platform: :twitch
    }
  end

  @doc """
  Generates a fake donation event.
  """
  def generate_donation(livestream_id) do
    donor_name = Enum.random(@usernames)
    amount = Enum.random(["1.00", "5.00", "10.00", "25.00", "50.00", "100.00"])
    message = if :rand.uniform(3) == 1, do: Enum.random(@donation_messages), else: nil

    %{
      type: :donation,
      data: %{
        donor_name: donor_name,
        amount: amount,
        currency: "USD",
        message: message,
        platform_donation_id: "donation_#{:rand.uniform(999_999)}"
      },
      livestream_id: livestream_id,
      platform: :twitch
    }
  end

  @doc """
  Generates a fake follow event.
  """
  def generate_follow(livestream_id) do
    username = Enum.random(@usernames)

    %{
      type: :follow,
      data: %{
        username: username,
        display_name: String.capitalize(username)
      },
      livestream_id: livestream_id,
      platform: :twitch
    }
  end

  @doc """
  Generates a fake subscription event.
  """
  def generate_subscription(livestream_id) do
    username = Enum.random(@usernames)
    tier = Enum.random(["1", "2", "3"])
    months = Enum.random(["1", "3", "6", "12", "24"])
    message = if :rand.uniform(2) == 1, do: Enum.random(@sub_messages), else: nil

    %{
      type: :subscription,
      data: %{
        username: username,
        tier: tier,
        months: months,
        message: message
      },
      livestream_id: livestream_id,
      platform: :twitch
    }
  end

  @doc """
  Generates a fake raid event.
  """
  def generate_raid(livestream_id) do
    raider_name = Enum.random(@usernames)
    viewer_count = Enum.random(["5", "12", "25", "47", "89", "156"])
    message = Enum.random(@raid_messages)

    %{
      type: :raid,
      data: %{
        raider_name: raider_name,
        viewer_count: viewer_count,
        message: message
      },
      livestream_id: livestream_id,
      platform: :twitch
    }
  end

  @doc """
  Generates a random event of any type.
  """
  def generate_random_event(livestream_id) do
    event_type = Enum.random([:chat_message, :donation, :follow, :subscription, :raid])

    case event_type do
      :chat_message -> generate_chat_message(livestream_id)
      :donation -> generate_donation(livestream_id)
      :follow -> generate_follow(livestream_id)
      :subscription -> generate_subscription(livestream_id)
      :raid -> generate_raid(livestream_id)
    end
  end
end
