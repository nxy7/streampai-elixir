defmodule Streampai.LivestreamManager.Platforms.YouTube.ChatMonitor do
  @moduledoc false
  use GenServer

  alias Streampai.YouTube.LiveChatStream

  require Logger

  @reconnect_delay 5_000
  @max_reconnect_attempts 5

  def start_link(opts) do
    user_id = Keyword.fetch!(opts, :user_id)
    GenServer.start_link(__MODULE__, opts, name: via_tuple(user_id))
  end

  def start_monitoring(user_id, access_token, live_chat_id) do
    GenServer.call(via_tuple(user_id), {:start_monitoring, access_token, live_chat_id})
  end

  def stop_monitoring(user_id) do
    GenServer.call(via_tuple(user_id), :stop_monitoring)
  end

  def is_monitoring?(user_id) do
    GenServer.call(via_tuple(user_id), :is_monitoring?)
  catch
    :exit, _ -> false
  end

  @impl true
  def init(opts) do
    user_id = Keyword.fetch!(opts, :user_id)

    state = %{
      user_id: user_id,
      chat_stream_pid: nil,
      access_token: nil,
      live_chat_id: nil,
      reconnect_attempts: 0,
      monitoring: false
    }

    Logger.info("[YouTube.ChatMonitor:#{user_id}] Started")
    {:ok, state}
  end

  @impl true
  def handle_call({:start_monitoring, access_token, live_chat_id}, _from, state) do
    Logger.info("[YouTube.ChatMonitor:#{state.user_id}] Starting chat monitoring for chat: #{live_chat_id}")

    new_state = %{
      state
      | access_token: access_token,
        live_chat_id: live_chat_id,
        reconnect_attempts: 0
    }

    case start_chat_stream(new_state) do
      {:ok, updated_state} ->
        {:reply, :ok, updated_state}

      {:error, reason} = error ->
        Logger.error("[YouTube.ChatMonitor:#{state.user_id}] Failed to start chat monitoring: #{inspect(reason)}")

        {:reply, error, new_state}
    end
  end

  @impl true
  def handle_call(:stop_monitoring, _from, state) do
    Logger.info("[YouTube.ChatMonitor:#{state.user_id}] Stopping chat monitoring")

    if state.chat_stream_pid do
      LiveChatStream.stop_stream(state.chat_stream_pid)
    end

    new_state = %{
      state
      | chat_stream_pid: nil,
        monitoring: false,
        access_token: nil,
        live_chat_id: nil,
        reconnect_attempts: 0
    }

    {:reply, :ok, new_state}
  end

  @impl true
  def handle_call(:is_monitoring?, _from, state) do
    {:reply, state.monitoring, state}
  end

  @impl true
  def handle_info({:chat_message, message}, state) do
    Logger.debug(
      "[YouTube.ChatMonitor:#{state.user_id}] Chat message: #{inspect(get_in(message, ["snippet", "displayMessage"]))}"
    )

    Phoenix.PubSub.broadcast(
      Streampai.PubSub,
      "youtube_chat:#{state.user_id}",
      {:chat_message, :youtube, format_chat_message(message)}
    )

    {:noreply, state}
  end

  @impl true
  def handle_info({:chat_error, reason}, state) do
    Logger.warning("[YouTube.ChatMonitor:#{state.user_id}] Chat error: #{inspect(reason)}")

    if state.monitoring and state.reconnect_attempts < @max_reconnect_attempts do
      Process.send_after(self(), :reconnect, @reconnect_delay)

      {:noreply, %{state | chat_stream_pid: nil, reconnect_attempts: state.reconnect_attempts + 1}}
    else
      Logger.error("[YouTube.ChatMonitor:#{state.user_id}] Max reconnect attempts reached, stopping monitoring")

      {:noreply, %{state | chat_stream_pid: nil, monitoring: false}}
    end
  end

  @impl true
  def handle_info({:chat_ended, reason}, state) do
    Logger.info("[YouTube.ChatMonitor:#{state.user_id}] Chat stream ended: #{inspect(reason)}")
    {:noreply, %{state | chat_stream_pid: nil, monitoring: false}}
  end

  @impl true
  def handle_info(:reconnect, state) do
    if state.monitoring and state.access_token and state.live_chat_id do
      Logger.info(
        "[YouTube.ChatMonitor:#{state.user_id}] Attempting reconnect (#{state.reconnect_attempts}/#{@max_reconnect_attempts})"
      )

      case start_chat_stream(state) do
        {:ok, new_state} ->
          Logger.info("[YouTube.ChatMonitor:#{state.user_id}] Reconnected successfully")
          {:noreply, %{new_state | reconnect_attempts: 0}}

        {:error, reason} ->
          Logger.error("[YouTube.ChatMonitor:#{state.user_id}] Reconnect failed: #{inspect(reason)}")

          if state.reconnect_attempts < @max_reconnect_attempts do
            Process.send_after(self(), :reconnect, @reconnect_delay * 2)
            {:noreply, state}
          else
            {:noreply, %{state | monitoring: false}}
          end
      end
    else
      {:noreply, state}
    end
  end

  @impl true
  def handle_info(msg, state) do
    Logger.debug("[YouTube.ChatMonitor:#{state.user_id}] Unknown message: #{inspect(msg)}")
    {:noreply, state}
  end

  @impl true
  def terminate(reason, state) do
    Logger.info("[YouTube.ChatMonitor:#{state.user_id}] Terminating: #{inspect(reason)}")

    if state.chat_stream_pid do
      try do
        LiveChatStream.stop_stream(state.chat_stream_pid)
      catch
        _, _ -> :ok
      end
    end

    :ok
  end

  defp start_chat_stream(state) do
    case LiveChatStream.start_stream(
           state.access_token,
           state.live_chat_id,
           self()
         ) do
      {:ok, chat_pid} ->
        Logger.info("[YouTube.ChatMonitor:#{state.user_id}] Chat stream started")
        {:ok, %{state | chat_stream_pid: chat_pid, monitoring: true}}

      error ->
        error
    end
  end

  defp format_chat_message(message) do
    %{
      id: message["id"],
      user: %{
        id: get_in(message, ["authorDetails", "channelId"]),
        name: get_in(message, ["authorDetails", "displayName"]),
        avatar: get_in(message, ["authorDetails", "profileImageUrl"]),
        is_moderator: get_in(message, ["authorDetails", "isChatModerator"]) || false,
        is_verified: get_in(message, ["authorDetails", "isVerified"]) || false
      },
      message: get_in(message, ["snippet", "displayMessage"]),
      timestamp: get_in(message, ["snippet", "publishedAt"]),
      type: get_in(message, ["snippet", "type"])
    }
  end

  defp via_tuple(user_id) do
    registry_name = get_registry_name()
    {:via, Registry, {registry_name, {:youtube_chat_monitor, user_id}}}
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
