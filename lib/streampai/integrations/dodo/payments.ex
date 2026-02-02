defmodule Streampai.Integrations.Dodo.Payments do
  @moduledoc """
  Dodo Payments API — Payments.

  One-time payment creation and retrieval.
  """

  alias Streampai.Integrations.Dodo.Client

  @base_path "/payments"

  @doc "Create a one-time payment."
  def create(attrs), do: Client.post(@base_path, attrs)

  @doc "List payments. Pass query params as `params:` keyword."
  def list(opts \\ []), do: Client.get(@base_path, opts)

  @doc "Get a single payment by ID."
  def get(payment_id), do: Client.get("#{@base_path}/#{payment_id}")

  @doc "Get line items for a payment."
  def line_items(payment_id), do: Client.get("#{@base_path}/#{payment_id}/line-items")
end
