defmodule Streampai.LivestreamManager.StreamStateServerTest do
  use ExUnit.Case, async: true
  
  alias Streampai.LivestreamManager.StreamStateServer
  import StreampaiTest.LivestreamTestHelpers

  setup do
    {test_config, cleanup_fn} = start_test_livestream_manager()
    
    # Start a test-specific registry for this test
    {:ok, _} = Registry.start_link(keys: :unique, name: test_config.registry_name)
    
    on_exit(cleanup_fn)
    
    %{test_config: test_config}
  end

  describe "initialization" do
    test "starts with correct initial state", %{test_config: test_config} do
      user_id = "test_user_123"
      
      {:ok, pid} = StreamStateServer.start_link(user_id)
      
      state = StreamStateServer.get_state(pid)
      
      assert state.user_id == user_id
      assert state.status == :offline
      assert state.statistics.total_viewers == 0
      assert is_map(state.platforms)
    end

    test "loads user platforms on initialization" do
      # This would test the platform loading logic
      # For now, it returns empty map since we haven't implemented the DB query
      user_id = "test_user_456"
      
      {:ok, pid} = StreamStateServer.start_link(user_id)
      state = StreamStateServer.get_state(pid)
      
      # In real implementation, this would load from database
      assert state.platforms == %{}
    end
  end

  describe "status updates" do
    setup %{test_config: test_config} do
      user_id = "test_user_status"
      {:ok, pid} = StreamStateServer.start_link(user_id)
      
      %{pid: pid, user_id: user_id}
    end

    test "updates stream status", %{pid: pid, test_config: test_config} do
      # Subscribe to state changes
      Phoenix.PubSub.subscribe(test_config.pubsub_name, "user_stream:test_user_status")
      
      StreamStateServer.update_status(pid, :live)
      
      # Check state was updated
      state = StreamStateServer.get_state(pid)
      assert state.status == :live
      assert state.started_at != nil
      
      # Check broadcast was sent
      assert_receive {:stream_state_changed, updated_state}
      assert updated_state.status == :live
    end

    test "sets timestamps correctly for different statuses", %{pid: pid} do
      # Test going live
      StreamStateServer.update_status(pid, :live)
      live_state = StreamStateServer.get_state(pid)
      assert live_state.started_at != nil
      assert live_state.ended_at == nil
      
      # Test going offline
      StreamStateServer.update_status(pid, :offline)
      offline_state = StreamStateServer.get_state(pid)
      assert offline_state.ended_at != nil
      assert offline_state.started_at != nil  # Should keep start time
    end
  end

  describe "metadata updates" do
    setup %{test_config: test_config} do
      user_id = "test_user_metadata"
      {:ok, pid} = StreamStateServer.start_link(user_id)
      
      %{pid: pid, user_id: user_id}
    end

    test "updates stream metadata", %{pid: pid} do
      new_metadata = %{
        title: "My Awesome Stream",
        thumbnail_url: "https://example.com/thumb.jpg"
      }
      
      StreamStateServer.update_metadata(pid, new_metadata)
      
      state = StreamStateServer.get_state(pid)
      assert state.title == "My Awesome Stream"
      assert state.thumbnail_url == "https://example.com/thumb.jpg"
    end

    test "ignores invalid metadata fields", %{pid: pid} do
      invalid_metadata = %{
        title: "Valid Title",
        invalid_field: "Should be ignored",
        another_invalid: 123
      }
      
      StreamStateServer.update_metadata(pid, invalid_metadata)
      
      state = StreamStateServer.get_state(pid)
      assert state.title == "Valid Title"
      refute Map.has_key?(state, :invalid_field)
      refute Map.has_key?(state, :another_invalid)
    end
  end

  describe "platform status updates" do
    setup %{test_config: test_config} do
      user_id = "test_user_platforms"
      {:ok, pid} = StreamStateServer.start_link(user_id)
      
      %{pid: pid, user_id: user_id}
    end

    test "updates platform connection status", %{pid: pid} do
      platform_update = %{
        status: :connected,
        viewer_count: 150,
        last_connected: DateTime.utc_now()
      }
      
      StreamStateServer.update_platform_status(pid, :twitch, platform_update)
      
      state = StreamStateServer.get_state(pid)
      assert state.platforms[:twitch][:status] == :connected
      assert state.platforms[:twitch][:viewer_count] == 150
    end

    test "merges platform updates with existing data", %{pid: pid} do
      # First update
      StreamStateServer.update_platform_status(pid, :twitch, %{
        status: :connected,
        username: "test_streamer"
      })
      
      # Second update should merge
      StreamStateServer.update_platform_status(pid, :twitch, %{
        viewer_count: 200
      })
      
      state = StreamStateServer.get_state(pid)
      twitch_data = state.platforms[:twitch]
      
      assert twitch_data[:status] == :connected
      assert twitch_data[:username] == "test_streamer"
      assert twitch_data[:viewer_count] == 200
    end
  end

  describe "statistics updates" do
    setup %{test_config: test_config} do
      user_id = "test_user_stats" 
      {:ok, pid} = StreamStateServer.start_link(user_id)
      
      %{pid: pid, user_id: user_id}
    end

    test "updates statistics", %{pid: pid, test_config: test_config} do
      # Subscribe to statistics updates
      Phoenix.PubSub.subscribe(test_config.pubsub_name, "user_stream:test_user_stats:statistics")
      
      stats_update = %{
        total_viewers: 500,
        donations_count: 5,
        follows_count: 10
      }
      
      StreamStateServer.update_statistics(pid, stats_update)
      
      state = StreamStateServer.get_state(pid)
      assert state.statistics.total_viewers == 500
      assert state.statistics.donations_count == 5
      assert state.statistics.follows_count == 10
      
      # Check statistics broadcast
      assert_receive {:stream_statistics_update, broadcast_stats}
      assert broadcast_stats.total_viewers == 500
    end

    test "preserves existing statistics when updating", %{pid: pid} do
      # Initial state has some default stats
      initial_state = StreamStateServer.get_state(pid)
      initial_messages = initial_state.statistics.chat_messages
      
      # Update only specific stats
      StreamStateServer.update_statistics(pid, %{donations_count: 3})
      
      updated_state = StreamStateServer.get_state(pid)
      assert updated_state.statistics.donations_count == 3
      assert updated_state.statistics.chat_messages == initial_messages
    end
  end

  describe "cloudflare input management" do
    setup %{test_config: test_config} do
      user_id = "test_user_cloudflare"
      {:ok, pid} = StreamStateServer.start_link(user_id)
      
      %{pid: pid, user_id: user_id}
    end

    test "sets cloudflare input configuration", %{pid: pid} do
      input_config = %{
        input_id: "cf_input_123",
        rtmp_url: "rtmp://live.cloudflare.com/live",
        stream_key: "secret_key_456",
        status: :ready
      }
      
      StreamStateServer.set_cloudflare_input(pid, input_config)
      
      state = StreamStateServer.get_state(pid)
      assert state.cloudflare_input.input_id == "cf_input_123"
      assert state.cloudflare_input.rtmp_url == "rtmp://live.cloudflare.com/live"
      assert state.cloudflare_input.stream_key == "secret_key_456"
      assert state.cloudflare_input.status == :ready
    end
  end
end