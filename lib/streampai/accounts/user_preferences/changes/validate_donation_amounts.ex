defmodule Streampai.Accounts.UserPreferences.Changes.ValidateDonationAmounts do
  @moduledoc """
  Validates donation amount ranges and ensures min is less than max.
  """
  use Ash.Resource.Change

  @impl true
  def change(changeset, _opts, _context) do
    min_amount = Ash.Changeset.get_attribute(changeset, :min_donation_amount)
    max_amount = Ash.Changeset.get_attribute(changeset, :max_donation_amount)

    cond do
      is_nil(min_amount) and is_nil(max_amount) ->
        changeset

      is_nil(min_amount) or is_nil(max_amount) ->
        changeset

      min_amount > max_amount ->
        Ash.Changeset.add_error(
          changeset,
          field: :min_donation_amount,
          message: "Minimum donation amount must be less than maximum amount"
        )

      true ->
        changeset
    end
  end
end
