defmodule Streampai.LivestreamManager.Platforms.YouTubeManager do
  @moduledoc """
  Manages YouTube platform integration for live streaming.
  Handles broadcast creation, stream binding, chat, and lifecycle management.
  """
  use GenServer

  alias Streampai.YouTube.ApiClient
  alias Streampai.YouTube.LiveChatStream

  require Logger

  defstruct [
    :user_id,
    :access_token,
    :refresh_token,
    :expires_at,
    :broadcast_id,
    :stream_id,
    :chat_id,
    :chat_pid,
    :stream_key,
    :rtmp_url,
    :is_active,
    :started_at
  ]

  def start_link(user_id, config) when is_binary(user_id) do
    GenServer.start_link(__MODULE__, {user_id, config}, name: via_tuple(user_id))
  end

  @impl true
  def init({user_id, config}) do
    state = %__MODULE__{
      user_id: user_id,
      access_token: config.access_token,
      refresh_token: config.refresh_token,
      expires_at: config.expires_at,
      is_active: false,
      started_at: DateTime.utc_now()
    }

    Logger.info("[YouTubeManager:#{user_id}] Started")
    {:ok, state}
  end

  # Client API

  def start_streaming(user_id, stream_uuid) do
    GenServer.call(via_tuple(user_id), {:start_streaming, stream_uuid}, 30_000)
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

  def get_status(user_id) when is_binary(user_id) do
    GenServer.call(via_tuple(user_id), :get_status)
  end

  # Server callbacks

  @impl true
  def handle_call({:start_streaming, stream_uuid}, _from, state) do
    Logger.info("[YouTubeManager:#{state.user_id}] Starting stream: #{stream_uuid}")

    with {:ok, broadcast} <- create_broadcast(state, stream_uuid),
         {:ok, stream} <- create_stream(state, stream_uuid),
         {:ok, bound_broadcast} <- bind_stream(state, broadcast["id"], stream["id"]),
         {:ok, chat_id} <- extract_chat_id(bound_broadcast),
         {:ok, chat_pid} <- start_chat_streaming(state, chat_id) do
      new_state = %{
        state
        | is_active: true,
          broadcast_id: broadcast["id"],
          stream_id: stream["id"],
          chat_id: chat_id,
          chat_pid: chat_pid,
          stream_key: get_in(stream, ["cdn", "ingestionInfo", "streamName"]),
          rtmp_url: get_in(stream, ["cdn", "ingestionInfo", "ingestionAddress"])
      }

      Logger.info(
        "[YouTubeManager:#{state.user_id}] Stream created successfully - RTMP: #{new_state.rtmp_url}, Key: #{new_state.stream_key}"
      )

      {:reply, {:ok, %{rtmp_url: new_state.rtmp_url, stream_key: new_state.stream_key}}, new_state}
    else
      {:error, reason} = error ->
        Logger.error("[YouTubeManager:#{state.user_id}] Failed to start stream: #{inspect(reason)}")

        {:reply, error, state}
    end
  end

  @impl true
  def handle_call(:stop_streaming, _from, state) do
    Logger.info("[YouTubeManager:#{state.user_id}] Stopping stream")

    if state.chat_pid do
      LiveChatStream.stop_stream(state.chat_pid)
    end

    if state.broadcast_id do
      case ApiClient.delete_live_broadcast(state.access_token, state.broadcast_id) do
        {:ok, _} ->
          Logger.info("[YouTubeManager:#{state.user_id}] Broadcast deleted: #{state.broadcast_id}")

        {:error, reason} ->
          Logger.warning("[YouTubeManager:#{state.user_id}] Failed to delete broadcast: #{inspect(reason)}")
      end
    end

    if state.stream_id do
      case ApiClient.delete_live_stream(state.access_token, state.stream_id) do
        {:ok, _} ->
          Logger.info("[YouTubeManager:#{state.user_id}] Stream deleted: #{state.stream_id}")

        {:error, reason} ->
          Logger.warning("[YouTubeManager:#{state.user_id}] Failed to delete stream: #{inspect(reason)}")
      end
    end

    new_state = %{
      state
      | is_active: false,
        broadcast_id: nil,
        stream_id: nil,
        chat_id: nil,
        chat_pid: nil,
        stream_key: nil,
        rtmp_url: nil
    }

    {:reply, :ok, new_state}
  end

  @impl true
  def handle_call({:send_chat_message, message}, _from, state) do
    if state.chat_id do
      message_data = %{
        snippet: %{
          liveChatId: state.chat_id,
          type: "textMessageEvent",
          textMessageDetails: %{
            messageText: message
          }
        }
      }

      case ApiClient.insert_live_chat_message(state.access_token, "snippet", message_data) do
        {:ok, _result} ->
          Logger.info("[YouTubeManager:#{state.user_id}] Chat message sent: #{message}")
          {:reply, :ok, state}

        {:error, reason} ->
          Logger.error("[YouTubeManager:#{state.user_id}] Failed to send chat message: #{inspect(reason)}")

          {:reply, {:error, reason}, state}
      end
    else
      {:reply, {:error, :no_active_chat}, state}
    end
  end

  @impl true
  def handle_call({:update_stream_metadata, metadata}, _from, state) do
    if state.broadcast_id do
      broadcast_data = %{
        id: state.broadcast_id,
        snippet:
          %{
            title: Map.get(metadata, :title),
            description: Map.get(metadata, :description)
          }
          |> Enum.reject(fn {_k, v} -> is_nil(v) end)
          |> Map.new()
      }

      case ApiClient.update_live_broadcast(state.access_token, "snippet", broadcast_data) do
        {:ok, _result} ->
          Logger.info("[YouTubeManager:#{state.user_id}] Stream metadata updated: #{inspect(metadata)}")

          {:reply, :ok, state}

        {:error, reason} ->
          Logger.error("[YouTubeManager:#{state.user_id}] Failed to update metadata: #{inspect(reason)}")

          {:reply, {:error, reason}, state}
      end
    else
      {:reply, {:error, :no_active_broadcast}, state}
    end
  end

  @impl true
  def handle_call(:get_status, _from, state) do
    status = %{
      is_active: state.is_active,
      broadcast_id: state.broadcast_id,
      stream_id: state.stream_id,
      chat_id: state.chat_id,
      rtmp_url: state.rtmp_url,
      has_stream_key: !is_nil(state.stream_key)
    }

    {:reply, {:ok, status}, state}
  end

  @impl true
  def handle_call(request, _from, state) do
    Logger.debug("[YouTubeManager:#{state.user_id}] Unhandled call: #{inspect(request)}")
    {:reply, :ok, state}
  end

  @impl true
  def handle_cast(request, state) do
    Logger.debug("[YouTubeManager:#{state.user_id}] Unhandled cast: #{inspect(request)}")
    {:noreply, state}
  end

  @impl true
  def handle_info({:chat_message, message}, state) do
    author = get_in(message, ["authorDetails", "displayName"]) || "Unknown"
    text = get_in(message, ["snippet", "displayMessage"]) || ""

    Logger.debug("[YouTubeManager:#{state.user_id}] Chat message from #{author}: #{text}")

    {:noreply, state}
  end

  @impl true
  def handle_info({:chat_error, reason}, state) do
    Logger.error("[YouTubeManager:#{state.user_id}] Chat error: #{inspect(reason)}")
    {:noreply, state}
  end

  @impl true
  def handle_info({:chat_ended, reason}, state) do
    Logger.info("[YouTubeManager:#{state.user_id}] Chat ended: #{inspect(reason)}")
    new_state = %{state | chat_pid: nil}
    {:noreply, new_state}
  end

  @impl true
  def handle_info(msg, state) do
    Logger.debug("[YouTubeManager:#{state.user_id}] Unknown message: #{inspect(msg)}")
    {:noreply, state}
  end

  @impl true
  def terminate(_reason, state) do
    if state.chat_pid do
      LiveChatStream.stop_stream(state.chat_pid)
    end

    :ok
  end

  # Private functions

  defp create_broadcast(state, stream_uuid) do
    broadcast_data = %{
      snippet: %{
        title: "Live Stream - #{stream_uuid}",
        scheduledStartTime: DateTime.to_iso8601(DateTime.utc_now())
      },
      status: %{
        privacyStatus: "public",
        selfDeclaredMadeForKids: false
      }
    }

    ApiClient.insert_live_broadcast(state.access_token, "snippet,status", broadcast_data)
  end

  defp create_stream(state, stream_uuid) do
    stream_data = %{
      snippet: %{
        title: "Stream - #{stream_uuid}"
      },
      cdn: %{
        format: "1080p",
        ingestionType: "rtmp",
        resolution: "variable"
      }
    }

    ApiClient.insert_live_stream(state.access_token, "snippet,cdn", stream_data)
  end

  defp bind_stream(state, broadcast_id, stream_id) do
    ApiClient.bind_live_broadcast(state.access_token, broadcast_id, "snippet,status", stream_id: stream_id)
  end

  defp extract_chat_id(broadcast) do
    case get_in(broadcast, ["snippet", "liveChatId"]) do
      nil -> {:error, :no_live_chat_id}
      chat_id -> {:ok, chat_id}
    end
  end

  defp start_chat_streaming(state, chat_id) do
    LiveChatStream.start_stream(state.access_token, chat_id, self())
  end

  defp via_tuple(user_id) do
    registry_name = get_registry_name()
    {:via, Registry, {registry_name, {:platform_manager, user_id, :youtube}}}
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
