defmodule Streampai.Integrations.IFTTTWebhookTest do
  use ExUnit.Case, async: true

  alias Streampai.Integrations.IFTTT.Client

  describe "IFTTT.Client payload building" do
    test "builds donation payload correctly" do
      payload =
        Client.build_payload_for_event(:donation, %{
          donor_name: "TestDonor",
          amount: "25.00",
          currency: "USD",
          message: "Great stream!"
        })

      assert payload.value1 == "TestDonor"
      assert payload.value2 == "USD 25.00"
      assert payload.value3 == "Great stream!"
    end

    test "builds stream_start payload correctly" do
      payload =
        Client.build_payload_for_event(:stream_start, %{
          title: "Gaming Session",
          platform: "twitch",
          category: "Just Chatting"
        })

      assert payload.value1 == "Gaming Session"
      assert payload.value2 == "twitch"
      assert payload.value3 == "Just Chatting"
    end

    test "builds new_follower payload correctly" do
      payload =
        Client.build_payload_for_event(:new_follower, %{
          username: "NewFollower123",
          platform: "youtube"
        })

      assert payload.value1 == "NewFollower123"
      assert payload.value2 == "New follower"
      assert payload.value3 == "youtube"
    end

    test "builds raid payload correctly" do
      payload =
        Client.build_payload_for_event(:raid, %{
          raider_name: "BigRaider",
          viewer_count: 500
        })

      assert payload.value1 == "BigRaider"
      assert payload.value2 == "500 viewers"
      assert payload.value3 == "Raid incoming!"
    end

    test "handles missing data with defaults" do
      payload = Client.build_payload_for_event(:donation, %{})

      assert payload.value1 == "Anonymous"
      assert payload.value2 == "USD 0"
      assert payload.value3 == ""
    end
  end
end
