defmodule Streampai.Stream.HookLogStatus do
  @moduledoc false
  use Ash.Type.Enum,
    values: [
      :success,
      :failure,
      :skipped_cooldown,
      :skipped_condition
    ]
end
