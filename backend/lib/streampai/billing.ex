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
  Uses upsert for idempotency - duplicate webhook deliveries will update existing grants.
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
          revoke_premium_grants(user, subscription.id)

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

  @doc """
  Reconcile user subscription state with Stripe.
  Should be called periodically to ensure consistency.
  """
  def reconcile_user_subscription(user) do
    case get_subscription_status(user) do
      {:ok, %{status: :active, subscription: stripe_sub}} ->
        # Upsert will create or update the grant
        create_premium_grant(user, stripe_sub)

      {:ok, %{status: :inactive}} ->
        # Revoke any active grants
        revoke_premium_grants(user, nil)
        {:ok, :revoked}

      {:error, reason} ->
        {:error, "Failed to check Stripe status: #{reason}"}
    end
  end

  # Private functions

  defp create_premium_grant(user, subscription) do
    grant_params = %{
      user_id: user.id,
      # Self-granted through payment
      granted_by_user_id: user.id,
      stripe_subscription_id: subscription.id,
      # Set to subscription period end
      expires_at: DateTime.from_unix!(subscription.current_period_end),
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

  defp revoke_premium_grants(user, subscription_id) do
    import Ash.Query

    grants =
      UserPremiumGrant
      |> filter(user_id == ^user.id and stripe_subscription_id == ^subscription_id)
      |> Ash.read!(actor: :system)

    Enum.each(grants, fn grant ->
      grant
      |> Ash.Changeset.for_update(:revoke, %{revoked_at: DateTime.utc_now()}, actor: :system)
      |> Ash.update()
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
