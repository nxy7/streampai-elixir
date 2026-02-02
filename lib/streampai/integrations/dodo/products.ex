defmodule Streampai.Integrations.Dodo.Products do
  @moduledoc """
  Dodo Payments API — Products.

  Products represent the items you sell (one-time, subscription, or usage-based).
  """

  alias Streampai.Integrations.Dodo.Client

  @base_path "/products"

  @doc "List products. Pass query params as `params:` keyword."
  def list(opts \\ []), do: Client.get(@base_path, opts)

  @doc "Get a single product by ID."
  def get(product_id), do: Client.get("#{@base_path}/#{product_id}")

  @doc "Create a product."
  def create(attrs), do: Client.post(@base_path, attrs)

  @doc "Update a product by ID."
  def update(product_id, attrs), do: Client.patch("#{@base_path}/#{product_id}", attrs)

  @doc "Archive a product by ID."
  def archive(product_id), do: Client.delete("#{@base_path}/#{product_id}")

  @doc "Unarchive a product by ID."
  def unarchive(product_id), do: Client.post("#{@base_path}/#{product_id}/unarchive", %{})
end
