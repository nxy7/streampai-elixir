defmodule Streampai.Stream.HookTriggerType do
  @moduledoc false
  use Ash.Type.Enum,
    values: [
      :donation,
      :follow,
      :raid,
      :subscription,
      :stream_start,
      :stream_end,
      :chat_message
    ]
end
