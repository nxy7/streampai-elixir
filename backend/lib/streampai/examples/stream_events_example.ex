defmodule Streampai.Examples.StreamEventsExample do
  @moduledoc """
  Example usage of the unified stream events system.

  This demonstrates how to create different types of events in a single table
  and query them chronologically or by type.
  """

  alias Streampai.Stream.StreamEvent
  alias Streampai.Fake.StreamEvent, as: FakeStreamEvent

  @doc """
  Creates sample events to demonstrate the unified approach.
  """
  def create_sample_events do
    FakeStreamEvent.create_sample_events()
  end

  @doc """
  Demonstrates querying events chronologically (mixed types).
  """
  def demo_chronological_query do
    {livestream_id, _events} = create_sample_events()

    # Get all events for the stream in chronological order
    events = StreamEvent.for_stream(%{livestream_id: livestream_id, limit: 10})

    IO.puts("\n=== Chronological Events (All Types Mixed) ===")

    Enum.each(events, fn event ->
      summary =
        case event.type do
          :chat_message ->
            "💬 #{event.data["username"]}: #{event.data["message"]}"

          :donation ->
            "💰 #{event.data["donor_name"]} donated $#{event.data["amount"]}"

          :follow ->
            "👥 #{event.data["username"]} followed"

          :subscription ->
            "⭐ #{event.data["username"]} subscribed (Tier #{event.data["tier"]})"

          :raid ->
            "🎯 #{event.data["raider_name"]} raided with #{event.data["viewer_count"]} viewers"

          _ ->
            "❓ Unknown event"
        end

      IO.puts("#{DateTime.to_string(event.inserted_at)} | #{summary}")
    end)

    livestream_id
  end

  @doc """
  Demonstrates querying events by specific type.
  """
  def demo_type_specific_query(livestream_id) do
    # Get only chat messages
    chat_events =
      StreamEvent.by_type(%{
        livestream_id: livestream_id,
        event_type: :chat_message,
        limit: 10
      })

    IO.puts("\n=== Chat Messages Only ===")

    Enum.each(chat_events, fn event ->
      badges = if event.data["is_subscriber"], do: "[SUB]", else: ""
      badges = if event.data["is_moderator"], do: badges <> "[MOD]", else: badges
      badges = if badges != "", do: "#{badges} ", else: ""

      IO.puts("💬 #{badges}#{event.data["username"]}: #{event.data["message"]}")
    end)

    # Get only donations
    donation_events =
      StreamEvent.by_type(%{
        livestream_id: livestream_id,
        event_type: :donation,
        limit: 10
      })

    IO.puts("\n=== Donations Only ===")

    Enum.each(donation_events, fn event ->
      message_part =
        if event.data["message"],
          do: " - \"#{event.data["message"]}\"",
          else: ""

      IO.puts("💰 #{event.data["donor_name"]} donated $#{event.data["amount"]}#{message_part}")
    end)
  end

  @doc """
  Demonstrates the performance advantage of single table for chronological queries.
  """
  def demo_performance_advantage do
    IO.puts("\n=== Performance Comparison ===")

    IO.puts("❌ OLD APPROACH (Multiple Tables):")

    IO.puts(
      "   SELECT * FROM chat_messages WHERE stream_id = ? ORDER BY inserted_at DESC LIMIT 50"
    )

    IO.puts("   UNION ALL")
    IO.puts("   SELECT * FROM donations WHERE stream_id = ? ORDER BY inserted_at DESC LIMIT 50")
    IO.puts("   UNION ALL")
    IO.puts("   SELECT * FROM follows WHERE stream_id = ? ORDER BY inserted_at DESC LIMIT 50")
    IO.puts("   -- Then sort in application layer")

    IO.puts("\n✅ NEW APPROACH (Single Table):")

    IO.puts(
      "   SELECT * FROM stream_events WHERE livestream_id = ? ORDER BY inserted_at DESC LIMIT 50"
    )

    IO.puts("   -- Perfect chronological order, single query, single index scan!")
  end

  @doc """
  Run the complete demo.
  """
  def run_demo do
    IO.puts("🎬 Stream Events Demo")
    IO.puts("=" |> String.duplicate(50))

    # Create sample events and show chronological query
    livestream_id = demo_chronological_query()

    # Show type-specific queries
    demo_type_specific_query(livestream_id)

    # Show performance advantage
    demo_performance_advantage()

    IO.puts("\n✅ Demo completed! Livestream ID: #{livestream_id}")
    livestream_id
  end
end
