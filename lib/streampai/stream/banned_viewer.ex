defmodule Streampai.Stream.BannedViewer do
  @moduledoc """
  Represents a viewer who has been banned or timed out from a streamer's channel.

  This resource tracks ban history across all platforms and streams, allowing:
  - View all currently banned viewers
  - See ban history across different streams
  - Unban viewers from a UI even if they were banned on a previous stream
  - Track ban reasons and durations
  - Platform-specific ban identification (platform_ban_id for some platforms)

  ## Ban Types
  - **Permanent Ban**: No expires_at timestamp
  - **Timeout**: Has expires_at timestamp indicating when ban expires

  ## Platform Identifiers
  - `viewer_username`: Username on the platform (may change)
  - `viewer_platform_id`: Platform-specific user ID (stable identifier)
  - `platform_ban_id`: Some platforms (like YouTube) return a ban ID for unbanning
  """
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Stream,
    data_layer: AshPostgres.DataLayer,
    authorizers: [Ash.Policy.Authorizer],
    extensions: [AshTypescript.Resource]

  alias Streampai.Accounts.User
  alias Streampai.Stream.BannedViewer.Changes.ExecutePlatformBan
  alias Streampai.Stream.BannedViewer.Changes.ExecutePlatformUnban
  alias Streampai.Stream.BannedViewer.Changes.SetBanAttributes
  alias Streampai.Stream.BannedViewer.Changes.SetUnbanAttributes
  alias Streampai.Stream.StreamAction.Checks.IsStreamOwnerOrModerator

  postgres do
    table "banned_viewers"
    repo Streampai.Repo

    custom_indexes do
      index [:user_id], name: "idx_banned_viewers_user_id"

      index [:user_id, :platform, :viewer_platform_id],
        name: "idx_banned_viewers_user_platform_viewer"

      index [:user_id, :is_active], name: "idx_banned_viewers_user_active"
      index [:expires_at], name: "idx_banned_viewers_expires_at"
    end
  end

  typescript do
    type_name("BannedViewer")
  end

  code_interface do
    define :create
    define :read
    define :update
    define :destroy
    define :ban_viewer
    define :unban_viewer
    define :get_active_bans, args: [:user_id]
    define :get_all_bans, args: [:user_id]
    define :get_platform_bans, args: [:user_id, :platform]
  end

  actions do
    defaults [:read, :destroy, update: :*]

    create :create do
      primary? true
      accept [:*]
    end

    create :ban_viewer do
      description "Ban a viewer permanently or for a specified duration"

      accept [
        :user_id,
        :platform,
        :viewer_username,
        :viewer_platform_id,
        :reason,
        :duration_seconds,
        :platform_ban_id,
        :livestream_id,
        :banned_by_user_id
      ]

      change SetBanAttributes
      change ExecutePlatformBan
    end

    update :unban_viewer do
      description "Mark a ban as inactive (unbanned)"
      require_atomic? false

      change SetUnbanAttributes
      change ExecutePlatformUnban
    end

    read :get_active_bans do
      description "Get all currently active bans for a user"

      argument :user_id, :uuid, allow_nil?: false

      filter expr(
               user_id == ^arg(:user_id) and is_active == true and
                 (is_nil(expires_at) or expires_at > ^DateTime.utc_now())
             )

      prepare build(sort: [inserted_at: :desc])
    end

    read :get_all_bans do
      description "Get all bans (active and inactive) for a user"

      argument :user_id, :uuid, allow_nil?: false

      filter expr(user_id == ^arg(:user_id))
      prepare build(sort: [inserted_at: :desc])

      pagination do
        required? false
        offset? false
        keyset? true
        countable true
        default_limit 50
        max_page_size 200
      end
    end

    read :get_platform_bans do
      description "Get all bans for a specific platform"

      argument :user_id, :uuid, allow_nil?: false
      argument :platform, :atom, allow_nil?: false

      filter expr(user_id == ^arg(:user_id) and platform == ^arg(:platform) and is_active == true)
      prepare build(sort: [inserted_at: :desc])
    end
  end

  policies do
    bypass actor_attribute_equals(:is_admin, true) do
      authorize_if always()
      description "Admins can do anything"
    end

    policy action_type(:read) do
      authorize_if IsStreamOwnerOrModerator
    end

    policy action_type(:create) do
      authorize_if IsStreamOwnerOrModerator
    end

    policy action_type(:update) do
      authorize_if IsStreamOwnerOrModerator
    end

    policy action_type(:destroy) do
      authorize_if IsStreamOwnerOrModerator
    end
  end

  attributes do
    uuid_primary_key :id, public?: true

    attribute :platform, Streampai.Stream.Platform do
      allow_nil? false
      public? true
      description "Platform where the ban occurred"
    end

    attribute :viewer_username, :string do
      allow_nil? false
      public? true
      constraints max_length: 100
      description "Username of the banned viewer (may change over time)"
    end

    attribute :viewer_platform_id, :string do
      allow_nil? false
      public? true
      constraints max_length: 100
      description "Platform-specific user ID (stable identifier)"
    end

    attribute :reason, :string do
      allow_nil? true
      public? true
      constraints max_length: 500
      description "Reason for the ban"
    end

    attribute :duration_seconds, :integer do
      allow_nil? true
      public? true
      description "Duration of timeout in seconds (null for permanent ban)"
    end

    attribute :expires_at, :utc_datetime_usec do
      allow_nil? true
      public? true
      description "When the timeout expires (null for permanent ban)"
    end

    attribute :is_active, :boolean do
      allow_nil? false
      public? true
      default true
      description "Whether the ban is currently active"
    end

    attribute :platform_ban_id, :string do
      allow_nil? true
      public? true
      constraints max_length: 100
      description "Platform-specific ban ID (used by some platforms like YouTube for unbanning)"
    end

    attribute :unbanned_at, :utc_datetime_usec do
      allow_nil? true
      public? true
      description "When the viewer was unbanned (if manually unbanned)"
    end

    timestamps(public?: true)
  end

  relationships do
    belongs_to :user, User do
      allow_nil? false
      attribute_writable? true
      description "The streamer who banned this viewer"
    end

    belongs_to :banned_by_user, User do
      allow_nil? true
      attribute_writable? true
      description "The user (streamer or moderator) who performed the ban"
    end

    belongs_to :livestream, Streampai.Stream.Livestream do
      allow_nil? true
      attribute_writable? true
      description "The livestream during which the ban occurred (optional)"
    end
  end

  identities do
    identity :user_platform_viewer, [:user_id, :platform, :viewer_platform_id, :inserted_at]
  end
end
