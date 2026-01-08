defmodule Streampai.Repo.Migrations.RenameLegacyThumbnailUrlBack do
  use Ecto.Migration

  def up do
    # Only rename if the legacy column still exists
    if column_exists?(:livestreams, :legacy_thumbnail_url) do
      rename table(:livestreams), :legacy_thumbnail_url, to: :thumbnail_url
    end
  end

  def down do
    if column_exists?(:livestreams, :thumbnail_url) do
      rename table(:livestreams), :thumbnail_url, to: :legacy_thumbnail_url
    end
  end

  defp column_exists?(table, column) do
    result =
      repo().query!(
        "SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2",
        [Atom.to_string(table), Atom.to_string(column)]
      )

    result.num_rows > 0
  end
end
