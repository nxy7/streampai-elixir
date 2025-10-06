defmodule Streampai.Accounts.User.Changes.SetAvatarFromArgument do
  @moduledoc """
  Sets the avatar attribute from the avatar_url argument.
  """
  use Ash.Resource.Change

  @impl true
  def change(changeset, _opts, _context) do
    Ash.Changeset.change_attribute(
      changeset,
      :avatar,
      Ash.Changeset.get_argument(changeset, :avatar_url)
    )
  end
end
