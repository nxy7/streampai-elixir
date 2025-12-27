defmodule Streampai.Accounts.StreamingAccount.Changes.RefreshPlatformStats do
  @moduledoc """
  Ash change that refreshes platform statistics for a streaming account.

  For now, this generates fake stats for development purposes.
  In production, this would call the respective platform APIs (YouTube, Twitch, etc.)
  to fetch real statistics.
  """
  use Ash.Resource.Change

  @impl true
  def change(changeset, _opts, _context) do
    platform = Ash.Changeset.get_attribute(changeset, :platform)

    # Generate fake stats for now (to be replaced with real API calls)
    stats = generate_fake_stats(platform)

    changeset
    |> Ash.Changeset.force_change_attribute(:sponsor_count, stats.sponsor_count)
    |> Ash.Changeset.force_change_attribute(:views_last_30d, stats.views_last_30d)
    |> Ash.Changeset.force_change_attribute(:follower_count, stats.follower_count)
    |> Ash.Changeset.force_change_attribute(:subscriber_count, stats.subscriber_count)
    |> Ash.Changeset.force_change_attribute(:stats_last_refreshed_at, DateTime.utc_now())
  end

  defp generate_fake_stats(platform) do
    # Generate semi-random but consistent stats based on platform
    base = :erlang.phash2(platform, 1000)

    %{
      sponsor_count: base + :rand.uniform(500),
      views_last_30d: (base + :rand.uniform(100)) * 1000,
      follower_count: (base + :rand.uniform(50)) * 100,
      subscriber_count: (base + :rand.uniform(200)) * 50
    }
  end
end
