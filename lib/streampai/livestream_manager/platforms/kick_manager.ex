defmodule Streampai.LivestreamManager.Platforms.KickManager do
  @moduledoc """
  Manages Kick platform integration for live streaming.
  Currently a stub implementation - to be implemented in the future.
  """
  use GenServer

  require Logger

  @activity_interval 1_000

  def start_link(user_id, config) when is_binary(user_id) do
    GenServer.start_link(__MODULE__, {user_id, config}, name: via_tuple(user_id))
  end

  @impl true
  def init({user_id, config}) do
    Logger.metadata(component: :kick_manager, user_id: user_id)
    schedule_activity_log()

    state = %{
      user_id: user_id,
      platform: :kick,
      config: config,
      is_active: false,
      started_at: DateTime.utc_now()
    }

    Logger.info("Started - #{DateTime.utc_now()}")
    {:ok, state}
  end

  # Client API

  def start_streaming(user_id, stream_uuid) do
    GenServer.call(via_tuple(user_id), {:start_streaming, stream_uuid})
  end

  def stop_streaming(user_id) do
    GenServer.call(via_tuple(user_id), :stop_streaming)
  end

  def send_chat_message(pid, message) when is_pid(pid) do
    GenServer.call(pid, {:send_chat_message, message})
  end

  def send_chat_message(user_id, message) when is_binary(user_id) do
    GenServer.call(via_tuple(user_id), {:send_chat_message, message})
  end

  def update_stream_metadata(pid, metadata) when is_pid(pid) do
    GenServer.call(pid, {:update_stream_metadata, metadata})
  end

  def update_stream_metadata(user_id, metadata) when is_binary(user_id) do
    GenServer.call(via_tuple(user_id), {:update_stream_metadata, metadata})
  end

  # Server callbacks

  @impl true
  def handle_info(:log_activity, state) do
    if state.is_active do
      Logger.info("Streaming active - #{DateTime.utc_now()}")
    else
      Logger.debug("Standby - #{DateTime.utc_now()}")
    end

    schedule_activity_log()
    {:noreply, state}
  end

  @impl true
  def handle_info(msg, state) do
    Logger.debug("Unknown message: #{inspect(msg)}")
    {:noreply, state}
  end

  @impl true
  def handle_call({:start_streaming, stream_uuid}, _from, state) do
    Logger.info("Starting stream: #{stream_uuid}")
    new_state = %{state | is_active: true}
    {:reply, :ok, new_state}
  end

  @impl true
  def handle_call(:stop_streaming, _from, state) do
    Logger.info("Stopping stream")
    new_state = %{state | is_active: false}
    {:reply, :ok, new_state}
  end

  @impl true
  def handle_call({:send_chat_message, message}, _from, state) do
    Logger.info("Sending chat message: #{message}")
    {:reply, :ok, state}
  end

  @impl true
  def handle_call({:update_stream_metadata, metadata}, _from, state) do
    Logger.info("Updating metadata: #{inspect(metadata)}")
    {:reply, :ok, state}
  end

  @impl true
  def handle_call(request, _from, state) do
    Logger.debug("Unhandled call: #{inspect(request)}")
    {:reply, :ok, state}
  end

  @impl true
  def handle_cast(request, state) do
    Logger.debug("Unhandled cast: #{inspect(request)}")
    {:noreply, state}
  end

  # Private functions

  defp schedule_activity_log do
    Process.send_after(self(), :log_activity, @activity_interval)
  end

  defp via_tuple(user_id) do
    registry_name = get_registry_name()
    {:via, Registry, {registry_name, {:platform_manager, user_id, :kick}}}
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
