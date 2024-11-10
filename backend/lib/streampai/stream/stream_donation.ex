defmodule Streampai.Stream.StreamDonation do
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Stream,
    data_layer: AshPostgres.DataLayer

  postgres do
    table "stream_donations"
    repo Streampai.Repo
  end

  actions do
    defaults [:read, :destroy, create: :*, update: :*]

    # read :recent_for_channel do
    # argument :channel_id, :string, allow_nil?: false
    # argument :limit, :integer, default: 50

    # filter expr(channel_id == ^arg(:channel_id))
    # limit arg(:limit)
    # end

    # read :total_for_channel do
    # argument :channel_id, :string, allow_nil?: false

    # filter expr(channel_id == ^arg(:channel_id))
    # calculate :total_amount, :decimal, expr(sum(amount))
    # end
  end

  attributes do
    uuid_primary_key :id

    attribute :amount, :decimal do
      allow_nil? false
      # $99,999,999.99 max
      # constraints precision: 10, scale: 2
    end

    attribute :currency, :string do
      allow_nil? false
      default "USD"
      # ISO currency codes
      constraints max_length: 3
    end

    attribute :donor_name, :string do
      allow_nil? false
      constraints max_length: 100
    end

    attribute :message, :string do
      allow_nil? true
      constraints max_length: 500
    end

    attribute :platform, Streampai.Stream.Platform do
      allow_nil? false
    end

    attribute :platform_donation_id, :string do
      allow_nil? false
      constraints max_length: 255
    end

    attribute :channel_id, :string do
      allow_nil? false
    end

    # Some platforms show donor email
    attribute :donor_email, :string do
      allow_nil? true
      constraints max_length: 255
    end

    # Platform-specific metadata (sound alerts, animation, etc.)
    attribute :platform_metadata, :map do
      default %{}
    end

    # Whether this donation triggered special effects
    attribute :featured, :boolean do
      default false
    end

    attribute :processed_at, :utc_datetime do
      allow_nil? true
    end

    timestamps()
  end

  relationships do
    belongs_to :user, Streampai.Accounts.User do
      allow_nil? true
    end
  end

  identities do
    # Prevent duplicate donations from same platform
    identity :unique_platform_donation, [:platform, :platform_donation_id]
  end
end
