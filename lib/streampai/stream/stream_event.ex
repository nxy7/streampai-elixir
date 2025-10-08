defmodule Streampai.Stream.StreamEvent do
  @moduledoc """
  Base resource for all stream events. Events are stored in a single table
  with type discrimination and JSONB data storage for flexibility.

  This allows for efficient chronological queries across all event types.
  """
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Stream,
    data_layer: AshPostgres.DataLayer

  postgres do
    table "stream_events"
    repo Streampai.Repo

    # Add indexes for common query patterns
    custom_indexes do
      # For chronological queries by stream
      index [:livestream_id, :inserted_at],
        name: "idx_stream_events_stream_chrono"

      # For type-specific queries
      index [:livestream_id, :type, :inserted_at],
        name: "idx_stream_events_type_chrono"

      # For user's events across all streams
      index [:user_id, :inserted_at],
        name: "idx_stream_events_user_chrono"

      # For platform-specific queries
      index [:platform, :inserted_at],
        name: "idx_stream_events_platform_chrono"

      # For viewer-specific queries (chronological)
      index [:viewer_id, :inserted_at],
        name: "idx_stream_events_viewer_chrono"
    end
  end

  code_interface do
    define :create
    define :read
    define :for_stream
    define :by_type
    define :destroy
    define :get_activity_events_for_livestream, args: [:livestream_id]
    define :get_platform_started_for_livestream, args: [:livestream_id]
    define :get_for_viewer, args: [:viewer_id, :user_id]
    define :upsert
    define :create_stream_updated, args: [:livestream_id, :user_id, :author_id, :metadata]
  end

  actions do
    defaults [:read, :destroy]

    create :create do
      accept [
        :type,
        :data,
        :data_raw,
        :author_id,
        :livestream_id,
        :user_id,
        :platform,
        :viewer_id
      ]
    end

    read :for_stream do
      description "Get events for a stream"

      argument :livestream_id, :uuid, allow_nil?: false
      argument :limit, :integer, default: 50

      filter expr(livestream_id == ^arg(:livestream_id))
      prepare build(sort: [inserted_at: :desc], limit: arg(:limit))
    end

    read :by_type do
      description "Get events by type for a stream"

      argument :livestream_id, :uuid, allow_nil?: false
      argument :event_type, :atom, allow_nil?: false
      argument :limit, :integer, default: 50

      filter expr(livestream_id == ^arg(:livestream_id) and type == ^arg(:event_type))
      prepare build(sort: [inserted_at: :desc], limit: arg(:limit))
    end

    read :get_activity_events_for_livestream do
      description "Get activity events (donations, follows, raids, etc.) for a livestream"

      argument :livestream_id, :uuid, allow_nil?: false

      filter expr(
               livestream_id == ^arg(:livestream_id) and
                 (type == :donation or type == :follow or type == :raid or type == :cheer or
                    type == :patreon)
             )

      prepare build(sort: [inserted_at: :asc])
    end

    read :get_platform_started_for_livestream do
      description "Get platform_started events for a livestream to determine which platforms were used"

      argument :livestream_id, :uuid, allow_nil?: false

      filter expr(livestream_id == ^arg(:livestream_id) and type == :platform_started)
    end

    read :get_for_viewer do
      description "Get events for a specific viewer on a user's streams"

      argument :viewer_id, :string, allow_nil?: false
      argument :user_id, :uuid, allow_nil?: false

      filter expr(viewer_id == ^arg(:viewer_id) and user_id == ^arg(:user_id))
      prepare build(sort: [inserted_at: :desc], limit: 50)
    end

    create :upsert do
      accept [
        :type,
        :data,
        :data_raw,
        :author_id,
        :livestream_id,
        :user_id,
        :platform,
        :viewer_id
      ]

      argument :id, :uuid do
        allow_nil? true
      end

      change set_attribute(:id, arg(:id))

      upsert? true
      upsert_identity :primary_key

      upsert_fields [
        :type,
        :data,
        :data_raw,
        :author_id,
        :livestream_id,
        :user_id,
        :platform,
        :viewer_id
      ]
    end

    create :create_stream_updated do
      description "Creates a stream_updated event with proper metadata structure"

      argument :livestream_id, :uuid, allow_nil?: false
      argument :user_id, :uuid, allow_nil?: false
      argument :author_id, :string, allow_nil?: false
      argument :metadata, :map, allow_nil?: false

      change set_attribute(:type, :stream_updated)
      change set_attribute(:livestream_id, arg(:livestream_id))
      change set_attribute(:user_id, arg(:user_id))
      change set_attribute(:author_id, arg(:author_id))
      change set_attribute(:platform, nil)

      change fn changeset, _context ->
        metadata = Ash.Changeset.get_argument(changeset, :metadata)

        data = %{
          "username" => metadata["username"],
          "title" => metadata["title"],
          "description" => metadata["description"],
          "user" => metadata["user"]
        }

        changeset
        |> Ash.Changeset.change_attribute(:data, data)
        |> Ash.Changeset.change_attribute(:data_raw, metadata)
      end

      change fn changeset, _context ->
        metadata = Ash.Changeset.get_argument(changeset, :metadata)

        viewer_id =
          get_in(metadata, ["user", "id"]) ||
            Ash.Changeset.get_attribute(changeset, :author_id)

        Ash.Changeset.change_attribute(changeset, :viewer_id, to_string(viewer_id))
      end
    end
  end

  attributes do
    uuid_primary_key :id

    attribute :type, Streampai.Stream.EventType do
      public? true
      allow_nil? false
    end

    attribute :data, :map do
      description "
      Event-specific data stored as JSONB, unlike RAW data
      this should be pre-processed into a consistent format.
      "
      public? true
      allow_nil? false
    end

    attribute :data_raw, :map do
      description "Raw data as received from platform, unprocessed"
      public? true
      allow_nil? false
    end

    attribute :author_id, :string do
      public? true
      allow_nil? false
    end

    attribute :livestream_id, :uuid do
      public? true
      allow_nil? false
    end

    attribute :user_id, :uuid do
      public? true
      allow_nil? false
    end

    attribute :platform, Streampai.Stream.Platform do
      public? true
      allow_nil? true
    end

    attribute :viewer_id, :string do
      public? true
    end

    create_timestamp :inserted_at
  end

  relationships do
    belongs_to :user, Streampai.Accounts.User do
      source_attribute :user_id
      destination_attribute :id
    end

    belongs_to :livestream, Streampai.Stream.Livestream do
      source_attribute :livestream_id
      destination_attribute :id
    end
  end

  identities do
    identity :primary_key, [:id]
  end
end
