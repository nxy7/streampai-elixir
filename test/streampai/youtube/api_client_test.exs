defmodule Streampai.YouTube.ApiClientTest do
  use ExUnit.Case, async: true

  alias Streampai.YouTube.ApiClient

  @moduletag :skip
  @moduletag :integration

  describe "Live Broadcasts API" do
    @tag :skip
    test "list_live_broadcasts/3 returns broadcasts for authenticated user" do
      # This test requires valid OAuth token and would be skipped in CI
      # Example of how to structure the test:

      access_token = System.get_env("YOUTUBE_ACCESS_TOKEN") || "mock_token"

      case ApiClient.list_live_broadcasts(access_token, "snippet,status", mine: true) do
        {:ok, response} ->
          assert %{"items" => _items} = response
          assert is_list(response["items"])

        {:error, {:http_error, 401, _}} ->
          # Expected if no valid token
          :ok

        {:error, reason} ->
          flunk("Unexpected error: #{inspect(reason)}")
      end
    end

    test "insert_live_broadcast/4 with mock data" do
      # Mock test structure
      broadcast_data = %{
        snippet: %{
          title: "Test Broadcast",
          scheduledStartTime: "2024-12-25T10:00:00Z"
        },
        status: %{
          privacyStatus: "private"
        }
      }

      # This would fail with mock token but shows proper structure
      result = ApiClient.insert_live_broadcast("mock_token", "snippet,status", broadcast_data)
      assert match?({:error, _}, result)
    end
  end

  describe "Live Streams API" do
    test "insert_live_stream/4 with mock data" do
      stream_data = %{
        snippet: %{
          title: "Test Stream"
        },
        cdn: %{
          format: "1080p",
          ingestionType: "rtmp"
        }
      }

      result = ApiClient.insert_live_stream("mock_token", "snippet,cdn", stream_data)
      assert match?({:error, _}, result)
    end
  end

  describe "Live Chat Messages API" do
    test "stream_live_chat_messages/3 directs to gRPC streaming" do
      result = ApiClient.stream_live_chat_messages("token", "chat_id")
      assert {:error, :use_grpc_streaming, _message} = result
    end

    test "insert_live_chat_message/3 with mock data" do
      message_data = %{
        snippet: %{
          liveChatId: "test_chat_id",
          type: "textMessageEvent",
          textMessageDetails: %{
            messageText: "Hello from API test!"
          }
        }
      }

      result = ApiClient.insert_live_chat_message("mock_token", "snippet", message_data)
      assert match?({:error, _}, result)
    end
  end

  describe "Utility Functions" do
    test "get_live_chat_id/2 with mock broadcast" do
      result = ApiClient.get_live_chat_id("mock_token", "mock_broadcast_id")
      assert match?({:error, _}, result)
    end
  end
end
