defmodule Streampai.Repo.Migrations.BackfillThumbnailUrls do
  use Ecto.Migration

  import Ecto.Query

  def up do
    # Fetch all livestreams with a thumbnail_file_id but no thumbnail_url
    rows =
      from(l in "livestreams",
        where: not is_nil(l.thumbnail_file_id) and is_nil(l.thumbnail_url),
        select: %{id: l.id, thumbnail_file_id: l.thumbnail_file_id}
      )
      |> repo().all()

    for row <- rows do
      case repo().one(
             from(f in "files", where: f.id == ^row.thumbnail_file_id, select: f.storage_key)
           ) do
        nil ->
          :ok

        storage_key ->
          url = Streampai.Storage.Adapters.S3.get_url(storage_key)

          from(l in "livestreams", where: l.id == ^row.id)
          |> repo().update_all(set: [thumbnail_url: url])
      end
    end
  end

  def down do
    # No-op
  end
end
