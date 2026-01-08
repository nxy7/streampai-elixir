defmodule Streampai.Stream.EventData.SubscriptionData do
  @moduledoc false
  use Ash.Resource, data_layer: :embedded, extensions: [AshTypescript.Resource]

  attributes do
    attribute :username, :string, public?: true, allow_nil?: false
    attribute :tier, :string, public?: true, allow_nil?: false
    attribute :months, :string, public?: true
    attribute :message, :string, public?: true
    attribute :channel_id, :string, public?: true
    attribute :metadata, :map, public?: true
  end
end
