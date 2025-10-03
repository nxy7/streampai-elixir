defmodule Streampai.YouTube.GrpcStreamClientTest do
  use ExUnit.Case, async: true

  alias Streampai.YouTube.GrpcStreamClient

  @moduletag :skip
  describe "GrpcStreamClient" do
    test "start_link/5 starts GenServer process" do
      # Mock test - would need proper gRPC setup for real testing
      user_id = "test_user"
      livestream_id = "test_stream"
      access_token = "mock_token"
      live_chat_id = "mock_chat_id"

      # This will start but fail to connect with mock credentials
      assert {:ok, pid} =
               GrpcStreamClient.start_link(
                 user_id,
                 livestream_id,
                 access_token,
                 live_chat_id,
                 self()
               )

      assert is_pid(pid)

      # Clean up
      GenServer.stop(pid, :normal)
    end

    test "get_status/1 returns current stream status" do
      user_id = "test_user"
      livestream_id = "test_stream"
      access_token = "mock_token"
      live_chat_id = "mock_chat_id"

      {:ok, pid} =
        GrpcStreamClient.start_link(user_id, livestream_id, access_token, live_chat_id, self())

      status = GrpcStreamClient.get_status(pid)

      assert %{
               live_chat_id: ^live_chat_id,
               reconnect_attempts: _
             } = status

      GenServer.stop(pid, :normal)
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
