defmodule Streampai.Integrations.Paddle.Products do
  @moduledoc """
  Paddle Billing API — Products.

  Products describe what you sell. They hold high-level information like name,
  description, and tax category.
  """

  alias Streampai.Integrations.Paddle.Client

  @doc """
  Create a product.

  ## Required attrs
    - `name` — Product name
    - `tax_category` — Tax category (e.g. "saas", "digital-goods")

  ## Optional attrs
    - `description` — Short description
    - `type` — "standard" (default) or "custom"
    - `image_url` — Product image URL
    - `custom_data` — Key-value metadata
  """
  def create(attrs), do: Client.post("/products", attrs)

  @doc "Get a product by ID (prefixed with pro_)."
  def get(product_id), do: Client.get("/products/#{product_id}")

  @doc "List all products."
  def list(opts \\ []), do: Client.get("/products", opts)

  @doc "Update a product."
  def update(product_id, attrs), do: Client.patch("/products/#{product_id}", attrs)
end
