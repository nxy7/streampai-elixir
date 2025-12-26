defmodule Streampai.Integrations.Discord.ClientTest do
  use ExUnit.Case, async: false

  alias Streampai.Integrations.Discord.Client
  alias StreampaiTest.Mocks.DiscordWebhookMock

  setup do
    # Start the mock for each test
    {:ok, _pid} = DiscordWebhookMock.start_link()

    on_exit(fn ->
      if Process.whereis(DiscordWebhookMock), do: Agent.stop(DiscordWebhookMock)
    end)

    :ok
  end

  describe "send_webhook/2 validation" do
    test "accepts valid Discord webhook URLs" do
      valid_url = "https://discord.com/api/webhooks/1234567890/abcdef123456"
      result = Client.send_webhook(valid_url, %{content: "test"})

      # With mock, should succeed
      assert result == {:ok, :sent}
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

  describe "send_webhook/2 with mock" do
    test "sends payload to Discord" do
      webhook_url = "https://discord.com/api/webhooks/123/abc"
      payload = %{content: "Hello Discord!"}

      assert {:ok, :sent} = Client.send_webhook(webhook_url, payload)

      # Verify the call was logged
      [call] = DiscordWebhookMock.get_call_log()
      assert call.url == webhook_url
      assert call.payload == payload
    end

    test "handles rate limiting" do
      DiscordWebhookMock.set_response({:error, {:rate_limited, 5}})

      webhook_url = "https://discord.com/api/webhooks/123/abc"
      result = Client.send_webhook(webhook_url, %{content: "test"})

      assert result == {:error, {:rate_limited, 5}}
    end

    test "handles HTTP errors" do
      DiscordWebhookMock.set_response({:error, {:http_error, 400, %{"message" => "Bad Request"}}})

      webhook_url = "https://discord.com/api/webhooks/123/abc"
      result = Client.send_webhook(webhook_url, %{content: "test"})

      assert result == {:error, {:http_error, 400, %{"message" => "Bad Request"}}}
    end
  end

  describe "send_test_message/1" do
    test "sends a properly formatted test message" do
      webhook = %{
        name: "Test Webhook",
        webhook_url: "https://discord.com/api/webhooks/123/abc",
        event_types: [:donation, :stream_start]
      }

      assert {:ok, :sent} = Client.send_test_message(webhook)

      [call] = DiscordWebhookMock.get_call_log()
      assert call.url == webhook.webhook_url

      # Verify embed structure
      [embed] = call.payload.embeds
      assert embed.title == "Streampai Connected!"
      assert embed.footer.text == "Webhook: Test Webhook"
      assert String.contains?(hd(embed.fields).value, "Donations")
      assert String.contains?(hd(embed.fields).value, "Stream Start")
    end
  end

  describe "send_notification/3" do
    test "sends donation notification with all fields" do
      webhook = %{
        webhook_url: "https://discord.com/api/webhooks/123/abc",
        event_types: [:donation],
        is_enabled: true,
        include_amount: true,
        include_message: true
      }

      data = %{
        donor_name: "TestDonor",
        amount: "25.00",
        currency: "USD",
        message: "Great stream!"
      }

      assert {:ok, :sent} = Client.send_notification(webhook, :donation, data)

      [call] = DiscordWebhookMock.get_call_log()
      [embed] = call.payload.embeds

      assert embed.title == "New Donation!"

      field_names = Enum.map(embed.fields, & &1.name)
      assert "From" in field_names
      assert "Amount" in field_names
      assert "Message" in field_names
    end

    test "sends donation notification without message when include_message is false" do
      webhook = %{
        webhook_url: "https://discord.com/api/webhooks/123/abc",
        event_types: [:donation],
        is_enabled: true,
        include_amount: true,
        include_message: false
      }

      data = %{
        donor_name: "TestDonor",
        amount: "25.00",
        currency: "USD",
        message: "Great stream!"
      }

      assert {:ok, :sent} = Client.send_notification(webhook, :donation, data)

      [call] = DiscordWebhookMock.get_call_log()
      [embed] = call.payload.embeds

      field_names = Enum.map(embed.fields, & &1.name)
      refute "Message" in field_names
    end

    test "sends stream_start notification" do
      webhook = %{
        webhook_url: "https://discord.com/api/webhooks/123/abc",
        event_types: [:stream_start],
        is_enabled: true,
        include_amount: true,
        include_message: true
      }

      data = %{
        title: "Playing Elixir Games!",
        platform: "twitch",
        category: "Software and Game Development"
      }

      assert {:ok, :sent} = Client.send_notification(webhook, :stream_start, data)

      [call] = DiscordWebhookMock.get_call_log()
      [embed] = call.payload.embeds

      assert embed.title == "Stream Started!"
      assert embed.description == "Playing Elixir Games!"
    end

    test "sends stream_end notification with duration" do
      webhook = %{
        webhook_url: "https://discord.com/api/webhooks/123/abc",
        event_types: [:stream_end],
        is_enabled: true,
        include_amount: true,
        include_message: true
      }

      data = %{
        duration_seconds: 7265,
        peak_viewers: 150
      }

      assert {:ok, :sent} = Client.send_notification(webhook, :stream_end, data)

      [call] = DiscordWebhookMock.get_call_log()
      [embed] = call.payload.embeds

      assert embed.title == "Stream Ended"

      duration_field = Enum.find(embed.fields, &(&1.name == "Duration"))
      assert duration_field.value == "2h 1m"
    end

    test "sends new_follower notification" do
      webhook = %{
        webhook_url: "https://discord.com/api/webhooks/123/abc",
        event_types: [:new_follower],
        is_enabled: true,
        include_amount: true,
        include_message: true
      }

      data = %{username: "NewFollower123"}

      assert {:ok, :sent} = Client.send_notification(webhook, :new_follower, data)

      [call] = DiscordWebhookMock.get_call_log()
      [embed] = call.payload.embeds

      assert embed.title == "New Follower!"
      assert String.contains?(embed.description, "NewFollower123")
    end

    test "sends raid notification" do
      webhook = %{
        webhook_url: "https://discord.com/api/webhooks/123/abc",
        event_types: [:raid],
        is_enabled: true,
        include_amount: true,
        include_message: true
      }

      data = %{raider_name: "BigStreamer", viewer_count: 500}

      assert {:ok, :sent} = Client.send_notification(webhook, :raid, data)

      [call] = DiscordWebhookMock.get_call_log()
      [embed] = call.payload.embeds

      assert embed.title == "Incoming Raid!"
      assert String.contains?(embed.description, "BigStreamer")
      assert String.contains?(embed.description, "500")
    end
  end

  describe "format_duration" do
    test "formats hours and minutes" do
      webhook = %{
        webhook_url: "https://discord.com/api/webhooks/123/abc",
        event_types: [:stream_end],
        is_enabled: true,
        include_amount: true,
        include_message: true
      }

      # 3 hours, 30 minutes, 45 seconds
      data = %{duration_seconds: 12_645}
      Client.send_notification(webhook, :stream_end, data)

      [call] = DiscordWebhookMock.get_call_log()
      [embed] = call.payload.embeds
      duration_field = Enum.find(embed.fields, &(&1.name == "Duration"))
      assert duration_field.value == "3h 30m"
    end

    test "formats minutes and seconds when under an hour" do
      webhook = %{
        webhook_url: "https://discord.com/api/webhooks/123/abc",
        event_types: [:stream_end],
        is_enabled: true,
        include_amount: true,
        include_message: true
      }

      # 45 minutes, 30 seconds
      data = %{duration_seconds: 2730}
      Client.send_notification(webhook, :stream_end, data)

      [call] = DiscordWebhookMock.get_call_log()
      [embed] = call.payload.embeds
      duration_field = Enum.find(embed.fields, &(&1.name == "Duration"))
      assert duration_field.value == "45m 30s"
    end

    test "formats seconds only when under a minute" do
      webhook = %{
        webhook_url: "https://discord.com/api/webhooks/123/abc",
        event_types: [:stream_end],
        is_enabled: true,
        include_amount: true,
        include_message: true
      }

      data = %{duration_seconds: 45}
      Client.send_notification(webhook, :stream_end, data)

      [call] = DiscordWebhookMock.get_call_log()
      [embed] = call.payload.embeds
      duration_field = Enum.find(embed.fields, &(&1.name == "Duration"))
      assert duration_field.value == "45s"
    end
  end
end
