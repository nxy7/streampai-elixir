defmodule StreampaiWeb.Utils.FakeEventlist do
  @moduledoc """
  Utilities for generating fake eventlist data for preview and testing.
  """

  alias Streampai.Fake.Base
  alias StreampaiWeb.Utils.PlatformColors

  @event_types [:donation, :follow, :subscription, :raid, :chat_message]

  @donation_messages [
    "Keep up the great work!",
    "Love the stream! 💖",
    "Thanks for the entertainment!",
    "Here's a little something for you",
    "Amazing content as always!",
    "You deserve this and more!",
    "Keep being awesome!",
    "Love what you do!",
    "Great stream tonight!",
    "Thanks for making my day better!"
  ]

  @follow_messages [
    "New follower!",
    "Welcome to the family!",
    "Thanks for the follow!",
    "Another amazing person joins us!",
    "Welcome aboard!",
    "Happy to have you here!",
    "Thanks for joining the community!",
    "Welcome to the stream!",
    "Glad you found us!",
    "Welcome to the crew!"
  ]

  @subscription_messages [
    "Thanks for the sub!",
    "Welcome to the sub club!",
    "Much appreciated!",
    "You're the best!",
    "Thanks for the support!",
    "Welcome to the subscriber family!",
    "Amazing, thank you!",
    "You rock!",
    "Thanks for believing in the stream!",
    "Subscriber hype!"
  ]

  @raid_messages [
    "Thanks for the raid!",
    "Welcome raiders!",
    "Raid hype!",
    "Thanks for bringing the crew!",
    "Welcome everyone!",
    "Raid squad is here!",
    "Thanks for the love!",
    "Welcome to the stream raiders!",
    "Appreciate the raid!",
    "Amazing raid!"
  ]

  @chat_messages [
    "Hey everyone! How's the stream going?",
    "This is so entertaining!",
    "POGGERS",
    "Can't wait to see what happens next",
    "You're doing great!",
    "Love this game!",
    "First time here, loving it already!",
    "LUL that was funny",
    "Keep it up!",
    "This is why I love your streams",
    "Amazing plays!",
    "GG",
    "Hype!",
    "Best streamer ever!",
    "Can you play that song again?",
    "What's your setup?",
    "How long have you been streaming?",
    "Love the overlay!",
    "Your setup looks clean!",
    "Thanks for the stream!"
  ]

  @platforms [:twitch, :youtube, :facebook, :kick]

  def default_config do
    %{
      animation_type: "fade",
      max_events: 10,
      event_types: ["donation", "follow", "subscription", "raid"],
      show_timestamps: false,
      show_platform: false,
      show_amounts: true,
      font_size: "medium",
      compact_mode: true
    }
  end

  @doc """
  Generates a single random event for preview purposes.
  """
  def generate_event do
    event_type = Enum.random(@event_types)
    platform = Enum.random(@platforms)
    username = Base.generate_username()

    base_event = %{
      id: "event_#{:rand.uniform(10_000)}",
      type: Atom.to_string(event_type),
      username: username,
      timestamp: DateTime.utc_now(),
      platform: %{
        icon: Atom.to_string(platform),
        color: PlatformColors.get_platform_color(platform)
      }
    }

    case event_type do
      :donation ->
        amount = Enum.random([5.00, 10.00, 25.00, 50.00, 100.00, 2.50, 7.50, 15.00, 20.00])

        Map.merge(base_event, %{
          amount: amount,
          currency: "$",
          message: Enum.random(@donation_messages),
          data: %{
            "amount" => amount,
            "currency" => "USD",
            "message" => Enum.random(@donation_messages)
          }
        })

      :follow ->
        Map.merge(base_event, %{
          message: Enum.random(@follow_messages),
          data: %{
            "message" => Enum.random(@follow_messages)
          }
        })

      :subscription ->
        tier = Enum.random(["Tier 1", "Tier 2", "Tier 3"])
        months = Enum.random([1, 2, 3, 6, 12, 24])

        Map.merge(base_event, %{
          message: Enum.random(@subscription_messages),
          data: %{
            "tier" => tier,
            "months" => months,
            "message" => Enum.random(@subscription_messages)
          }
        })

      :raid ->
        viewer_count = Enum.random([5, 10, 25, 50, 100, 250, 500])

        Map.merge(base_event, %{
          message: Enum.random(@raid_messages),
          data: %{
            "viewer_count" => viewer_count,
            "message" => Enum.random(@raid_messages)
          }
        })

      :chat_message ->
        Map.merge(base_event, %{
          message: Enum.random(@chat_messages),
          data: %{
            "message" => Enum.random(@chat_messages),
            "badges" => generate_chat_badges(),
            "emotes" => []
          }
        })
    end
  end

  @doc """
  Generates multiple events for testing purposes.
  """
  def generate_events(count \\ 15) do
    # Generate events with slightly different timestamps to simulate real activity
    base_time = DateTime.utc_now()

    0..(count - 1)
    |> Enum.map(fn index ->
      # Events from most recent to oldest
      timestamp = DateTime.add(base_time, -index * 30, :second)

      generate_event()
      |> Map.put(:timestamp, timestamp)
      |> Map.put(:id, "event_#{System.unique_integer([:positive])}")
    end)
    |> Enum.sort_by(& &1.timestamp, {:desc, DateTime})
  end

  @doc """
  Generates realistic event statistics for the widget.
  """
  def generate_event_stats(events \\ nil) do
    events = events || generate_events(50)

    total_events = length(events)

    type_counts =
      events
      |> Enum.group_by(& &1.type)
      |> Map.new(fn {type, events} -> {type, length(events)} end)

    total_donations =
      events
      |> Enum.filter(&(&1.type == "donation"))
      |> Enum.map(&Map.get(&1, :amount, 0))
      |> Enum.sum()

    %{
      total_events: total_events,
      donations: Map.get(type_counts, "donation", 0),
      follows: Map.get(type_counts, "follow", 0),
      subscriptions: Map.get(type_counts, "subscription", 0),
      raids: Map.get(type_counts, "raid", 0),
      chat_messages: Map.get(type_counts, "chat_message", 0),
      total_donation_amount: Float.round(total_donations, 2),
      # Simulating 1 hour of activity
      events_per_hour: Float.round(total_events / 1.0, 1),
      most_active_platform: get_most_active_platform(events)
    }
  end

  defp generate_chat_badges do
    possible_badges = ["subscriber", "vip", "moderator", "broadcaster"]
    # Most users have 0-1 badges
    badge_count = Enum.random([0, 0, 0, 1, 1, 2])

    Enum.take_random(possible_badges, badge_count)
  end

  defp get_most_active_platform(events) do
    events
    |> Enum.group_by(&get_in(&1, [:platform, :icon]))
    |> Enum.map(fn {platform, events} -> {platform, length(events)} end)
    |> Enum.max_by(fn {_platform, count} -> count end, fn -> {"twitch", 0} end)
    |> elem(0)
  end
end
