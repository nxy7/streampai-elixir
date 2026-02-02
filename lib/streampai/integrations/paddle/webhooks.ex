defmodule Streampai.Integrations.Paddle.Webhooks do
  @moduledoc """
  Paddle webhook signature verification.

  Paddle signs webhooks using HMAC-SHA256. The signature is in the
  `Paddle-Signature` header with format: `ts=TIMESTAMP;h1=SIGNATURE`

  The signed payload is: `{ts}:{raw_body}`
  """

  require Logger

  @doc """
  Verify a Paddle webhook signature and parse the JSON body.

  Returns `{:ok, parsed_event}` or `{:error, :invalid_signature}`.
  """
  @spec verify_and_parse(String.t(), String.t()) :: {:ok, map()} | {:error, atom()}
  def verify_and_parse(raw_body, signature_header) do
    if verify_signature(raw_body, signature_header) do
      {:ok, Jason.decode!(raw_body)}
    else
      {:error, :invalid_signature}
    end
  end

  @doc """
  Verify the Paddle-Signature header against the raw body.

  ## Paddle signature format
    `ts=1671552777;h1=eb4d0dc8...`

  ## Algorithm
    1. Parse ts and h1 from header
    2. Build signed payload: `{ts}:{raw_body}`
    3. HMAC-SHA256 with webhook secret
    4. Compare hex digest with h1
  """
  @spec verify_signature(String.t(), String.t()) :: boolean()
  def verify_signature(raw_body, signature_header) do
    secret = webhook_secret()

    case parse_signature_header(signature_header) do
      {:ok, ts, h1} ->
        signed_payload = "#{ts}:#{raw_body}"

        expected =
          :hmac
          |> :crypto.mac(:sha256, secret, signed_payload)
          |> Base.encode16(case: :lower)

        Plug.Crypto.secure_compare(expected, h1)

      _ ->
        false
    end
  end

  defp parse_signature_header(header) do
    parts = String.split(header, ";")

    ts =
      Enum.find_value(parts, fn part ->
        case String.split(part, "=", parts: 2) do
          ["ts", value] -> value
          _ -> nil
        end
      end)

    h1 =
      Enum.find_value(parts, fn part ->
        case String.split(part, "=", parts: 2) do
          ["h1", value] -> value
          _ -> nil
        end
      end)

    if ts && h1, do: {:ok, ts, h1}, else: :error
  end

  defp webhook_secret do
    Streampai.Integrations.Paddle.Client.config()[:webhook_secret] ||
      raise "Paddle webhook secret not configured"
  end
end
