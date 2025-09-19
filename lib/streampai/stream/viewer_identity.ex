defmodule Streampai.Stream.ViewerIdentity do
  @moduledoc """
  A ViewerIdentity represents a global person across all streaming platforms.
  This is the core entity that links "johndoe123" on Twitch, "john_doe" on YouTube,
  and other platform identities as the same physical person.

  Key features:
  - Global identity across all platforms and streamers
  - Multiple platform-specific accounts per identity
  - Can be linked to different streamers' local Viewer records via ViewerLink
  - Maintains confidence scores and linking metadata
  - Supports both automatic and manual linking
  """
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Stream,
    data_layer: AshPostgres.DataLayer

  alias Streampai.Stream.Platform

  postgres do
    table "viewer_identities"
    repo Streampai.Repo

    custom_indexes do
      index [:global_viewer_id], name: "idx_viewer_identities_global_viewer_id"

      index [:platform, :platform_user_id],
        name: "idx_viewer_identities_platform_user",
        unique: true

      index [:global_viewer_id, :platform],
        name: "idx_viewer_identities_global_viewer_platform_unique",
        unique: true

      index [:display_name], name: "idx_viewer_identities_display_name"
      index [:confidence_score], name: "idx_viewer_identities_confidence"
      index [:linked_at], name: "idx_viewer_identities_linked_at"
      index [:last_seen_at], name: "idx_viewer_identities_last_seen_at"
    end
  end

  code_interface do
    define :create
    define :read
    define :update
    define :destroy
    define :for_global_viewer
    define :for_platform
    define :find_by_platform_id
  end

  actions do
    defaults [:read, :destroy]

    create :create do
      primary? true

      accept [
        :platform,
        :platform_user_id,
        :username,
        :global_viewer_id,
        :display_name,
        :confidence_score,
        :linking_method,
        :linking_batch_id,
        :metadata,
        :global_notes
      ]

      validate present([:platform, :platform_user_id, :global_viewer_id])
    end

    update :update do
      primary? true
      accept [:username, :confidence_score, :metadata, :last_seen_username, :display_name, :global_notes, :last_seen_at]

      change set_attribute(:updated_at, &DateTime.utc_now/0)
    end

    update :update_confidence do
      accept [:confidence_score, :linking_method, :linking_batch_id]

      change set_attribute(:updated_at, &DateTime.utc_now/0)
    end

    read :for_global_viewer do
      argument :global_viewer_id, :uuid, allow_nil?: false

      filter expr(global_viewer_id == ^arg(:global_viewer_id))
      prepare build(sort: [platform: :asc])
    end

    read :for_platform do
      argument :platform, Platform, allow_nil?: false

      filter expr(platform == ^arg(:platform))
      prepare build(sort: [linked_at: :desc])
    end

    read :find_by_platform_id do
      argument :platform, Platform, allow_nil?: false
      argument :platform_user_id, :string, allow_nil?: false

      filter expr(platform == ^arg(:platform) and platform_user_id == ^arg(:platform_user_id))
    end
  end

  validations do
    validate match(:username, ~r/^[a-zA-Z0-9_\-]+$/) do
      message "Username can only contain letters, numbers, underscores, and hyphens"
    end

    validate compare(:confidence_score, greater_than_or_equal_to: Decimal.new("0.0")) do
      message "Confidence score must be between 0.0 and 1.0"
    end

    validate compare(:confidence_score, less_than_or_equal_to: Decimal.new("1.0")) do
      message "Confidence score must be between 0.0 and 1.0"
    end
  end

  attributes do
    uuid_primary_key :id

    attribute :global_viewer_id, :uuid do
      description "Global identifier linking platform identities to the same person"
      allow_nil? false
      default &Ash.UUID.generate/0
    end

    attribute :platform, Platform do
      description "The streaming platform this identity belongs to"
      allow_nil? false
    end

    attribute :platform_user_id, :string do
      description "The platform-specific user ID (e.g., Twitch user ID, YouTube channel ID)"
      allow_nil? false
      constraints max_length: 255
    end

    attribute :username, :string do
      description "The current username on this platform"
      allow_nil? false
      constraints max_length: 100
    end

    attribute :last_seen_username, :string do
      description "The last seen username (for tracking username changes)"
      constraints max_length: 100
    end

    attribute :display_name, :string do
      description "The preferred display name for this global viewer identity"
      constraints max_length: 100
    end

    attribute :global_notes, :string do
      description "Global notes about this person (not streamer-specific)"
      constraints max_length: 1000
    end

    attribute :first_seen_at, :utc_datetime_usec do
      description "When this global identity was first created"
      allow_nil? false
      default &DateTime.utc_now/0
    end

    attribute :last_seen_at, :utc_datetime_usec do
      description "When this identity was last seen across any platform"
      allow_nil? false
      default &DateTime.utc_now/0
    end

    attribute :confidence_score, :decimal do
      description "Confidence level of this identity linkage (0.0 to 1.0)"
      allow_nil? false
      default Decimal.new("1.0")

      constraints min: Decimal.new("0.0"),
                  max: Decimal.new("1.0")
    end

    attribute :linking_method, :atom do
      description "How this identity was linked to the global viewer"
      allow_nil? false
      default :automatic

      constraints one_of: [
                    :automatic,
                    :manual,
                    :username_similarity,
                    :cross_platform_activity,
                    :admin_override
                  ]
    end

    attribute :linking_batch_id, :string do
      description "Batch ID for grouping linking operations (for idempotency/reevaluation)"
      constraints max_length: 100
    end

    attribute :metadata, :map do
      description "Additional metadata about the linking decision (algorithms used, similarity scores, etc.)"
      default %{}
    end

    attribute :linked_at, :utc_datetime_usec do
      description "When this identity was linked to the global viewer"
      allow_nil? false
      default &DateTime.utc_now/0
    end

    create_timestamp :inserted_at
    update_timestamp :updated_at
  end

  relationships do
    has_many :viewer_links, Streampai.Stream.ViewerLink do
      description "Links to streamer-specific viewer records"
    end

    has_many :chat_messages, Streampai.Stream.ChatMessage do
      description "Chat messages from this global identity"
    end

    has_many :stream_events, Streampai.Stream.StreamEvent do
      description "Stream events from this global identity"
    end
  end

  identities do
    identity :platform_user_unique, [:platform, :platform_user_id] do
      description "Each platform user ID can only belong to one global viewer identity"
    end

    identity :global_viewer_platform_unique, [:global_viewer_id, :platform] do
      description "Each global viewer can only have one identity per platform"
    end
  end
end
