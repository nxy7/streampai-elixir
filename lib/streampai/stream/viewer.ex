defmodule Streampai.Stream.Viewer do
  @moduledoc """
  A Viewer represents a physical person who interacts with a streamer's content
  across multiple platforms. This allows linking chat messages, donations, follows,
  and other events from the same person across different streaming platforms.

  Each viewer is scoped to a specific streamer (user_id) and can have multiple
  platform identities linked to them via ViewerIdentity records.
  """
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Stream,
    data_layer: AshPostgres.DataLayer

  postgres do
    table "viewers"
    repo Streampai.Repo

    custom_indexes do
      index [:user_id], name: "idx_viewers_user_id"
      index [:user_id, :display_name], name: "idx_viewers_user_display_name"
      index [:user_id, :last_seen_at], name: "idx_viewers_user_last_seen"
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
      accept [:display_name, :user_id, :notes]

      validate present([:display_name, :user_id])
    end

    update :update do
      primary? true
      accept [:display_name, :notes, :last_seen_at]
    end

    update :touch_last_seen do
      accept []

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

      filter expr(user_id == ^arg(:user_id) and display_name == ^arg(:display_name))
    end
  end

  validations do
    validate match(:display_name, ~r/^[a-zA-Z0-9_\-\s]+$/) do
      message "Display name can only contain letters, numbers, underscores, hyphens, and spaces"
    end
  end

  attributes do
    uuid_primary_key :id

    attribute :display_name, :string do
      description "The preferred name to display for this viewer"
      allow_nil? false
      constraints max_length: 100
    end

    attribute :notes, :string do
      description "Optional notes about this viewer (e.g., VIP status, special recognition)"
      constraints max_length: 1000
    end

    attribute :first_seen_at, :utc_datetime_usec do
      description "When this viewer was first seen/created"
      allow_nil? false
      default &DateTime.utc_now/0
    end

    attribute :last_seen_at, :utc_datetime_usec do
      description "When this viewer was last seen (updated when linking new activities)"
      allow_nil? false
      default &DateTime.utc_now/0
    end

    create_timestamp :inserted_at
    update_timestamp :updated_at
  end

  relationships do
    belongs_to :user, Streampai.Accounts.User do
      description "The streamer this viewer belongs to"
      allow_nil? false
      attribute_writable? true
    end

    has_many :viewer_identities, Streampai.Stream.ViewerIdentity do
      description "Platform-specific identities linked to this viewer"
    end

    has_many :chat_messages, Streampai.Stream.ChatMessage do
      description "Chat messages linked to this viewer"
    end

    has_many :stream_events, Streampai.Stream.StreamEvent do
      description "Stream events (donations, follows, etc.) linked to this viewer"
    end
  end

  identities do
    identity :user_display_name_unique, [:user_id, :display_name] do
      description "Each display name must be unique per streamer"
    end
  end
end
