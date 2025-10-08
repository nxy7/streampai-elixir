defmodule Streampai.Accounts.User.Changes.SetAvatarFromFile do
  @moduledoc """
  Sets the avatar_file_id attribute from the file_id argument.
  Also marks the old avatar file as deleted if it exists.
  """
  use Ash.Resource.Change

  @impl true
  def change(changeset, _opts, _context) do
    file_id = Ash.Changeset.get_argument(changeset, :file_id)

    Ash.Changeset.change_attribute(changeset, :avatar_file_id, file_id)
  end
end
