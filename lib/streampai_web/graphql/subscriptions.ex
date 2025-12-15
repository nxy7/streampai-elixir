defmodule StreampaiWeb.GraphQL.Subscriptions do
  @moduledoc """
  Helper functions to broadcast GraphQL subscription events for widgets.

  These functions can be called from iex or application code to send real-time
  updates to widget OBS browser sources.

  ## Example Usage

  From iex:

      iex> StreampaiWeb.GraphQL.Subscriptions.broadcast_donation("user-id-123", %{
      ...>   id: "donation-1",
      ...>   amount: 5.00,
      ...>   currency: "USD",
      ...>   username: "TestUser",
      ...>   message: "Great stream!",
      ...>   timestamp: DateTime.utc_now(),
      ...>   platform: "twitch"
      ...> })
      :ok
  """

  @doc """
  Broadcast a donation event to subscribers.

  ## Parameters
    - user_id: The streamer's user ID
    - donation_data: Map containing:
      - id: Unique donation ID
      - amount: Donation amount (float)
      - currency: Currency code (e.g., "USD")
      - username: Donor's username
      - message: Optional message from donor
      - timestamp: DateTime of donation
      - platform: Platform name (e.g., "twitch", "youtube")
  """
  @spec broadcast_donation(String.t(), map()) :: :ok
  def broadcast_donation(user_id, donation_data) do
    Absinthe.Subscription.publish(
      StreampaiWeb.Endpoint,
      donation_data,
      donation_received: "widget_events:donation:#{user_id}"
    )
  end

  @doc """
  Broadcast a new follower event to subscribers.

  ## Parameters
    - user_id: The streamer's user ID
    - follower_data: Map containing:
      - id: Unique follower event ID
      - username: New follower's username
      - timestamp: DateTime of follow
      - platform: Platform name
  """
  @spec broadcast_follower(String.t(), map()) :: :ok
  def broadcast_follower(user_id, follower_data) do
    Absinthe.Subscription.publish(
      StreampaiWeb.Endpoint,
      follower_data,
      follower_added: "widget_events:follower:#{user_id}"
    )
  end

  @doc """
  Broadcast a new subscriber event to subscribers.

  ## Parameters
    - user_id: The streamer's user ID
    - subscriber_data: Map containing:
      - id: Unique subscription event ID
      - username: New subscriber's username
      - tier: Subscription tier (e.g., "tier1", "tier2", "tier3", "prime")
      - months: Number of months subscribed
      - message: Optional subscription message
      - timestamp: DateTime of subscription
      - platform: Platform name
  """
  @spec broadcast_subscriber(String.t(), map()) :: :ok
  def broadcast_subscriber(user_id, subscriber_data) do
    Absinthe.Subscription.publish(
      StreampaiWeb.Endpoint,
      subscriber_data,
      subscriber_added: "widget_events:subscriber:#{user_id}"
    )
  end

  @doc """
  Broadcast a raid event to subscribers.

  ## Parameters
    - user_id: The streamer's user ID
    - raid_data: Map containing:
      - id: Unique raid event ID
      - username: Raider's username
      - viewer_count: Number of viewers in the raid
      - timestamp: DateTime of raid
      - platform: Platform name
  """
  @spec broadcast_raid(String.t(), map()) :: :ok
  def broadcast_raid(user_id, raid_data) do
    Absinthe.Subscription.publish(
      StreampaiWeb.Endpoint,
      raid_data,
      raid_received: "widget_events:raid:#{user_id}"
    )
  end

  @doc """
  Broadcast a cheer/bits event to subscribers.

  ## Parameters
    - user_id: The streamer's user ID
    - cheer_data: Map containing:
      - id: Unique cheer event ID
      - username: Cheerer's username
      - bits: Number of bits cheered
      - message: Optional cheer message
      - timestamp: DateTime of cheer
      - platform: Platform name (usually "twitch")
  """
  @spec broadcast_cheer(String.t(), map()) :: :ok
  def broadcast_cheer(user_id, cheer_data) do
    Absinthe.Subscription.publish(
      StreampaiWeb.Endpoint,
      cheer_data,
      cheer_received: "widget_events:cheer:#{user_id}"
    )
  end

  @doc """
  Broadcast a chat message event to subscribers.

  ## Parameters
    - user_id: The streamer's user ID
    - message_data: Map containing:
      - id: Unique message ID
      - username: Message sender's username
      - message: Chat message content
      - timestamp: DateTime of message
      - platform: Platform name
      - is_moderator: Whether sender is a moderator (boolean)
      - is_subscriber: Whether sender is a subscriber (boolean)
  """
  @spec broadcast_chat_message(String.t(), map()) :: :ok
  def broadcast_chat_message(user_id, message_data) do
    Absinthe.Subscription.publish(
      StreampaiWeb.Endpoint,
      message_data,
      chat_message: "widget_events:chat:#{user_id}"
    )
  end

  @doc """
  Broadcast a viewer count update to subscribers.

  ## Parameters
    - user_id: The streamer's user ID
    - count_data: Map containing:
      - count: Current viewer count (integer)
      - timestamp: DateTime of update
      - platform: Platform name (optional, can be "all" for aggregated)
  """
  @spec broadcast_viewer_count(String.t(), map()) :: :ok
  def broadcast_viewer_count(user_id, count_data) do
    Absinthe.Subscription.publish(
      StreampaiWeb.Endpoint,
      count_data,
      viewer_count_updated: "widget_events:viewer_count:#{user_id}"
    )
  end

  @doc """
  Broadcast a donation goal progress update to subscribers.

  ## Parameters
    - user_id: The streamer's user ID
    - goal_data: Map containing:
      - goal_id: Unique goal ID (optional, if omitted broadcasts to all goal subscriptions)
      - current_amount: Current amount raised (float)
      - target_amount: Goal target amount (float)
      - percentage: Progress percentage (float, 0-100)
      - timestamp: DateTime of update
  """
  @spec broadcast_goal_progress(String.t(), map()) :: :ok
  def broadcast_goal_progress(user_id, goal_data) do
    topic =
      if goal_data[:goal_id] do
        "widget_events:goal:#{user_id}:#{goal_data.goal_id}"
      else
        "widget_events:goal:#{user_id}"
      end

    Absinthe.Subscription.publish(
      StreampaiWeb.Endpoint,
      goal_data,
      goal_progress: topic
    )
  end

  @doc """
  Generate a test donation event for development/testing.

  Returns a map with sample donation data that can be broadcast.
  """
  @spec generate_test_donation() :: map()
  def generate_test_donation do
    %{
      id: "test-donation-#{System.unique_integer([:positive])}",
      amount: Enum.random([5.0, 10.0, 25.0, 50.0, 100.0]),
      currency: "USD",
      username: Enum.random(["GenerousViewer", "AmazingSupporter", "CoolDonor", "BestFan123"]),
      message:
        Enum.random([
          "Keep up the great content!",
          "Love your streams!",
          "You're amazing!",
          "Best streamer ever!",
          nil
        ]),
      timestamp: DateTime.utc_now(),
      platform: Enum.random(["twitch", "youtube", "facebook", "kick"])
    }
  end

  @doc """
  Generate a test follower event for development/testing.
  """
  @spec generate_test_follower() :: map()
  def generate_test_follower do
    %{
      id: "test-follower-#{System.unique_integer([:positive])}",
      username: Enum.random(["NewFan123", "CoolViewer", "HappyFollower", "StreamFan456"]),
      timestamp: DateTime.utc_now(),
      platform: Enum.random(["twitch", "youtube", "facebook", "kick"])
    }
  end

  @doc """
  Generate a test subscriber event for development/testing.
  """
  @spec generate_test_subscriber() :: map()
  def generate_test_subscriber do
    %{
      id: "test-subscriber-#{System.unique_integer([:positive])}",
      username: Enum.random(["LoyalViewer", "SubHype", "MonthlySupporter", "PrimeSub"]),
      tier: Enum.random(["tier1", "tier2", "tier3", "prime"]),
      months: Enum.random([1, 3, 6, 12, 24, 36]),
      message:
        Enum.random([
          "Love the community!",
          "Happy to support!",
          "Keep it up!",
          nil
        ]),
      timestamp: DateTime.utc_now(),
      platform: Enum.random(["twitch", "youtube"])
    }
  end

  @doc """
  Generate a test raid event for development/testing.
  """
  @spec generate_test_raid() :: map()
  def generate_test_raid do
    %{
      id: "test-raid-#{System.unique_integer([:positive])}",
      username: Enum.random(["FriendlyStreamer", "RaidLeader", "CoolHost", "StreamBuddy"]),
      viewer_count: Enum.random([5, 10, 25, 50, 100, 250, 500]),
      timestamp: DateTime.utc_now(),
      platform: Enum.random(["twitch", "kick"])
    }
  end
end
