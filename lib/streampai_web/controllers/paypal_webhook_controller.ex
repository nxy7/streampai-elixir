defmodule StreampaiWeb.PayPalWebhookController do
  @moduledoc """
  Handles PayPal webhook events for donations.

  Verifies webhook signatures and processes payment events in real-time.
  """
  use StreampaiWeb, :controller

  alias Streampai.Donations.Pipeline
  alias Streampai.Integrations.PayPalDonation
  alias Streampai.SystemActor

  require Logger

  @doc """
  Handle incoming PayPal webhooks.

  PayPal will send notifications for payment events like:
  - PAYMENT.CAPTURE.COMPLETED
  - PAYMENT.CAPTURE.DENIED
  - PAYMENT.CAPTURE.REFUNDED
  """
  def handle_webhook(conn, params) do
    with :ok <- verify_webhook_signature(conn),
         {:ok, event} <- parse_event(params),
         :ok <- process_event(event) do
      json(conn, %{status: "success"})
    else
      {:error, :invalid_signature} ->
        Logger.warning("Invalid PayPal webhook signature")

        conn
        |> put_status(401)
        |> json(%{error: "Invalid signature"})

      {:error, :duplicate_event} ->
        # Already processed, return success to prevent retries
        json(conn, %{status: "duplicate"})

      {:error, reason} ->
        Logger.error("Failed to process PayPal webhook: #{inspect(reason)}")

        conn
        |> put_status(500)
        |> json(%{error: "Processing failed"})
    end
  end

  defp verify_webhook_signature(conn) do
    # Extract headers needed for verification
    transmission_id = conn |> get_req_header("paypal-transmission-id") |> List.first()
    transmission_time = conn |> get_req_header("paypal-transmission-time") |> List.first()
    transmission_sig = conn |> get_req_header("paypal-transmission-sig") |> List.first()
    cert_url = conn |> get_req_header("paypal-cert-url") |> List.first()
    auth_algo = conn |> get_req_header("paypal-auth-algo") |> List.first()

    # Get webhook ID from config
    webhook_id = Application.get_env(:streampai, :paypal)[:webhook_id]

    # Read body
    {:ok, body, _conn} = read_body(conn)

    # Verify with PayPal API
    payload = %{
      transmission_id: transmission_id,
      transmission_time: transmission_time,
      cert_url: cert_url,
      auth_algo: auth_algo,
      transmission_sig: transmission_sig,
      webhook_id: webhook_id,
      webhook_event: Jason.decode!(body)
    }

    case Streampai.Integrations.PayPal.Client.post(
           "/v1/notifications/verify-webhook-signature",
           payload
         ) do
      {:ok, %{"verification_status" => "SUCCESS"}} ->
        :ok

      {:ok, %{"verification_status" => status}} ->
        Logger.warning("Webhook verification failed: #{status}")
        {:error, :invalid_signature}

      error ->
        Logger.error("Webhook verification error: #{inspect(error)}")
        {:error, :verification_failed}
    end
  end

  defp parse_event(params) do
    {:ok,
     %{
       event_id: params["id"],
       event_type: params["event_type"],
       resource: params["resource"],
       create_time: params["create_time"]
     }}
  end

  defp process_event(%{event_type: "PAYMENT.CAPTURE.COMPLETED", resource: resource} = event) do
    order_id = resource["supplementary_data"]["related_ids"]["order_id"]

    with {:ok, donation} <- get_donation(order_id),
         :ok <- check_duplicate(donation, event.event_id),
         {:ok, updated_donation} <- update_donation_completed(donation, resource, event.event_id) do
      process_through_pipeline(updated_donation)
    end
  end

  defp process_event(%{event_type: "PAYMENT.CAPTURE.DENIED", resource: resource}) do
    order_id = resource["supplementary_data"]["related_ids"]["order_id"]

    with {:ok, donation} <- get_donation(order_id),
         {:ok, _updated} <- update_donation_failed(donation) do
      :ok
    end
  end

  defp process_event(%{event_type: "PAYMENT.CAPTURE.REFUNDED", resource: resource} = event) do
    capture_id = resource["id"]

    with {:ok, donation} <- get_donation_by_capture(capture_id),
         {:ok, _updated} <- update_donation_refunded(donation, resource, event.event_id) do
      :ok
    end
  end

  defp process_event(%{event_type: event_type}) do
    Logger.info("Unhandled PayPal webhook event: #{event_type}")
    :ok
  end

  defp get_donation(order_id) do
    case PayPalDonation.get_by_order_id(order_id) do
      {:ok, [donation | _]} -> {:ok, donation}
      _ -> {:error, :donation_not_found}
    end
  end

  defp get_donation_by_capture(capture_id) do
    require Ash.Query

    case PayPalDonation
         |> Ash.Query.filter(capture_id == ^capture_id)
         |> Ash.read(actor: SystemActor.paypal()) do
      {:ok, [donation | _]} -> {:ok, donation}
      _ -> {:error, :donation_not_found}
    end
  end

  defp check_duplicate(donation, event_id) do
    if donation.webhook_event_id == event_id do
      {:error, :duplicate_event}
    else
      :ok
    end
  end

  defp update_donation_completed(donation, resource, event_id) do
    params = %{
      capture_id: resource["id"],
      status: :completed,
      webhook_event_id: event_id,
      paypal_fee: extract_fee(resource),
      net_amount: extract_net_amount(resource)
    }

    PayPalDonation.update(donation, params, actor: SystemActor.paypal())
  end

  defp update_donation_failed(donation) do
    PayPalDonation.update(donation, %{status: :failed}, actor: SystemActor.paypal())
  end

  defp update_donation_refunded(donation, resource, event_id) do
    params = %{
      status: :refunded,
      refund_id: resource["id"],
      refunded_at: DateTime.utc_now(),
      webhook_event_id: event_id
    }

    PayPalDonation.update(donation, params, actor: SystemActor.paypal())
  end

  defp extract_fee(resource) do
    case get_in(resource, ["seller_receivable_breakdown", "paypal_fee", "value"]) do
      nil -> nil
      value -> Decimal.new(value)
    end
  end

  defp extract_net_amount(resource) do
    case get_in(resource, ["seller_receivable_breakdown", "net_amount", "value"]) do
      nil -> nil
      value -> Decimal.new(value)
    end
  end

  defp process_through_pipeline(donation) do
    params = %{
      user_id: donation.user_id,
      platform: :paypal,
      donor_name: donation.donor_name || "Anonymous",
      amount: donation.amount,
      currency: donation.currency,
      message: donation.message,
      voice: donation.voice || "alloy",
      metadata: %{
        donation_id: donation.id,
        order_id: donation.order_id,
        capture_id: donation.capture_id,
        paypal_fee: donation.paypal_fee,
        net_amount: donation.net_amount
      }
    }

    case Pipeline.process_donation(params) do
      {:ok, _event} -> :ok
      {:error, reason} -> {:error, reason}
    end
  end
end
