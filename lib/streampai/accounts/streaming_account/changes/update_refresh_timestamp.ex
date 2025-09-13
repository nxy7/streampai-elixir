defmodule Streampai.Accounts.StreamingAccount.Changes.UpdateRefreshTimestamp do
  @moduledoc """
  Updates the timestamp when refreshing tokens.
  Currently simple, but designed to contain more complex token refresh logic in the future.
  """

  use Ash.Resource.Change

  @impl true
  def change(changeset, _opts, _context) do
    Ash.Changeset.change_attribute(changeset, :updated_at, DateTime.utc_now())
  end
end
