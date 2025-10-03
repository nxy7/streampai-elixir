defmodule Streampai.LivestreamManager.Platforms.YouTubeManager do
  @moduledoc """
  Manages YouTube platform integration for live streaming.
  Handles broadcast creation, stream binding, chat, and lifecycle management.
  """
  use GenServer

  alias Streampai.LivestreamManager.CloudflareManager
  alias Streampai.YouTube.ApiClient
  alias Streampai.YouTube.GrpcStreamClient
  alias Streampai.YouTube.TokenManager

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
    :cloudflare_output_id,
    :is_active,
    :started_at
  ]

  def start_link(user_id, config) when is_binary(user_id) do
    GenServer.start_link(__MODULE__, {user_id, config}, name: via_tuple(user_id))
  end

  @impl true
  def init({user_id, config}) do
    Logger.metadata(user_id: user_id, component: :youtube_manager)

    # Ensure token manager is running for this user
    {:ok, _token_manager_pid} =
      Streampai.YouTube.TokenSupervisor.ensure_token_manager(user_id, config)

    # Subscribe to token updates
    TokenManager.subscribe(user_id)

    # Use the token from config initially to avoid blocking
    # TokenManager will send updated token if it refreshes
    state = %__MODULE__{
      user_id: user_id,
      access_token: config.access_token,
      refresh_token: config.refresh_token,
      expires_at: config.expires_at,
      is_active: false,
      started_at: DateTime.utc_now()
    }

    Logger.info("Started")
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
    Logger.info("Starting stream: #{stream_uuid}")

    with {:create_broadcast, {:ok, broadcast}} <-
           {:create_broadcast, create_broadcast(state, stream_uuid)},
         {:create_stream, {:ok, stream}} <- {:create_stream, create_stream(state, stream_uuid)},
         {:bind_stream, {:ok, bound_broadcast}} <-
           {:bind_stream, bind_stream(state, broadcast["id"], stream["id"])},
         {:get_chat_ids, {:ok, broadcast_chat_id, active_chat_id}} <-
           {:get_chat_ids, get_chat_ids(state, bound_broadcast, broadcast["id"])},
         {:start_chat, {:ok, chat_pid}} <-
           {:start_chat, start_chat_streaming(state, stream_uuid, broadcast_chat_id)},
         stream_key = get_in(stream, ["cdn", "ingestionInfo", "streamName"]),
         rtmp_url = get_in(stream, ["cdn", "ingestionInfo", "ingestionAddress"]),
         {:create_output, {:ok, output_id}} <-
           {:create_output, create_cloudflare_output(state, rtmp_url, stream_key)} do
      new_state = %{
        state
        | is_active: true,
          broadcast_id: broadcast["id"],
          stream_id: stream["id"],
          chat_id: active_chat_id,
          chat_pid: chat_pid,
          stream_key: stream_key,
          rtmp_url: rtmp_url,
          cloudflare_output_id: output_id
      }

      Logger.info("Stream created successfully - RTMP: #{rtmp_url}, Key: #{stream_key}, Cloudflare Output: #{output_id}")

      {:reply, {:ok, %{rtmp_url: rtmp_url, stream_key: stream_key}}, new_state}
    else
      {step, {:error, reason}} ->
        Logger.error("Failed at #{step}: #{inspect(reason)}")
        {:reply, {:error, reason}, state}
    end
  end

  @impl true
  def handle_call(:stop_streaming, _from, state) do
    Logger.info("Stopping stream")

    if state.chat_pid do
      GrpcStreamClient.stop(state.chat_pid)
    end

    cleanup_cloudflare_output(state)
    cleanup_broadcast(state)
    cleanup_stream(state)

    new_state = %{
      state
      | is_active: false,
        broadcast_id: nil,
        stream_id: nil,
        chat_id: nil,
        chat_pid: nil,
        stream_key: nil,
        rtmp_url: nil,
        cloudflare_output_id: nil
    }

    {:reply, :ok, new_state}
  end

  @impl true
  def handle_call({:send_chat_message, message}, _from, state) do
    do_send_chat_message(message, state)
  end

  @impl true
  def handle_call({:update_stream_metadata, metadata}, _from, state) do
    do_update_stream_metadata(metadata, state)
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
    Logger.debug("Unhandled call: #{inspect(request)}")
    {:reply, :ok, state}
  end

  @impl true
  def handle_cast(request, state) do
    Logger.debug("Unhandled cast: #{inspect(request)}")
    {:noreply, state}
  end

  @impl true
  def handle_info({:youtube_message, :chat_message, data}, state) do
    Logger.debug("💬 Chat message from #{data.username}: #{data.message}")
    broadcast_chat_message(state.user_id, data)
    {:noreply, state}
  end

  @impl true
  def handle_info({:youtube_message, event_type, data}, state) do
    Logger.debug("YouTube event [#{event_type}]: #{inspect(data)}")
    {:noreply, state}
  end

  @impl true
  def handle_info({:stream_ended, reason}, state) do
    Logger.info("gRPC stream ended: #{inspect(reason)}")
    new_state = %{state | chat_pid: nil}
    {:noreply, new_state}
  end

  @impl true
  def handle_info({:token_updated, _user_id, new_token}, state) do
    Logger.info("Received updated token from TokenManager")

    # Update gRPC client with new token if running
    if state.chat_pid do
      GrpcStreamClient.update_token(state.chat_pid, new_token)
    end

    {:noreply, %{state | access_token: new_token}}
  end

  @impl true
  def handle_info({:token_expired, _reason}, state) do
    Logger.warning("Token expired, requesting refresh from TokenManager...")

    case TokenManager.refresh_token(state.user_id) do
      {:ok, new_token} ->
        Logger.info("Token refreshed successfully")

        # Update gRPC client with new token
        if state.chat_pid do
          GrpcStreamClient.update_token(state.chat_pid, new_token)
        end

        {:noreply, %{state | access_token: new_token}}

      {:error, reason} ->
        Logger.error("Failed to refresh token: #{inspect(reason)}")

        # Stop the gRPC stream on failed refresh
        if state.chat_pid do
          GrpcStreamClient.stop(state.chat_pid)
        end

        {:noreply, %{state | chat_pid: nil}}
    end
  end

  @impl true
  def handle_info(msg, state) do
    Logger.debug("Unknown message: #{inspect(msg)}")
    {:noreply, state}
  end

  @impl true
  def terminate(reason, state) do
    Logger.info("Terminating YouTube manager, reason: #{inspect(reason)}")

    # Stop chat stream
    if state.chat_pid do
      GrpcStreamClient.stop(state.chat_pid)
    end

    # Delete Cloudflare Live Output
    if state.cloudflare_output_id do
      Logger.info("Cleaning up Cloudflare output: #{state.cloudflare_output_id}")
      delete_cloudflare_output(state)
    end

    cleanup_broadcast(state)
    cleanup_stream(state)

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

    with_token_retry(state, fn token ->
      ApiClient.insert_live_broadcast(token, "snippet,status", broadcast_data)
    end)
  end

  defp do_send_chat_message(_message, %{chat_id: nil} = state) do
    {:reply, {:error, :no_active_chat}, state}
  end

  defp do_send_chat_message(message, state) do
    message_data = %{
      snippet: %{
        liveChatId: state.chat_id,
        type: "textMessageEvent",
        textMessageDetails: %{
          messageText: message
        }
      }
    }

    case with_token_retry(state, fn token ->
           ApiClient.insert_live_chat_message(token, "snippet", message_data)
         end) do
      {:ok, _result} ->
        Logger.info("Chat message sent: #{message}")
        {:reply, :ok, state}

      {:error, reason} ->
        Logger.error("Failed to send chat message: #{inspect(reason)}")
        {:reply, {:error, reason}, state}
    end
  end

  defp do_update_stream_metadata(_metadata, %{broadcast_id: nil} = state) do
    {:reply, {:error, :no_active_broadcast}, state}
  end

  defp do_update_stream_metadata(metadata, state) do
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

    case with_token_retry(state, fn token ->
           ApiClient.update_live_broadcast(token, "snippet", broadcast_data)
         end) do
      {:ok, _result} ->
        Logger.info("Stream metadata updated: #{inspect(metadata)}")
        {:reply, :ok, state}

      {:error, reason} ->
        Logger.error("Failed to update metadata: #{inspect(reason)}")
        {:reply, {:error, reason}, state}
    end
  end

  defp create_stream(state, stream_uuid) do
    stream_data = %{
      snippet: %{
        title: "Stream - #{stream_uuid}"
      },
      cdn: %{
        format: "1080p",
        ingestionType: "rtmp",
        resolution: "variable",
        frameRate: "variable"
      }
    }

    with_token_retry(state, fn token ->
      ApiClient.insert_live_stream(token, "snippet,cdn", stream_data)
    end)
  end

  defp bind_stream(state, broadcast_id, stream_id) do
    with_token_retry(state, fn token ->
      ApiClient.bind_live_broadcast(token, broadcast_id, "snippet,status", stream_id: stream_id)
    end)
  end

  defp get_chat_ids(state, broadcast, broadcast_id) do
    # Get liveChatId from broadcast (REST API method)
    broadcast_chat_id = get_in(broadcast, ["snippet", "liveChatId"])

    # Get activeLiveChatId from video (gRPC docs method)
    active_chat_id =
      case get_video_active_chat_id(state, broadcast_id) do
        {:ok, chat_id} -> chat_id
        {:error, _} -> nil
      end

    Logger.info("""
    Chat ID comparison:
      - broadcast.snippet.liveChatId: #{inspect(broadcast_chat_id)}
      - video.liveStreamingDetails.activeLiveChatId: #{inspect(active_chat_id)}
      - Using for gRPC: #{inspect(active_chat_id || broadcast_chat_id)}
    """)

    # Prefer activeLiveChatId for gRPC, fallback to broadcast liveChatId
    # chat_id_to_use = active_chat_id || broadcast_chat_id

    {:ok, broadcast_chat_id, active_chat_id}

    # case chat_id_to_use do
    #   nil -> {:error, :no_live_chat_id}
    #   chat_id -> {:ok, broadcast_chat_id, chat_id}
    # end
  end

  defp get_video_active_chat_id(state, video_id) do
    get_video_active_chat_id_with_retry(state, video_id, 3)
  end

  defp get_video_active_chat_id_with_retry(state, video_id, retries_left) when retries_left > 0 do
    with_token_retry(state, fn token ->
      case ApiClient.get_video(token, video_id, [
             "liveStreamingDetails",
             "contentDetails",
             "statistics"
           ]) do
        {:ok, video} ->
          live_streaming_details = Map.get(video, "liveStreamingDetails", %{})

          if live_streaming_details == %{} do
            Logger.info("liveStreamingDetails is empty, retrying in 500ms (#{retries_left} retries left)")

            Process.sleep(1000)
            get_video_active_chat_id_with_retry(state, video_id, retries_left - 1)
          else
            case get_in(video, ["liveStreamingDetails", "activeLiveChatId"]) do
              nil -> {:error, :no_active_chat_id}
              chat_id -> {:ok, chat_id}
            end
          end

        error ->
          error
      end
    end)
  end

  defp get_video_active_chat_id_with_retry(_state, _video_id, 0) do
    Logger.warning("liveStreamingDetails still empty after 3 retries")
    {:error, :no_active_chat_id}
  end

  defp start_chat_streaming(state, livestream_id, chat_id) do
    Logger.info("Starting gRPC chat streaming for chat ID: #{chat_id}, livestream ID: #{livestream_id}")

    GrpcStreamClient.start_link(
      state.user_id,
      livestream_id,
      state.access_token,
      chat_id,
      self()
    )
  end

  defp create_cloudflare_output(state, rtmp_url, stream_key) do
    registry_name = get_registry_name()

    CloudflareManager.create_platform_output(
      {:via, Registry, {registry_name, {:cloudflare_manager, state.user_id}}},
      :youtube,
      rtmp_url,
      stream_key
    )
  end

  defp delete_cloudflare_output(state) do
    registry_name = get_registry_name()

    case CloudflareManager.delete_platform_output(
           {:via, Registry, {registry_name, {:cloudflare_manager, state.user_id}}},
           :youtube
         ) do
      :ok ->
        Logger.info("Cloudflare output deleted: #{state.cloudflare_output_id}")

      {:error, reason} ->
        Logger.warning("Failed to delete Cloudflare output: #{inspect(reason)}")
    end
  end

  defp cleanup_cloudflare_output(%{cloudflare_output_id: nil}), do: :ok

  defp cleanup_cloudflare_output(state) do
    Logger.info("Cleaning up Cloudflare output: #{state.cloudflare_output_id}")
    delete_cloudflare_output(state)
  end

  defp cleanup_broadcast(%{broadcast_id: nil}), do: :ok

  defp cleanup_broadcast(state) do
    case with_token_retry(state, fn token ->
           ApiClient.delete_live_broadcast(token, state.broadcast_id)
         end) do
      {:ok, _} ->
        Logger.info("Broadcast deleted: #{state.broadcast_id}")

      {:error, reason} ->
        Logger.warning("Failed to delete broadcast: #{inspect(reason)}")
    end
  end

  defp cleanup_stream(%{stream_id: nil}), do: :ok

  defp cleanup_stream(state) do
    case with_token_retry(state, fn token ->
           ApiClient.delete_live_stream(token, state.stream_id)
         end) do
      {:ok, _} ->
        Logger.info("Stream deleted: #{state.stream_id}")

      {:error, reason} ->
        Logger.warning("Failed to delete stream: #{inspect(reason)}")
    end
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

  defp broadcast_chat_message(user_id, data) do
    # Data already comes in the correct format from GrpcStreamClient
    chat_event = %{
      id: data.id,
      username: data.username,
      message: data.message,
      platform: :youtube,
      timestamp: data.timestamp,
      author_channel_id: data.channel_id,
      is_moderator: data.is_moderator,
      is_owner: data.is_owner,
      # Not included in gRPC response
      profile_image_url: nil
    }

    Phoenix.PubSub.broadcast(
      Streampai.PubSub,
      "chat:#{user_id}",
      {:chat_message, chat_event}
    )
  end

  # Token refresh helpers

  defp with_token_retry(state, api_call_fn) do
    case api_call_fn.(state.access_token) do
      {:error, {:http_error, 401, _}} = error ->
        Logger.warning("Got 401 error, requesting token refresh from TokenManager...")

        case TokenManager.refresh_token(state.user_id) do
          {:ok, new_token} ->
            Logger.info("Token refreshed, retrying API call")
            # Retry with new token
            api_call_fn.(new_token)

          {:error, refresh_error} ->
            Logger.error("Token refresh failed: #{inspect(refresh_error)}")
            # Return original 401 error
            error
        end

      result ->
        result
    end
  end
end
