defmodule Streampai.LivestreamManager.Platforms.YouTubeManager do
  @moduledoc """
  Manages YouTube platform integration for live streaming.
  Handles broadcast creation, stream binding, chat, and lifecycle management.
  """
  @behaviour Streampai.LivestreamManager.Platforms.StreamPlatformManager

  use GenServer

  alias Streampai.LivestreamManager.CloudflareManager
  alias Streampai.LivestreamManager.Platforms.YouTubeMetricsCollector
  alias Streampai.LivestreamManager.StreamEvents
  alias Streampai.Stream.MetadataHelper
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
    :stream_uuid,
    :chat_id,
    :chat_pid,
    :metrics_collector_pid,
    :stream_key,
    :rtmp_url,
    :cloudflare_output_id,
    :is_active,
    :started_at,
    viewer_count: 0
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

  # Client API - StreamPlatformManager behaviour implementation

  @impl true
  def start_streaming(user_id, stream_uuid, metadata \\ %{}) do
    GenServer.call(via_tuple(user_id), {:start_streaming, stream_uuid, metadata}, 30_000)
  end

  @impl true
  def stop_streaming(user_id) do
    case GenServer.call(via_tuple(user_id), :stop_streaming) do
      :ok -> {:ok, %{stopped_at: DateTime.utc_now()}}
      error -> error
    end
  end

  @impl true
  def send_chat_message(pid, message) when is_pid(pid) and is_binary(message) do
    case GenServer.call(pid, {:send_chat_message, message}) do
      :ok -> {:ok, "message_sent"}
      error -> error
    end
  end

  @impl true
  def update_stream_metadata(pid, metadata) when is_pid(pid) and is_map(metadata) do
    case GenServer.call(pid, {:update_stream_metadata, metadata}) do
      :ok -> {:ok, metadata}
      error -> error
    end
  end

  @impl true
  def get_status(user_id) when is_binary(user_id) do
    GenServer.call(via_tuple(user_id), :get_status)
  end

  @impl true
  def delete_message(user_id, message_id) when is_binary(user_id) do
    GenServer.call(via_tuple(user_id), {:delete_message, message_id})
  end

  @impl true
  def ban_user(user_id, target_user_id, _reason \\ nil) when is_binary(user_id) do
    GenServer.call(via_tuple(user_id), {:ban_user, target_user_id, :permanent})
  end

  @impl true
  def timeout_user(user_id, target_user_id, duration_seconds, _reason \\ nil) when is_binary(user_id) do
    GenServer.call(
      via_tuple(user_id),
      {:ban_user, target_user_id, {:temporary, duration_seconds}}
    )
  end

  @impl true
  def unban_user(user_id, ban_id) when is_binary(user_id) do
    GenServer.call(via_tuple(user_id), {:unban_user, ban_id})
  end

  # Additional helper functions

  @doc """
  Gets the current viewer count for the stream.
  """
  def get_viewer_count(user_id) when is_binary(user_id) do
    GenServer.call(via_tuple(user_id), :get_viewer_count)
  end

  # Server callbacks

  @impl true
  def handle_call({:start_streaming, stream_uuid}, from, state) do
    handle_call({:start_streaming, stream_uuid, %{}}, from, state)
  end

  @impl true
  def handle_call({:start_streaming, stream_uuid, metadata}, _from, state) do
    Logger.info("Starting stream: #{stream_uuid} with metadata: #{inspect(metadata)}")

    with {:create_broadcast, {:ok, broadcast}} <-
           {:create_broadcast, create_broadcast(state, stream_uuid, metadata)},
         {:create_stream, {:ok, stream}} <- {:create_stream, create_stream(state, stream_uuid)},
         {:bind_stream, {:ok, bound_broadcast}} <-
           {:bind_stream, bind_stream(state, broadcast["id"], stream["id"])},
         {:get_chat_id, {:ok, broadcast_chat_id}} <-
           {:get_chat_id, get_chat_id(state, bound_broadcast)},
         {:start_chat, {:ok, chat_pid}} <-
           {:start_chat, start_chat_streaming(state, stream_uuid, broadcast_chat_id)},
         stream_key = get_in(stream, ["cdn", "ingestionInfo", "streamName"]),
         rtmp_url = get_in(stream, ["cdn", "ingestionInfo", "ingestionAddress"]),
         {:create_output, {:ok, output_id}} <-
           {:create_output, create_cloudflare_output(state, rtmp_url, stream_key)},
         {:start_metrics_collector, {:ok, collector_pid}} <-
           {:start_metrics_collector, start_metrics_collector(state, broadcast["id"])} do
      new_state = %{
        state
        | is_active: true,
          broadcast_id: broadcast["id"],
          stream_id: stream["id"],
          stream_uuid: stream_uuid,
          chat_id: broadcast_chat_id,
          chat_pid: chat_pid,
          metrics_collector_pid: collector_pid,
          stream_key: stream_key,
          rtmp_url: rtmp_url,
          cloudflare_output_id: output_id
      }

      Logger.info("Stream created successfully - RTMP: #{rtmp_url}, Key: #{stream_key}, Cloudflare Output: #{output_id}")

      StreamEvents.emit_platform_started(state.user_id, stream_uuid, :youtube)

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

    if state.metrics_collector_pid do
      Process.exit(state.metrics_collector_pid, :normal)
    end

    cleanup_cloudflare_output(state)
    cleanup_broadcast(state)
    cleanup_stream(state)

    if state.stream_uuid do
      StreamEvents.emit_platform_stopped(state.user_id, state.stream_uuid, :youtube)
    end

    new_state = %{
      state
      | is_active: false,
        broadcast_id: nil,
        stream_id: nil,
        stream_uuid: nil,
        chat_id: nil,
        chat_pid: nil,
        metrics_collector_pid: nil,
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
  def handle_call(:get_viewer_count, _from, state) do
    {:reply, state.viewer_count, state}
  end

  @impl true
  def handle_call({:delete_message, message_id}, _from, state) do
    do_delete_message(message_id, state)
  end

  @impl true
  def handle_call({:ban_user, channel_id, ban_type}, _from, state) do
    do_ban_user(channel_id, ban_type, state)
  end

  @impl true
  def handle_call({:unban_user, ban_id}, _from, state) do
    do_unban_user(ban_id, state)
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
  def handle_info({:viewer_count_update, viewer_count}, state) do
    Logger.debug("Metrics update - viewer count: #{viewer_count}")

    # Broadcast viewer count update via PubSub
    Phoenix.PubSub.broadcast(
      Streampai.PubSub,
      "viewer_counts:#{state.user_id}",
      {:viewer_update, :youtube, viewer_count}
    )

    {:noreply, %{state | viewer_count: viewer_count}}
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

    # Stop metrics collector
    if state.metrics_collector_pid do
      Process.exit(state.metrics_collector_pid, :normal)
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

  defp create_broadcast(state, stream_uuid, metadata) do
    title = MetadataHelper.get_stream_title(metadata, stream_uuid)
    description = Map.get(metadata, :description)

    snippet =
      MetadataHelper.maybe_add_description(
        %{title: title, scheduledStartTime: DateTime.to_iso8601(DateTime.utc_now())},
        description
      )

    broadcast_data = %{
      snippet: snippet,
      status: %{
        privacyStatus: "public",
        selfDeclaredMadeForKids: false
      },
      contentDetails: %{
        latencyPreference: "low",
        enableAutoStart: true
      }
    }

    with_token_retry(state, fn token ->
      ApiClient.insert_live_broadcast(token, "snippet,status,contentDetails", broadcast_data)
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

  defp do_delete_message(_message_id, %{chat_id: nil} = state) do
    {:reply, {:error, :no_active_chat}, state}
  end

  defp do_delete_message(message_id, state) do
    case with_token_retry(state, fn token ->
           ApiClient.delete_live_chat_message(token, message_id)
         end) do
      {:ok, _result} ->
        Logger.info("Chat message deleted: #{message_id}")
        {:reply, :ok, state}

      {:error, reason} ->
        Logger.error("Failed to delete chat message: #{inspect(reason)}")
        {:reply, {:error, reason}, state}
    end
  end

  defp do_ban_user(_channel_id, _ban_type, %{chat_id: nil} = state) do
    {:reply, {:error, :no_active_chat}, state}
  end

  defp do_ban_user(channel_id, :permanent, state) do
    case with_token_retry(state, fn token ->
           ApiClient.ban_user(token, state.chat_id, channel_id, type: "permanent")
         end) do
      {:ok, result} ->
        ban_id = Map.get(result, "id")
        Logger.info("User banned permanently: #{channel_id}, ban_id: #{ban_id}")
        {:reply, {:ok, ban_id}, state}

      {:error, reason} ->
        Logger.error("Failed to ban user: #{inspect(reason)}")
        {:reply, {:error, reason}, state}
    end
  end

  defp do_ban_user(channel_id, {:temporary, duration_seconds}, state) do
    case with_token_retry(state, fn token ->
           ApiClient.ban_user(token, state.chat_id, channel_id,
             type: "temporary",
             duration_seconds: duration_seconds
           )
         end) do
      {:ok, result} ->
        ban_id = Map.get(result, "id")
        Logger.info("User timed out: #{channel_id} for #{duration_seconds}s, ban_id: #{ban_id}")
        {:reply, {:ok, ban_id}, state}

      {:error, reason} ->
        Logger.error("Failed to timeout user: #{inspect(reason)}")
        {:reply, {:error, reason}, state}
    end
  end

  defp do_unban_user(ban_id, state) do
    case with_token_retry(state, fn token ->
           ApiClient.unban_user(token, ban_id)
         end) do
      {:ok, _result} ->
        Logger.info("User unbanned: ban_id #{ban_id}")
        {:reply, :ok, state}

      {:error, reason} ->
        Logger.error("Failed to unban user: #{inspect(reason)}")
        {:reply, {:error, reason}, state}
    end
  end

  defp do_update_stream_metadata(_metadata, %{broadcast_id: nil} = state) do
    {:reply, {:error, :no_active_broadcast}, state}
  end

  defp do_update_stream_metadata(metadata, state) do
    with {:get_broadcast, {:ok, current_broadcast}} <-
           {:get_broadcast,
            with_token_retry(state, fn token ->
              ApiClient.get_live_broadcast(token, state.broadcast_id, "snippet")
            end)},
         current_snippet = Map.get(current_broadcast, "snippet", %{}),
         updated_snippet =
           current_snippet
           |> maybe_update_field("title", Map.get(metadata, :title))
           |> maybe_update_field("description", Map.get(metadata, :description)),
         broadcast_data = %{
           id: state.broadcast_id,
           snippet: updated_snippet
         },
         {:update_broadcast, {:ok, _result}} <-
           {:update_broadcast,
            with_token_retry(state, fn token ->
              ApiClient.update_live_broadcast(token, "snippet", broadcast_data)
            end)} do
      Logger.info("Stream metadata updated: #{inspect(metadata)}")
      {:reply, :ok, state}
    else
      {step, {:error, reason}} ->
        Logger.error("Failed to update metadata at #{step}: #{inspect(reason)}")
        {:reply, {:error, reason}, state}
    end
  end

  defp maybe_update_field(map, _key, nil), do: map
  defp maybe_update_field(map, key, value), do: Map.put(map, key, value)

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

  defp get_chat_id(_state, broadcast) do
    case get_in(broadcast, ["snippet", "liveChatId"]) do
      nil -> {:error, :no_live_chat_id}
      chat_id -> {:ok, chat_id}
    end
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

  defp start_metrics_collector(state, video_id) do
    Logger.info("Starting metrics collector for video ID: #{video_id}")

    YouTubeMetricsCollector.start_link(
      user_id: state.user_id,
      video_id: video_id,
      access_token: state.access_token,
      parent_pid: self()
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
            Logger.info("Token refreshed (length: #{String.length(new_token)}), retrying API call")

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
