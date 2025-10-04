defmodule Streampai.Accounts.User.Calculations.HoursStreamedLast30Days do
  @moduledoc """
  Calculates total hours streamed in the last 30 days for a user.
  """
  use Ash.Resource.Calculation

  alias Streampai.Stream.Livestream

  require Ash.Query

  @impl true
  def load(_query, _opts, _context) do
    [:id]
  end

  @impl true
  def calculate(records, _opts, _context) do
    cutoff = DateTime.add(DateTime.utc_now(), -30 * 24 * 60 * 60, :second)

    {:ok,
     Enum.map(records, fn record ->
       total_seconds =
         Livestream
         |> Ash.Query.for_read(:get_completed_by_user, %{user_id: record.id})
         |> Ash.Query.filter(started_at >= ^cutoff)
         |> Ash.Query.load(:duration_seconds)
         |> Ash.read!(authorize?: false)
         |> Enum.map(&(&1.duration_seconds || 0))
         |> Enum.sum()

       Float.round(total_seconds / 3600, 1)
     end)}
  end
end
