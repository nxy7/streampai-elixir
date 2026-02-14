defmodule Streampai.LivestreamManager.LivestreamMetricsCollector do
  @moduledoc """
  Subscribes to viewer count updates from platform managers via PubSub
  and stores them in the livestream_metrics table every minute.

  Platform managers broadcast updates in the format:
  {:viewer_update, platform, count} where platform is :youtube, :twitch, etc.
  """
  use GenServer

  alias Phoenix.PubSub
  alias Streampai.Stream.CurrentStreamData
  alias Streampai.Stream.LivestreamMetric

  require Logger

  @save_interval to_timeout(minute: 1)

  defstruct [
    :user_id,
    :stream_id,
    :current_viewers
  ]

  def start_link(opts) do
    GenServer.start_link(__MODULE__, opts)
  end

  @impl true
  def init(opts) do
    user_id = Keyword.fetch!(opts, :user_id)
    stream_id = Keyword.fetch!(opts, :stream_id)

    Logger.metadata(
      user_id: user_id,
      stream_id: stream_id,
      component: :livestream_metrics_collector
    )

    state = %__MODULE__{
      user_id: user_id,
      stream_id: stream_id,
      current_viewers: %{}
    }

    # Subscribe to viewer count updates for this user
    :ok = PubSub.subscribe(Streampai.PubSub, "viewer_counts:#{user_id}")

    Logger.info("Starting livestream metrics collector for stream #{stream_id}, subscribed to viewer_counts:#{user_id}")

    schedule_save()
    {:ok, state}
  end

  @impl true
  def handle_info({:viewer_update, platform, count}, state) when is_atom(platform) and is_integer(count) do
    Logger.debug("Received viewer update: #{platform}=#{count}")

    updated_viewers = Map.put(state.current_viewers, platform, count)
    {:noreply, %{state | current_viewers: updated_viewers}}
  end

  @impl true
  def handle_info(:save_metrics, state) do
    save_current_metrics(state)
    schedule_save()
    {:noreply, state}
  end

  # Private functions

  defp save_current_metrics(state) do
    if map_size(state.current_viewers) > 0 do
      bitrate = fetch_current_bitrate(state.user_id)

      attrs =
        then(
          %{
            livestream_id: state.stream_id,
            youtube_viewers: Map.get(state.current_viewers, :youtube, 0),
            twitch_viewers: Map.get(state.current_viewers, :twitch, 0),
            facebook_viewers: Map.get(state.current_viewers, :facebook, 0),
            kick_viewers: Map.get(state.current_viewers, :kick, 0)
          },
          fn attrs ->
            if bitrate, do: Map.put(attrs, :input_bitrate_kbps, bitrate), else: attrs
          end
        )

      case LivestreamMetric.create(attrs, actor: Streampai.SystemActor.system()) do
        {:ok, _} -> :ok
        {:error, reason} -> Logger.error("Failed to save metrics: #{inspect(reason)}")
      end
    end
  end

  defp fetch_current_bitrate(user_id) do
    case CurrentStreamData.get_by_user(user_id, actor: Streampai.SystemActor.system()) do
      {:ok, record} when not is_nil(record) ->
        get_in(record.cloudflare_data, ["input_bitrate_kbps"])

      _ ->
        nil
    end
  end

  defp schedule_save do
    Process.send_after(self(), :save_metrics, @save_interval)
  end
end
