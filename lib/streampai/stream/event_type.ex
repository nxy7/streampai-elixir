defmodule Streampai.Stream.EventType do
  @moduledoc false
  use Ash.Type.Enum,
    values: [
      :chat_message,
      :donation,
      :follow,
      :raid,
      :subscription,
      :stream_updated,
      :platform_started,
      :platform_stopped
    ]
end
