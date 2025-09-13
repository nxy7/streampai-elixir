defmodule Streampai.Accounts.User.Changes.ValidateOAuthConfirmation do
  @moduledoc """
  Validates OAuth user confirmation status after action.
  """

  use Ash.Resource.Change

  @impl true
  def change(changeset, _opts, _context) do
    # Add after_action hook for validation
    Ash.Changeset.after_action(changeset, &validate_confirmation/2)
  end

  defp validate_confirmation(_changeset, user) do
    case user.confirmed_at do
      nil -> {:error, "Unconfirmed user exists already"}
      _ -> {:ok, user}
    end
  end
end
