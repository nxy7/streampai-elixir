defmodule StreampaiWeb.PayPalCallbackController do
  @moduledoc """
  Handles PayPal OAuth callback after merchant onboarding.
  """
  use StreampaiWeb, :controller

  alias Streampai.Accounts.User
  alias Streampai.Integrations.PayPal.PartnerReferrals

  require Logger

  def handle_callback(conn, params) do
    user_id = params["user_id"]
    merchant_id = params["merchantId"]
    merchant_id_in_paypal = params["merchantIdInPayPal"]
    permissions_granted = params["permissionsGranted"] == "true"
    consent_status = params["consentStatus"]
    is_email_confirmed = params["isEmailConfirmed"] == "true"
    account_status = params["accountStatus"]

    # Get auth code from params
    # Note: PayPal doesn't directly send authCode in callback params
    # You need to handle this based on their actual implementation
    auth_code = params["authCode"]
    shared_id = merchant_id_in_paypal

    with {:ok, user} <- get_user(user_id),
         {:ok, _connection} <-
           PartnerReferrals.handle_onboarding_callback(auth_code, shared_id, user) do
      conn
      |> put_flash(:info, "PayPal account connected successfully!")
      |> redirect(to: "/dashboard/settings")
    else
      {:error, :user_not_found} ->
        Logger.error("User not found: #{user_id}")

        conn
        |> put_flash(:error, "Session expired. Please try again.")
        |> redirect(to: "/dashboard/settings")

      {:error, reason} ->
        Logger.error("PayPal callback error: #{inspect(reason)}")

        conn
        |> put_flash(:error, "Failed to connect PayPal account. Please try again.")
        |> redirect(to: "/dashboard/settings")
    end
  end

  defp get_user(user_id) do
    case Ash.get(User, user_id, authorize?: false) do
      {:ok, user} -> {:ok, user}
      _ -> {:error, :user_not_found}
    end
  end
end
