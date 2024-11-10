defmodule Streampai.Cloudflare.APIClientTest do
  use ExUnit.Case, async: true
  use Mneme

  @moduletag :external
  @moduletag :cloudflare

  alias Streampai.Cloudflare.APIClient

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

      {:ok, response} = APIClient.get_live_input(input_uid)

      auto_assert %{
                    "created" => _,
                    "deleteRecordingAfterDays" => nil,
                    "meta" => %{
                      "user_id" => ^user_id,
                      "name" => ^expected_name,
                      "env" => "test"
                    },
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
      # Pattern match on the expected error response (404 not found)
      {:error, {:http_error, 404, body}} = APIClient.get_live_input(input_uid)

      auto_assert %{
                    "errors" => [
                      %{
                        "code" => 10003,
                        "message" =>
                          "Not Found: The requested resource or operation was not found."
                      }
                    ],
                    "messages" => nil,
                    "result" => nil,
                    "success" => false
                  } <- body
    end
  end

  describe "live output operations" do
    test "create live output" do
      # First create a live input to attach output to
      user_id = "test-output-#{:rand.uniform(1000)}"
      {:ok, create_response} = APIClient.create_live_input(user_id)
      input_uid = create_response["uid"]

      output_config = %{
        rtmp_url: "rtmp://live.twitch.tv/live",
        stream_key: "test_stream_key_#{:rand.uniform(1000)}",
        enabled: true
      }

      {:ok, response} = APIClient.create_live_output(input_uid, output_config)

      auto_assert %{
                    "enabled" => true,
                    "streamKey" => _,
                    "uid" => _,
                    "url" => "rtmp://live.twitch.tv/live"
                  } <- response

      # Verify required fields exist
      assert Map.has_key?(response, "uid")
      assert response["enabled"] == true
    end

    @tag capture_log: true
    test "get live output" do
      # First create a live input and output
      user_id = "test-get-output-#{:rand.uniform(1000)}"
      {:ok, create_response} = APIClient.create_live_input(user_id)
      input_uid = create_response["uid"]

      output_config = %{
        rtmp_url: "rtmp://live.twitch.tv/live",
        stream_key: "test_stream_key_#{:rand.uniform(1000)}",
        enabled: false
      }

      {:ok, output_response} = APIClient.create_live_output(input_uid, output_config)
      output_uid = output_response["uid"]

      # Cloudflare API doesn't support getting individual outputs, only listing all
      {:error, {:http_error, 405, _}} = APIClient.get_live_output(input_uid, output_uid)
    end

    test "list live outputs" do
      # First create a live input and multiple outputs
      user_id = "test-list-outputs-#{:rand.uniform(1000)}"
      {:ok, create_response} = APIClient.create_live_input(user_id)
      input_uid = create_response["uid"]

      # Create first output
      output_config_1 = %{
        rtmp_url: "rtmp://live.twitch.tv/live",
        stream_key: "test_key_1_#{:rand.uniform(1000)}",
        enabled: true
      }

      {:ok, _output_1} = APIClient.create_live_output(input_uid, output_config_1)

      # Create second output
      output_config_2 = %{
        rtmp_url: "rtmp://live.youtube.com/live2",
        stream_key: "test_key_2_#{:rand.uniform(1000)}",
        enabled: false
      }

      {:ok, _output_2} = APIClient.create_live_output(input_uid, output_config_2)

      {:ok, outputs} = APIClient.list_live_outputs(input_uid)

      assert is_list(outputs)
      assert length(outputs) == 2

      # Verify structure of outputs list
      for output <- outputs do
        auto_assert %{
                      "enabled" => _,
                      "streamKey" => _,
                      "uid" => _,
                      "url" => _
                    } <- output
      end
    end

    test "toggle live output" do
      # First create a live input and output
      user_id = "test-toggle-output-#{:rand.uniform(1000)}"
      {:ok, create_response} = APIClient.create_live_input(user_id)
      input_uid = create_response["uid"]

      original_config = %{
        rtmp_url: "rtmp://live.twitch.tv/live",
        stream_key: "original_key_#{:rand.uniform(1000)}",
        enabled: false
      }

      {:ok, output_response} = APIClient.create_live_output(input_uid, original_config)
      output_uid = output_response["uid"]

      # Toggle the output to enabled
      {:ok, response} = APIClient.toggle_live_output(input_uid, output_uid, true)

      # API updates the 'enabled' field, other fields remain original
      auto_assert %{
                    "enabled" => true,
                    "status" => nil,
                    "streamKey" => _,
                    "uid" => ^output_uid,
                    "url" => "rtmp://live.twitch.tv/live"
                  } <- response
    end

    @tag capture_log: true
    test "delete live output" do
      # First create a live input and output
      user_id = "test-delete-output-#{:rand.uniform(1000)}"
      {:ok, create_response} = APIClient.create_live_input(user_id)
      input_uid = create_response["uid"]

      output_config = %{
        rtmp_url: "rtmp://live.twitch.tv/live",
        stream_key: "test_key_#{:rand.uniform(1000)}",
        enabled: true
      }

      {:ok, output_response} = APIClient.create_live_output(input_uid, output_config)
      output_uid = output_response["uid"]

      # Delete the output
      result = APIClient.delete_live_output(input_uid, output_uid)
      assert :ok = result

      # Verify output is gone by listing outputs (since get individual output returns 405)
      {:ok, outputs} = APIClient.list_live_outputs(input_uid)

      # The deleted output should no longer be in the list
      deleted_output_exists = Enum.any?(outputs, fn output -> output["uid"] == output_uid end)
      assert deleted_output_exists == false
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
                        "message" =>
                          "Not Found: The requested resource or operation was not found."
                      }
                    ],
                    "messages" => nil,
                    "result" => nil,
                    "success" => false
                  } <- body
    end
  end
end
