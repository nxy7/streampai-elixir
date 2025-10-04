defmodule Streampai.LivestreamManager.Platforms.YouTubeMetricsCollector do
  @moduledoc """
  GenServer that periodically fetches stream metrics from YouTube API.

  This process:
  1. Polls YouTube API for live streaming details
  2. Extracts metrics (concurrent viewers, etc.)
  3. Sends updates back to the parent YouTubeManager
  """
  use GenServer

  alias Streampai.YouTube.ApiClient
  alias Streampai.YouTube.TokenManager

  require Logger

  @poll_interval to_timeout(second: 30)

  defstruct [
    :user_id,
    :video_id,
    :access_token,
    :parent_pid,
    :poll_timer_ref
  ]

  def start_link(opts) do
    GenServer.start_link(__MODULE__, opts)
  end

  @impl true
  def init(opts) do
    user_id = Keyword.fetch!(opts, :user_id)
    video_id = Keyword.fetch!(opts, :video_id)
    access_token = Keyword.fetch!(opts, :access_token)
    parent_pid = Keyword.fetch!(opts, :parent_pid)

    Logger.metadata(user_id: user_id, component: :youtube_metrics_collector)

    state = %__MODULE__{
      user_id: user_id,
      video_id: video_id,
      access_token: access_token,
      parent_pid: parent_pid
    }

    Logger.info("Starting metrics collector for video #{video_id}")

    # Schedule first poll immediately
    {:ok, schedule_poll(state)}
  end

  @impl true
  def handle_info(:poll, state) do
    case fetch_viewer_count(state) do
      {:ok, viewer_count} ->
        send_update_to_parent(state.parent_pid, viewer_count)
        {:noreply, schedule_poll(state)}

      {:error, {:http_error, 401, _}} ->
        Logger.warning("Got 401 error, requesting token refresh")
        handle_token_refresh(state)

      {:error, reason} ->
        Logger.warning("Failed to fetch viewer count: #{inspect(reason)}")
        {:noreply, schedule_poll(state)}
    end
  end

  @impl true
  def handle_info({:token_updated, _user_id, new_token}, state) do
    Logger.info("Received updated token")
    {:noreply, %{state | access_token: new_token}}
  end

  @impl true
  def handle_info(msg, state) do
    Logger.debug("Unknown message: #{inspect(msg)}")
    {:noreply, state}
  end

  @impl true
  def terminate(reason, state) do
    Logger.info("Terminating metrics collector, reason: #{inspect(reason)}")

    if state.poll_timer_ref do
      Process.cancel_timer(state.poll_timer_ref)
    end

    :ok
  end

  # Private functions

  defp fetch_viewer_count(state) do
    case ApiClient.get_video(state.access_token, state.video_id, "liveStreamingDetails") do
      {:ok, video} ->
        viewer_count = get_in(video, ["liveStreamingDetails", "concurrentViewers"])

        case viewer_count do
          nil ->
            Logger.debug("No concurrent viewers data available yet")
            {:ok, 0}

          count when is_binary(count) ->
            {:ok, String.to_integer(count)}

          count when is_integer(count) ->
            {:ok, count}
        end

      error ->
        error
    end
  end

  defp send_update_to_parent(parent_pid, viewer_count) do
    send(parent_pid, {:viewer_count_update, viewer_count})
    Logger.debug("Sent viewer count update: #{viewer_count}")
  end

  defp schedule_poll(state) do
    timer_ref = Process.send_after(self(), :poll, @poll_interval)
    %{state | poll_timer_ref: timer_ref}
  end

  defp handle_token_refresh(state) do
    case TokenManager.refresh_token(state.user_id) do
      {:ok, new_token} ->
        Logger.info("Token refreshed successfully, retrying poll")
        new_state = %{state | access_token: new_token}
        send(self(), :poll)
        {:noreply, new_state}

      {:error, reason} ->
        Logger.error("Failed to refresh token: #{inspect(reason)}")
        {:stop, :token_refresh_failed, state}
    end
  end
end
