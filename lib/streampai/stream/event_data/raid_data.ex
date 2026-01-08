defmodule Streampai.Stream.EventData.RaidData do
  @moduledoc false
  use Ash.Resource, data_layer: :embedded, extensions: [AshTypescript.Resource]

  attributes do
    attribute :raider_name, :string, public?: true, allow_nil?: false
    attribute :viewer_count, :string, public?: true, allow_nil?: false
    attribute :message, :string, public?: true
  end
end
