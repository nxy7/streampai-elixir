defmodule Streampai.Accounts.StreamingAccount.Preparations.NeedsStatsRefresh do
  @moduledoc """
  Preparation that filters streaming accounts needing stats refresh.
  """
  use Ash.Resource.Preparation

  require Ash.Query

  @impl true
  def prepare(query, _opts, _context) do
    hours_threshold = Ash.Query.get_argument(query, :hours_threshold) || 6
    threshold_time = DateTime.add(DateTime.utc_now(), -hours_threshold, :hour)

    query
    |> Ash.Query.filter(
      is_nil(stats_last_refreshed_at) or stats_last_refreshed_at < ^threshold_time
    )
    |> Ash.Query.sort(stats_last_refreshed_at: :asc_nils_first)
  end
end
