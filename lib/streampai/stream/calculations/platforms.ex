defmodule Streampai.Stream.Calculations.Platforms do
  @moduledoc """
  Calculates the list of platforms used for a livestream based on platform_started events.
  """
  use Ash.Resource.Calculation

  alias Streampai.Stream.StreamEvent

  @impl true
  def calculate(records, _opts, _context) do
    {:ok,
     Enum.map(records, fn record ->
       record.id
       |> StreamEvent.get_platform_started_for_livestream!(authorize?: false)
       |> Enum.map(& &1.platform)
       |> Enum.uniq()
     end)}
  end
end
