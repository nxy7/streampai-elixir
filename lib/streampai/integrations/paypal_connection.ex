defmodule Streampai.Integrations.PayPalConnection do
  @moduledoc """
  Represents a streamer's connected PayPal account for receiving donations.

  Uses PayPal Commerce Platform Partner Referrals API to onboard merchants
  and Orders API v2 to create donations that go directly to the merchant's account.
  """
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Integrations,
    data_layer: AshPostgres.DataLayer,
    authorizers: [Ash.Policy.Authorizer]

  postgres do
    table "paypal_connections"
    repo Streampai.Repo
  end

  code_interface do
    define :create
    define :read
    define :update
    define :destroy
    define :get_by_user, args: [:user_id]
  end

  actions do
    defaults [:read, :destroy, update: :*]

    create :create do
      primary? true
      accept [:*]
    end

    read :get_by_user do
      argument :user_id, :uuid, allow_nil?: false
      filter expr(user_id == ^arg(:user_id))
    end
  end

  policies do
    bypass actor_attribute_equals(:is_admin, true) do
      authorize_if always()
    end

    policy action_type(:read) do
      authorize_if expr(user_id == ^actor(:id))
    end

    policy action_type([:create, :update, :destroy]) do
      authorize_if expr(user_id == ^actor(:id))
    end
  end

  attributes do
    uuid_primary_key :id

    attribute :merchant_id, :string do
      allow_nil? false
      constraints max_length: 255
      description "PayPal merchant ID (also called payer_id)"
    end

    attribute :merchant_email, :string do
      allow_nil? true
      constraints max_length: 255
      description "PayPal account email"
    end

    attribute :account_status, :atom do
      allow_nil? false
      default :pending
      constraints one_of: [:pending, :active, :suspended, :revoked]
      description "Connection status"
    end

    attribute :access_token, :string do
      allow_nil? true
      sensitive? true
      description "OAuth access token (encrypted)"
    end

    attribute :refresh_token, :string do
      allow_nil? true
      sensitive? true
      description "OAuth refresh token (encrypted)"
    end

    attribute :token_expires_at, :utc_datetime_usec do
      allow_nil? true
      description "When the access token expires"
    end

    attribute :permissions, {:array, :string} do
      allow_nil? false
      default []
      description "Granted permissions (e.g., PAYMENT, REFUND)"
    end

    attribute :onboarding_completed_at, :utc_datetime_usec do
      allow_nil? true
      description "When the merchant completed PayPal onboarding"
    end

    attribute :last_synced_at, :utc_datetime_usec do
      allow_nil? true
      description "Last time we synced with PayPal API"
    end

    timestamps()
  end

  relationships do
    belongs_to :user, Streampai.Accounts.User do
      allow_nil? false
      attribute_writable? true
      description "The streamer who connected this PayPal account"
    end
  end

  identities do
    identity :unique_user_paypal, [:user_id]
    identity :unique_merchant_id, [:merchant_id]
  end
end
