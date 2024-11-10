defmodule Streampai.Stream.StreamEvent.Type do
  use Ash.Type.Enum, values: [:donation, :cheer, :patreon, :follow, :raid]
end
