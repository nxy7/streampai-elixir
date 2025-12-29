defmodule StreampaiWeb.CloudflareWebhookController do
  @moduledoc """
  Handles incoming webhooks from Cloudflare Stream Live.

  Documentation: https://developers.cloudflare.com/stream/stream-live/webhooks/
  """
  use StreampaiWeb, :controller

  alias Streampai.Cloudflare.LiveInput
  alias Streampai.LivestreamManager.CloudflareManager
  alias Streampai.SystemActor

  require Logger

  @doc """
  Receives webhook events from Cloudflare Stream Live.

  Expected events:
  - stream.live_input.connected - When a live stream starts
  - stream.live_input.disconnected - When a live stream ends

  The signature is verified using HMAC-SHA256 with the webhook secret.
  Format: Webhook-Signature: time=<unix_timestamp>,sig1=<hex_signature>
  """
  def handle_webhook(conn, params) do
    with {:ok, raw_body} <- get_raw_body(conn),
         :ok <- verify_webhook_signature(conn, raw_body) do
      process_webhook(conn, params)
    else
      {:error, :missing_signature} ->
        # In development/test, allow unsigned webhooks if secret not configured
        if webhook_secret_configured?() do
          Logger.warning("Cloudflare webhook rejected: missing signature")

          conn
          |> put_status(401)
          |> json(%{error: "Missing webhook signature"})
        else
          Logger.warning("Cloudflare webhook signature verification skipped: secret not configured")

          process_webhook(conn, params)
        end

      {:error, :invalid_signature} ->
        Logger.warning("Cloudflare webhook rejected: invalid signature")

        conn
        |> put_status(401)
        |> json(%{error: "Invalid webhook signature"})

      {:error, :stale_timestamp} ->
        Logger.warning("Cloudflare webhook rejected: stale timestamp")

        conn
        |> put_status(401)
        |> json(%{error: "Stale webhook timestamp"})
    end
  end

  defp process_webhook(conn, params) do
    # Extract relevant information
    event_type = params["eventType"]
    live_input_uid = params["liveInputUid"]
    timestamp = params["eventTimestamp"]

    Logger.info(
      "Cloudflare webhook received: event_type=#{event_type}, input_uid=#{live_input_uid}, timestamp=#{timestamp}"
    )

    # Check if this live input exists in our database
    case LiveInput.get_by_cloudflare_uid(live_input_uid, actor: SystemActor.cloudflare()) do
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

  defp get_raw_body(conn) do
    # The raw body should be cached by a plug that reads it before JSON parsing
    case conn.assigns[:raw_body] do
      nil -> {:ok, Jason.encode!(conn.params)}
      body -> {:ok, body}
    end
  end

  defp verify_webhook_signature(conn, raw_body) do
    case conn |> get_req_header("webhook-signature") |> List.first() do
      nil ->
        {:error, :missing_signature}

      signature_header ->
        with {:ok, time, signature} <- parse_signature_header(signature_header),
             :ok <- verify_timestamp_freshness(time) do
          verify_signature(time, raw_body, signature)
        end
    end
  end

  defp parse_signature_header(header) do
    parts =
      header
      |> String.split(",")
      |> Enum.map(fn part ->
        case String.split(part, "=", parts: 2) do
          [key, value] -> {key, value}
          _ -> nil
        end
      end)
      |> Enum.reject(&is_nil/1)
      |> Map.new()

    case {Map.get(parts, "time"), Map.get(parts, "sig1")} do
      {nil, _} -> {:error, :invalid_signature}
      {_, nil} -> {:error, :invalid_signature}
      {time, sig} -> {:ok, time, sig}
    end
  end

  # Reject webhooks older than 5 minutes to prevent replay attacks
  defp verify_timestamp_freshness(time_str) do
    case Integer.parse(time_str) do
      {timestamp, ""} ->
        now = System.system_time(:second)
        # Allow 5 minute window
        if abs(now - timestamp) <= 300 do
          :ok
        else
          {:error, :stale_timestamp}
        end

      _ ->
        {:error, :invalid_signature}
    end
  end

  defp verify_signature(time, raw_body, provided_signature) do
    secret = get_webhook_secret()

    if is_nil(secret) do
      # If no secret is configured, skip verification
      :ok
    else
      # Build the source string: time.body
      source = "#{time}.#{raw_body}"

      # Compute HMAC-SHA256
      expected_signature =
        :hmac
        |> :crypto.mac(:sha256, secret, source)
        |> Base.encode16(case: :lower)

      # Use constant-time comparison to prevent timing attacks
      if Plug.Crypto.secure_compare(expected_signature, provided_signature) do
        :ok
      else
        {:error, :invalid_signature}
      end
    end
  end

  defp get_webhook_secret do
    Application.get_env(:streampai, :cloudflare)[:webhook_secret]
  end

  defp webhook_secret_configured? do
    not is_nil(get_webhook_secret())
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
