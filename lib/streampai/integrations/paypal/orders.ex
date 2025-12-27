defmodule Streampai.Integrations.PayPal.Orders do
  @moduledoc """
  Handles PayPal Orders API v2 for creating and capturing donations.

  Donations are created as PayPal orders that go directly to the streamer's
  PayPal account using the PayPal-Auth-Assertion header.
  """
  alias Streampai.Integrations.PayPal.Client
  alias Streampai.Integrations.PayPalConnection
  alias Streampai.Integrations.PayPalDonation

  require Logger

  @doc """
  Create a donation order for a streamer.

  Returns an order with an approval URL where the donor should be redirected to complete payment.

  ## Parameters
    - streamer: The user who will receive the donation
    - amount: Donation amount (Decimal)
    - currency: Currency code (default: "USD")
    - donor_info: Map with optional donor information (%{name:, email:, message:})
  """
  def create_donation(streamer, amount, currency \\ "USD", donor_info \\ %{}) do
    with {:ok, connection} <- get_active_connection(streamer),
         {:ok, order} <- create_order(connection, amount, currency, streamer, donor_info),
         {:ok, donation} <- save_donation(streamer, order, amount, currency, donor_info) do
      {:ok, %{donation: donation, approval_url: extract_approval_url(order)}}
    end
  end

  @doc """
  Capture a donation after the donor has approved it.

  This completes the payment and transfers funds to the streamer's account.
  """
  def capture_donation(order_id) do
    with {:ok, donation} <- get_donation_by_order(order_id),
         {:ok, connection} <- get_connection(donation),
         {:ok, capture_response} <-
           Client.post(
             "/v2/checkout/orders/#{order_id}/capture",
             %{},
             merchant_id: connection.merchant_id,
             idempotency_key: "capture_#{order_id}"
           ) do
      update_donation_after_capture(donation, capture_response)
    end
  end

  @doc """
  Get order details from PayPal.
  """
  def get_order(order_id, merchant_id) do
    Client.get("/v2/checkout/orders/#{order_id}", merchant_id: merchant_id)
  end

  defp get_active_connection(streamer) do
    case PayPalConnection.get_by_user(streamer.id) do
      {:ok, [connection | _]} when connection.account_status == :active ->
        {:ok, connection}

      _ ->
        {:error, :no_active_paypal_connection}
    end
  end

  defp create_order(connection, amount, currency, streamer, donor_info) do
    payload = %{
      intent: "CAPTURE",
      purchase_units: [
        %{
          reference_id: "donation_#{Ash.UUID.generate()}",
          amount: %{
            currency_code: currency,
            value: format_amount(amount)
          },
          payee: %{
            merchant_id: connection.merchant_id
          },
          description: build_description(streamer, donor_info),
          custom_id: "user_#{streamer.id}"
        }
      ],
      application_context: %{
        brand_name: "Streampai",
        locale: "en-US",
        landing_page: "NO_PREFERENCE",
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
        return_url: build_return_url(streamer.id),
        cancel_url: build_cancel_url(streamer.id)
      }
    }

    Client.post("/v2/checkout/orders", payload, merchant_id: connection.merchant_id)
  end

  defp save_donation(streamer, order, amount, currency, donor_info) do
    params = %{
      user_id: streamer.id,
      order_id: order["id"],
      amount: amount,
      currency: currency,
      status: :created,
      donor_name: donor_info[:name],
      donor_email: donor_info[:email],
      message: donor_info[:message],
      approval_url: extract_approval_url(order),
      metadata: %{
        created_via: "orders_api",
        donor_ip: donor_info[:ip],
        user_agent: donor_info[:user_agent]
      }
    }

    case PayPalDonation.create(params, authorize?: false) do
      {:ok, donation} -> {:ok, donation}
      error -> error
    end
  end

  defp get_donation_by_order(order_id) do
    case PayPalDonation.get_by_order_id(order_id) do
      {:ok, [donation | _]} -> {:ok, donation}
      _ -> {:error, :donation_not_found}
    end
  end

  defp get_connection(donation) do
    case PayPalConnection.get_by_user(donation.user_id) do
      {:ok, [connection | _]} -> {:ok, connection}
      _ -> {:error, :connection_not_found}
    end
  end

  defp update_donation_after_capture(donation, capture_response) do
    capture =
      capture_response["purchase_units"]
      |> List.first()
      |> Map.get("payments")
      |> Map.get("captures")
      |> List.first()

    params = %{
      capture_id: capture["id"],
      status: :completed,
      payer_id: capture_response["payer"]["payer_id"],
      donor_name: get_in(capture_response, ["payer", "name", "given_name"]),
      donor_email: capture_response["payer"]["email_address"],
      paypal_fee: extract_fee(capture),
      net_amount: extract_net_amount(capture)
    }

    PayPalDonation.update(donation, params, authorize?: false)
  end

  defp extract_approval_url(order) do
    order["links"]
    |> Enum.find(fn link -> link["rel"] == "approve" end)
    |> Map.get("href")
  end

  defp extract_fee(capture) do
    case get_in(capture, ["seller_receivable_breakdown", "paypal_fee"]) do
      %{"value" => value} -> Decimal.new(value)
      _ -> nil
    end
  end

  defp extract_net_amount(capture) do
    case get_in(capture, ["seller_receivable_breakdown", "net_amount"]) do
      %{"value" => value} -> Decimal.new(value)
      _ -> nil
    end
  end

  defp format_amount(amount) when is_binary(amount), do: amount
  defp format_amount(%Decimal{} = amount), do: Decimal.to_string(amount)

  defp format_amount(amount) when is_number(amount), do: :erlang.float_to_binary(amount / 1, decimals: 2)

  defp build_description(streamer, donor_info) do
    base = "Donation to #{streamer.name || streamer.email}"

    case donor_info[:message] do
      nil -> base
      "" -> base
      message -> "#{base} - #{String.slice(message, 0, 100)}"
    end
  end

  defp build_return_url(user_id) do
    base_url = Application.get_env(:streampai, StreampaiWeb.Endpoint)[:url][:host]
    "#{base_url}/donations/success?user_id=#{user_id}"
  end

  defp build_cancel_url(user_id) do
    base_url = Application.get_env(:streampai, StreampaiWeb.Endpoint)[:url][:host]
    "#{base_url}/donations/cancel?user_id=#{user_id}"
  end
end
