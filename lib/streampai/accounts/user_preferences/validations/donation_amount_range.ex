defmodule Streampai.Accounts.UserPreferences.Validations.DonationAmountRange do
  @moduledoc """
  Validates that the minimum donation amount is less than the maximum and both are at least $1.
  Contains business logic for donation amount validation.
  """

  use Ash.Resource.Validation

  @impl true
  def validate(changeset, _opts, _context) do
    min_amount = Ash.Changeset.get_attribute(changeset, :min_donation_amount)
    max_amount = Ash.Changeset.get_attribute(changeset, :max_donation_amount)

    cond do
      is_nil(min_amount) or is_nil(max_amount) ->
        :ok

      min_amount >= max_amount ->
        {:error, field: :min_donation_amount, message: "must be less than maximum donation amount"}

      min_amount < 1 ->
        {:error, field: :min_donation_amount, message: "must be at least $1"}

      max_amount < 1 ->
        {:error, field: :max_donation_amount, message: "must be at least $1"}

      true ->
        :ok
    end
  end
end
