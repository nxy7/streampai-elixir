defmodule Streampai.WireMockRecordingTest do
  use ExUnit.Case, async: false

  import Streampai.ExternalAPITestHelpers
  alias Streampai.Cloudflare.APIClient
  alias Streampai.YouTube.ApiClient

  @moduletag :wiremock_recording

  setup do
    setup_external_api_test(
      env_vars: [],
      service: "Recorded API Test",
      tags: [:wiremock_recording]
    )
  end

  describe "Recorded Cloudflare API responses" do
    @tag :cloudflare_recording
    test "create and manage live input using recorded responses" do
      # This test uses real recorded API responses!
      user_id = "recorded-test-user-#{:rand.uniform(1000)}"

      # Create live input - uses recorded response
      {:ok, input_response} = APIClient.create_live_input(user_id, %{recording: %{mode: "off"}})

      assert input_response["meta"]["user_id"] == user_id
      assert input_response["meta"]["env"] == "test"
      assert input_response["recording"]["mode"] == "off"
      assert input_response["uid"] != nil

      input_uid = input_response["uid"]

      # Get live input - uses recorded response
      {:ok, get_response} = APIClient.get_live_input(input_uid)
      assert get_response["uid"] == input_uid

      # Create output - uses recorded response
      output_config = %{
        rtmp_url: "rtmp://live.twitch.tv/live",
        stream_key: "test_key_#{:rand.uniform(1000)}",
        enabled: true
      }

      {:ok, output_response} = APIClient.create_live_output(input_uid, output_config)
      assert output_response["enabled"] == true
      assert output_response["url"] == "rtmp://live.twitch.tv/live"

      output_uid = output_response["uid"]

      # List outputs - uses recorded response
      {:ok, outputs} = APIClient.list_live_outputs(input_uid)
      assert is_list(outputs)

      # Toggle output - uses recorded response
      {:ok, toggle_response} = APIClient.toggle_live_output(input_uid, output_uid, false)
      assert toggle_response["enabled"] == false

      # Delete output - uses recorded response
      assert :ok = APIClient.delete_live_output(input_uid, output_uid)

      # Delete input - uses recorded response
      assert :ok = APIClient.delete_live_input(input_uid)
    end
  end

  describe "Recorded YouTube API responses" do
    @tag :youtube_recording
    test "manage broadcasts using recorded responses" do
      # List broadcasts - uses recorded response
      {:ok, broadcasts_response} = ApiClient.list_live_broadcasts("recorded_token", "snippet,status")

      assert broadcasts_response["kind"] == "youtube#liveBroadcastListResponse"
      assert is_list(broadcasts_response["items"])

      # Create broadcast - uses recorded response
      broadcast_data = %{
        snippet: %{
          title: "Recorded Test Broadcast",
          scheduledStartTime: "2024-12-01T12:00:00Z",
          description: "A test broadcast from recordings"
        },
        status: %{
          privacyStatus: "unlisted"
        }
      }

      {:ok, create_response} = ApiClient.insert_live_broadcast("recorded_token", "snippet,status", broadcast_data)

      assert create_response["snippet"]["title"] == "Recorded Test Broadcast"
      assert create_response["status"]["privacyStatus"] == "unlisted"
      assert create_response["id"] != nil
    end

    @tag :youtube_recording
    test "manage streams using recorded responses" do
      # List streams - uses recorded response
      {:ok, streams_response} = ApiClient.list_live_streams("recorded_token", "snippet,cdn,status")

      assert streams_response["kind"] == "youtube#liveStreamListResponse"
      assert is_list(streams_response["items"])

      # Create stream - uses recorded response
      stream_data = %{
        snippet: %{
          title: "Recorded Test Stream",
          description: "A test stream from recordings"
        },
        cdn: %{
          format: "1080p",
          ingestionType: "rtmp"
        }
      }

      {:ok, create_response} = ApiClient.insert_live_stream("recorded_token", "snippet,cdn,status", stream_data)

      assert create_response["snippet"]["title"] == "Recorded Test Stream"
      assert create_response["cdn"]["format"] == "1080p"
      assert create_response["cdn"]["ingestionType"] == "rtmp"
    end
  end

  describe "Error handling with recorded responses" do
    test "handles 404 errors from recorded responses" do
      # This should return a recorded 404 response
      result = APIClient.get_live_input("invalid-input-id")

      assert {:error, :http_error, message} = result
      assert message =~ "404"
    end
  end
end