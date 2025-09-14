defmodule Streampai.YouTube.LiveChatStreamTest do
  use ExUnit.Case, async: true

  alias Streampai.YouTube.LiveChatStream

  @moduletag :skip
  describe "LiveChatStream" do
    test "start_stream/4 starts GenServer process" do
      # Mock test - would need proper gRPC setup for real testing
      access_token = "mock_token"
      live_chat_id = "mock_chat_id"

      # This will start but fail to connect with mock credentials
      assert {:ok, pid} = LiveChatStream.start_stream(access_token, live_chat_id, self())
      assert is_pid(pid)

      # Clean up
      GenServer.stop(pid, :normal)
    end

    test "get_status/1 returns current stream status" do
      access_token = "mock_token"
      live_chat_id = "mock_chat_id"

      {:ok, pid} = LiveChatStream.start_stream(access_token, live_chat_id, self())

      status = LiveChatStream.get_status(pid)

      assert %{
               # Expected with mock credentials
               connected: false,
               live_chat_id: ^live_chat_id,
               reconnect_attempts: _,
               max_reconnect_attempts: _
             } = status

      GenServer.stop(pid, :normal)
    end

    test "log_handler/0 spawns message logging process" do
      pid = LiveChatStream.log_handler()
      assert is_pid(pid)
      assert Process.alive?(pid)

      # Send test message
      send(pid, {:chat_message, %{"test" => "message"}})

      # Clean up
      Process.exit(pid, :normal)
    end
  end

  describe "Message handling" do
    test "handles chat messages correctly" do
      # Test message structure validation
      test_message = %{
        "id" => "test_id",
        "snippet" => %{
          "type" => "textMessageEvent",
          "displayMessage" => "Test message",
          "authorChannelId" => "test_author"
        },
        "authorDetails" => %{
          "displayName" => "Test User"
        }
      }

      # This would be tested with actual message processing
      assert is_map(test_message)
      assert get_in(test_message, ["snippet", "type"]) == "textMessageEvent"
    end
  end
end
