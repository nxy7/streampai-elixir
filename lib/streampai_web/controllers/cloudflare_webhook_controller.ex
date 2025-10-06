defmodule StreampaiWeb.CloudflareWebhookController do
  @moduledoc """
  Handles incoming webhooks from Cloudflare Stream Live.

  Documentation: https://developers.cloudflare.com/stream/stream-live/webhooks/
  """
  use StreampaiWeb, :controller

  alias Streampai.Cloudflare.LiveInput
  alias Streampai.LivestreamManager.CloudflareManager

  require Logger

  @doc """
  Receives webhook events from Cloudflare Stream Live.

  Expected events:
  - stream.live_input.connected - When a live stream starts
  - stream.live_input.disconnected - When a live stream ends
  """
  def handle_webhook(conn, params) do
    # Extract relevant information
    event_type = params["eventType"]
    live_input_uid = params["liveInputUid"]
    timestamp = params["eventTimestamp"]

    Logger.info(
      "Cloudflare webhook received: event_type=#{event_type}, input_uid=#{live_input_uid}, timestamp=#{timestamp}"
    )

    # Check if this live input exists in our database
    case LiveInput.get_by_cloudflare_uid(live_input_uid, authorize?: false) do
      {:ok, live_input} ->
        Logger.info("Live input found in database: live_input_uid=#{live_input_uid}, user_id=#{live_input.user_id}")

        process_webhook_event(event_type, live_input, timestamp)

      {:error, %Ash.Error.Query.NotFound{}} ->
        Logger.info(
          "Ignoring webhook - live input not found in database: live_input_uid=#{live_input_uid} (not in this environment)"
        )

      {:error, reason} ->
        Logger.warning(
          "Failed to query live input from database: live_input_uid=#{live_input_uid}, reason=#{inspect(reason)}"
        )
    end

    # Always return 200 OK to acknowledge receipt
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(200, Jason.encode!(%{status: "received"}))
  end

  defp process_webhook_event(event_type, live_input, timestamp) do
    live_input_uid = get_in(live_input.data, ["uid"])
    user_id = live_input.user_id

    Logger.info("""
    Processing Cloudflare Stream Webhook Event:
    - Event Type: #{event_type}
    - Live Input UID: #{live_input_uid}
    - User ID: #{user_id}
    - Timestamp: #{timestamp}
    """)

    case event_type do
      "stream.live_input.connected" ->
        Logger.info("Stream connected - notifying CloudflareManager for user #{user_id}")
        CloudflareManager.handle_webhook_event(user_id, event_type)

      "stream.live_input.disconnected" ->
        Logger.info("Stream disconnected - notifying CloudflareManager for user #{user_id}")
        CloudflareManager.handle_webhook_event(user_id, event_type)

      _ ->
        Logger.warning("Unknown event type: #{event_type}")
    end
  end
end
