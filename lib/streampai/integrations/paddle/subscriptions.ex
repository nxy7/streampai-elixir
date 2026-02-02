defmodule Streampai.Integrations.Paddle.Subscriptions do
  @moduledoc """
  Paddle Billing API — Subscriptions.

  Manage recurring billing subscriptions. Paddle automatically creates
  subscriptions when checkout transactions complete.
  """

  alias Streampai.Integrations.Paddle.Client

  @doc "Get a subscription by ID (prefixed with sub_)."
  def get(subscription_id), do: Client.get("/subscriptions/#{subscription_id}")

  @doc """
  Get a subscription with included related entities.

  ## Include options
    - "next_transaction" — Preview of next billing
    - "recurring_transaction_details" — Recurring charge preview
  """
  def get(subscription_id, include: include) do
    Client.get("/subscriptions/#{subscription_id}", params: [include: include])
  end

  @doc "List subscriptions. Filter with params like customer_id, status."
  def list(opts \\ []), do: Client.get("/subscriptions", opts)

  @doc "Update a subscription (change items, billing details, etc.)."
  def update(subscription_id, attrs) do
    Client.patch("/subscriptions/#{subscription_id}", attrs)
  end

  @doc "Cancel a subscription."
  def cancel(subscription_id, attrs \\ %{}) do
    Client.post("/subscriptions/#{subscription_id}/cancel", attrs)
  end

  @doc "Pause a subscription."
  def pause(subscription_id, attrs \\ %{}) do
    Client.post("/subscriptions/#{subscription_id}/pause", attrs)
  end

  @doc "Resume a paused subscription."
  def resume(subscription_id, attrs \\ %{}) do
    Client.post("/subscriptions/#{subscription_id}/resume", attrs)
  end
end
