defmodule Streampai.Stream.EventData.StreamUpdatedData do
  @moduledoc false
  use Ash.Resource, data_layer: :embedded, extensions: [AshTypescript.Resource]

  attributes do
    attribute :username, :string, public?: true
    attribute :title, :string, public?: true
    attribute :description, :string, public?: true
    attribute :thumbnail_url, :string, public?: true
    attribute :user, :map, public?: true
  end
end
