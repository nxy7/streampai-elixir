defmodule Streampai.Repo.Migrations.RefactorToGlobalViewerIdentities do
  use Ecto.Migration

  def up do
    # Remove viewer_id foreign key from viewer_identities to make them global
    drop_if_exists constraint(:viewer_identities, "viewer_identities_viewer_id_fkey")

    # Add global identifier fields to viewer_identities
    alter table(:viewer_identities) do
      add :global_viewer_id, :uuid, default: fragment("gen_random_uuid()")
      add :display_name, :string
      add :first_seen_at, :utc_datetime_usec, default: fragment("now()")
      add :last_seen_at, :utc_datetime_usec, default: fragment("now()")
      add :global_notes, :text
    end

    # Create new viewer_links table to link global identities to per-streamer viewers
    create table(:viewer_links, primary_key: false) do
      add :id, :uuid, primary_key: true, default: fragment("gen_random_uuid()")
      add :viewer_identity_id, references(:viewer_identities, type: :uuid, on_delete: :delete_all), null: false
      add :viewer_id, references(:viewers, type: :uuid, on_delete: :delete_all), null: false
      add :linking_confidence, :decimal, default: 1.0, precision: 3, scale: 2
      add :linking_method, :string, null: false, default: "automatic"
      add :linked_at, :utc_datetime_usec, null: false, default: fragment("now()")
      add :metadata, :map, null: false, default: %{}

      timestamps(type: :utc_datetime_usec)
    end

    # Create indexes for viewer_links
    create unique_index(:viewer_links, [:viewer_identity_id, :viewer_id],
             name: :idx_viewer_links_identity_viewer_unique)
    create index(:viewer_links, [:viewer_identity_id], name: :idx_viewer_links_identity_id)
    create index(:viewer_links, [:viewer_id], name: :idx_viewer_links_viewer_id)
    create index(:viewer_links, [:linking_confidence], name: :idx_viewer_links_confidence)
    create index(:viewer_links, [:linked_at], name: :idx_viewer_links_linked_at)

    # Add constraints for viewer_links
    create constraint(:viewer_links, :valid_linking_method,
             check: "linking_method IN ('automatic', 'manual', 'username_similarity', 'cross_platform_activity', 'admin_override')")

    create constraint(:viewer_links, :valid_linking_confidence,
             check: "linking_confidence >= 0.0 AND linking_confidence <= 1.0")

    # Update viewer_identities indexes to reflect new structure
    drop_if_exists index(:viewer_identities, [:viewer_id])
    drop_if_exists index(:viewer_identities, [:viewer_id, :platform])

    # Add new indexes for global viewer_identities
    create index(:viewer_identities, [:global_viewer_id], name: :idx_viewer_identities_global_viewer_id)
    create unique_index(:viewer_identities, [:global_viewer_id, :platform],
             name: :idx_viewer_identities_global_viewer_platform_unique)
    create index(:viewer_identities, [:display_name], name: :idx_viewer_identities_display_name)
    create index(:viewer_identities, [:last_seen_at], name: :idx_viewer_identities_last_seen_at)

    # Update chat_messages and stream_events to link to viewer_identities instead of viewers
    alter table(:chat_messages) do
      add :viewer_identity_id, references(:viewer_identities, type: :uuid, on_delete: :nilify_all)
    end

    alter table(:stream_events) do
      add :viewer_identity_id, references(:viewer_identities, type: :uuid, on_delete: :nilify_all)
    end

    # Create indexes for the new foreign keys
    create index(:chat_messages, [:viewer_identity_id], name: :idx_chat_messages_viewer_identity_id)
    create index(:chat_messages, [:viewer_identity_id, :inserted_at],
             name: :idx_chat_messages_viewer_identity_chrono)

    create index(:stream_events, [:viewer_identity_id], name: :idx_stream_events_viewer_identity_id)
    create index(:stream_events, [:viewer_identity_id, :inserted_at],
             name: :idx_stream_events_viewer_identity_chrono)
  end

  def down do
    # Remove new columns and tables
    drop_if_exists table(:viewer_links)

    alter table(:viewer_identities) do
      remove :global_viewer_id
      remove :display_name
      remove :first_seen_at
      remove :last_seen_at
      remove :global_notes
    end

    alter table(:chat_messages) do
      remove :viewer_identity_id
    end

    alter table(:stream_events) do
      remove :viewer_identity_id
    end

    # Restore original structure
    alter table(:viewer_identities) do
      add :viewer_id, references(:viewers, type: :uuid, on_delete: :delete_all), null: false
    end

    # Restore original indexes
    create index(:viewer_identities, [:viewer_id], name: :idx_viewer_identities_viewer_id)
    create index(:viewer_identities, [:viewer_id, :platform], name: :idx_viewer_identities_viewer_platform)
  end
end