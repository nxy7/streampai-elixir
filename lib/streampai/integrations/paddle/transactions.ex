defmodule Streampai.Integrations.Paddle.Transactions do
  @moduledoc """
  Paddle Billing API — Transactions.

  Transactions represent payment attempts. Paddle creates them automatically
  from checkouts and subscription renewals.
  """

  alias Streampai.Integrations.Paddle.Client

  @doc "Get a transaction by ID (prefixed with txn_)."
  def get(transaction_id), do: Client.get("/transactions/#{transaction_id}")

  @doc "List transactions. Filter with params like subscription_id, customer_id, status."
  def list(opts \\ []), do: Client.get("/transactions", opts)

  @doc "Create a transaction (server-side checkout). Returns checkout URL in response."
  def create(params), do: Client.post("/transactions", params)
end
