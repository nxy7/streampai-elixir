defmodule Streampai.Stream.Livestream.Changes.ResolveThumbnailUrl do
  @moduledoc """
  Resolves `thumbnail_file_id` to a public URL and stores it in `thumbnail_url`.
  This allows Electric SQL to sync the URL as a plain string column.
  """
  use Ash.Resource.Change

  @impl true
  def change(changeset, _opts, _context) do
    thumbnail_file_id = Ash.Changeset.get_attribute(changeset, :thumbnail_file_id)

    if is_nil(thumbnail_file_id) do
      changeset
    else
      case Ash.get(Streampai.Storage.File, thumbnail_file_id, actor: Streampai.SystemActor.system()) do
        {:ok, file} ->
          url = Streampai.Storage.Adapters.S3.get_url(file.storage_key)
          Ash.Changeset.change_attribute(changeset, :thumbnail_url, url)

        {:error, _} ->
          changeset
      end
    end
  end
end
