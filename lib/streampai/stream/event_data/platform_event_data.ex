defmodule Streampai.Stream.EventData.PlatformEventData do
  @moduledoc false
  use Ash.Resource, data_layer: :embedded, extensions: [AshTypescript.Resource]

  attributes do
    attribute :platform, :atom, public?: true, allow_nil?: false
  end
end
