defmodule Streampai.LivestreamManager.ConsoleLogger do
  @moduledoc """
  Simple GenServer that logs to console every second for testing purposes.
  """
  use GenServer

  def start_link(user_id) when is_binary(user_id) do
    GenServer.start_link(__MODULE__, user_id, name: via_tuple(user_id))
  end

  @impl true
  def init(user_id) do
    schedule_log()
    {:ok, %{user_id: user_id, count: 0}}
  end

  @impl true
  def handle_info(:log, %{user_id: user_id, count: count} = state) do
    require Logger

    Logger.debug("[UserStreamManager:#{user_id}] Console log ##{count + 1} - #{DateTime.utc_now()}")

    schedule_log()
    {:noreply, %{state | count: count + 1}}
  end

  defp schedule_log do
    Process.send_after(self(), :log, 1000)
  end

  defp via_tuple(user_id) do
    {:via, Registry, {Streampai.LivestreamManager.Registry, {:console_logger, user_id}}}
  end
end
