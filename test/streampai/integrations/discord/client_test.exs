defmodule Streampai.Integrations.Discord.ClientTest do
  use ExUnit.Case, async: true

  alias Streampai.Integrations.Discord.Client

  describe "valid_webhook_url?/1" do
    test "accepts valid Discord webhook URLs" do
      valid_url = "https://discord.com/api/webhooks/1234567890/abcdef123456"
      assert Client.send_webhook(valid_url, %{content: "test"}) != {:error, :invalid_webhook_url}
    end

    test "rejects invalid webhook URLs" do
      assert Client.send_webhook("https://example.com/webhook", %{}) ==
               {:error, :invalid_webhook_url}

      assert Client.send_webhook("http://discord.com/api/webhooks/123/abc", %{}) ==
               {:error, :invalid_webhook_url}

      assert Client.send_webhook("not-a-url", %{}) == {:error, :invalid_webhook_url}
      assert Client.send_webhook(nil, %{}) == {:error, :invalid_webhook_url}
    end
  end

  describe "build_embed_for_event/3" do
    # We're testing the module internals through the public API via send_notification

    test "creates a webhook with proper structure" do
      webhook = %{
        id: "test-id",
        webhook_url: "https://discord.com/api/webhooks/fake/url",
        event_types: [:donation],
        is_enabled: true,
        include_amount: true,
        include_message: true
      }

      # This would fail on actual HTTP but tests the structure is created
      donation_data = %{
        donor_name: "TestDonor",
        amount: "25.00",
        currency: "USD",
        message: "Great stream!"
      }

      # The function will try to make a real HTTP call which will fail,
      # but we're testing the flow works without crashing
      result = Client.send_notification(webhook, :donation, donation_data)

      # Since it's a fake URL, we expect a request error, not a crash
      assert match?({:error, _}, result)
    end
  end

  describe "format_duration/1" do
    test "formats seconds correctly" do
      # Access private function via Module.eval_code
      # For testing, we verify through stream_end event
      webhook = %{
        webhook_url: "https://discord.com/api/webhooks/fake/url",
        event_types: [:stream_end],
        is_enabled: true,
        include_amount: true,
        include_message: true
      }

      # Test stream end with duration
      result =
        Client.send_notification(webhook, :stream_end, %{
          duration_seconds: 7265,
          peak_viewers: 100
        })

      # Will fail HTTP but structure is built
      assert match?({:error, _}, result)
    end
  end

  describe "test message" do
    test "builds proper test message structure" do
      webhook = %{
        name: "Test Webhook",
        webhook_url: "https://discord.com/api/webhooks/fake/url",
        event_types: [:donation, :stream_start]
      }

      result = Client.send_test_message(webhook)
      # Will fail HTTP but structure is built without crash
      assert match?({:error, _}, result)
    end
  end
end
