defmodule Streampai.Support.Ticket.Types.Status do
  @moduledoc false
  use Ash.Type.Enum, values: [:open, :resolved]
end
