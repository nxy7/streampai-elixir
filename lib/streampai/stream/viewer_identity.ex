defmodule Streampai.Stream.ViewerIdentity do
  @moduledoc """
  A ViewerIdentity represents a platform-specific identity (e.g., Twitch username,
  YouTube channel ID) that belongs to a Viewer. This allows us to track that
  "johndoe123" on Twitch and "john_doe" on YouTube are the same physical person.

  Key features:
  - Tracks platform-specific identifiers and usernames
  - Records confidence level of the linkage
  - Supports both automatic and manual linking
  - Maintains audit trail for linking decisions
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
      index [:viewer_id], name: "idx_viewer_identities_viewer_id"

      index [:platform, :platform_user_id],
        name: "idx_viewer_identities_platform_user",
        unique: true

      index [:viewer_id, :platform], name: "idx_viewer_identities_viewer_platform"
      index [:confidence_score], name: "idx_viewer_identities_confidence"
      index [:linked_at], name: "idx_viewer_identities_linked_at"
    end
  end

  code_interface do
    define :create
    define :read
    define :update
    define :destroy
    define :for_viewer
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
        :viewer_id,
        :confidence_score,
        :linking_method,
        :linking_batch_id,
        :metadata
      ]

      validate present([:platform, :platform_user_id, :viewer_id])
    end

    update :update do
      primary? true
      accept [:username, :confidence_score, :metadata, :last_seen_username]

      change set_attribute(:updated_at, &DateTime.utc_now/0)
    end

    update :update_confidence do
      accept [:confidence_score, :linking_method, :linking_batch_id]

      change set_attribute(:updated_at, &DateTime.utc_now/0)
    end

    read :for_viewer do
      argument :viewer_id, :uuid, allow_nil?: false

      filter expr(viewer_id == ^arg(:viewer_id))
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

    attribute :confidence_score, :decimal do
      description "Confidence level of this identity linkage (0.0 to 1.0)"
      allow_nil? false
      default Decimal.new("1.0")

      constraints min: Decimal.new("0.0"),
                  max: Decimal.new("1.0")
    end

    attribute :linking_method, :atom do
      description "How this identity was linked to the viewer"
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
      description "When this identity was linked to the viewer"
      allow_nil? false
      default &DateTime.utc_now/0
    end

    create_timestamp :inserted_at
    update_timestamp :updated_at
  end

  relationships do
    belongs_to :viewer, Streampai.Stream.Viewer do
      description "The viewer this identity belongs to"
      allow_nil? false
      attribute_writable? true
    end
  end

  identities do
    identity :platform_user_unique, [:platform, :platform_user_id] do
      description "Each platform user ID can only belong to one viewer identity"
    end
  end
end
