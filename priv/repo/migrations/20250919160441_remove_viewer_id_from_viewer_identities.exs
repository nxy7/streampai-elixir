defmodule Streampai.Repo.Migrations.RemoveViewerIdFromViewerIdentities do
  use Ecto.Migration

  def up do
    # Remove the viewer_id column that's no longer needed in the global architecture
    alter table(:viewer_identities) do
      remove :viewer_id
    end
  end

  def down do
    # Re-add viewer_id column if we need to rollback
    alter table(:viewer_identities) do
      add :viewer_id, references(:viewers, type: :uuid, on_delete: :delete_all)
    end
  end
end
