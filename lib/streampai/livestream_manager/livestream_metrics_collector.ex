defmodule Streampai.LivestreamManager.LivestreamMetricsCollector do
  @moduledoc """
  Periodically collects viewer metrics from all active platform managers
  and stores them in the livestream_metrics table.
  """
  use GenServer

  alias Streampai.LivestreamManager.Platforms.YouTubeManager
  alias Streampai.LivestreamManager.StreamStateServer
  alias Streampai.Stream.LivestreamMetric

  require Logger

  @collect_interval to_timeout(second: 30)

  defstruct [
    :user_id,
    :timer_ref
  ]

  def start_link(user_id) when is_binary(user_id) do
    GenServer.start_link(__MODULE__, user_id, name: via_tuple(user_id))
  end

  @impl true
  def init(user_id) do
    Logger.metadata(user_id: user_id, component: :livestream_metrics_collector)

    state = %__MODULE__{
      user_id: user_id
    }

    Logger.info("Starting livestream metrics collector")

    {:ok, schedule_collection(state)}
  end

  @impl true
  def handle_info(:collect_metrics, state) do
    collect_and_save_metrics(state)
    {:noreply, schedule_collection(state)}
  end

  @impl true
  def terminate(_reason, state) do
    if state.timer_ref do
      Process.cancel_timer(state.timer_ref)
    end

    :ok
  end

  # Private functions

  defp collect_and_save_metrics(state) do
    stream_state = get_stream_state(state.user_id)
    stream_uuid = Map.get(stream_state, :stream_uuid)

    if stream_uuid && stream_state.status == :streaming do
      metrics = collect_platform_metrics(state.user_id)

      %{
        livestream_id: stream_uuid,
        youtube_viewers: metrics.youtube_viewers,
        twitch_viewers: metrics.twitch_viewers
      }
      |> LivestreamMetric.create(authorize?: false)
      |> case do
        {:ok, _metric} ->
          Logger.debug("Saved metrics: YouTube=#{metrics.youtube_viewers}, Twitch=#{metrics.twitch_viewers}")

        {:error, reason} ->
          Logger.warning("Failed to save metrics: #{inspect(reason)}")
      end
    end
  end

  defp collect_platform_metrics(user_id) do
    youtube_viewers = get_youtube_viewers(user_id)
    twitch_viewers = get_twitch_viewers(user_id)

    %{
      youtube_viewers: youtube_viewers,
      twitch_viewers: twitch_viewers
    }
  end

  defp get_youtube_viewers(user_id) do
    case get_platform_manager_pid(user_id, :youtube) do
      {:ok, _pid} -> YouTubeManager.get_viewer_count(user_id)
      :error -> 0
    end
  catch
    :exit, _ -> 0
  end

  defp get_twitch_viewers(_user_id) do
    # TODO: Implement when TwitchManager has viewer count support
    0
  end

  defp get_stream_state(user_id) do
    StreamStateServer.get_state({:via, Registry, {get_registry_name(), {:stream_state, user_id}}})
  end

  defp get_platform_manager_pid(user_id, platform) do
    case Registry.lookup(get_registry_name(), {:platform_manager, user_id, platform}) do
      [{pid, _}] -> {:ok, pid}
      [] -> :error
    end
  end

  defp schedule_collection(state) do
    if state.timer_ref do
      Process.cancel_timer(state.timer_ref)
    end

    timer_ref = Process.send_after(self(), :collect_metrics, @collect_interval)
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
