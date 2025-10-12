defmodule Streampai.Integrations do
  @moduledoc """
  Domain for third-party integrations (PayPal, Stripe, etc.) and donations.
  """
  use Ash.Domain

  resources do
    resource Streampai.Integrations.PayPalConnection
    resource Streampai.Integrations.Donation
  end
end

# Backward compatibility alias
defmodule Streampai.Integrations.PayPalDonation do
  @moduledoc """
  DEPRECATED: Use `Streampai.Integrations.Donation` instead.

  This module is an alias for backward compatibility.
  """
  alias Streampai.Integrations.Donation

  defdelegate create(params, opts \\ []), to: Donation
  defdelegate read(opts \\ []), to: Donation
  defdelegate update(donation, params, opts \\ []), to: Donation
  defdelegate destroy(donation, opts \\ []), to: Donation
  defdelegate get_by_order_id(order_id, opts \\ []), to: Donation
  defdelegate get_by_user(user_id, opts \\ []), to: Donation
end
