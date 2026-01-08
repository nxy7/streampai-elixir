defmodule Streampai.LivestreamManager.Platforms.TrovoManager do
  @moduledoc """
  Manages Trovo platform integration for live streaming.
  Currently a stub implementation - to be implemented in the future.
  """
  @behaviour Streampai.LivestreamManager.Platforms.StreamPlatformManager

  use GenServer

  alias Streampai.LivestreamManager.RegistryHelpers
  alias Streampai.LivestreamManager.StreamEvents

  require Logger

  @activity_interval 1_000

  def start_link(user_id, config) when is_binary(user_id) do
    GenServer.start_link(__MODULE__, {user_id, config}, name: via_tuple(user_id))
  end

  @impl true
  def init({user_id, config}) do
    Logger.metadata(component: :trovo_manager, user_id: user_id)
    schedule_activity_log()

    state = %{
      user_id: user_id,
      livestream_id: nil,
      platform: :trovo,
      config: config,
      is_active: false,
      started_at: DateTime.utc_now()
    }

    Logger.info("Started - #{DateTime.utc_now()}")
    {:ok, state}
  end

  # Client API - StreamPlatformManager behavior implementation

  @impl true
  def start_streaming(user_id, livestream_id, _opts \\ []) when is_binary(user_id) do
    case GenServer.call(via_tuple(user_id), {:start_streaming, livestream_id}) do
      :ok -> {:ok, %{platform: :trovo, livestream_id: livestream_id}}
      error -> error
    end
  end

  @impl true
  def stop_streaming(user_id) when is_binary(user_id) do
    case GenServer.call(via_tuple(user_id), :stop_streaming) do
      :ok -> {:ok, %{stopped_at: DateTime.utc_now()}}
      error -> error
    end
  end

  @impl true
  def send_chat_message(user_id, message) when is_binary(user_id) and is_binary(message) do
    case GenServer.call(via_tuple(user_id), {:send_chat_message, message}, 15_000) do
      :ok -> {:ok, "message_sent"}
      error -> error
    end
  end

  @impl true
  def update_stream_metadata(user_id, metadata) when is_binary(user_id) and is_map(metadata) do
    case GenServer.call(via_tuple(user_id), {:update_stream_metadata, metadata}) do
      :ok -> {:ok, metadata}
      error -> error
    end
  end

  @impl true
  def delete_message(user_id, message_id) when is_binary(user_id) and is_binary(message_id) do
    Logger.info("Delete message not implemented for Trovo: #{message_id}")
    {:error, :not_implemented}
  end

  @impl true
  def ban_user(user_id, target_user_id, reason \\ nil)
      when is_binary(user_id) and is_binary(target_user_id) do
    Logger.info(
      "Ban user not implemented for Trovo: #{target_user_id}, reason: #{inspect(reason)}"
    )

    {:error, :not_implemented}
  end

  @impl true
  def timeout_user(user_id, target_user_id, duration_seconds, reason \\ nil)
      when is_binary(user_id) and is_binary(target_user_id) and is_integer(duration_seconds) do
    Logger.info(
      "Timeout user not implemented for Trovo: #{target_user_id}, duration: #{duration_seconds}s, reason: #{inspect(reason)}"
    )

    {:error, :not_implemented}
  end

  @impl true
  def unban_user(user_id, ban_id) when is_binary(user_id) and is_binary(ban_id) do
    Logger.info("Unban user not implemented for Trovo: #{ban_id}")
    {:error, :not_implemented}
  end

  @impl true
  def get_status(user_id) when is_binary(user_id) do
    case GenServer.call(via_tuple(user_id), :get_status) do
      status when is_map(status) -> {:ok, status}
      error -> error
    end
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
  def handle_call({:start_streaming, livestream_id}, _from, state) do
    Logger.info("Starting stream: #{livestream_id}")
    StreamEvents.emit_platform_started(state.user_id, livestream_id, :trovo)
    new_state = %{state | is_active: true, livestream_id: livestream_id}
    {:reply, :ok, new_state}
  end

  @impl true
  def handle_call(:stop_streaming, _from, state) do
    Logger.info("Stopping stream")

    if state.livestream_id do
      StreamEvents.emit_platform_stopped(state.user_id, state.livestream_id, :trovo)
    end

    new_state = %{state | is_active: false, livestream_id: nil}
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
  def handle_call(:get_status, _from, state) do
    status = %{
      platform: :trovo,
      connection_status: if(state.is_active, do: :connected, else: :disconnected),
      authenticated: true,
      stream_active: state.is_active,
      livestream_id: state.livestream_id,
      started_at: state.started_at
    }

    {:reply, status, state}
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
    RegistryHelpers.via_tuple(:platform_manager, user_id, :trovo)
  end
end
