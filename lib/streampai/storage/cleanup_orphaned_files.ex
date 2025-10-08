defmodule Streampai.Storage.CleanupOrphanedFiles do
  @moduledoc """
  Oban worker that cleans up orphaned files from storage.

  Runs daily to:
  1. Delete files in :pending status older than 24 hours
  2. Delete files from S3 that don't have DB records
  3. Delete DB records for files that don't exist in S3 (optional)

  ## Orphan Prevention Techniques

  1. **Two-Phase Upload**:
     - Create DB record with status=:pending
     - Upload to S3
     - Mark status=:uploaded
     - This job cleans pending uploads that never completed

  2. **Reference Tracking**:
     - Files know which user uploaded them
     - Can extend to track which resource uses them (livestream thumbnail, etc.)

  3. **Periodic Reconciliation**:
     - Compare DB records vs S3 objects
     - Flag/delete orphans

  4. **S3 Lifecycle Rules** (set in R2/MinIO):
     - Auto-delete files in temp/ prefix after 7 days
     - Additional safety net
  """

  use Oban.Worker,
    queue: :storage_cleanup,
    max_attempts: 3

  alias Streampai.Storage.Adapters.S3
  alias Streampai.Storage.File

  require Logger

  @impl Oban.Worker
  def perform(%Oban.Job{}) do
    Logger.info("Starting orphaned files cleanup")

    # Step 1: Clean up pending uploads older than 24 hours
    {:ok, cleaned_pending} = cleanup_pending_uploads()

    # Step 2: Optional - reconcile DB with S3 (expensive, run weekly)
    # {:ok, reconciled} = reconcile_with_storage()

    Logger.info("Cleaned up #{cleaned_pending} pending uploads")

    :ok
  end

  defp cleanup_pending_uploads do
    require Ash.Query

    # Find pending files older than 24 hours
    {:ok, pending_files} =
      File
      |> Ash.Query.for_read(:list_pending_old, %{hours_old: 24})
      |> Ash.read(authorize?: false)

    Logger.info("Found #{length(pending_files)} pending files to clean up")

    # Delete from S3 and mark as deleted in DB
    Enum.each(pending_files, fn file ->
      case S3.delete(file.storage_key) do
        :ok ->
          File.mark_deleted(file, actor: :system)
          Logger.debug("Deleted pending file: #{file.storage_key}")

        {:error, reason} ->
          Logger.warning("Failed to delete #{file.storage_key}: #{inspect(reason)}")
      end
    end)

    {:ok, length(pending_files)}
  end

  @doc """
  Reconcile database records with S3 storage.
  This is an expensive operation, run it weekly or on-demand.
  """
  def reconcile_with_storage do
    # TODO: Implement full reconciliation
    # 1. List all files in S3
    # 2. Compare with DB records
    # 3. Flag orphans
    {:ok, 0}
  end
end
