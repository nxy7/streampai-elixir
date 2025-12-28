defmodule Streampai.Integrations.Donation do
  @moduledoc """
  Represents a donation made to a streamer from any platform.

  Donations can come from:
  - Streampai donation page (PayPal) - is_streampai: true
  - Streaming platforms (Twitch, YouTube, etc.) - is_streampai: false

  Tracks the complete lifecycle from creation through completion and potential refunds.
  """
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Integrations,
    data_layer: AshPostgres.DataLayer,
    authorizers: [Ash.Policy.Authorizer]

  postgres do
    table "donations"
    repo Streampai.Repo

    custom_indexes do
      index [:user_id, :inserted_at], name: "idx_donations_user_date"
      index [:provider], name: "idx_donations_provider"
      index [:is_streampai], name: "idx_donations_is_streampai"
      index [:status], name: "idx_donations_status"
      index [:order_id], name: "idx_donations_order_id", where: "order_id IS NOT NULL"
      index [:external_id], name: "idx_donations_external_id", where: "external_id IS NOT NULL"
    end
  end

  code_interface do
    define :create
    define :read
    define :update
    define :destroy
    define :get_by_order_id, args: [:order_id]
    define :get_by_external_id, args: [:external_id]
    define :get_by_user, args: [:user_id]
    define :get_by_provider, args: [:provider]
  end

  actions do
    defaults [:read, :destroy, update: :*]

    create :create do
      primary? true
      accept [:*]
    end

    read :get_by_order_id do
      argument :order_id, :string, allow_nil?: false
      filter expr(order_id == ^arg(:order_id))
    end

    read :get_by_external_id do
      argument :external_id, :string, allow_nil?: false
      filter expr(external_id == ^arg(:external_id))
    end

    read :get_by_user do
      argument :user_id, :uuid, allow_nil?: false
      filter expr(user_id == ^arg(:user_id))
      prepare build(sort: [inserted_at: :desc])
    end

    read :get_by_provider do
      argument :provider, :atom, allow_nil?: false
      filter expr(provider == ^arg(:provider))
      prepare build(sort: [inserted_at: :desc])
    end
  end

  policies do
    bypass Streampai.SystemActor.Check do
      authorize_if always()
    end

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

    attribute :provider, :atom do
      allow_nil? false
      default :paypal

      constraints one_of: [
                    :paypal,
                    :twitch,
                    :youtube,
                    :kick,
                    :facebook
                  ]

      description "Platform/provider where the donation originated"
    end

    attribute :is_streampai, :boolean do
      allow_nil? false
      default false

      description "Whether donation came from Streampai donation page (true) or streaming platform (false)"
    end

    attribute :external_id, :string do
      allow_nil? true
      constraints max_length: 255

      description "External ID from streaming platform (Twitch event ID, YouTube Super Chat ID, etc.)"
    end

    attribute :order_id, :string do
      allow_nil? true
      constraints max_length: 255
      description "PayPal order ID (for PayPal donations)"
    end

    attribute :capture_id, :string do
      allow_nil? true
      constraints max_length: 255
      description "PayPal capture ID (when payment is captured)"
    end

    attribute :amount, :decimal do
      allow_nil? false
      constraints min: Decimal.new("0.01")
      description "Donation amount"
    end

    attribute :currency, :string do
      allow_nil? false
      default "USD"
      constraints max_length: 3
      description "Currency code (ISO 4217)"
    end

    attribute :status, :atom do
      allow_nil? false
      default :created

      constraints one_of: [
                    :created,
                    :approved,
                    :captured,
                    :completed,
                    :refunded,
                    :cancelled,
                    :failed
                  ]

      description "Donation status"
    end

    attribute :donor_name, :string do
      allow_nil? true
      constraints max_length: 255
      description "Name of the person who donated"
    end

    attribute :donor_email, :string do
      allow_nil? true
      constraints max_length: 255
      description "Email of the donor (if provided)"
    end

    attribute :message, :string do
      allow_nil? true
      constraints max_length: 500
      description "Optional message from donor"
    end

    attribute :voice, :string do
      allow_nil? true
      constraints max_length: 50
      description "TTS voice model ID (null means use user's default)"
    end

    attribute :payer_id, :string do
      allow_nil? true
      constraints max_length: 255
      description "PayPal payer ID or platform-specific user ID"
    end

    attribute :approval_url, :string do
      allow_nil? true
      constraints max_length: 1000
      description "URL where donor approves the payment (PayPal)"
    end

    attribute :processing_fee, :decimal do
      allow_nil? true
      description "Platform processing fee (PayPal fee, platform cut, etc.)"
    end

    attribute :net_amount, :decimal do
      allow_nil? true
      description "Amount after fees"
    end

    attribute :refund_id, :string do
      allow_nil? true
      constraints max_length: 255
      description "Refund ID if refunded"
    end

    attribute :refunded_at, :utc_datetime_usec do
      allow_nil? true
      description "When the donation was refunded"
    end

    attribute :webhook_event_id, :string do
      allow_nil? true
      constraints max_length: 255
      description "Webhook event ID for idempotency"
    end

    attribute :metadata, :map do
      allow_nil? false
      default %{}
      description "Additional metadata (user agent, IP, platform-specific data, etc.)"
    end

    attribute :displayed_at, :utc_datetime_usec do
      allow_nil? true
      description "When the donation was displayed on stream"
    end

    timestamps()
  end

  relationships do
    belongs_to :user, Streampai.Accounts.User do
      allow_nil? false
      attribute_writable? true
      description "The streamer who received this donation"
    end

    belongs_to :livestream, Streampai.Stream.Livestream do
      allow_nil? true
      attribute_writable? true
      description "The livestream during which the donation was made"
    end

    belongs_to :paypal_connection, Streampai.Integrations.PayPalConnection do
      allow_nil? true
      attribute_writable? true
      description "The PayPal connection used for this donation (if provider is PayPal)"
    end
  end

  identities do
    identity :unique_order_id, [:order_id], eager_check?: false
    identity :unique_external_id, [:external_id, :provider], eager_check?: false
  end
end
