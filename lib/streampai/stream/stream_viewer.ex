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
    define :read
    define :update
    define :destroy
    define :for_user
    define :by_display_name
    define :touch_last_seen
    define :upsert
  end

  actions do
    defaults [:read, :destroy]

    create :upsert do
      primary? true

      accept [
        :viewer_id,
        :user_id,
        :platform,
        :display_name,
        :avatar_url,
        :channel_url,
        :is_verified,
        :is_owner,
        :is_moderator,
        :is_patreon,
        :notes,
        :ai_summary
      ]

      upsert? true
      upsert_identity :primary_key

      upsert_fields [
        :platform,
        :display_name,
        :avatar_url,
        :channel_url,
        :is_verified,
        :is_owner,
        :is_moderator,
        :is_patreon,
        :last_seen_at
      ]

      validate present([:viewer_id, :user_id, :platform, :display_name])

      change set_attribute(:last_seen_at, &DateTime.utc_now/0)
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
      prepare build(sort: [last_seen_at: :desc, viewer_id: :desc])

      pagination do
        required? false
        offset? false
        keyset? true
        countable false
        default_limit 20
        max_page_size 100
      end
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

  attributes do
    attribute :viewer_id, :string do
      description "Reference to the global viewer"
      allow_nil? false
      primary_key? true
    end

    attribute :user_id, :uuid do
      description "Reference to the streamer (user)"
      allow_nil? false
      primary_key? true
    end

    attribute :platform, :atom do
      description "Platform where this viewer was seen (twitch, youtube, facebook, kick)"
      allow_nil? false
      constraints one_of: [:twitch, :youtube, :facebook, :kick]
    end

    attribute :display_name, :string do
      description "The preferred name to display for this viewer in this streamer's context"
      allow_nil? false
      constraints max_length: 100
    end

    attribute :avatar_url, :string do
      description "URL to the viewer's profile/avatar image"
      constraints max_length: 500
    end

    attribute :channel_url, :string do
      description "Platform channel/profile URL for this viewer"
      constraints max_length: 500
    end

    attribute :is_verified, :boolean do
      description "Whether the viewer has a verified badge on the platform"
      default false
    end

    attribute :is_owner, :boolean do
      description "Whether the viewer is the channel owner"
      default false
    end

    attribute :is_moderator, :boolean do
      description "Whether the viewer is a moderator"
      default false
    end

    attribute :is_patreon, :boolean do
      description "Whether the viewer is a patron/subscriber"
      default false
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
      writable? false
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
    # belongs_to :viewer, Streampai.Stream.Viewer do
    #   description "The global viewer record"
    #   source_attribute :viewer_id
    #   destination_attribute :id
    #   allow_nil? false
    # end

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
