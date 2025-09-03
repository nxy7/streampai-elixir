defmodule Streampai.LivestreamManager.EventBroadcasterPropertyTest do
  use ExUnit.Case, async: true
  use ExUnitProperties
  
  alias Streampai.LivestreamManager.EventBroadcaster
  import StreampaiTest.LivestreamTestHelpers

  setup do
    {test_config, cleanup_fn} = start_test_livestream_manager()
    on_exit(cleanup_fn)
    
    {:ok, event_broadcaster} = EventBroadcaster.start_link(name: :test_event_broadcaster)
    
    %{event_broadcaster: event_broadcaster, test_config: test_config}
  end

  # Generators for different event types
  defp user_id_generator do
    gen all id <- string(:alphanumeric, min_length: 5, max_length: 20) do
      "user_#{id}"
    end
  end

  defp username_generator do
    gen all name <- string(:alphanumeric, min_length: 3, max_length: 15) do
      name
    end
  end

  defp donation_event_generator do
    gen all user_id <- user_id_generator(),
            username <- username_generator(),
            amount <- float(min: 0.01, max: 1000.0),
            currency <- member_of(["USD", "EUR", "GBP", "CAD"]),
            message <- string(:printable, max_length: 200) do
      %{
        type: :donation,
        user_id: user_id,
        username: username,
        amount: Float.round(amount, 2),
        currency: currency,
        message: message,
        platform: :twitch
      }
    end
  end

  defp follow_event_generator do
    gen all user_id <- user_id_generator(),
            username <- username_generator(),
            platform <- member_of([:twitch, :youtube, :facebook, :kick]) do
      %{
        type: :follow,
        user_id: user_id,
        username: username,
        platform: platform
      }
    end
  end

  defp raid_event_generator do
    gen all user_id <- user_id_generator(),
            username <- username_generator(),
            viewer_count <- integer(1..10000),
            platform <- member_of([:twitch, :youtube]) do
      %{
        type: :raid,
        user_id: user_id,
        username: username,
        viewer_count: viewer_count,
        platform: platform
      }
    end
  end

  defp valid_event_generator do
    one_of([
      donation_event_generator(),
      follow_event_generator(), 
      raid_event_generator()
    ])
  end

  property "valid events are always accepted and broadcast", 
           %{event_broadcaster: broadcaster, test_config: test_config} do
    
    check all event <- valid_event_generator() do
      # Subscribe to the user's event stream
      Phoenix.PubSub.subscribe(test_config.pubsub_name, "user_stream:#{event.user_id}:events")
      
      # Broadcast the event
      EventBroadcaster.broadcast_event(event)
      
      # Should receive the event with timestamp added
      assert_receive {:stream_event, broadcast_event}, 1000
      
      # Verify event structure
      assert broadcast_event.type == event.type
      assert broadcast_event.user_id == event.user_id
      assert broadcast_event.username == event.username
      assert Map.has_key?(broadcast_event, :timestamp)
      assert %DateTime{} = broadcast_event.timestamp
      
      # Verify event-specific fields
      case event.type do
        :donation ->
          assert broadcast_event.amount == event.amount
          assert broadcast_event.currency == event.currency
        :raid ->
          assert broadcast_event.viewer_count == event.viewer_count
        _ ->
          :ok
      end
    end
  end

  property "event counters are always accurate", 
           %{event_broadcaster: broadcaster} do
    
    check all events <- list_of(valid_event_generator(), min_length: 1, max_length: 50) do
      # Reset counters
      :sys.replace_state(broadcaster, fn state -> 
        %{state | event_counters: %{donation: 0, follow: 0, subscription: 0, raid: 0, chat_message: 0, viewer_count_update: 0, stream_start: 0, stream_end: 0}}
      end)
      
      # Broadcast all events
      Enum.each(events, &EventBroadcaster.broadcast_event/1)
      
      # Count expected events by type
      expected_counts = Enum.reduce(events, %{}, fn event, acc ->
        Map.update(acc, event.type, 1, &(&1 + 1))
      end)
      
      # Get actual counts
      stats = EventBroadcaster.get_event_stats(broadcaster)
      actual_counts = stats.event_counters
      
      # Verify counts match
      for {type, expected_count} <- expected_counts do
        actual_count = actual_counts[type] || 0
        assert actual_count >= expected_count, 
               "Expected at least #{expected_count} #{type} events, got #{actual_count}"
      end
    end
  end

  property "event history maintains correct order and size", 
           %{event_broadcaster: broadcaster} do
    
    check all events <- list_of(valid_event_generator(), min_length: 5, max_length: 20) do
      # Clear history
      :sys.replace_state(broadcaster, fn state -> 
        %{state | event_history: :queue.new()}
      end)
      
      # Add events one by one and track timestamps
      timestamps = Enum.map(events, fn event ->
        EventBroadcaster.broadcast_event(event)
        Process.sleep(1)  # Ensure different timestamps
        DateTime.utc_now()
      end)
      
      # Get history
      history = EventBroadcaster.get_event_history(broadcaster, length(events))
      
      # Verify order (should be chronological)
      history_timestamps = Enum.map(history, & &1.timestamp)
      sorted_timestamps = Enum.sort(history_timestamps, DateTime)
      
      assert history_timestamps == sorted_timestamps, "Event history not in chronological order"
      
      # Verify all events are present
      assert length(history) == length(events)
    end
  end

  property "invalid events are rejected gracefully", 
           %{event_broadcaster: broadcaster} do
    
    invalid_event_generator = one_of([
      # Missing required fields
      constant(%{type: :donation}),
      constant(%{user_id: "test"}),
      
      # Invalid types
      gen all user_id <- user_id_generator(),
              invalid_type <- atom(:alphanumeric) do
        %{type: invalid_type, user_id: user_id, username: "test"}
      end,
      
      # Invalid donation (missing amount)
      gen all user_id <- user_id_generator(),
              username <- username_generator() do
        %{type: :donation, user_id: user_id, username: username}
      end
    ])
    
    check all invalid_event <- invalid_event_generator do
      initial_stats = EventBroadcaster.get_event_stats(broadcaster)
      initial_total = initial_stats.event_counters |> Map.values() |> Enum.sum()
      
      # Should not crash when given invalid event
      EventBroadcaster.broadcast_event(invalid_event)
      
      # Counters should not increase for invalid events
      final_stats = EventBroadcaster.get_event_stats(broadcaster)
      final_total = final_stats.event_counters |> Map.values() |> Enum.sum()
      
      assert final_total == initial_total, "Invalid events should not be counted"
    end
  end

  property "concurrent event broadcasting is safe", 
           %{event_broadcaster: broadcaster, test_config: test_config} do
    
    check all events <- list_of(valid_event_generator(), min_length: 10, max_length: 50) do
      # Get unique user IDs to subscribe to
      user_ids = events |> Enum.map(& &1.user_id) |> Enum.uniq()
      
      # Subscribe to all users
      Enum.each(user_ids, fn user_id ->
        Phoenix.PubSub.subscribe(test_config.pubsub_name, "user_stream:#{user_id}:events")
      end)
      
      initial_stats = EventBroadcaster.get_event_stats(broadcaster)
      initial_total = initial_stats.event_counters |> Map.values() |> Enum.sum()
      
      # Broadcast all events concurrently
      tasks = Enum.map(events, fn event ->
        Task.async(fn -> EventBroadcaster.broadcast_event(event) end)
      end)
      
      # Wait for all to complete
      Task.await_many(tasks, 5000)
      
      # Give time for processing
      Process.sleep(100)
      
      # Verify all events were processed
      final_stats = EventBroadcaster.get_event_stats(broadcaster)
      final_total = final_stats.event_counters |> Map.values() |> Enum.sum()
      
      assert final_total >= initial_total + length(events), 
             "Not all concurrent events were processed"
      
      # Verify we received the expected number of broadcasts
      received_events = collect_events([])
      assert length(received_events) >= length(events)
    end
  end

  # Helper to collect received events
  defp collect_events(acc) do
    receive do
      {:stream_event, _event} = msg -> collect_events([msg | acc])
    after
      100 -> acc
    end
  end
end