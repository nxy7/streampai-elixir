defmodule Streampai.Integrations.Dodo.Customers do
  @moduledoc """
  Dodo Payments API — Customers.
  """

  alias Streampai.Integrations.Dodo.Client

  @base_path "/customers"

  @doc "Create a customer."
  def create(attrs), do: Client.post(@base_path, attrs)

  @doc "List customers. Pass query params as `params:` keyword."
  def list(opts \\ []), do: Client.get(@base_path, opts)

  @doc "Get a single customer by ID."
  def get(customer_id), do: Client.get("#{@base_path}/#{customer_id}")

  @doc "Update a customer by ID."
  def update(customer_id, attrs), do: Client.patch("#{@base_path}/#{customer_id}", attrs)

  @doc "Get payment methods for a customer."
  def payment_methods(customer_id) do
    Client.get("#{@base_path}/#{customer_id}/payment-methods")
  end

  @doc "Create a customer portal session."
  def create_portal_session(customer_id) do
    Client.post("#{@base_path}/#{customer_id}/customer-portal/session", %{})
  end
end
