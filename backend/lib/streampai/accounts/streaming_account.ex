defmodule Streampai.Accounts.StreamingAccount do
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Accounts,
    authorizers: [Ash.Policy.Authorizer],
    data_layer: AshPostgres.DataLayer

  require Ash.Query

  postgres do
    table "streaming_account"
    repo Streampai.Repo
  end

  code_interface do
    define :create
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
    end

    read :for_user do
      argument :user_id, :uuid, allow_nil?: false
      filter expr(user_id == ^arg(:user_id))
    end

    read :expired_tokens do
      filter expr(access_token_expires_at < now())
    end

    update :refresh_token do
      accept [:access_token, :refresh_token, :access_token_expires_at]
      require_atomic? false

      change fn changeset, _context ->
        # This would be called by a background job or API call
        # For now, just update the timestamps
        Ash.Changeset.change_attribute(changeset, :updated_at, DateTime.utc_now())
      end
    end
  end

  policies do
    # Allow all read operations for users viewing their own accounts or admins
    policy action_type(:read) do
      authorize_if expr(user_id == ^actor(:id))
      authorize_if expr(^actor(:email) == ^Streampai.Constants.admin_email())
    end

    # Allow all destroy operations for users deleting their own accounts or admins
    policy action_type(:destroy) do
      authorize_if expr(user_id == ^actor(:id))
      authorize_if expr(^actor(:email) == ^Streampai.Constants.admin_email())
    end

    # Allow all update operations for users updating their own accounts or admins
    policy action_type(:update) do
      authorize_if expr(user_id == ^actor(:id))
      authorize_if expr(^actor(:email) == ^Streampai.Constants.admin_email())
    end

    # Policy for create operations - this is where we enforce tier limits
    policy action_type(:create) do
      # Admins can always create streaming accounts
      authorize_if expr(^actor(:email) == ^Streampai.Constants.admin_email())

      # For regular users, check tier limits
      authorize_if Streampai.Accounts.StreamingAccount.Checks.TierLimitCheck
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

    timestamps()
  end

  relationships do
    belongs_to :user, Streampai.Accounts.User do
      source_attribute :user_id
      destination_attribute :id
    end
  end

  identities do
    identity :unique_user_platform, [:user_id, :platform]
  end
end
