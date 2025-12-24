defmodule Streampai.Stream.Calculations.DurationSeconds do
  @moduledoc """
  Calculates the duration of a livestream in seconds.
  """
  use Ash.Resource.Calculation

  @impl true
  def load(_query, _opts, _context) do
    [:started_at, :ended_at]
  end

  @impl true
  def calculate(records, _opts, _context) do
    {:ok,
     Enum.map(records, fn record ->
       case record.ended_at do
         nil -> DateTime.diff(DateTime.utc_now(), record.started_at)
         ended_at -> DateTime.diff(ended_at, record.started_at)
       end
     end)}
  end
end
