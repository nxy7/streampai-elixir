defmodule Streampai.Accounts.UserPreferences do
  @moduledoc false
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Accounts,
    authorizers: [Ash.Policy.Authorizer],
    extensions: [AshAdmin.Resource],
    data_layer: AshPostgres.DataLayer

  postgres do
    table "user_preferences"
    repo Streampai.Repo
  end

  code_interface do
    define :get_by_user_id
    define :create
  end

  actions do
    defaults [:read, :destroy]

    create :create do
      accept [
        :user_id,
        :email_notifications,
        :min_donation_amount,
        :max_donation_amount,
        :donation_currency
      ]

      upsert? true
      upsert_identity :primary_key
    end

    read :get_by_user_id do
      get? true
      argument :user_id, :uuid, allow_nil?: false

      filter expr(user_id == ^arg(:user_id))

      prepare Streampai.Accounts.UserPreferences.Preparations.GetOrCreateDefault
    end
  end

  policies do
    # Users can only manage their own preferences
    policy action_type(:read) do
      authorize_if expr(user_id == ^actor(:id))
      authorize_if expr(^actor(:role) == :admin)
    end

    policy action_type(:create) do
      authorize_if expr(^actor(:role) == :admin)
      authorize_if actor_present()
    end

    policy action_type(:destroy) do
      authorize_if expr(user_id == ^actor(:id))
      authorize_if expr(^actor(:role) == :admin)
    end
  end

  validations do
    validate present(:user_id)
    validate present(:donation_currency)

    validate Streampai.Accounts.UserPreferences.Validations.DonationAmountRange
  end

  attributes do
    attribute :user_id, :uuid, primary_key?: true, allow_nil?: false, public?: true
    attribute :email_notifications, :boolean, allow_nil?: false, default: true, public?: true
    attribute :min_donation_amount, :integer, allow_nil?: true, public?: true
    attribute :max_donation_amount, :integer, allow_nil?: true, public?: true
    attribute :donation_currency, :string, allow_nil?: false, default: "USD", public?: true

    timestamps()
  end

  relationships do
    belongs_to :user, Streampai.Accounts.User do
      source_attribute :user_id
      destination_attribute :id
      allow_nil? false
      public? true
    end
  end

  identities do
    identity :primary_key, [:user_id]
  end
end
