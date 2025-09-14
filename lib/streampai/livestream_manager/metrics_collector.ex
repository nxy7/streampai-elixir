defmodule Streampai.LivestreamManager.MetricsCollector do
  @moduledoc """
  Collects system-wide metrics for the livestream management system.
  Tracks performance, usage statistics, and system health.
  """
  use GenServer

  require Logger

  defstruct [
    :metrics,
    :start_time
  ]

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, :ok, Keyword.put_new(opts, :name, __MODULE__))
  end

  @impl true
  def init(:ok) do
    state = %__MODULE__{
      metrics: %{
        active_users: 0,
        total_events: 0,
        platform_connections: %{},
        system_uptime: 0
      },
      start_time: DateTime.utc_now()
    }

    # Schedule periodic metrics collection
    schedule_metrics_update()

    Logger.info("MetricsCollector started")
    {:ok, state}
  end

  # Client API

  def get_metrics, do: GenServer.call(__MODULE__, :get_metrics)

  # Server callbacks

  @impl true
  def handle_info(:update_metrics, state) do
    metrics = collect_current_metrics(state)
    state = %{state | metrics: metrics}

    schedule_metrics_update()
    {:noreply, state}
  end

  @impl true
  def handle_call(:get_metrics, _from, state) do
    {:reply, state.metrics, state}
  end

  # Helper functions

  defp collect_current_metrics(state) do
    %{
      active_users: count_active_users(),
      total_events: get_total_events(),
      platform_connections: count_platform_connections(),
      system_uptime: DateTime.diff(DateTime.utc_now(), state.start_time, :second)
    }
  end

  defp count_active_users do
    Streampai.LivestreamManager.Registry
    |> Registry.select([
      {{{:user_stream_manager, :"$1"}, :_, :_}, [], [:"$1"]}
    ])
    |> length()
  end

  defp get_total_events do
    0
    # case GenServer.whereis(Streampai.LivestreamManager.EventBroadcaster) do
    #   nil ->
    #     0

    #   _pid ->
    #     case Streampai.LivestreamManager.EventBroadcaster.get_event_stats() do
    #       stats when is_map(stats) ->
    #         stats.event_counters |> Map.values() |> Enum.sum()

    #       _ ->
    #         0
    #     end
    # end
  end

  defp count_platform_connections do
    platforms = StreampaiWeb.Utils.PlatformUtils.supported_platforms()

    Map.new(platforms, fn platform ->
      count =
        Streampai.LivestreamManager.Registry
        |> Registry.select([
          {{{:platform_manager, :_, platform}, :_, :_}, [], [true]}
        ])
        |> length()

      {platform, count}
    end)
  end

  defp schedule_metrics_update do
    # Every minute
    Process.send_after(self(), :update_metrics, 60_000)
  end
end
