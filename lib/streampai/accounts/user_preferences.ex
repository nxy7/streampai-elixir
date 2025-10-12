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
    define :toggle_email_notifications
    define :update_donation_settings, args: [:min_amount, :max_amount, :currency]
    define :update_voice_settings, args: [:default_voice]
  end

  actions do
    defaults [:read, :destroy]

    create :create do
      accept [
        :user_id,
        :email_notifications,
        :min_donation_amount,
        :max_donation_amount,
        :donation_currency,
        :default_voice
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

    update :toggle_email_notifications do
      description "Toggle email notifications on/off for the user"
      require_atomic? false

      change fn changeset, _context ->
        current_value = Ash.Changeset.get_attribute(changeset, :email_notifications)
        Ash.Changeset.change_attribute(changeset, :email_notifications, !current_value)
      end
    end

    update :update_donation_settings do
      description "Update donation min/max amounts and currency"
      require_atomic? false

      argument :min_amount, :integer, allow_nil?: true
      argument :max_amount, :integer, allow_nil?: true
      argument :currency, :string, allow_nil?: false

      change set_attribute(:min_donation_amount, arg(:min_amount))
      change set_attribute(:max_donation_amount, arg(:max_amount))
      change set_attribute(:donation_currency, arg(:currency))
      change Streampai.Accounts.UserPreferences.Changes.ValidateDonationAmounts
    end

    update :update_voice_settings do
      description "Update default TTS voice settings"
      require_atomic? false

      argument :default_voice, :string, allow_nil?: true

      change set_attribute(:default_voice, arg(:default_voice))
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

    policy action_type(:update) do
      authorize_if expr(^actor(:role) == :admin)
      authorize_if expr(user_id == ^actor(:id))
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

    attribute :default_voice, :string do
      allow_nil? true
      public? true

      description "Default TTS voice for donations. Special values: 'random' = random voice per donation, null = use first available voice"
    end

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
