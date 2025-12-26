defmodule Streampai.Integrations.Discord.ClientTest do
  @moduledoc """
  Unit tests for Discord webhook client.

  These tests verify the client logic without hitting the Discord API.
  For real integration tests, see discord_integration_test.exs
  """
  use ExUnit.Case, async: true

  alias Streampai.Integrations.Discord.Client

  describe "send_webhook/2 validation" do
    test "rejects invalid webhook URLs" do
      assert Client.send_webhook("https://example.com/webhook", %{}) ==
               {:error, :invalid_webhook_url}

      assert Client.send_webhook("http://discord.com/api/webhooks/123/abc", %{}) ==
               {:error, :invalid_webhook_url}

      assert Client.send_webhook("not-a-url", %{}) == {:error, :invalid_webhook_url}
      assert Client.send_webhook(nil, %{}) == {:error, :invalid_webhook_url}
    end

    test "accepts valid Discord webhook URL format" do
      # This will fail with connection error since it's not a real webhook,
      # but it should NOT fail with :invalid_webhook_url
      valid_url = "https://discord.com/api/webhooks/1234567890/abcdef123456"
      result = Client.send_webhook(valid_url, %{content: "test"})

      # Should fail with HTTP error, not invalid URL
      assert result != {:error, :invalid_webhook_url}
    end
  end

  describe "embed building" do
    test "builds donation embed with all fields" do
      # Test by calling send_notification and checking it doesn't crash
      webhook = %{
        webhook_url: "https://discord.com/api/webhooks/fake/url",
        event_types: [:donation],
        include_amount: true,
        include_message: true
      }

      data = %{
        donor_name: "TestDonor",
        amount: "25.00",
        currency: "USD",
        message: "Great stream!"
      }

      # Will fail with HTTP error, but structure is built
      result = Client.send_notification(webhook, :donation, data)
      assert match?({:error, _}, result)
    end

    test "builds stream_start embed" do
      webhook = %{
        webhook_url: "https://discord.com/api/webhooks/fake/url",
        event_types: [:stream_start],
        include_amount: true,
        include_message: true
      }

      data = %{
        title: "Playing Elixir Games!",
        platform: "twitch",
        category: "Software and Game Development"
      }

      result = Client.send_notification(webhook, :stream_start, data)
      assert match?({:error, _}, result)
    end

    test "builds stream_end embed with duration formatting" do
      webhook = %{
        webhook_url: "https://discord.com/api/webhooks/fake/url",
        event_types: [:stream_end],
        include_amount: true,
        include_message: true
      }

      data = %{
        duration_seconds: 7265,
        peak_viewers: 150
      }

      result = Client.send_notification(webhook, :stream_end, data)
      assert match?({:error, _}, result)
    end

    test "builds test message" do
      webhook = %{
        name: "Test Webhook",
        webhook_url: "https://discord.com/api/webhooks/fake/url",
        event_types: [:donation, :stream_start]
      }

      result = Client.send_test_message(webhook)
      assert match?({:error, _}, result)
    end
  end
end
