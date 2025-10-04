defmodule Streampai.Stream.StreamEvent.Type do
  @moduledoc false
  use Ash.Type.Enum,
    values: [
      :donation,
      :cheer,
      :patreon,
      :follow,
      :raid,
      :stream_metadata_changed,
      :platform_started,
      :platform_stopped
    ]
end
