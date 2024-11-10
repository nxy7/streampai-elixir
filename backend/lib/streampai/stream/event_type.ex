defmodule Streampai.Stream.EventType do
  use Ash.Type.Enum, values: [:chat_message, :donation, :follow, :raid, :subscription]
end
