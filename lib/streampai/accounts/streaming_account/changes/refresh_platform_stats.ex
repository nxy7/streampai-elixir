defmodule Streampai.Accounts.StreamingAccount.Changes.RefreshPlatformStats do
  @moduledoc """
  Ash change that refreshes platform statistics for a streaming account.

  Fetches real statistics from YouTube and Twitch APIs:
  - YouTube: Channel subscribers, views (30 days), and memberships (sponsors)
  - Twitch: Followers and subscribers (paid)

  Falls back to cached values if API calls fail.
  Automatically refreshes OAuth tokens if they are expired.
  """
  use Ash.Resource.Change

  alias Streampai.Twitch.ApiClient, as: TwitchClient
  alias Streampai.YouTube.ApiClient, as: YouTubeClient
  alias Ueberauth.Strategy.Google.OAuth

  require Logger

  @impl true
  def atomic(_changeset, _opts, _context) do
    {:not_atomic, "requires external API calls"}
  end

  # Refresh token 5 minutes before expiry
  @refresh_buffer_seconds 300

  @impl true
  def change(changeset, _opts, _context) do
    platform = Ash.Changeset.get_attribute(changeset, :platform)
    access_token = Ash.Changeset.get_attribute(changeset, :access_token)
    refresh_token = Ash.Changeset.get_attribute(changeset, :refresh_token)
    expires_at = Ash.Changeset.get_attribute(changeset, :access_token_expires_at)
    extra_data = Ash.Changeset.get_attribute(changeset, :extra_data) || %{}

    # Check if token needs refresh and refresh it if necessary
    {access_token, changeset} =
      maybe_refresh_token(changeset, platform, access_token, refresh_token, expires_at)

    stats = fetch_platform_stats(platform, access_token, extra_data)

    changeset
    |> maybe_update_stat(:sponsor_count, stats[:sponsor_count])
    |> maybe_update_stat(:views_last_30d, stats[:views_last_30d])
    |> maybe_update_stat(:follower_count, stats[:follower_count])
    |> maybe_update_stat(:unique_viewers_last_30d, stats[:unique_viewers_last_30d])
    |> Ash.Changeset.force_change_attribute(:stats_last_refreshed_at, DateTime.utc_now())
  end

  defp maybe_refresh_token(changeset, platform, access_token, refresh_token, expires_at) do
    if token_needs_refresh?(expires_at) do
      Logger.info("Access token expired or expiring soon, refreshing...")

      case refresh_oauth_token(platform, refresh_token) do
        {:ok, new_token_data} ->
          Logger.info("Successfully refreshed OAuth token")

          updated_changeset =
            changeset
            |> Ash.Changeset.force_change_attribute(:access_token, new_token_data.access_token)
            |> Ash.Changeset.force_change_attribute(
              :refresh_token,
              new_token_data.refresh_token
            )
            |> Ash.Changeset.force_change_attribute(
              :access_token_expires_at,
              new_token_data.expires_at
            )

          {new_token_data.access_token, updated_changeset}

        {:error, reason} ->
          Logger.warning("Failed to refresh OAuth token: #{inspect(reason)}, using existing token")

          {access_token, changeset}
      end
    else
      {access_token, changeset}
    end
  end

  defp token_needs_refresh?(nil), do: true

  defp token_needs_refresh?(expires_at) do
    DateTime.diff(expires_at, DateTime.utc_now(), :second) < @refresh_buffer_seconds
  end

  defp refresh_oauth_token(:youtube, refresh_token), do: refresh_google_token(refresh_token)
  defp refresh_oauth_token(:twitch, refresh_token), do: refresh_twitch_token(refresh_token)
  defp refresh_oauth_token(_platform, _refresh_token), do: {:error, :unsupported_platform}

  defp refresh_google_token(refresh_token) do
    client_id = Application.get_env(:ueberauth, OAuth)[:client_id]

    client_secret =
      Application.get_env(:ueberauth, OAuth)[:client_secret]

    case Req.post("https://oauth2.googleapis.com/token",
           form: [
             client_id: client_id,
             client_secret: client_secret,
             refresh_token: refresh_token,
             grant_type: "refresh_token"
           ]
         ) do
      {:ok, %{status: 200, body: body}} ->
        {:ok,
         %{
           access_token: body["access_token"],
           refresh_token: Map.get(body, "refresh_token", refresh_token),
           expires_at: DateTime.add(DateTime.utc_now(), body["expires_in"], :second)
         }}

      {:ok, %{status: status, body: body}} ->
        {:error, {:http_error, status, body}}

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp refresh_twitch_token(refresh_token) do
    client_id = Application.get_env(:ueberauth, Ueberauth.Strategy.Twitch.OAuth)[:client_id]

    client_secret =
      Application.get_env(:ueberauth, Ueberauth.Strategy.Twitch.OAuth)[:client_secret]

    case Req.post("https://id.twitch.tv/oauth2/token",
           form: [
             client_id: client_id,
             client_secret: client_secret,
             refresh_token: refresh_token,
             grant_type: "refresh_token"
           ]
         ) do
      {:ok, %{status: 200, body: body}} ->
        {:ok,
         %{
           access_token: body["access_token"],
           refresh_token: Map.get(body, "refresh_token", refresh_token),
           expires_at: DateTime.add(DateTime.utc_now(), body["expires_in"], :second)
         }}

      {:ok, %{status: status, body: body}} ->
        {:error, {:http_error, status, body}}

      {:error, reason} ->
        {:error, reason}
    end
  end

  # Only update stat if we got a value (don't overwrite with nil on API failure)
  defp maybe_update_stat(changeset, _key, nil), do: changeset

  defp maybe_update_stat(changeset, key, value) do
    Ash.Changeset.force_change_attribute(changeset, key, value)
  end

  defp fetch_platform_stats(:youtube, access_token, _extra_data) do
    Logger.info("Fetching YouTube statistics")

    # Fetch all stats in parallel
    channel_task = Task.async(fn -> YouTubeClient.get_channel_stats(access_token) end)
    analytics_task = Task.async(fn -> YouTubeClient.get_analytics_views(access_token) end)
    members_task = Task.async(fn -> YouTubeClient.get_member_count(access_token) end)

    channel_result = Task.await(channel_task, 30_000)
    analytics_result = Task.await(analytics_task, 30_000)
    members_result = Task.await(members_task, 30_000)

    # Extract values, logging any failures
    subscriber_count =
      case channel_result do
        {:ok, %{subscriber_count: count}} ->
          count

        {:error, reason} ->
          Logger.warning("Failed to fetch YouTube channel stats: #{inspect(reason)}")
          nil
      end

    {views_last_30d, unique_viewers_last_30d} =
      case analytics_result do
        {:ok, %{views_last_30d: views, unique_viewers_last_30d: unique_viewers}} ->
          {views, unique_viewers}

        {:ok, %{views_last_30d: views}} ->
          {views, nil}

        {:error, reason} ->
          Logger.warning("Failed to fetch YouTube analytics: #{inspect(reason)}")
          {nil, nil}
      end

    sponsor_count =
      case members_result do
        {:ok, %{sponsor_count: count}} ->
          count

        {:error, reason} ->
          Logger.warning("Failed to fetch YouTube members: #{inspect(reason)}")
          nil
      end

    %{
      sponsor_count: sponsor_count,
      views_last_30d: views_last_30d,
      # YouTube doesn't have "followers" - subscribers are what we track
      follower_count: subscriber_count,
      # Note: Unique viewers is not available via YouTube Analytics API
      unique_viewers_last_30d: unique_viewers_last_30d
    }
  end

  defp fetch_platform_stats(:twitch, access_token, extra_data) do
    Logger.info("Fetching Twitch statistics")

    # Get broadcaster ID from extra_data (stored during OAuth)
    broadcaster_id = extra_data["uid"] || extra_data[:uid]

    if is_nil(broadcaster_id) do
      Logger.warning("No broadcaster ID found for Twitch account")
      %{}
    else
      case TwitchClient.get_channel_stats(access_token, broadcaster_id) do
        {:ok, stats} ->
          %{
            # Twitch paid subscribers = sponsors
            sponsor_count: stats[:subscriber_count],
            # Twitch doesn't provide view analytics via API easily
            views_last_30d: nil,
            follower_count: stats[:follower_count],
            # Unique viewers not available via Twitch API
            unique_viewers_last_30d: nil
          }

        {:error, reason} ->
          Logger.warning("Failed to fetch Twitch stats: #{inspect(reason)}")
          %{}
      end
    end
  end

  # For other platforms, return empty stats (to be implemented)
  defp fetch_platform_stats(platform, _access_token, _extra_data) do
    Logger.info("Statistics not yet implemented for platform: #{platform}")
    %{}
  end
end
