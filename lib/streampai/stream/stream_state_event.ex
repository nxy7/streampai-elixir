defmodule Streampai.Stream.StreamStateEvent do
  @moduledoc """
  Tracks state transitions for livestreams, used for crash recovery
  via the probe-and-reconcile pattern.

  Events are persisted on every state transition for audit and state reconstruction.
  On node restart, we read the last known state, probe external systems (Cloudflare,
  platforms) to get current reality, and reconcile - reality wins over history.
  """
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Stream,
    data_layer: AshPostgres.DataLayer

  postgres do
    table "stream_state_events"
    repo Streampai.Repo

    custom_indexes do
      index [:livestream_id, :inserted_at],
        name: "idx_stream_state_events_livestream_chrono"

      index [:user_id, :inserted_at],
        name: "idx_stream_state_events_user_chrono"
    end
  end

  code_interface do
    define :record
    define :get_last_for_livestream, args: [:livestream_id]
    define :get_for_livestream, args: [:livestream_id]
  end

  actions do
    defaults [:read]

    create :record do
      accept [
        :livestream_id,
        :user_id,
        :event_type,
        :from_state,
        :to_state,
        :event_data,
        :timestamp
      ]
    end

    read :get_last_for_livestream do
      description "Get the most recent state event for a livestream"

      argument :livestream_id, :uuid, allow_nil?: false

      filter expr(livestream_id == ^arg(:livestream_id))
      prepare build(sort: [inserted_at: :desc], limit: 1)
    end

    read :get_for_livestream do
      description "Get all state events for a livestream in chronological order"

      argument :livestream_id, :uuid, allow_nil?: false

      filter expr(livestream_id == ^arg(:livestream_id))
      prepare build(sort: [inserted_at: :asc])
    end
  end

  attributes do
    uuid_primary_key :id

    attribute :livestream_id, :uuid do
      allow_nil? false
      public? true
    end

    attribute :user_id, :uuid do
      allow_nil? false
      public? true
    end

    attribute :event_type, :atom do
      allow_nil? false
      public? true

      description "Type of state event (e.g., :stream_started, :entered_live, :platform_connected)"
    end

    attribute :from_state, :atom do
      allow_nil? true
      public? true
      description "Previous state before transition (nil for initial events)"
    end

    attribute :to_state, :atom do
      allow_nil? false
      public? true
      description "New state after transition"
    end

    attribute :event_data, :map do
      allow_nil? false
      default %{}
      public? true
      description "Additional event-specific data (platform statuses, error info, etc.)"
    end

    attribute :timestamp, :utc_datetime_usec do
      allow_nil? false
      public? true
      description "When this state transition occurred"
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
