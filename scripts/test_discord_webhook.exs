# Test Discord Webhook Integration
#
# Usage:
#   1. Create a Discord webhook in your server:
#      - Right-click a channel → Edit Channel → Integrations → Webhooks → New Webhook
#      - Copy the webhook URL
#
#   2. Run this script:
#      DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/your/url" mix run scripts/test_discord_webhook.exs
#
#   Or in IEx:
#      iex -S mix
#      webhook_url = "https://discord.com/api/webhooks/your/url"
#      Code.eval_file("scripts/test_discord_webhook.exs", webhook_url: webhook_url)

alias Streampai.Integrations.Discord.Client

webhook_url = System.get_env("DISCORD_WEBHOOK_URL") || Keyword.get(binding(), :webhook_url)

unless webhook_url do
  IO.puts("""
  Error: No webhook URL provided!

  Set DISCORD_WEBHOOK_URL environment variable or pass webhook_url in binding.

  Example:
    DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/123/abc" mix run scripts/test_discord_webhook.exs
  """)
  System.halt(1)
end

IO.puts("Testing Discord webhook: #{String.slice(webhook_url, 0, 50)}...")

# Create a fake webhook struct for testing
webhook = %{
  name: "Test Script Webhook",
  webhook_url: webhook_url,
  event_types: [:donation, :stream_start, :stream_end, :new_follower],
  include_amount: true,
  include_message: true
}

IO.puts("\n1. Sending test message...")
case Client.send_test_message(webhook) do
  {:ok, :sent} -> IO.puts("   ✓ Test message sent successfully!")
  {:error, reason} -> IO.puts("   ✗ Failed: #{inspect(reason)}")
end

Process.sleep(1000)

IO.puts("\n2. Sending donation notification...")
case Client.send_notification(webhook, :donation, %{
  donor_name: "TestDonor",
  amount: "25.00",
  currency: "USD",
  message: "Thanks for the great stream!"
}) do
  {:ok, :sent} -> IO.puts("   ✓ Donation notification sent!")
  {:error, reason} -> IO.puts("   ✗ Failed: #{inspect(reason)}")
end

Process.sleep(1000)

IO.puts("\n3. Sending stream start notification...")
case Client.send_notification(webhook, :stream_start, %{
  title: "Testing Discord Integration!",
  platform: "twitch",
  category: "Software and Game Development"
}) do
  {:ok, :sent} -> IO.puts("   ✓ Stream start notification sent!")
  {:error, reason} -> IO.puts("   ✗ Failed: #{inspect(reason)}")
end

Process.sleep(1000)

IO.puts("\n4. Sending new follower notification...")
case Client.send_notification(webhook, :new_follower, %{
  username: "NewFollower123"
}) do
  {:ok, :sent} -> IO.puts("   ✓ New follower notification sent!")
  {:error, reason} -> IO.puts("   ✗ Failed: #{inspect(reason)}")
end

IO.puts("\n✓ All tests completed! Check your Discord channel.")
