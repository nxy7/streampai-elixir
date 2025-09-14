defmodule Streampai.WireMockTest do
  use ExUnit.Case, async: false

  import Streampai.ExternalAPITestHelpers
  alias Streampai.Cloudflare.APIClient
  alias Streampai.YouTube.ApiClient

  @moduletag :wiremock

  setup do
    setup_external_api_test(
      env_vars: [],
      service: "WireMock Test",
      tags: [:wiremock]
    )
  end

  describe "Cloudflare API mocking" do
    test "create live input works with WireMock" do
      user_id = "test-user-#{:rand.uniform(1000)}"

      {:ok, response} = APIClient.create_live_input(user_id, %{recording: %{mode: "off"}})

      assert response["meta"]["user_id"] == user_id
      assert response["meta"]["env"] == "test"
      assert response["recording"]["mode"] == "off"
      assert response["uid"] != nil
    end

    test "get live input works with WireMock" do
      # First create an input
      user_id = "test-get-#{:rand.uniform(1000)}"
      {:ok, create_response} = APIClient.create_live_input(user_id)
      input_uid = create_response["uid"]

      # Then get it
      {:ok, response} = APIClient.get_live_input(input_uid)

      assert response["uid"] == input_uid
      assert response["meta"]["env"] == "test"
    end

    test "delete live input works with WireMock" do
      # First create an input
      user_id = "test-delete-#{:rand.uniform(1000)}"
      {:ok, create_response} = APIClient.create_live_input(user_id)
      input_uid = create_response["uid"]

      # Then delete it
      assert :ok = APIClient.delete_live_input(input_uid)
    end
  end

  describe "YouTube API mocking" do
    test "list broadcasts works with WireMock" do
      {:ok, response} = ApiClient.list_live_broadcasts("test_token", "snippet")

      assert response["kind"] == "youtube#liveBroadcastListResponse"
      assert is_list(response["items"])
    end

    test "create broadcast works with WireMock" do
      broadcast_data = %{
        snippet: %{
          title: "Test WireMock Broadcast",
          scheduledStartTime: "2024-12-01T12:00:00Z",
          description: "A test broadcast"
        },
        status: %{
          privacyStatus: "public"
        }
      }

      {:ok, response} = ApiClient.insert_live_broadcast("test_token", "snippet,status", broadcast_data)

      assert response["snippet"]["title"] == "Test WireMock Broadcast"
      assert response["status"]["privacyStatus"] == "public"
    end
  end
end