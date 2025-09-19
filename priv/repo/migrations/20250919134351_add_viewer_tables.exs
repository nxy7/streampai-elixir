defmodule Streampai.Repo.Migrations.AddViewerTables do
  use Ecto.Migration

  def change do
    # Create viewers table
    create table(:viewers, primary_key: false) do
      add :id, :uuid, primary_key: true, default: fragment("gen_random_uuid()")
      add :display_name, :string, null: false, size: 100
      add :notes, :text, size: 1000
      add :first_seen_at, :utc_datetime_usec, null: false, default: fragment("now()")
      add :last_seen_at, :utc_datetime_usec, null: false, default: fragment("now()")
      add :user_id, references(:users, type: :uuid, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime_usec)
    end

    # Create indexes for viewers
    create index(:viewers, [:user_id], name: :idx_viewers_user_id)
    create unique_index(:viewers, [:user_id, :display_name], name: :idx_viewers_user_display_name)
    create index(:viewers, [:user_id, :last_seen_at], name: :idx_viewers_user_last_seen)

    # Create viewer_identities table
    create table(:viewer_identities, primary_key: false) do
      add :id, :uuid, primary_key: true, default: fragment("gen_random_uuid()")
      add :platform, :string, null: false
      add :platform_user_id, :string, null: false, size: 255
      add :username, :string, null: false, size: 100
      add :last_seen_username, :string, size: 100
      add :confidence_score, :decimal, null: false, default: 1.0, precision: 3, scale: 2
      add :linking_method, :string, null: false, default: "automatic"
      add :linking_batch_id, :string, size: 100
      add :metadata, :map, null: false, default: %{}
      add :linked_at, :utc_datetime_usec, null: false, default: fragment("now()")
      add :viewer_id, references(:viewers, type: :uuid, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime_usec)
    end

    # Create indexes for viewer_identities
    create index(:viewer_identities, [:viewer_id], name: :idx_viewer_identities_viewer_id)
    create unique_index(:viewer_identities, [:platform, :platform_user_id], name: :idx_viewer_identities_platform_user)
    create index(:viewer_identities, [:viewer_id, :platform], name: :idx_viewer_identities_viewer_platform)
    create index(:viewer_identities, [:confidence_score], name: :idx_viewer_identities_confidence)
    create index(:viewer_identities, [:linked_at], name: :idx_viewer_identities_linked_at)

    # Add constraint for platform enum
    create constraint(:viewer_identities, :valid_platform,
      check: "platform IN ('youtube', 'twitch', 'facebook', 'kick')")

    # Add constraint for linking_method enum
    create constraint(:viewer_identities, :valid_linking_method,
      check: "linking_method IN ('automatic', 'manual', 'username_similarity', 'cross_platform_activity', 'admin_override')")

    # Add constraint for confidence score range
    create constraint(:viewer_identities, :valid_confidence_score,
      check: "confidence_score >= 0.0 AND confidence_score <= 1.0")

    # Create viewer_linking_audits table
    create table(:viewer_linking_audits, primary_key: false) do
      add :id, :uuid, primary_key: true, default: fragment("gen_random_uuid()")
      add :action_type, :string, null: false
      add :linking_batch_id, :string, null: false, size: 100
      add :algorithm_version, :string, null: false, size: 50
      add :input_data, :map, null: false, default: %{}
      add :decision_data, :map, null: false, default: %{}
      add :confidence_score, :decimal, precision: 3, scale: 2
      add :notes, :text, size: 1000
      add :viewer_identity_id, references(:viewer_identities, type: :uuid, on_delete: :delete_all), null: false

      add :created_at, :utc_datetime_usec, null: false, default: fragment("now()")
    end

    # Create indexes for viewer_linking_audits
    create index(:viewer_linking_audits, [:viewer_identity_id], name: :idx_viewer_linking_audits_identity_id)
    create index(:viewer_linking_audits, [:linking_batch_id], name: :idx_viewer_linking_audits_batch_id)
    create index(:viewer_linking_audits, [:action_type], name: :idx_viewer_linking_audits_action_type)
    create index(:viewer_linking_audits, [:created_at], name: :idx_viewer_linking_audits_created_at)
    create index(:viewer_linking_audits, [:algorithm_version], name: :idx_viewer_linking_audits_algorithm_version)

    # Add constraint for action_type enum
    create constraint(:viewer_linking_audits, :valid_action_type,
      check: "action_type IN ('create', 'update', 'unlink', 'relink', 'confidence_update', 'username_update')")

    # Add constraint for confidence score range (if present)
    create constraint(:viewer_linking_audits, :valid_audit_confidence_score,
      check: "confidence_score IS NULL OR (confidence_score >= 0.0 AND confidence_score <= 1.0)")

    # Add viewer_id column to chat_messages table
    alter table(:chat_messages) do
      add :viewer_id, references(:viewers, type: :uuid, on_delete: :nilify_all)
    end

    # Create indexes for chat_messages viewer_id
    create index(:chat_messages, [:viewer_id], name: :idx_chat_messages_viewer_id)
    create index(:chat_messages, [:viewer_id, :inserted_at], name: :idx_chat_messages_viewer_chrono)

    # Add viewer_id column to stream_events table
    alter table(:stream_events) do
      add :viewer_id, references(:viewers, type: :uuid, on_delete: :nilify_all)
    end

    # Create indexes for stream_events viewer_id
    create index(:stream_events, [:viewer_id], name: :idx_stream_events_viewer_id)
    create index(:stream_events, [:viewer_id, :inserted_at], name: :idx_stream_events_viewer_chrono)
  end
end
