defmodule StreampaiWeb.PaddleWebhookController do
  @moduledoc """
  Handles Paddle Billing webhook events.

  Verifies HMAC-SHA256 signatures (Paddle-Signature header) and processes
  subscription lifecycle events using the shared SubscriptionVerifier.

  ## Key events
    - `subscription.created` — New subscription from checkout
    - `subscription.updated` — Status change (active, paused, canceled, past_due)
    - `transaction.completed` — Payment succeeded
  """
  use StreampaiWeb, :controller

  import StreampaiWeb.Plugs.ConnHelpers, only: [get_raw_body: 1, get_header: 2]

  alias Streampai.Integrations.Paddle.SubscriptionVerifier
  alias Streampai.Integrations.Paddle.Webhooks

  require Logger

  def handle_webhook(conn, _params) do
    with {:ok, raw_body} <- get_raw_body(conn),
         signature when is_binary(signature) <-
           get_header(conn, "paddle-signature") || {:error, :missing_signature},
         {:ok, event} <- Webhooks.verify_and_parse(raw_body, signature),
         :ok <- process_event(event) do
      json(conn, %{status: "success"})
    else
      {:error, :invalid_signature} ->
        Logger.warning("Invalid Paddle webhook signature")
        conn |> put_status(401) |> json(%{error: "Invalid signature"})

      {:error, :missing_signature} ->
        conn |> put_status(400) |> json(%{error: "Missing signature"})

      {:error, reason} ->
        Logger.error("Failed to process Paddle webhook: #{inspect(reason)}")
        conn |> put_status(500) |> json(%{error: "Processing failed"})
    end
  end

  # Subscription created (checkout completed)
  defp process_event(%{"event_type" => "subscription.created", "data" => data}) do
    Logger.info("Paddle subscription created: #{data["id"]}")
    handle_grant_result(SubscriptionVerifier.grant_from_webhook(data))
  end

  # Subscription updated (status changes, renewals)
  defp process_event(%{"event_type" => "subscription.updated", "data" => data}) do
    Logger.info("Paddle subscription updated: #{data["id"]} status=#{data["status"]}")
    handle_grant_result(SubscriptionVerifier.grant_from_webhook(data))
  end

  # Transaction completed (payment succeeded)
  defp process_event(%{"event_type" => "transaction.completed", "data" => data}) do
    Logger.info("Paddle transaction completed: #{data["id"]}")

    if sub_id = data["subscription_id"] do
      user_id = get_in(data, ["custom_data", "user_id"])
      handle_grant_result(SubscriptionVerifier.verify_subscription(sub_id, user_id))
    else
      :ok
    end
  end

  defp process_event(%{"event_type" => type}) do
    Logger.info("Unhandled Paddle webhook event: #{type}")
    :ok
  end

  defp handle_grant_result({:ok, _}), do: :ok
  defp handle_grant_result({:error, reason}), do: {:error, reason}
end
