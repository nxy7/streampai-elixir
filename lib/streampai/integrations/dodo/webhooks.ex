defmodule Streampai.Integrations.Dodo.Webhooks do
  @moduledoc """
  Dodo Payments webhook signature verification and event parsing.

  Follows the Standard Webhooks specification. Dodo signs webhooks using
  HMAC-SHA256. The signature components are sent in three headers:
  - `webhook-id` — unique event ID
  - `webhook-timestamp` — unix timestamp
  - `webhook-signature` — HMAC-SHA256 signature(s)

  ## Usage in a Phoenix controller

      def handle_webhook(conn, _params) do
        raw_body = conn.assigns[:raw_body]
        webhook_id = Plug.Conn.get_req_header(conn, "webhook-id") |> List.first()
        timestamp = Plug.Conn.get_req_header(conn, "webhook-timestamp") |> List.first()
        signature = Plug.Conn.get_req_header(conn, "webhook-signature") |> List.first()

        case Webhooks.verify_and_parse(raw_body, webhook_id, timestamp, signature) do
          {:ok, event} -> handle_event(event)
          {:error, reason} -> # reject
        end
      end
  """

  require Logger

  # Standard Webhooks tolerance: 5 minutes
  @timestamp_tolerance 300

  @doc """
  Verify a webhook signature and parse the event in one step.

  Returns `{:ok, parsed_body}` or `{:error, reason}`.
  """
  def verify_and_parse(raw_body, webhook_id, timestamp, signature) do
    with :ok <- verify_signature(raw_body, webhook_id, timestamp, signature) do
      {:ok, Jason.decode!(raw_body)}
    end
  end

  @doc """
  Verify the Standard Webhooks signature headers against the raw request body.

  The signed message is: `{webhook_id}.{timestamp}.{raw_body}`
  The secret key is base64-decoded (after stripping the `whsec_` prefix).

  Returns `:ok` if valid, `{:error, reason}` otherwise.
  """
  def verify_signature(raw_body, webhook_id, timestamp, signature) do
    with :ok <- validate_presence(webhook_id, timestamp, signature),
         :ok <- validate_timestamp(timestamp) do
      secret = decode_secret(webhook_secret())
      signed_payload = "#{webhook_id}.#{timestamp}.#{raw_body}"

      expected =
        :crypto.mac(:hmac, :sha256, secret, signed_payload)
        |> Base.encode64()

      # webhook-signature header may contain multiple signatures: "v1,<sig1> v1,<sig2>"
      signatures =
        signature
        |> String.split(" ")
        |> Enum.map(fn sig ->
          case String.split(sig, ",", parts: 2) do
            [_version, s] -> s
            [s] -> s
          end
        end)

      if Enum.any?(signatures, &Plug.Crypto.secure_compare(&1, expected)) do
        :ok
      else
        Logger.warning("Dodo webhook signature mismatch")
        {:error, :invalid_signature}
      end
    end
  end

  defp validate_presence(webhook_id, timestamp, signature) do
    if is_binary(webhook_id) and is_binary(timestamp) and is_binary(signature) do
      :ok
    else
      {:error, :missing_headers}
    end
  end

  defp validate_timestamp(timestamp) do
    case Integer.parse(timestamp) do
      {ts, ""} ->
        now = System.system_time(:second)

        if abs(now - ts) <= @timestamp_tolerance do
          :ok
        else
          {:error, :timestamp_too_old}
        end

      _ ->
        {:error, :invalid_timestamp}
    end
  end

  defp decode_secret(secret) do
    # Standard Webhooks secrets are prefixed with "whsec_" and base64-encoded
    secret
    |> String.replace_prefix("whsec_", "")
    |> Base.decode64!()
  end

  defp webhook_secret do
    Streampai.Integrations.Dodo.Client.config()[:webhook_secret] ||
      raise "Dodo Payments webhook secret not configured"
  end
end
