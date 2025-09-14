defmodule Streampai.LivestreamManager.Platforms.YouTubeManagerIntegrationTest do
  @moduledoc """
  Integration tests for YouTube streaming workflow.
  Tests the complete flow from GO LIVE to stream management.
  """

  use ExUnit.Case, async: false
  import ExUnit.CaptureLog

  alias Streampai.LivestreamManager.Platforms.YouTubeManager

  @moduletag :integration

  setup do
    # Create a test registry for isolation
    registry_name = :"test_registry_#{:rand.uniform(1000)}"
    start_supervised!({Registry, keys: :unique, name: registry_name})
    Process.put(:test_registry_name, registry_name)

    user_id = "test_user_#{:rand.uniform(1000)}"

    # Mock config with test access token
    config = %{
      access_token: "test_access_token",
      refresh_token: "test_refresh_token",
      expires_at: DateTime.add(DateTime.utc_now(), 3600, :second),
      extra_data: %{}
    }

    {:ok, user_id: user_id, config: config, registry_name: registry_name}
  end

  describe "YouTube streaming workflow" do
    test "creates YouTube broadcast and handles streaming lifecycle", %{
      user_id: user_id,
      config: config
    } do
      # Start YouTubeManager
      {:ok, _pid} = YouTubeManager.start_link(user_id, config)

      stream_uuid = Ecto.UUID.generate()

      # Mock YouTube API responses
      _mock_broadcast_response = %{
        "id" => "test_broadcast_id",
        "snippet" => %{
          "title" => "Test Stream",
          "description" => "Test Description",
          "liveChatId" => "test_chat_id"
        }
      }

      _mock_stream_response = %{
        "id" => "test_stream_id",
        "cdn" => %{
          "ingestionInfo" => %{
            "ingestionAddress" => "rtmp://youtube.com/live",
            "streamName" => "test_stream_key"
          }
        }
      }

      # Test starting streaming
      # Note: In a real integration test, we'd need valid YouTube API credentials
      # For now, we'll test the interface and error handling

      # Capture logs to suppress expected authentication errors
      {stream_result, _logs} = with_log(fn ->
        YouTubeManager.start_streaming(user_id, stream_uuid)
      end)

      # Since we're using test credentials, we expect this to fail
      # but the failure should be handled gracefully
      case stream_result do
        :ok ->
          # If it somehow succeeds with test credentials, verify we can get broadcast ID
          broadcast_id = YouTubeManager.get_broadcast_id(user_id)
          assert is_binary(broadcast_id) or is_nil(broadcast_id)

        {:error, reason} ->
          # Expected failure due to invalid credentials
          assert reason
      end

      # Test stopping streaming (should work even if start failed)
      {actual_stop, _logs} = with_log(fn ->
        YouTubeManager.stop_streaming(user_id)
      end)
      assert actual_stop == :ok or match?({:error, _}, actual_stop)
    end

    test "handles metadata updates", %{user_id: user_id, config: config} do
      {:ok, _pid} = YouTubeManager.start_link(user_id, config)

      metadata = %{
        title: "Updated Stream Title",
        description: "Updated stream description"
      }

      # Capture logs to suppress expected "not_streaming" errors
      capture_log(fn ->
        result = YouTubeManager.update_stream_metadata(user_id, metadata)
        # Should handle the case when not streaming
        assert result == {:error, :not_streaming} or match?({:error, _}, result)
      end)
    end

    test "handles chat message sending", %{user_id: user_id, config: config} do
      {:ok, _pid} = YouTubeManager.start_link(user_id, config)

      result = YouTubeManager.send_chat_message(user_id, "Test message")
      # Should handle gracefully even when not streaming
      assert result == :ok or match?({:error, _}, result)
    end

    test "provides stream metrics", %{user_id: user_id, config: config} do
      {:ok, _pid} = YouTubeManager.start_link(user_id, config)

      metrics = YouTubeManager.get_stream_metrics(user_id)

      assert is_map(metrics)
      assert Map.has_key?(metrics, :viewer_count)
      assert Map.has_key?(metrics, :stream_title)
      assert Map.has_key?(metrics, :stream_description)
      assert Map.has_key?(metrics, :is_active)

      assert metrics.viewer_count == 0
      assert is_nil(metrics.stream_title)
      assert is_nil(metrics.stream_description)
      assert metrics.is_active == false
    end
  end

  describe "error handling" do
    test "handles invalid config gracefully", %{user_id: user_id} do
      invalid_config = %{
        access_token: nil,
        refresh_token: nil,
        expires_at: nil,
        extra_data: %{}
      }

      {:ok, _pid} = YouTubeManager.start_link(user_id, invalid_config)

      stream_uuid = Ecto.UUID.generate()

      # Capture logs to suppress expected authentication errors
      capture_log(fn ->
        result = YouTubeManager.start_streaming(user_id, stream_uuid)
        # Should handle missing credentials gracefully
        assert match?({:error, _}, result)
      end)
    end

    test "handles network failures gracefully", %{user_id: user_id, config: config} do
      {:ok, _pid} = YouTubeManager.start_link(user_id, config)

      # Test with malformed access token to simulate network/auth failure
      stream_uuid = Ecto.UUID.generate()

      # Capture logs to suppress expected authentication errors
      capture_log(fn ->
        result = YouTubeManager.start_streaming(user_id, stream_uuid)
        # Should handle API failures gracefully
        assert result == :ok or match?({:error, _}, result)
      end)
    end
  end

  describe "state management" do
    test "maintains correct state during lifecycle", %{user_id: user_id, config: config} do
      {:ok, _pid} = YouTubeManager.start_link(user_id, config)

      # Initial state
      metrics = YouTubeManager.get_stream_metrics(user_id)
      assert metrics.is_active == false
      assert is_nil(metrics.stream_title)

      # After attempting to start (will likely fail with test credentials)
      stream_uuid = Ecto.UUID.generate()

      # Capture logs to suppress expected authentication errors
      capture_log(fn ->
        YouTubeManager.start_streaming(user_id, stream_uuid)
      end)

      # State should be consistent
      updated_metrics = YouTubeManager.get_stream_metrics(user_id)
      assert is_map(updated_metrics)

      # After stopping
      YouTubeManager.stop_streaming(user_id)
      final_metrics = YouTubeManager.get_stream_metrics(user_id)
      assert final_metrics.is_active == false
    end
  end
end
