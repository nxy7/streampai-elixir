defmodule Streampai.Accounts.UserPremiumGrant do
  @moduledoc false
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Accounts,
    data_layer: AshPostgres.DataLayer

  postgres do
    table "user_premium_grants"
    repo Streampai.Repo
  end

  code_interface do
    define :list, action: :read
    define :get, action: :read, get?: true
    define :create

    define :grant_premium,
      action: :grant_premium,
      args: [:user_id, :lock_in_amount, :type, :granted_until]

    define :create_grant,
      action: :create_grant,
      args: [:user_id, :granted_by_user_id, :expires_at, :granted_at, :grant_reason]
  end

  actions do
    defaults [:read, :destroy, create: :*]

    create :grant_premium do
      accept [:user_id, :lock_in_amount, :type, :granted_until]
    end

    create :create_stripe_grant do
      accept [
        :user_id,
        :granted_by_user_id,
        :stripe_subscription_id,
        :expires_at,
        :granted_at,
        :grant_reason,
        :metadata,
        :type
      ]

      upsert? true
      upsert_identity :unique_stripe_subscription

      upsert_fields [
        :expires_at,
        :granted_at,
        :grant_reason,
        :metadata
      ]
    end

    create :create_grant do
      accept [
        :user_id,
        :granted_by_user_id,
        :expires_at,
        :granted_at,
        :grant_reason,
        :metadata,
        :type
      ]
    end

    update :revoke do
      accept [:revoked_at]
    end
  end

  attributes do
    uuid_primary_key :id

    attribute :lock_in_amount, :integer do
      allow_nil? false
      default 0
    end

    attribute :initiated_at, :datetime do
      allow_nil? false
      default &DateTime.utc_now/0
    end

    attribute :type, :atom do
      allow_nil? false
      constraints one_of: [:purchase, :grant]
      default :purchase
    end

    attribute :granted_at, :datetime do
      allow_nil? false
      default &DateTime.utc_now/0
    end

    attribute :granted_until, :date do
      allow_nil? true
    end

    attribute :revoked_at, :datetime do
      allow_nil? true
    end

    # Stripe-specific fields
    attribute :stripe_subscription_id, :string do
      allow_nil? true
    end

    attribute :granted_by_user_id, :string do
      allow_nil? false
    end

    attribute :expires_at, :datetime do
      allow_nil? false
    end

    attribute :grant_reason, :string do
      allow_nil? false
    end

    attribute :metadata, :map do
      allow_nil? true
      default %{}
    end

    timestamps()
  end

  relationships do
    belongs_to :user, Streampai.Accounts.User do
      allow_nil? false
      attribute_writable? true
    end
  end

  identities do
    identity :unique_stripe_subscription, [:stripe_subscription_id]
  end
end
