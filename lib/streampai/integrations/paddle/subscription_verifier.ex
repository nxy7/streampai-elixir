defmodule Streampai.Integrations.Paddle.SubscriptionVerifier do
  @moduledoc """
  Shared subscription verification and pro access granting for Paddle.

  Called from three places:
    1. Redirect callback — user returns from Paddle checkout
    2. Webhook controller — Paddle pushes subscription events
    3. Oban polling job — periodic safety net

  All paths are idempotent via UserPremiumGrant's upsert on paddle_subscription_id.
  """

  alias Streampai.Accounts.UserPremiumGrant
  alias Streampai.Integrations.Paddle.Subscriptions
  alias Streampai.Integrations.Paddle.Transactions

  require Logger

  @doc """
  Verify a transaction (from checkout redirect) and grant pro if subscription is active.

  Fetches the transaction from Paddle, finds the subscription, and grants access.
  """
  @spec verify_transaction(String.t()) :: {:ok, :granted | :not_ready} | {:error, term()}
  def verify_transaction(transaction_id) do
    case Transactions.get(transaction_id) do
      {:ok, %{"data" => %{"subscription_id" => sub_id, "custom_data" => custom_data}}}
      when is_binary(sub_id) ->
        user_id = get_in(custom_data || %{}, ["user_id"])
        verify_subscription(sub_id, user_id)

      {:ok, %{"data" => %{"status" => status}}} ->
        Logger.info("Paddle transaction #{transaction_id} not ready: #{status}")
        {:ok, :not_ready}

      {:error, reason} ->
        {:error, reason}
    end
  end

  @doc """
  Verify a subscription status and grant pro access if active.
  """
  @spec verify_subscription(String.t(), String.t() | nil) ::
          {:ok, :granted | :not_ready} | {:error, term()}
  def verify_subscription(subscription_id, user_id) do
    case Subscriptions.get(subscription_id) do
      {:ok, %{"data" => sub_data}} ->
        grant_if_active(sub_data, user_id)

      {:error, reason} ->
        {:error, reason}
    end
  end

  @doc """
  Grant pro access from webhook subscription data (already parsed, no API call needed).
  """
  @spec grant_from_webhook(map()) :: {:ok, :granted | :not_ready} | {:error, term()}
  def grant_from_webhook(sub_data) do
    user_id = get_in(sub_data, ["custom_data", "user_id"])
    grant_if_active(sub_data, user_id)
  end

  defp grant_if_active(sub_data, nil) do
    Logger.error("Paddle subscription #{sub_data["id"]} missing user_id in custom_data")
    {:error, :missing_user_id}
  end

  defp grant_if_active(%{"status" => status} = sub_data, user_id) when status in ["active", "trialing"] do
    subscription_id = sub_data["id"]

    expires_at =
      case sub_data["current_billing_period"] do
        %{"ends_at" => ends_at} when is_binary(ends_at) ->
          case DateTime.from_iso8601(ends_at) do
            {:ok, dt, _} -> DateTime.add(dt, 7, :day)
            _ -> DateTime.add(DateTime.utc_now(), 35, :day)
          end

        _ ->
          DateTime.add(DateTime.utc_now(), 35, :day)
      end

    case UserPremiumGrant.create_paddle_grant(
           user_id,
           subscription_id,
           expires_at,
           %{
             paddle_subscription_id: subscription_id,
             paddle_customer_id: sub_data["customer_id"],
             plan: get_in(sub_data, ["custom_data", "plan"])
           }
         ) do
      {:ok, _grant} ->
        Logger.info("Pro access granted for user #{user_id} via Paddle sub #{subscription_id}")
        {:ok, :granted}

      {:error, error} ->
        Logger.error("Failed to grant pro access: #{inspect(error)}")
        {:error, :grant_failed}
    end
  end

  defp grant_if_active(%{"status" => status} = sub_data, _user_id) do
    Logger.info("Paddle subscription #{sub_data["id"]} not active: #{status}")
    {:ok, :not_ready}
  end
end
