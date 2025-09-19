defmodule Streampai.Repo.Migrations.RestoreViewerIdToViewerIdentities do
  use Ecto.Migration

  def up do
    # Add back the viewer_id column to restore original ViewerIdentity > Viewer relationship
    alter table(:viewer_identities) do
      add :viewer_id, references(:viewers, type: :uuid, on_delete: :delete_all), null: false
    end

    # Remove the global architecture columns that were added
    alter table(:viewer_identities) do
      remove :global_viewer_id
      remove :display_name
      remove :first_seen_at
      remove :last_seen_at
      remove :global_notes
    end

    # Remove the viewer_links table that was part of global architecture
    drop_if_exists table(:viewer_links)

    # Remove viewer_identity_id from chat_messages and stream_events
    alter table(:chat_messages) do
      remove_if_exists :viewer_identity_id, :uuid
    end

    alter table(:stream_events) do
      remove_if_exists :viewer_identity_id, :uuid
    end

    # Recreate original indexes
    create_if_not_exists index(:viewer_identities, [:viewer_id], name: "idx_viewer_identities_viewer_id")
    create_if_not_exists index(:viewer_identities, [:viewer_id, :platform], name: "idx_viewer_identities_viewer_platform")
  end

  def down do
    # This would reverse to the global architecture, but we're keeping it simple
    # Just drop the viewer_id column if we need to rollback
    alter table(:viewer_identities) do
      remove :viewer_id
    end
  end
end