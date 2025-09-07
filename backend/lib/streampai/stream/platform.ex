defmodule Streampai.Stream.Platform do
  use Ash.Type.Enum, values: [:youtube, :twitch, :facebook, :kick]
end
