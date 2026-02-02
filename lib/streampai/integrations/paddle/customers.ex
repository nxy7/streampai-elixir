defmodule Streampai.Integrations.Paddle.Customers do
  @moduledoc """
  Paddle Billing API — Customers.
  """

  alias Streampai.Integrations.Paddle.Client

  @doc "Get a customer by ID (prefixed with ctm_)."
  def get(customer_id), do: Client.get("/customers/#{customer_id}")

  @doc "List customers."
  def list(opts \\ []), do: Client.get("/customers", opts)

  @doc "Create a customer."
  def create(attrs), do: Client.post("/customers", attrs)

  @doc "Update a customer."
  def update(customer_id, attrs), do: Client.patch("/customers/#{customer_id}", attrs)
end
