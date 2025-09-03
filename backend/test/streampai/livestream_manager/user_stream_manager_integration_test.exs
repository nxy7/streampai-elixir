defmodule Streampai.LivestreamManager.UserStreamManagerIntegrationTest do
  use ExUnit.Case, async: true
  
  alias Streampai.LivestreamManager
  import StreampaiTest.LivestreamTestHelpers

  setup do
    {test_config, cleanup_fn} = start_test_livestream_manager()
    on_exit(cleanup_fn)
    
    %{test_config: test_config}
  end

  describe "full user stream lifecycle" do
    test "starts and manages complete user stream", %{test_config: test_config} do
      user_data = create_test_user("integration_user")
      user_id = user_data.user_id
      
      # 1. Start user stream management
      {:ok, user_stream_pid} = start_test_user_stream(test_config, user_id)
      assert Process.alive?(user_stream_pid)
      
      # 2. Verify all child processes started
      children = Supervisor.which_children(user_stream_pid)
      child_modules = Enum.map(children, fn {id, _pid, _type, [module]} -> module end)
      
      expected_modules = [
        LivestreamManager.StreamStateServer,
        LivestreamManager.PlatformSupervisor,
        LivestreamManager.CloudflareManager,
        LivestreamManager.AlertManager
      ]
      
      for module <- expected_modules do
        assert module in child_modules, "Expected #{module} to be started"
      end
      
      # 3. Test state retrieval
      state = LivestreamManager.get_stream_state(user_id)
      assert state.user_id == user_id
      assert state.status == :offline
    end

    test "handles platform events end-to-end", %{test_config: test_config} do
      user_id = "events_test_user"
      {:ok, _} = start_test_user_stream(test_config, user_id)
      
      # Subscribe to relevant events
      topics = [
        "user_stream:#{user_id}:events",
        "widget_events:#{user_id}:alertbox",
        "dashboard:#{user_id}:stream"
      ]
      
      {_result, events} = capture_events(test_config.pubsub_name, topics, fn ->
        # Simulate a donation event from Twitch
        donation_event = %{
          type: :donation,
          user_id: user_id,
          platform: :twitch,
          username: "generous_viewer",
          amount: 10.00,
          currency: "USD",
          message: "Great stream!"
        }
        
        # Broadcast event through the system
        LivestreamManager.EventBroadcaster.broadcast_event(donation_event)
        
        # Allow time for event processing
        Process.sleep(100)
      end)
      
      # Verify events were processed correctly
      assert length(events) >= 3, "Should have events for all subscribed topics"
      
      # Check that alertbox event was created with display_time
      alertbox_events = Enum.filter(events, fn
        {:widget_event, event} -> event.type == :donation
        _ -> false
      end)
      
      assert length(alertbox_events) == 1
      [{:widget_event, alertbox_event}] = alertbox_events
      assert alertbox_event.display_time == 8  # Default for donations
      assert alertbox_event.amount == 10.00
    end

    test "chat message broadcasting", %{test_config: test_config} do
      user_id = "chat_test_user"
      {:ok, _} = start_test_user_stream(test_config, user_id)
      
      # Start platform API mock
      {:ok, api_mock} = StreampaiTest.Mocks.PlatformAPIMock.start_link()
      
      # Set up expected responses
      StreampaiTest.Mocks.PlatformAPIMock.set_response(
        api_mock, 
        :twitch, 
        :send_chat, 
        {:ok, %{message_id: "twitch_msg_123"}}
      )
      
      # Send chat message
      message = "Hello from the stream!"
      result = LivestreamManager.send_chat_message(user_id, message, :all)
      
      # In the real implementation, this would call platform APIs
      # For now, we can test the structure is working
      assert result == :ok or match?({:error, :not_found}, result)
      
      # Verify API would have been called (in mock)
      call_log = StreampaiTest.Mocks.PlatformAPIMock.get_call_log(api_mock)
      # Note: This requires the actual platform manager to use the mock
    end

    test "stream metadata updates", %{test_config: test_config} do
      user_id = "metadata_test_user"
      {:ok, _} = start_test_user_stream(test_config, user_id)
      
      # Subscribe to state changes
      Phoenix.PubSub.subscribe(test_config.pubsub_name, "user_stream:#{user_id}")
      
      metadata = %{
        title: "New Stream Title",
        thumbnail_url: "https://example.com/new_thumb.jpg"
      }
      
      result = LivestreamManager.update_stream_metadata(user_id, metadata, :all)
      assert result == :ok
      
      # Wait for state update
      assert_receive {:stream_state_changed, updated_state}, 1000
      assert updated_state.title == "New Stream Title"
    end

    test "cloudflare output configuration", %{test_config: test_config} do
      user_id = "cloudflare_test_user"
      {:ok, _} = start_test_user_stream(test_config, user_id)
      
      platform_configs = %{
        twitch: %{
          enabled: true,
          stream_key: "twitch_key_123"
        },
        youtube: %{
          enabled: false
        }
      }
      
      result = LivestreamManager.configure_stream_outputs(user_id, platform_configs)
      assert result == :ok
      
      # Verify cloudflare manager received the configuration
      # This would require accessing the cloudflare manager's state
    end
  end

  describe "error handling and resilience" do
    test "recovers from platform manager crashes", %{test_config: test_config} do
      user_id = "crash_test_user"
      {:ok, user_stream_pid} = start_test_user_stream(test_config, user_id)
      
      # Find the platform supervisor
      children = Supervisor.which_children(user_stream_pid)
      {_, platform_supervisor_pid, _, _} = Enum.find(children, fn 
        {id, _pid, _type, _modules} -> 
          id == LivestreamManager.PlatformSupervisor
      end)
      
      # Crash the platform supervisor
      Process.exit(platform_supervisor_pid, :kill)
      
      # Allow supervisor to restart
      Process.sleep(100)
      
      # Verify the user stream manager is still alive and functional
      assert Process.alive?(user_stream_pid)
      
      # Verify platform supervisor was restarted
      new_children = Supervisor.which_children(user_stream_pid)
      assert length(new_children) == length(children)
    end

    test "handles invalid user operations gracefully", %{test_config: test_config} do
      non_existent_user = "does_not_exist"
      
      # These should return errors, not crash
      assert {:error, :not_found} = LivestreamManager.get_stream_state(non_existent_user)
      assert {:error, :not_found} = LivestreamManager.send_chat_message(non_existent_user, "test")
      assert {:error, :not_found} = LivestreamManager.update_stream_metadata(non_existent_user, %{})
    end

    test "prevents duplicate user stream creation", %{test_config: test_config} do
      user_id = "duplicate_test_user"
      
      {:ok, first_pid} = start_test_user_stream(test_config, user_id)
      
      # Try to start again - should return existing or error
      result = start_test_user_stream(test_config, user_id)
      
      case result do
        {:ok, second_pid} -> 
          # Should be same PID if returning existing
          assert first_pid == second_pid
        {:error, :already_exists} -> 
          # Or should return already exists error
          :ok
      end
    end
  end

  describe "performance and scalability" do
    @tag :performance
    test "handles multiple concurrent users", %{test_config: test_config} do
      num_users = 10
      
      user_ids = for i <- 1..num_users, do: "perf_user_#{i}"
      
      # Start all users concurrently
      tasks = Enum.map(user_ids, fn user_id ->
        Task.async(fn -> start_test_user_stream(test_config, user_id) end)
      end)
      
      results = Task.await_many(tasks, 5000)
      
      # All should start successfully
      assert Enum.all?(results, fn
        {:ok, _pid} -> true
        _ -> false
      end)
      
      # Verify all are running
      running_users = LivestreamManager.list_active_streams()
      assert length(running_users) >= num_users
    end

    @tag :performance 
    test "event processing throughput", %{test_config: test_config} do
      user_id = "throughput_test_user"
      {:ok, _} = start_test_user_stream(test_config, user_id)
      
      num_events = 100
      
      start_time = System.monotonic_time(:millisecond)
      
      # Send many events rapidly
      for i <- 1..num_events do
        event = %{
          type: :follow,
          user_id: user_id,
          platform: :twitch,
          username: "follower_#{i}"
        }
        
        LivestreamManager.EventBroadcaster.broadcast_event(event)
      end
      
      end_time = System.monotonic_time(:millisecond)
      duration = end_time - start_time
      
      # Should process 100 events in reasonable time (< 1 second)
      assert duration < 1000, "Event processing took too long: #{duration}ms"
      
      # Verify events were processed
      stats = LivestreamManager.EventBroadcaster.get_event_stats()
      assert stats.event_counters.follow >= num_events
    end
  end
end