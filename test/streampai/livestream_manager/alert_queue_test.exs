defmodule Streampai.LivestreamManager.AlertQueueTest do
  use ExUnit.Case, async: true
  use Mneme

  alias Streampai.LivestreamManager.AlertQueue

  setup do
    # Set up test registry for isolated testing
    registry_name = :"TestRegistry_#{:rand.uniform(1_000_000)}"
    {:ok, _} = Registry.start_link(keys: :unique, name: registry_name)
    Process.put(:test_registry_name, registry_name)

    user_id = "test_user_#{:rand.uniform(1000)}"
    {:ok, pid} = AlertQueue.start_link(user_id)

    %{user_id: user_id, queue_pid: pid}
  end

  describe "basic queue operations" do
    test "starts with empty queue in playing state", %{queue_pid: pid} do
      status = AlertQueue.get_queue_status(pid)

      assert status.queue_state == :playing
      assert status.queue_length == 0
      assert status.next_events == []
    end

    test "enqueues events with correct priority ordering", %{queue_pid: pid} do
      # Enqueue events in mixed order
      chat_event = %{type: :chat_message, username: "viewer1", message: "Hello!"}
      donation_event = %{type: :donation, username: "donor1", amount: 25.00}
      follow_event = %{type: :follow, username: "follower1"}

      AlertQueue.enqueue_event(pid, chat_event)
      AlertQueue.enqueue_event(pid, donation_event)
      AlertQueue.enqueue_event(pid, follow_event)

      status = AlertQueue.get_queue_status(pid)

      auto_assert %{
                    next_events: [
                      %{
                        event: ^donation_event,
                        id: _,
                        priority: 1,
                        timestamp: _,
                        type: :event
                      },
                      %{
                        event: ^follow_event,
                        id: _,
                        priority: 2,
                        timestamp: _,
                        type: :event
                      },
                      %{
                        event: ^chat_event,
                        id: _,
                        priority: 3,
                        timestamp: _,
                        type: :event
                      }
                    ],
                    queue_length: 3,
                    queue_state: :playing,
                    recent_history: []
                  } <- status
    end
  end

  describe "control commands" do
    test "pause/resume commands work correctly", %{queue_pid: pid} do
      # Add some events
      event = %{type: :follow, username: "follower1"}
      AlertQueue.enqueue_event(pid, event)

      # Pause the queue
      AlertQueue.pause_queue(pid)

      # Wait a moment for control command to process
      Process.sleep(50)

      status = AlertQueue.get_queue_status(pid)
      assert status.queue_state == :paused

      # Resume the queue
      AlertQueue.resume_queue(pid)

      # Wait a moment for control command to process
      Process.sleep(50)

      status = AlertQueue.get_queue_status(pid)
      assert status.queue_state == :playing
    end

    test "skip command removes next event", %{queue_pid: pid} do
      # Add events
      event1 = %{type: :follow, username: "follower1"}
      event2 = %{type: :follow, username: "follower2"}

      AlertQueue.enqueue_event(pid, event1)
      AlertQueue.enqueue_event(pid, event2)

      status_before = AlertQueue.get_queue_status(pid)
      assert status_before.queue_length == 2

      # Skip next event
      AlertQueue.skip_event(pid)

      # Wait for command to process
      Process.sleep(50)

      status_after = AlertQueue.get_queue_status(pid)
      assert status_after.queue_length == 1
    end

    test "clear command removes all non-control events", %{queue_pid: pid} do
      # Add multiple events
      events = [
        %{type: :follow, username: "follower1"},
        %{type: :donation, username: "donor1", amount: 10.00},
        %{type: :chat_message, username: "chatter1", message: "Hi!"}
      ]

      Enum.each(events, &AlertQueue.enqueue_event(pid, &1))

      status_before = AlertQueue.get_queue_status(pid)
      assert status_before.queue_length == 3

      # Clear the queue
      AlertQueue.clear_queue(pid)

      # Wait for command to process
      Process.sleep(50)

      status_after = AlertQueue.get_queue_status(pid)
      assert status_after.queue_length == 0
    end
  end

  describe "priority assignment" do
    test "assigns correct priorities to different event types", %{queue_pid: pid} do
      events = [
        # High priority: big donation
        %{type: :donation, amount: 50.00, username: "bigdonor"},

        # Medium priority: regular donation
        %{type: :donation, amount: 5.00, username: "donor"},

        # Medium priority: subscription
        %{type: :subscription, username: "subscriber", tier: 1},

        # Low priority: chat message
        %{type: :chat_message, username: "chatter", message: "Hello"}
      ]

      Enum.each(events, &AlertQueue.enqueue_event(pid, &1))

      status = AlertQueue.get_queue_status(pid)
      priorities = Enum.map(status.next_events, & &1.priority)

      # Should be sorted by priority: [1, 2, 2, 3]
      assert priorities == [1, 2, 2, 3]
    end
  end

  describe "pubsub integration" do
    test "broadcasts queue updates", %{user_id: user_id, queue_pid: pid} do
      # Subscribe to queue updates
      Phoenix.PubSub.subscribe(Streampai.PubSub, "alertqueue:#{user_id}")

      # Add an event which should trigger a broadcast
      event = %{type: :follow, username: "follower1"}
      AlertQueue.enqueue_event(pid, event)

      # Should receive queue update
      assert_receive {:queue_update, update_data}, 1000

      assert update_data.queue_state == :playing
      assert update_data.queue_length == 1
      assert %DateTime{} = update_data.timestamp
    end

    test "processes events and broadcasts to alertbox topic", %{user_id: user_id, queue_pid: pid} do
      # Subscribe to alertbox events
      Phoenix.PubSub.subscribe(Streampai.PubSub, "alertbox:#{user_id}")

      # Add an event
      event = %{type: :follow, username: "follower1"}
      AlertQueue.enqueue_event(pid, event)

      # Manually trigger processing (since we don't want to wait for timer)
      AlertQueue.process_next_event(pid)

      # Should receive the processed event
      assert_receive {:alert_event, processed_event}, 1000
      assert processed_event == event
    end
  end

  describe "queue capacity management" do
    test "drops low priority events when queue is full" do
      # This test would need a queue with very small max size
      # For now, just test that the queue doesn't crash with many events
      user_id = "capacity_test_user"
      {:ok, pid} = AlertQueue.start_link(user_id)

      # Add many events rapidly
      for i <- 1..100 do
        event = %{type: :chat_message, username: "user#{i}", message: "Message #{i}"}
        AlertQueue.enqueue_event(pid, event)
      end

      # Queue should still be responsive
      status = AlertQueue.get_queue_status(pid)
      assert is_integer(status.queue_length)
      assert status.queue_state == :playing
    end
  end
end
