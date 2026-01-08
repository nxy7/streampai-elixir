defmodule Streampai.Stream.EventData.ChatMessageData do
  @moduledoc false
  use Ash.Resource, data_layer: :embedded, extensions: [AshTypescript.Resource]

  attributes do
    attribute :message, :string, public?: true, allow_nil?: false
    attribute :username, :string, public?: true, allow_nil?: false
    attribute :sender_channel_id, :string, public?: true
    attribute :is_moderator, :boolean, public?: true, default: false
    attribute :is_patreon, :boolean, public?: true, default: false
    attribute :is_sent_by_streamer, :boolean, public?: true, default: false
    attribute :delivery_status, :map, public?: true
    attribute :emotes, {:array, :map}, public?: true
  end
end
