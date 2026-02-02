defmodule Streampai.Integrations.Dodo.Refunds do
  @moduledoc """
  Dodo Payments API — Refunds.
  """

  alias Streampai.Integrations.Dodo.Client

  @base_path "/refunds"

  @doc "Create a refund."
  def create(attrs), do: Client.post(@base_path, attrs)

  @doc "List refunds. Pass query params as `params:` keyword."
  def list(opts \\ []), do: Client.get(@base_path, opts)

  @doc "Get a single refund by ID."
  def get(refund_id), do: Client.get("#{@base_path}/#{refund_id}")
end
