defmodule Streampai.Integrations.Dodo.Subscriptions do
  @moduledoc """
  Dodo Payments API — Subscriptions.

  Manage recurring billing subscriptions.
  """

  alias Streampai.Integrations.Dodo.Client

  @base_path "/subscriptions"

  @doc "Create a subscription."
  def create(attrs), do: Client.post(@base_path, attrs)

  @doc "List subscriptions. Pass query params as `params:` keyword."
  def list(opts \\ []), do: Client.get(@base_path, opts)

  @doc "Get a single subscription by ID."
  def get(subscription_id), do: Client.get("#{@base_path}/#{subscription_id}")

  @doc "Update a subscription (e.g. status, metadata)."
  def update(subscription_id, attrs) do
    Client.patch("#{@base_path}/#{subscription_id}", attrs)
  end

  @doc "Change subscription plan."
  def change_plan(subscription_id, attrs) do
    Client.post("#{@base_path}/#{subscription_id}/change-plan", attrs)
  end

  @doc "Preview a plan change before applying it."
  def preview_plan_change(subscription_id, attrs) do
    Client.post("#{@base_path}/#{subscription_id}/change-plan/preview", attrs)
  end

  @doc "Create an ad-hoc charge on a subscription."
  def charge(subscription_id, attrs) do
    Client.post("#{@base_path}/#{subscription_id}/charge", attrs)
  end

  @doc "Get usage history for a subscription."
  def usage_history(subscription_id, opts \\ []) do
    Client.get("#{@base_path}/#{subscription_id}/usage-history", opts)
  end

  @doc "Update payment method for a subscription."
  def update_payment_method(subscription_id, attrs) do
    Client.post("#{@base_path}/#{subscription_id}/update-payment-method", attrs)
  end
end
