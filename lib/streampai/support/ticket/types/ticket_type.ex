defmodule Streampai.Support.Ticket.Types.TicketType do
  @moduledoc false
  use Ash.Type.Enum, values: [:support, :feature_request, :bug_report]
end
