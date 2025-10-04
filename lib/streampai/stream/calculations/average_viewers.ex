defmodule Streampai.Stream.Calculations.AverageViewers do
  @moduledoc """
  Calculates the average total viewer count across all platforms for a livestream.
  """
  use Ash.Resource.Calculation

  @impl true
  def load(_query, _opts, _context) do
    [
      metrics: [
        :youtube_viewers,
        :twitch_viewers,
        :facebook_viewers,
        :kick_viewers
      ]
    ]
  end

  @impl true
  def calculate(records, _opts, _context) do
    alias Streampai.Stream.LivestreamMetric

    {:ok,
     Enum.map(records, fn record ->
       metrics = Map.get(record, :metrics, []) || []

       case metrics do
         [] ->
           0

         metrics when is_list(metrics) ->
           total_sum =
             Enum.reduce(metrics, 0, fn metric, acc ->
               acc + LivestreamMetric.total_viewers(metric)
             end)

           avg = total_sum / length(metrics)
           round(avg)
       end
     end)}
  end
end
