defmodule Streampai.Integrations.PayPal.PartnerReferrals do
  @moduledoc """
  Handles PayPal Partner Referrals API for onboarding merchants (streamers).

  This allows streamers to connect their PayPal accounts so they can receive donations
  directly to their account, while we handle all the payment processing via our platform credentials.
  """
  alias Streampai.Integrations.PayPal.Client
  alias Streampai.Integrations.PayPalConnection

  require Logger

  @doc """
  Create a partner referral link for a streamer to connect their PayPal account.

  Returns a signup URL that the streamer should be redirected to.
  """
  def create_referral_link(user) do
    payload = %{
      operations: [
        %{
          operation: "API_INTEGRATION",
          api_integration_preference: %{
            rest_api_integration: %{
              integration_method: "PAYPAL",
              integration_type: "THIRD_PARTY",
              third_party_details: %{
                features: ["PAYMENT", "REFUND"]
              }
            }
          }
        }
      ],
      products: ["EXPRESS_CHECKOUT"],
      legal_consents: [
        %{
          type: "SHARE_DATA_CONSENT",
          granted: true
        }
      ],
      partner_config_override: %{
        partner_logo_url: "https://streampai.com/logo.png",
        return_url:
          "#{Application.get_env(:streampai, StreampaiWeb.Endpoint)[:url][:host]}/settings/paypal/callback?user_id=#{user.id}",
        return_url_description: "Return to Streampai",
        action_renewal_url: "#{Application.get_env(:streampai, StreampaiWeb.Endpoint)[:url][:host]}/settings/paypal/renew"
      }
    }

    case Client.post("/v2/customer/partner-referrals", payload) do
      {:ok, response} ->
        # Extract the signup link
        signup_link =
          response["links"]
          |> Enum.find(fn link -> link["rel"] == "action_url" end)
          |> Map.get("href")

        {:ok, %{signup_url: signup_link, referral_data: response}}

      {:error, reason} ->
        Logger.error("Failed to create PayPal referral link: #{inspect(reason)}")
        {:error, reason}
    end
  end

  @doc """
  Handle the callback after a streamer completes PayPal onboarding.

  Exchanges the authorization code for access and refresh tokens.
  """
  def handle_onboarding_callback(auth_code, shared_id, user) do
    with {:ok, tokens} <- exchange_auth_code(auth_code, shared_id),
         {:ok, merchant_info} <- get_merchant_info(tokens.access_token),
         {:ok, connection} <- create_or_update_connection(user, tokens, merchant_info) do
      {:ok, connection}
    else
      {:error, reason} ->
        Logger.error("PayPal onboarding callback failed: #{inspect(reason)}")
        {:error, reason}
    end
  end

  defp exchange_auth_code(auth_code, shared_id) do
    config = Application.get_env(:streampai, :paypal, %{})

    payload = %{
      grant_type: "authorization_code",
      code: auth_code,
      code_verifier: shared_id
    }

    base_url =
      if config[:mode] == :sandbox,
        do: "https://api.sandbox.paypal.com",
        else: "https://api.paypal.com"

    case Req.post(
           "#{base_url}/v1/oauth2/token",
           form: payload,
           auth: {:basic, "#{config[:client_id]}:#{config[:secret]}"},
           headers: [accept: "application/json"]
         ) do
      {:ok, %{status: 200, body: data}} ->
        {:ok,
         %{
           access_token: data["access_token"],
           refresh_token: data["refresh_token"],
           expires_in: data["expires_in"]
         }}

      {:ok, %{status: status, body: body}} ->
        {:error, {:http_error, status, body}}

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp get_merchant_info(access_token) do
    config = Application.get_env(:streampai, :paypal, %{})

    base_url =
      if config[:mode] == :sandbox,
        do: "https://api.sandbox.paypal.com",
        else: "https://api.paypal.com"

    case Req.get(
           "#{base_url}/v1/identity/oauth2/userinfo?schema=paypalv1.1",
           headers: [
             authorization: "Bearer #{access_token}",
             content_type: "application/json"
           ]
         ) do
      {:ok, %{status: 200, body: data}} ->
        {:ok,
         %{
           merchant_id: data["payer_id"],
           email: data["email"],
           name: data["name"]
         }}

      {:ok, %{status: status, body: body}} ->
        {:error, {:http_error, status, body}}

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp create_or_update_connection(user, tokens, merchant_info) do
    expires_at = DateTime.add(DateTime.utc_now(), tokens.expires_in, :second)

    params = %{
      user_id: user.id,
      merchant_id: merchant_info.merchant_id,
      merchant_email: merchant_info.email,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: expires_at,
      account_status: :active,
      permissions: ["PAYMENT", "REFUND"],
      onboarding_completed_at: DateTime.utc_now()
    }

    case PayPalConnection.get_by_user(user.id) do
      {:ok, [existing | _]} ->
        PayPalConnection.update(existing, params, actor: user)

      _ ->
        PayPalConnection.create(params, actor: user)
    end
  end

  @doc """
  Refresh an expired access token using the refresh token.
  """
  def refresh_access_token(connection) do
    config = Application.get_env(:streampai, :paypal, %{})

    payload = %{
      grant_type: "refresh_token",
      refresh_token: connection.refresh_token
    }

    base_url =
      if config[:mode] == :sandbox,
        do: "https://api.sandbox.paypal.com",
        else: "https://api.paypal.com"

    case Req.post(
           "#{base_url}/v1/oauth2/token",
           form: payload,
           auth: {:basic, "#{config[:client_id]}:#{config[:secret]}"},
           headers: [accept: "application/json"]
         ) do
      {:ok, %{status: 200, body: data}} ->
        expires_at = DateTime.add(DateTime.utc_now(), data["expires_in"], :second)

        PayPalConnection.update(
          connection,
          %{
            access_token: data["access_token"],
            token_expires_at: expires_at
          },
          authorize?: false
        )

      {:ok, %{status: status, body: body}} ->
        {:error, {:http_error, status, body}}

      {:error, reason} ->
        {:error, reason}
    end
  end
end
