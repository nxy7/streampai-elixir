defmodule Streampai.Stream.StreamViewer do
  @moduledoc """
  StreamViewer represents the relationship between a global Viewer and a specific streamer.
  This allows each streamer to have their own context about a viewer (notes, display name,
  first/last seen times) without sharing sensitive information across streamers.

  Uses a composite primary key of (viewer_id, user_id) to ensure uniqueness.
  """
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Stream,
    data_layer: AshPostgres.DataLayer

  require Ash.Query

  postgres do
    table "stream_viewers"
    repo Streampai.Repo

    custom_indexes do
      index [:user_id, :display_name], name: "idx_stream_viewers_user_display_name"
      index [:user_id, :last_seen_at], name: "idx_stream_viewers_user_last_seen"
      index [:display_name], name: "idx_stream_viewers_display_name_gin", using: "gin"
    end
  end

  code_interface do
    define :create
    define :read
    define :update
    define :destroy
    define :for_user
    define :by_display_name
    define :touch_last_seen
  end

  actions do
    defaults [:read, :destroy]

    create :create do
      primary? true
      accept [:viewer_id, :user_id, :display_name, :notes, :ai_summary]

      validate present([:viewer_id, :user_id, :display_name])
    end

    update :update do
      primary? true
      accept [:display_name, :notes, :ai_summary, :last_seen_at]
    end

    update :touch_last_seen do
      accept []
      require_atomic? false

      change set_attribute(:last_seen_at, &DateTime.utc_now/0)
    end

    read :for_user do
      argument :user_id, :uuid, allow_nil?: false

      filter expr(user_id == ^arg(:user_id))
      prepare build(sort: [last_seen_at: :desc])
    end

    read :by_display_name do
      argument :user_id, :uuid, allow_nil?: false
      argument :display_name, :string, allow_nil?: false
      argument :similarity_threshold, :float, default: 0.75, allow_nil?: true

      filter expr(user_id == ^arg(:user_id))

      prepare fn query, _context ->
        %{arguments: %{display_name: search_name, similarity_threshold: threshold}} = query

        Ash.Query.filter(
          query,
          expr(fragment("similarity(?, ?) > ?", display_name, ^search_name, ^threshold))
        )
      end
    end
  end

  validations do
    validate match(:display_name, ~r/^[a-zA-Z0-9_\-\s]+$/) do
      message "Display name can only contain letters, numbers, underscores, hyphens, and spaces"
    end
  end

  attributes do
    attribute :viewer_id, :uuid do
      description "Reference to the global viewer"
      allow_nil? false
      primary_key? true
    end

    attribute :user_id, :uuid do
      description "Reference to the streamer (user)"
      allow_nil? false
      primary_key? true
    end

    attribute :display_name, :string do
      description "The preferred name to display for this viewer in this streamer's context"
      allow_nil? false
      constraints max_length: 100
    end

    attribute :notes, :string do
      description "Optional notes about this viewer (e.g., VIP status, special recognition)"
      constraints max_length: 1000
    end

    attribute :ai_summary, :string do
      description "AI-generated summary of viewer behavior and characteristics"
      constraints max_length: 2000
    end

    attribute :first_seen_at, :utc_datetime_usec do
      description "When this viewer was first seen by this streamer"
      allow_nil? false
      default &DateTime.utc_now/0
    end

    attribute :last_seen_at, :utc_datetime_usec do
      description "When this viewer was last seen by this streamer"
      allow_nil? false
      default &DateTime.utc_now/0
    end

    timestamps()
  end

  relationships do
    belongs_to :viewer, Streampai.Stream.Viewer do
      description "The global viewer record"
      source_attribute :viewer_id
      destination_attribute :id
      allow_nil? false
    end

    belongs_to :user, Streampai.Accounts.User do
      description "The streamer this viewer relationship belongs to"
      source_attribute :user_id
      destination_attribute :id
      allow_nil? false
    end
  end

  identities do
    identity :primary_key, [:viewer_id, :user_id]
  end
end
