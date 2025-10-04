defmodule Streampai.Stream.Calculations.PeakViewers do
  @moduledoc """
  Calculates the peak total viewer count across all platforms for a livestream.
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
    {:ok,
     Enum.map(records, fn record ->
       metrics = Map.get(record, :metrics, []) || []

       case metrics do
         [] ->
           0

         metrics when is_list(metrics) ->
           Enum.reduce(metrics, 0, fn metric, acc ->
             total_viewers =
               (metric.youtube_viewers || 0) +
                 (metric.twitch_viewers || 0) +
                 (metric.facebook_viewers || 0) +
                 (metric.kick_viewers || 0)

             max(acc, total_viewers)
           end)
       end
     end)}
  end
end
