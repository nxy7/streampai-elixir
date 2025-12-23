defmodule Streampai.Accounts.User.Changes.SetAvatarFromFile do
  @moduledoc """
  Sets the avatar_file_id and avatar_url attributes from the file_id argument.
  """
  use Ash.Resource.Change

  alias Streampai.Storage.Adapters.S3
  alias Streampai.Storage.File

  @impl true
  def change(changeset, _opts, context) do
    file_id = Ash.Changeset.get_argument(changeset, :file_id)

    case File.get_by_id(%{id: file_id}, actor: context.actor) do
      {:ok, file} ->
        avatar_url = S3.get_url(file.storage_key)

        changeset
        |> Ash.Changeset.change_attribute(:avatar_file_id, file_id)
        |> Ash.Changeset.change_attribute(:avatar_url, avatar_url)

      {:error, _} ->
        Ash.Changeset.add_error(changeset, field: :file_id, message: "File not found")
    end
  end
end
