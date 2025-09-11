defmodule Streampai.Billing do
  @moduledoc """
  Billing context for managing subscriptions and Stripe integration.
  """

  alias Streampai.Accounts.User
  alias Streampai.Accounts.UserPremiumGrant

  @doc """
  Create a Stripe checkout session for Pro plan upgrade.
  """
  def create_checkout_session(user, params \\ %{}) do
    success_url =
      Map.get(params, :success_url, "#{get_base_url()}/dashboard/settings?upgrade=success")

    cancel_url =
      Map.get(params, :cancel_url, "#{get_base_url()}/dashboard/settings?upgrade=cancelled")

    checkout_params = %{
      success_url: success_url,
      cancel_url: cancel_url,
      mode: :subscription,
      customer_email: user.email,
      client_reference_id: user.id,
      subscription_data: %{
        metadata: %{
          user_id: user.id,
          plan: "pro"
        }
      },
      line_items: [
        %{
          price: get_pro_plan_price_id(),
          quantity: 1
        }
      ],
      metadata: %{
        user_id: user.id,
        plan: "pro"
      }
    }

    case Stripe.Checkout.Session.create(checkout_params) do
      {:ok, session} ->
        {:ok, session}

      {:error, %Stripe.Error{} = error} ->
        {:error, "Failed to create checkout session: #{error.message}"}

      {:error, error} ->
        {:error, "Unexpected error: #{inspect(error)}"}
    end
  end

  @doc """
  Handle successful subscription creation from Stripe webhook.
  """
  def handle_subscription_created(subscription) do
    user_id = subscription.metadata["user_id"]

    if user_id do
      case User.get_by_id(user_id, actor: :system) do
        {:ok, user} ->
          create_premium_grant(user, subscription)

        {:error, _} ->
          {:error, "User not found"}
      end
    else
      {:error, "No user_id in subscription metadata"}
    end
  end

  @doc """
  Handle subscription cancellation/deletion from Stripe webhook.
  """
  def handle_subscription_deleted(subscription) do
    user_id = subscription.metadata["user_id"]

    if user_id do
      case User.get_by_id(user_id, actor: :system) do
        {:ok, user} ->
          remove_premium_grants(user, subscription.id)

        {:error, _} ->
          {:error, "User not found"}
      end
    else
      {:error, "No user_id in subscription metadata"}
    end
  end

  @doc """
  Handle subscription updates (renewal, plan changes, etc.)
  """
  def handle_subscription_updated(subscription) do
    # For now, just ensure the subscription is active
    if subscription.status in ["active", "trialing"] do
      handle_subscription_created(subscription)
    else
      handle_subscription_deleted(subscription)
    end
  end

  @doc """
  Check if a user has an active subscription directly with Stripe.
  """
  def get_subscription_status(user) do
    case Stripe.Customer.list(%{email: user.email, limit: 1}) do
      {:ok, %{data: [customer | _]}} ->
        case Stripe.Subscription.list(%{customer: customer.id, status: :active, limit: 1}) do
          {:ok, %{data: [subscription | _]}} ->
            {:ok, %{status: :active, subscription: subscription}}

          {:ok, %{data: []}} ->
            {:ok, %{status: :inactive, subscription: nil}}

          {:error, error} ->
            {:error, error}
        end

      {:ok, %{data: []}} ->
        {:ok, %{status: :inactive, subscription: nil}}

      {:error, error} ->
        {:error, error}
    end
  end

  # Private functions

  defp create_premium_grant(user, subscription) do
    grant_params = %{
      user_id: user.id,
      # Self-granted through payment
      granted_by_user_id: user.id,
      stripe_subscription_id: subscription.id,
      # Null for active subscriptions
      expires_at: nil,
      granted_at: DateTime.utc_now(),
      grant_reason: "stripe_subscription",
      metadata: %{
        subscription_id: subscription.id,
        customer_id: subscription.customer,
        plan_id: subscription.items.data |> List.first() |> Map.get(:price) |> Map.get(:id)
      }
    }

    UserPremiumGrant
    |> Ash.Changeset.for_create(:create_stripe_grant, grant_params, actor: :system)
    |> Ash.create()
  end

  defp remove_premium_grants(user, subscription_id) do
    import Ash.Query

    grants =
      UserPremiumGrant
      |> filter(user_id == ^user.id and stripe_subscription_id == ^subscription_id)
      |> Ash.read!(actor: :system)

    Enum.each(grants, fn grant ->
      grant
      |> Ash.Changeset.for_destroy(:destroy, %{}, actor: :system)
      |> Ash.destroy()
    end)
  end

  defp get_pro_plan_price_id do
    # TODO: Replace with actual Stripe Price ID for Pro plan
    # Placeholder - replace with real price ID
    Application.get_env(:streampai, :stripe_pro_price_id) ||
      System.get_env("STRIPE_PRO_PRICE_ID") ||
      "price_1234567890"
  end

  defp get_base_url do
    Application.get_env(:streampai, :base_url) ||
      System.get_env("BASE_URL") ||
      "http://localhost:4000"
  end
end
