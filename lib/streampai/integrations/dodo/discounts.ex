defmodule Streampai.Integrations.Dodo.Discounts do
  @moduledoc """
  Dodo Payments API — Discounts.
  """

  alias Streampai.Integrations.Dodo.Client

  @base_path "/discounts"

  @doc "Create a discount."
  def create(attrs), do: Client.post(@base_path, attrs)

  @doc "List discounts. Pass query params as `params:` keyword."
  def list(opts \\ []), do: Client.get(@base_path, opts)

  @doc "Get a discount by ID."
  def get(discount_id), do: Client.get("#{@base_path}/#{discount_id}")

  @doc "Get a discount by code."
  def get_by_code(code), do: Client.get("#{@base_path}/code/#{code}")

  @doc "Update a discount by ID."
  def update(discount_id, attrs), do: Client.patch("#{@base_path}/#{discount_id}", attrs)

  @doc "Delete a discount by ID."
  def delete(discount_id), do: Client.delete("#{@base_path}/#{discount_id}")
end
