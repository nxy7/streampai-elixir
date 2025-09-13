defmodule Streampai.Widgets.TimerServer do
  @moduledoc """
  A GenServer that manages timer state for timer widgets.
  Can be started from widget components and sends updates to LiveView processes.
  """

  use GenServer

  require Logger

  defstruct [:widget_id, :liveview_pid, :count, :interval]

  def start_link({widget_id, liveview_pid, opts}) do
    GenServer.start_link(__MODULE__, {widget_id, liveview_pid, opts})
  end

  def start_timer(widget_id, liveview_pid, opts \\ []) do
    # Simple approach - just start the GenServer directly
    case GenServer.start_link(__MODULE__, {widget_id, liveview_pid, opts}) do
      {:ok, pid} -> {:ok, pid}
      {:error, reason} -> {:error, reason}
    end
  end

  def stop_timer(pid) when is_pid(pid) do
    GenServer.stop(pid)
  end

  def stop_timer(_), do: :ok

  def get_count(pid) when is_pid(pid) do
    GenServer.call(pid, :get_count)
  end

  def get_count(_), do: 0

  @doc """
  Kill all running timer servers (useful for cleanup)
  """
  def kill_all_timers do
    Process.registered()
    |> Enum.filter(fn name ->
      case Atom.to_string(name) do
        "timer_" <> _ -> true
        _ -> false
      end
    end)
    |> Enum.each(fn name ->
      try do
        GenServer.stop(Process.whereis(name))
        Logger.info("Stopped timer server: #{name}")
      rescue
        _ -> :ok
      end
    end)
  end

  # GenServer callbacks

  def init({widget_id, liveview_pid, opts}) do
    Logger.info("Starting timer server for widget #{widget_id}, LiveView PID: #{inspect(liveview_pid)}")

    # Monitor the LiveView process so we can clean up when it dies
    Process.monitor(liveview_pid)

    interval = opts[:interval] || 1000

    state = %__MODULE__{
      widget_id: widget_id,
      liveview_pid: liveview_pid,
      count: 0,
      interval: interval
    }

    # Start the timer immediately
    schedule_tick(interval)
    Logger.info("Timer scheduled for #{interval}ms")

    {:ok, state}
  end

  def handle_info(:tick, state) do
    new_count = state.count + 1
    Logger.info("Timer tick: #{new_count}, sending to PID #{inspect(state.liveview_pid)}")

    # Send update to LiveView
    send(state.liveview_pid, {:timer_tick, new_count})

    # Schedule next tick
    schedule_tick(state.interval)

    {:noreply, %{state | count: new_count}}
  end

  def handle_info({:DOWN, _ref, :process, pid, reason}, state) when pid == state.liveview_pid do
    Logger.info(
      "LiveView process #{inspect(pid)} died (#{inspect(reason)}), stopping timer server for widget #{state.widget_id}"
    )

    {:stop, :normal, state}
  end

  def handle_call(:get_count, _from, state) do
    {:reply, state.count, state}
  end

  def terminate(reason, state) do
    Logger.info("Timer server for widget #{state.widget_id} terminated: #{inspect(reason)}")
  end

  # Private functions

  defp schedule_tick(interval) do
    Process.send_after(self(), :tick, interval)
  end
end
