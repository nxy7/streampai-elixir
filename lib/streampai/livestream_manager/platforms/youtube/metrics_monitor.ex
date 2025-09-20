defmodule Streampai.LivestreamManager.Platforms.YouTube.MetricsMonitor do
  @moduledoc false
  use GenServer

  alias Streampai.YouTube.ApiClient

  require Logger

  @check_interval 15_000
  @retry_interval 30_000

  def start_link(opts) do
    user_id = Keyword.fetch!(opts, :user_id)
    GenServer.start_link(__MODULE__, opts, name: via_tuple(user_id))
  end

  def start_monitoring(user_id, access_token, broadcast_id) do
    GenServer.call(via_tuple(user_id), {:start_monitoring, access_token, broadcast_id})
  end

  def stop_monitoring(user_id) do
    GenServer.call(via_tuple(user_id), :stop_monitoring)
  end

  def get_metrics(user_id) do
    GenServer.call(via_tuple(user_id), :get_metrics)
  catch
    :exit, _ -> {:error, :not_available}
  end

  @impl true
  def init(opts) do
    user_id = Keyword.fetch!(opts, :user_id)

    state = %{
      user_id: user_id,
      access_token: nil,
      broadcast_id: nil,
      monitoring: false,
      timer_ref: nil,
      # Cached metrics
      viewer_count: 0,
      stream_title: nil,
      stream_description: nil,
      last_update: nil,
      consecutive_failures: 0
    }

    Logger.info("[YouTube.MetricsMonitor:#{user_id}] Started")
    {:ok, state}
  end

  @impl true
  def handle_call({:start_monitoring, access_token, broadcast_id}, _from, state) do
    Logger.info("[YouTube.MetricsMonitor:#{state.user_id}] Starting metrics monitoring for broadcast: #{broadcast_id}")

    # Cancel existing timer if any
    if state.timer_ref do
      Process.cancel_timer(state.timer_ref)
    end

    # Start with immediate check
    timer_ref = Process.send_after(self(), :check_metrics, 0)

    new_state = %{
      state
      | access_token: access_token,
        broadcast_id: broadcast_id,
        monitoring: true,
        timer_ref: timer_ref,
        consecutive_failures: 0
    }

    {:reply, :ok, new_state}
  end

  @impl true
  def handle_call(:stop_monitoring, _from, state) do
    Logger.info("[YouTube.MetricsMonitor:#{state.user_id}] Stopping metrics monitoring")

    if state.timer_ref do
      Process.cancel_timer(state.timer_ref)
    end

    new_state = %{
      state
      | monitoring: false,
        timer_ref: nil,
        access_token: nil,
        broadcast_id: nil,
        consecutive_failures: 0
    }

    {:reply, :ok, new_state}
  end

  @impl true
  def handle_call(:get_metrics, _from, state) do
    metrics = %{
      viewer_count: state.viewer_count,
      stream_title: state.stream_title,
      stream_description: state.stream_description,
      last_update: state.last_update,
      monitoring: state.monitoring
    }

    {:reply, {:ok, metrics}, state}
  end

  @impl true
  def handle_info(:check_metrics, state) do
    if state.monitoring and state.broadcast_id do
      case fetch_metrics(state) do
        {:ok, updated_state} ->
          # Schedule next check
          timer_ref = Process.send_after(self(), :check_metrics, @check_interval)

          # Broadcast metrics update
          Phoenix.PubSub.broadcast(
            Streampai.PubSub,
            "youtube_metrics:#{state.user_id}",
            {:metrics_update, :youtube, format_metrics(updated_state)}
          )

          {:noreply, %{updated_state | timer_ref: timer_ref, consecutive_failures: 0}}

        {:error, reason} ->
          Logger.warning("[YouTube.MetricsMonitor:#{state.user_id}] Failed to fetch metrics: #{inspect(reason)}")

          new_failures = state.consecutive_failures + 1

          # Use longer interval after failures
          interval = if new_failures > 3, do: @retry_interval, else: @check_interval
          timer_ref = Process.send_after(self(), :check_metrics, interval)

          # Stop monitoring after too many failures
          if new_failures > 10 do
            Logger.error("[YouTube.MetricsMonitor:#{state.user_id}] Too many failures, stopping metrics monitoring")

            {:noreply, %{state | monitoring: false, timer_ref: nil}}
          else
            {:noreply, %{state | timer_ref: timer_ref, consecutive_failures: new_failures}}
          end
      end
    else
      {:noreply, state}
    end
  end

  @impl true
  def handle_info(msg, state) do
    Logger.debug("[YouTube.MetricsMonitor:#{state.user_id}] Unknown message: #{inspect(msg)}")
    {:noreply, state}
  end

  @impl true
  def terminate(reason, state) do
    Logger.info("[YouTube.MetricsMonitor:#{state.user_id}] Terminating: #{inspect(reason)}")

    if state.timer_ref do
      Process.cancel_timer(state.timer_ref)
    end

    :ok
  end

  defp fetch_metrics(state) do
    Logger.debug("[YouTube.MetricsMonitor:#{state.user_id}] Fetching YouTube stream metrics")

    case ApiClient.list_live_broadcasts(
           state.access_token,
           "snippet,statistics",
           id: [state.broadcast_id]
         ) do
      {:ok, %{"items" => [broadcast | _]}} ->
        viewer_count = get_in(broadcast, ["statistics", "concurrentViewers"]) || 0
        title = get_in(broadcast, ["snippet", "title"])
        description = get_in(broadcast, ["snippet", "description"])

        updated_state = %{
          state
          | viewer_count: parse_viewer_count(viewer_count),
            stream_title: title,
            stream_description: description,
            last_update: DateTime.utc_now()
        }

        Logger.debug("[YouTube.MetricsMonitor:#{state.user_id}] Metrics updated - viewers: #{updated_state.viewer_count}")

        {:ok, updated_state}

      {:ok, %{"items" => []}} ->
        Logger.warning("[YouTube.MetricsMonitor:#{state.user_id}] Broadcast not found for metrics")

        {:error, :broadcast_not_found}

      error ->
        error
    end
  end

  defp format_metrics(state) do
    %{
      viewer_count: state.viewer_count,
      stream_title: state.stream_title,
      stream_description: state.stream_description,
      last_update: state.last_update
    }
  end

  defp parse_viewer_count(count) when is_binary(count) do
    case Integer.parse(count) do
      {num, _} -> num
      :error -> 0
    end
  end

  defp parse_viewer_count(count) when is_integer(count), do: count
  defp parse_viewer_count(_), do: 0

  defp via_tuple(user_id) do
    registry_name = get_registry_name()
    {:via, Registry, {registry_name, {:youtube_metrics_monitor, user_id}}}
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
