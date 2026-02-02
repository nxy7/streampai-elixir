defmodule Streampai.Integrations.Paddle.Prices do
  @moduledoc """
  Paddle Billing API — Prices.

  Prices describe how you charge for products. Each price belongs to a product
  and defines amount, currency, and billing cycle.
  """

  alias Streampai.Integrations.Paddle.Client

  @doc """
  Create a price.

  ## Required attrs
    - `product_id` — Paddle product ID (prefixed with pro_)
    - `description` — Internal description (not shown to customers)
    - `unit_price` — `%{amount: "2499", currency_code: "USD"}`

  ## Optional attrs
    - `billing_cycle` — `%{interval: "month", frequency: 1}` (nil for one-time)
    - `trial_period` — `%{interval: "day", frequency: 14}`
    - `tax_mode` — "account_setting" (default), "internal", "external"
    - `unit_price_overrides` — Country-specific pricing
    - `quantity` — `%{minimum: 1, maximum: 100}`
    - `custom_data` — Key-value metadata
  """
  def create(attrs), do: Client.post("/prices", attrs)

  @doc "Get a price by ID (prefixed with pri_)."
  def get(price_id), do: Client.get("/prices/#{price_id}")

  @doc "List prices. Optionally filter with params like product_id."
  def list(opts \\ []), do: Client.get("/prices", opts)

  @doc "Update a price."
  def update(price_id, attrs), do: Client.patch("/prices/#{price_id}", attrs)
end
