defmodule Streampai.Accounts.StreamingAccount do
  @moduledoc false
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Accounts,
    authorizers: [Ash.Policy.Authorizer],
    extensions: [AshOban, AshTypescript.Resource],
    data_layer: AshPostgres.DataLayer

  require Ash.Query

  postgres do
    table "streaming_account"
    repo Streampai.Repo

    # Add indexes for common query patterns
    custom_indexes do
      index [:access_token_expires_at],
        name: "idx_streaming_account_token_expiry",
        where: "access_token_expires_at < NOW()"

      index [:user_id, :platform],
        name: "idx_streaming_account_user_platform",
        unique: true
    end
  end

  oban do
    triggers do
      trigger :refresh_stats_periodically do
        action :refresh_stats

        # Run every 30 minutes, refreshing accounts not updated in 6+ hours
        scheduler_cron "*/30 * * * *"
        max_attempts 3

        # Filter: only accounts that haven't been refreshed in 6+ hours (or never)
        where expr(
                is_nil(stats_last_refreshed_at) or
                  stats_last_refreshed_at < ago(6, :hour)
              )

        queue :maintenance
        worker_module_name StreamingAccount.AshOban.Worker.RefreshStats
        scheduler_module_name StreamingAccount.AshOban.Scheduler.RefreshStats
      end
    end
  end

  typescript do
    type_name("StreamingAccount")
  end

  code_interface do
    define :create
    define :destroy
    define :read
    define :for_user, action: :for_user, args: [:user_id]
    define :refresh_stats
    define :needs_stats_refresh, action: :needs_stats_refresh, args: [:hours_threshold]
  end

  actions do
    defaults [:read, :destroy, update: :*]

    create :create do
      accept [
        :user_id,
        :platform,
        :access_token,
        :refresh_token,
        :access_token_expires_at,
        :extra_data
      ]

      upsert? true
      upsert_identity :unique_user_platform

      validate present([:user_id])
      validate present([:platform])
      validate present([:access_token])
      validate present([:refresh_token])
      validate present([:access_token_expires_at])
    end

    read :for_user do
      argument :user_id, :uuid, allow_nil?: false
      filter expr(user_id == ^arg(:user_id))

      # Preload user for common use cases
      prepare build(load: [:user])
    end

    read :expired_tokens do
      filter expr(access_token_expires_at < now())

      # Order by expiry date for processing
      prepare build(sort: [access_token_expires_at: :asc])
    end

    read :expiring_soon do
      argument :minutes_ahead, :integer, default: 60

      filter expr(access_token_expires_at < datetime_add(now(), ^arg(:minutes_ahead), "minute"))
      prepare build(sort: [access_token_expires_at: :asc])
    end

    update :refresh_token do
      accept [:access_token, :refresh_token, :access_token_expires_at]
      require_atomic? false

      validate present([:access_token])
    end

    update :refresh_stats do
      description "Refresh platform statistics (sponsors, views, etc.)"
      require_atomic? false

      change Streampai.Accounts.StreamingAccount.Changes.RefreshPlatformStats
    end

    read :needs_stats_refresh do
      description "Find accounts that haven't been refreshed in the given hours threshold"
      argument :hours_threshold, :integer, default: 6

      prepare Streampai.Accounts.StreamingAccount.Preparations.NeedsStatsRefresh
    end
  end

  # Custom validation functions

  def validate_token_not_expired(changeset) do
    case Ash.Changeset.get_attribute(changeset, :access_token_expires_at) do
      # Will be caught by presence validation
      nil ->
        changeset

      expires_at ->
        if DateTime.after?(expires_at, DateTime.utc_now()) do
          changeset
        else
          Ash.Changeset.add_error(
            changeset,
            :access_token_expires_at,
            "Access token expiry must be in the future"
          )
        end
    end
  end

  def validate_extra_data_structure(changeset) do
    case Ash.Changeset.get_attribute(changeset, :extra_data) do
      nil -> changeset
      data when is_map(data) -> changeset
      _ -> Ash.Changeset.add_error(changeset, :extra_data, "Extra data must be a map")
    end
  end

  policies do
    bypass Streampai.SystemActor.Check do
      authorize_if always()
    end

    # Allow AshOban to bypass authorization for background jobs
    bypass AshOban.Checks.AshObanInteraction do
      authorize_if always()
    end

    # Allow all read operations for users viewing their own accounts or admins
    policy action_type(:read) do
      authorize_if expr(user_id == ^actor(:id))
    end

    # Allow all destroy operations for users deleting their own accounts or admins
    policy action_type(:destroy) do
      authorize_if expr(user_id == ^actor(:id))
      authorize_if expr(^actor(:role) == :admin)
    end

    # Allow all update operations for users updating their own accounts or admins
    policy action_type(:update) do
      authorize_if expr(user_id == ^actor(:id))
      authorize_if expr(^actor(:role) == :admin)
    end

    policy action_type(:create) do
      authorize_if actor_present()
    end
  end

  attributes do
    attribute :user_id, :uuid do
      primary_key? true
      allow_nil? false
    end

    attribute :platform, Streampai.Stream.Platform do
      primary_key? true
      allow_nil? false
    end

    attribute :refresh_token, :string do
      allow_nil? false
      sensitive? true
    end

    attribute :access_token, :string do
      allow_nil? false
      sensitive? true
    end

    attribute :access_token_expires_at, :utc_datetime do
      allow_nil? false
    end

    attribute :extra_data, :map do
      allow_nil? false
    end

    # Platform statistics (refreshed periodically)
    attribute :sponsor_count, :integer do
      description "Number of current sponsors/subscribers on the platform"
      allow_nil? true
      default nil
    end

    attribute :views_last_30d, :integer do
      description "Total views in the last 30 days"
      allow_nil? true
      default nil
    end

    attribute :follower_count, :integer do
      description "Total follower count on the platform"
      allow_nil? true
      default nil
    end

    attribute :unique_viewers_last_30d, :integer do
      description "Unique viewers in the last 30 days"
      allow_nil? true
      default nil
    end

    attribute :stats_last_refreshed_at, :utc_datetime do
      description "When the stats were last refreshed from the platform"
      allow_nil? true
      default nil
    end

    timestamps()
  end

  relationships do
    belongs_to :user, Streampai.Accounts.User do
      # source_attribute :user_id
      destination_attribute :id
    end
  end

  identities do
    identity :unique_user_platform, [:user_id, :platform]
  end
end
