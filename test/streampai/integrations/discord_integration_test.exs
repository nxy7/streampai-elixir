defmodule Streampai.Integrations.DiscordIntegrationTest do
  @moduledoc """
  Integration tests for Discord bot and webhook functionality.

  These tests require a real Discord bot token and server to run.

  ## Setup

  1. Create a Discord Application at https://discord.com/developers/applications
  2. Create a Bot user in your application
  3. Copy the bot token
  4. Create a test Discord server
  5. Invite the bot to your server with permissions:
     - Send Messages
     - View Channels
  6. Create a webhook in a test channel
  7. Set environment variables:
     - DISCORD_BOT_TOKEN: Your bot token
     - DISCORD_TEST_GUILD_ID: Your test server ID
     - DISCORD_TEST_CHANNEL_ID: A text channel ID in the server
     - DISCORD_WEBHOOK_URL: A webhook URL for the channel

  ## Running

      # Run integration tests (requires Discord credentials)
      mix test test/streampai/integrations/discord_integration_test.exs --include external

  """
  use ExUnit.Case, async: false

  alias Streampai.Integrations.Discord.Client

  @moduletag :external

  # Load test credentials from environment
  @bot_token System.get_env("DISCORD_BOT_TOKEN")
  @test_guild_id System.get_env("DISCORD_TEST_GUILD_ID")
  @test_channel_id System.get_env("DISCORD_TEST_CHANNEL_ID")
  @webhook_url System.get_env("DISCORD_WEBHOOK_URL")

  setup do
    :ok
  end

  describe "Bot API - fetch guilds" do
    @tag :external
    test "can fetch guilds the bot has joined" do
      headers = [{"Authorization", "Bot #{@bot_token}"}]

      case Req.get("https://discord.com/api/v10/users/@me/guilds", headers: headers) do
        {:ok, %{status: 200, body: guilds}} ->
          assert is_list(guilds)
          IO.puts("\nBot has access to #{length(guilds)} guild(s)")

          # Should include our test guild
          guild_ids = Enum.map(guilds, & &1["id"])

          if @test_guild_id do
            assert @test_guild_id in guild_ids,
                   "Bot should have access to test guild #{@test_guild_id}"
          end

        {:ok, %{status: 401}} ->
          flunk("Invalid bot token")

        {:ok, %{status: status, body: body}} ->
          flunk("Unexpected response: #{status} - #{inspect(body)}")

        {:error, reason} ->
          flunk("Request failed: #{inspect(reason)}")
      end
    end
  end

  describe "Bot API - fetch channels" do
    @tag :external
    test "can fetch channels from test guild" do
      skip_unless(@test_guild_id, "DISCORD_TEST_GUILD_ID not set")

      headers = [{"Authorization", "Bot #{@bot_token}"}]

      case Req.get("https://discord.com/api/v10/guilds/#{@test_guild_id}/channels",
             headers: headers
           ) do
        {:ok, %{status: 200, body: channels}} ->
          assert is_list(channels)

          text_channels = Enum.filter(channels, &(&1["type"] == 0))
          IO.puts("\nGuild has #{length(text_channels)} text channel(s)")

          assert length(text_channels) > 0, "Guild should have at least one text channel"

        {:ok, %{status: 403}} ->
          flunk("Bot doesn't have permission to view channels")

        {:ok, %{status: status, body: body}} ->
          flunk("Unexpected response: #{status} - #{inspect(body)}")

        {:error, reason} ->
          flunk("Request failed: #{inspect(reason)}")
      end
    end
  end

  describe "Bot API - send message" do
    @tag :external
    test "can send a message to test channel" do
      skip_unless(@test_channel_id, "DISCORD_TEST_CHANNEL_ID not set")

      headers = [
        {"Authorization", "Bot #{@bot_token}"},
        {"Content-Type", "application/json"}
      ]

      body = %{
        content: "Integration test message from Streampai - #{DateTime.utc_now()}"
      }

      case Req.post("https://discord.com/api/v10/channels/#{@test_channel_id}/messages",
             headers: headers,
             json: body
           ) do
        {:ok, %{status: 200, body: message}} ->
          assert message["content"] =~ "Integration test message"
          IO.puts("\nMessage sent successfully: #{message["id"]}")

        {:ok, %{status: 403}} ->
          flunk("Bot doesn't have permission to send messages")

        {:ok, %{status: status, body: body}} ->
          flunk("Unexpected response: #{status} - #{inspect(body)}")

        {:error, reason} ->
          flunk("Request failed: #{inspect(reason)}")
      end
    end

    @tag :external
    test "can send an embed message" do
      skip_unless(@test_channel_id, "DISCORD_TEST_CHANNEL_ID not set")

      headers = [
        {"Authorization", "Bot #{@bot_token}"},
        {"Content-Type", "application/json"}
      ]

      embed = %{
        title: "Streampai Integration Test",
        description: "Testing embed formatting",
        color: 0x5865F2,
        fields: [
          %{name: "Test Field", value: "Test Value", inline: true},
          %{name: "Timestamp", value: DateTime.to_iso8601(DateTime.utc_now()), inline: true}
        ],
        footer: %{text: "Automated test"}
      }

      body = %{embeds: [embed]}

      case Req.post("https://discord.com/api/v10/channels/#{@test_channel_id}/messages",
             headers: headers,
             json: body
           ) do
        {:ok, %{status: 200, body: message}} ->
          assert length(message["embeds"]) == 1
          IO.puts("\nEmbed message sent successfully: #{message["id"]}")

        {:ok, %{status: status, body: body}} ->
          flunk("Unexpected response: #{status} - #{inspect(body)}")

        {:error, reason} ->
          flunk("Request failed: #{inspect(reason)}")
      end
    end
  end

  describe "Webhook API" do
    @tag :external
    test "can send a webhook message" do
      skip_unless(@webhook_url, "DISCORD_WEBHOOK_URL not set")

      result =
        Client.send_webhook(@webhook_url, %{
          content: "Webhook test from Streampai - #{DateTime.utc_now()}"
        })

      assert result == {:ok, :sent}
      IO.puts("\nWebhook message sent successfully")
    end

    @tag :external
    test "can send a test message via webhook" do
      skip_unless(@webhook_url, "DISCORD_WEBHOOK_URL not set")

      webhook = %{
        name: "Integration Test Webhook",
        webhook_url: @webhook_url,
        event_types: [:donation, :stream_start]
      }

      result = Client.send_test_message(webhook)
      assert result == {:ok, :sent}
      IO.puts("\nWebhook test message sent successfully")
    end

    @tag :external
    test "can send donation notification via webhook" do
      skip_unless(@webhook_url, "DISCORD_WEBHOOK_URL not set")

      webhook = %{
        webhook_url: @webhook_url,
        event_types: [:donation],
        include_amount: true,
        include_message: true
      }

      data = %{
        donor_name: "IntegrationTestDonor",
        amount: "42.00",
        currency: "USD",
        message: "Integration test donation!"
      }

      result = Client.send_notification(webhook, :donation, data)
      assert result == {:ok, :sent}
      IO.puts("\nDonation notification sent successfully")
    end
  end

  # Helper to skip tests if env var not set
  # Returns :ok if value is present, flunks with message if not
  defp skip_unless(value, message) do
    unless value do
      flunk(message)
    end
  end
end
