defmodule Streampai.Cloudflare.APIClientTest do
  use ExUnit.Case
  use Mneme

  @moduletag :integration

  alias Streampai.Cloudflare.APIClient

  setup context do
    # Skip setup for tests that manage their own credentials
    if context[:skip_setup] do
      :ok
    else
      start_supervised({APIClient, []})
      :ok
    end
  end


  describe "live input operations" do
    test "create live input" do
      user_id = "test-user-#{:rand.uniform(1000)}"

      {:ok, response} =
        APIClient.create_live_input(user_id, %{
          recording: %{mode: "off"}
        })

      # Snapshot the response structure

      expected_name = APIClient.create_live_input_name(user_id)

      auto_assert %{
                    "created" => _,
                    "deleteRecordingAfterDays" => nil,
                    "meta" => %{"user_id" => ^user_id, "name" => ^expected_name, "env" => "test"},
                    "modified" => _,
                    "recording" => %{
                      "allowedOrigins" => nil,
                      "hideLiveViewerCount" => false,
                      "mode" => "off",
                      "requireSignedURLs" => false
                    },
                    "rtmps" => %{
                      "streamKey" => _,
                      "url" => "rtmps://live.cloudflare.com:443/live/"
                    },
                    "rtmpsPlayback" => %{
                      "streamKey" => _,
                      "url" => "rtmps://live.cloudflare.com:443/live/"
                    },
                    "srt" => %{
                      "passphrase" => _,
                      "streamId" => _,
                      "url" => "srt://live.cloudflare.com:778"
                    },
                    "srtPlayback" => %{
                      "passphrase" => _,
                      "streamId" => _,
                      "url" => "srt://live.cloudflare.com:778"
                    },
                    "status" => nil,
                    "uid" => _,
                    "webRTC" => %{"url" => _},
                    "webRTCPlayback" => %{"url" => _}
                  } <- response
    end

    test "get live input" do
      # First create a live input to test retrieval
      user_id = "test-get-#{:rand.uniform(1000)}"
      expected_name = APIClient.create_live_input_name(user_id)
      {:ok, create_response} = APIClient.create_live_input(user_id)
      input_uid = create_response["uid"]

      try do
        result = APIClient.get_live_input(input_uid)

        case result do
          {:ok, response} ->

            auto_assert %{
              "created" => _,
              "deleteRecordingAfterDays" => nil,
              "meta" => %{"user_id" => ^user_id, "name" => ^expected_name, "env" => "test"},
              "modified" => _,
              "recording" => %{
                "allowedOrigins" => nil,
                "hideLiveViewerCount" => false,
                "mode" => "off",
                "requireSignedURLs" => false
              },
              "rtmps" => %{
                "streamKey" => _,
                "url" => "rtmps://live.cloudflare.com:443/live/"
              },
              "rtmpsPlayback" => %{
                "streamKey" => _,
                "url" => "rtmps://live.cloudflare.com:443/live/"
              },
              "srt" => %{
                "passphrase" => _,
                "streamId" => _,
                "url" => "srt://live.cloudflare.com:778"
              },
              "srtPlayback" => %{
                "passphrase" => _,
                "streamId" => _,
                "url" => "srt://live.cloudflare.com:778"
              },
              "status" => nil,
              "uid" => ^input_uid,
              "webRTC" => %{"url" => _},
              "webRTCPlayback" => %{"url" => _}
            } <- response

          {:error, reason} ->
            auto_assert reason
            flunk("Failed to get live input: #{inspect(reason)}")
        end
      after
        # Clean up
        APIClient.delete_live_input(input_uid)
      end
    end

    @tag capture_log: true
    test "delete live input" do
      # First create a live input to delete
      user_id = "test-delete-#{:rand.uniform(1000)}"
      {:ok, create_response} = APIClient.create_live_input(user_id)
      input_uid = create_response["uid"]

      result = APIClient.delete_live_input(input_uid)
      assert :ok = result
      
      # Success - verify input is gone by trying to get it
      result = APIClient.get_live_input(input_uid)
      
      case result do
        {:error, {:api_error, msg}} ->
          # Expected - input should be gone
          auto_assert msg

        {:error, {:http_error, 404, body}} ->
          # Also expected - input not found  
          auto_assert %{
            "errors" => [%{
              "code" => 10003,
              "message" => "Not Found: The requested resource or operation was not found."
            }],
            "messages" => nil,
            "result" => nil,
            "success" => false
          } <- body

        {:ok, _} ->
          flunk("Live input still exists after deletion")

        other ->
          flunk("Unexpected response when verifying deletion: #{inspect(other)}")
      end
    end
  end

  describe "live output operations" do
    test "create live output" do
      # First create a live input to attach output to
      user_id = "test-output-#{:rand.uniform(1000)}"
      {:ok, create_response} = APIClient.create_live_input(user_id)
      input_uid = create_response["uid"]

      try do
        output_config = %{
          rtmp_url: "rtmp://live.twitch.tv/live",
          stream_key: "test_stream_key_#{:rand.uniform(1000)}",
          enabled: true
        }

        result = APIClient.create_live_output(input_uid, output_config)

        case result do
          {:ok, response} ->
            auto_assert %{
              "enabled" => true,
              "streamKey" => _,
              "uid" => _,
              "url" => "rtmp://live.twitch.tv/live"
            } <- response

            # Verify required fields exist
            assert Map.has_key?(response, "uid")
            assert response["enabled"] == true

          {:error, reason} ->
            auto_assert reason
            flunk("Failed to create live output: #{inspect(reason)}")
        end
      after
        # Clean up
        APIClient.delete_live_input(input_uid)
      end
    end
  end

  describe "error handling" do
    @tag capture_log: true
    test "handles invalid input ID" do
      {:error, {:http_error, 404, body}} = APIClient.get_live_input("invalid-input-id")
      
      # Expected error for invalid input ID
      auto_assert %{
        "errors" => [
          %{
            "code" => 10003,
            "message" => "Not Found: The requested resource or operation was not found."
          }
        ],
        "messages" => nil,
        "result" => nil,
        "success" => false
      } <- body
    end
  end

end
