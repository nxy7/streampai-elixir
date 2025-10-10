defmodule Streampai.Stream.Platform do
  @moduledoc false
  use Ash.Type.Enum,
    values: [:youtube, :twitch, :facebook, :kick, :tiktok, :trovo, :instagram, :rumble]
end
