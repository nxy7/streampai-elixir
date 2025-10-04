defmodule Streampai.LivestreamManager.LivestreamMetricsCollector do
  @moduledoc """
  Subscribes to viewer count updates from platform managers via PubSub
  and stores them in the livestream_metrics table every minute.

  Platform managers broadcast updates in the format:
  {:viewer_update, platform, count} where platform is :youtube, :twitch, etc.
  """
  use GenServer

  alias Phoenix.PubSub
  alias Streampai.LivestreamManager.StreamStateServer
  alias Streampai.Stream.LivestreamMetric

  require Logger

  @save_interval to_timeout(minute: 1)

  defstruct [
    :user_id,
    :timer_ref,
    :current_viewers
  ]

  def start_link(user_id) when is_binary(user_id) do
    GenServer.start_link(__MODULE__, user_id, name: via_tuple(user_id))
  end

  @impl true
  def init(user_id) do
    Logger.metadata(user_id: user_id, component: :livestream_metrics_collector)

    state = %__MODULE__{
      user_id: user_id,
      current_viewers: %{}
    }

    # Subscribe to viewer count updates for this user
    :ok = PubSub.subscribe(Streampai.PubSub, "viewer_counts:#{user_id}")

    Logger.info("Starting livestream metrics collector, subscribed to viewer_counts:#{user_id}")

    {:ok, schedule_save(state)}
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
    {:noreply, schedule_save(state)}
  end

  @impl true
  def terminate(_reason, state) do
    if state.timer_ref do
      Process.cancel_timer(state.timer_ref)
    end

    :ok
  end

  # Private functions

  defp save_current_metrics(state) do
    stream_state = get_stream_state(state.user_id)
    stream_uuid = Map.get(stream_state, :stream_uuid)

    if stream_uuid && stream_state.status == :streaming && map_size(state.current_viewers) > 0 do
      %{
        livestream_id: stream_uuid,
        youtube_viewers: Map.get(state.current_viewers, :youtube, 0),
        twitch_viewers: Map.get(state.current_viewers, :twitch, 0),
        facebook_viewers: Map.get(state.current_viewers, :facebook, 0),
        kick_viewers: Map.get(state.current_viewers, :kick, 0)
      }
      |> LivestreamMetric.create(authorize?: false)
      |> case do
        {:ok, _metric} ->
          Logger.debug("Saved metrics: #{inspect(state.current_viewers)}")

        {:error, reason} ->
          Logger.warning("Failed to save metrics: #{inspect(reason)}")
      end
    end
  end

  defp get_stream_state(user_id) do
    StreamStateServer.get_state({:via, Registry, {get_registry_name(), {:stream_state, user_id}}})
  end

  defp schedule_save(state) do
    if state.timer_ref do
      Process.cancel_timer(state.timer_ref)
    end

    timer_ref = Process.send_after(self(), :save_metrics, @save_interval)
    %{state | timer_ref: timer_ref}
  end

  defp via_tuple(user_id) do
    {:via, Registry, {get_registry_name(), {:livestream_metrics_collector, user_id}}}
  end

  defp get_registry_name do
    if Application.get_env(:streampai, :test_mode, false) do
      case Process.get(:test_registry_name) do
        nil -> Streampai.LivestreamManager.Registry
        test_registry -> test_registry
      end
    else
      Streampai.LivestreamManager.Registry
    end
  end
end
