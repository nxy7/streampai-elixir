defmodule Streampai.Stream.HookActionType do
  @moduledoc false
  use Ash.Type.Enum,
    values: [
      :webhook,
      :discord_message,
      :chat_message,
      :email
    ]
end
