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
  end

  code_interface do
    define :create
    define :read
    define :for_stream
    define :by_type
    define :destroy
  end

  actions do
    defaults [:read, :destroy]

    create :create do
      accept [:type, :data, :livestream_id, :user_id, :platform]

      validate present([:type, :data, :platform, :livestream_id])
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
  end

  attributes do
    uuid_primary_key :id

    attribute :type, :atom do
      public? true
      allow_nil? false
      # TODO extract to separate enum like Streampai.Stream.Platform
      constraints one_of: [:chat_message, :donation, :follow, :raid, :subscription]
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
      allow_nil? false
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
end
