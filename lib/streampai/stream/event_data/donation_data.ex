defmodule Streampai.Stream.EventData.DonationData do
  @moduledoc false
  use Ash.Resource, data_layer: :embedded, extensions: [AshTypescript.Resource]

  attributes do
    attribute :donor_name, :string, public?: true, allow_nil?: false
    attribute :amount, :string, public?: true, allow_nil?: false
    attribute :currency, :string, public?: true, allow_nil?: false
    attribute :message, :string, public?: true
    attribute :platform_donation_id, :string, public?: true
    attribute :username, :string, public?: true
    attribute :channel_id, :string, public?: true
    attribute :amount_micros, :string, public?: true
    attribute :amount_cents, :integer, public?: true
    attribute :comment, :string, public?: true
    attribute :metadata, :map, public?: true
  end
end
