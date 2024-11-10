defmodule Streampai.Accounts.UserPremiumGrant do
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
  end

  actions do
    defaults [:read, create: :*]

    create :grant_premium do
      accept [:user_id, :lock_in_amount, :type, :granted_until]
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
      allow_nil? true
    end

    attribute :granted_until, :date do
      allow_nil? true
    end

    attribute :revoked_at, :datetime do
      allow_nil? true
    end
  end

  relationships do
    belongs_to :user, Streampai.Accounts.User do
      allow_nil? false
      attribute_writable? true
    end
  end
end
