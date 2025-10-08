defmodule Streampai.Storage.File.Changes.FetchSizeFromS3 do
  @moduledoc """
  Fetches the actual file size from S3 after upload.

  This ensures we store the real file size rather than trusting
  the client's reported size.
  """
  use Ash.Resource.Change

  require Logger

  @impl true
  def change(changeset, _opts, _context) do
    storage_key = Ash.Changeset.get_attribute(changeset, :storage_key)

    case Streampai.Storage.Adapters.S3.get_file_size(storage_key) do
      {:ok, size_bytes} ->
        Logger.info("Verified file size from S3: #{size_bytes} bytes for #{storage_key}")
        Ash.Changeset.change_attribute(changeset, :size_bytes, size_bytes)

      {:error, reason} ->
        Logger.error("Failed to get file size from S3 for #{storage_key}: #{inspect(reason)}")

        Ash.Changeset.add_error(
          changeset,
          field: :size_bytes,
          message: "Failed to verify file size from storage: #{inspect(reason)}"
        )
    end
  end
end
