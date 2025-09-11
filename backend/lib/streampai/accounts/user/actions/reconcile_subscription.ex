defmodule Streampai.Accounts.User.Actions.ReconcileSubscription do
  @moduledoc """
  Reconciles user's subscription state with Stripe.
  """

  use Ash.Resource.Actions.Implementation

  require Logger

  @impl true
  def run(input, _opts, _context) do
    user_id = input.params["primary_key"]["id"]
    # Logger.info("=== Starting subscription reconciliation for user #{user_id} ===")

    # Commented out for debugging job scheduling
    # with {:ok, _result} <- Streampai.Billing.reconcile_user_subscription(user) do
    #   Streampai.Accounts.User.get_by_id(user.id, actor: :system)
    # end

    # Logger.info("=== Subscription reconciliation completed for user #{user_id} ===")
    {:ok, user_id}
  end
end
