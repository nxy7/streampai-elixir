defmodule Streampai.Stream.EventData.FollowData do
  @moduledoc false
  use Ash.Resource, data_layer: :embedded, extensions: [AshTypescript.Resource]

  attributes do
    attribute :username, :string, public?: true, allow_nil?: false
    attribute :display_name, :string, public?: true
  end
end
