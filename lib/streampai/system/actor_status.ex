defmodule Streampai.System.ActorStatus do
  @moduledoc """
  Status enum for actor lifecycle states.
  """
  use Ash.Type.Enum,
    values: [:active, :paused, :terminated]
end
