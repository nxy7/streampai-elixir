defmodule Streampai.LivestreamManager.Platforms.YouTubeManager do
  @moduledoc """
  Manages YouTube platform integration for live streaming.
  Handles broadcast creation, stream binding, chat, and lifecycle management.
  """
  use GenServer

  alias Streampai.LivestreamManager.CloudflareManager
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

    # Check if token needs refresh and refresh if needed
    config =
      if token_needs_refresh?(config.expires_at) do
        Logger.info("Token expiring soon, refreshing...")

        case refresh_google_token(config.refresh_token) do
          {:ok, new_config} ->
            # Update database with new tokens
            update_streaming_account_tokens(user_id, new_config)
            Logger.info("Token refreshed successfully")
            new_config

          {:error, reason} ->
            Logger.error("Failed to refresh token: #{inspect(reason)}")
            # Try with old token anyway
            config
        end
      else
        config
      end

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
         {:extract_chat_id, {:ok, chat_id}} <-
           {:extract_chat_id, extract_chat_id(bound_broadcast)},
         {:start_chat, {:ok, chat_pid}} <- {:start_chat, start_chat_streaming(state, chat_id)},
         stream_key = get_in(stream, ["cdn", "ingestionInfo", "streamName"]),
         rtmp_url = get_in(stream, ["cdn", "ingestionInfo", "ingestionAddress"]),
         {:create_output, {:ok, output_id}} <-
           {:create_output, create_cloudflare_output(state, rtmp_url, stream_key)} do
      new_state = %{
        state
        | is_active: true,
          broadcast_id: broadcast["id"],
          stream_id: stream["id"],
          chat_id: chat_id,
          chat_pid: chat_pid,
          stream_key: stream_key,
          rtmp_url: rtmp_url,
          cloudflare_output_id: output_id
      }

      Logger.info(
        "Stream created successfully - RTMP: #{new_state.rtmp_url}, Key: #{new_state.stream_key}, Cloudflare Output: #{output_id}"
      )

      {:reply, {:ok, %{rtmp_url: new_state.rtmp_url, stream_key: new_state.stream_key}}, new_state}
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
      LiveChatStream.stop_stream(state.chat_pid)
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
  def handle_info({:chat_message, message}, state) do
    author = get_in(message, ["authorDetails", "displayName"]) || "Unknown"
    text = get_in(message, ["snippet", "displayMessage"]) || ""

    Logger.debug("💬 Chat message from #{author}: #{text}")

    # Broadcast chat message to OBS widgets
    broadcast_chat_message(state.user_id, message)

    {:noreply, state}
  end

  @impl true
  def handle_info({:chat_error, reason}, state) do
    Logger.error("Chat error: #{inspect(reason)}")
    {:noreply, state}
  end

  @impl true
  def handle_info({:chat_ended, reason}, state) do
    Logger.info("Chat ended: #{inspect(reason)}")
    new_state = %{state | chat_pid: nil}
    {:noreply, new_state}
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
      LiveChatStream.stop_stream(state.chat_pid)
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

  defp extract_chat_id(broadcast) do
    case get_in(broadcast, ["snippet", "liveChatId"]) do
      nil -> {:error, :no_live_chat_id}
      chat_id -> {:ok, chat_id}
    end
  end

  defp start_chat_streaming(state, chat_id) do
    LiveChatStream.start_stream(state.access_token, chat_id, self())
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

  defp broadcast_chat_message(user_id, message) do
    chat_event = %{
      id: get_in(message, ["id"]) || "msg_#{System.unique_integer([:positive])}",
      username: get_in(message, ["authorDetails", "displayName"]) || "Unknown",
      message: get_in(message, ["snippet", "displayMessage"]) || "",
      platform: :youtube,
      timestamp: parse_timestamp(get_in(message, ["snippet", "publishedAt"])),
      author_channel_id: get_in(message, ["authorDetails", "channelId"]),
      is_moderator: get_in(message, ["authorDetails", "isChatModerator"]) || false,
      is_owner: get_in(message, ["authorDetails", "isChatOwner"]) || false,
      profile_image_url: get_in(message, ["authorDetails", "profileImageUrl"])
    }

    Phoenix.PubSub.broadcast(
      Streampai.PubSub,
      "chat:#{user_id}",
      {:chat_message, chat_event}
    )
  end

  defp parse_timestamp(nil), do: DateTime.utc_now()

  defp parse_timestamp(timestamp_string) do
    case DateTime.from_iso8601(timestamp_string) do
      {:ok, datetime, _offset} -> datetime
      {:error, _} -> DateTime.utc_now()
    end
  end

  # Token refresh helpers

  defp with_token_retry(state, api_call_fn) do
    case api_call_fn.(state.access_token) do
      {:error, {:http_error, 401, _}} = error ->
        Logger.warning("Got 401 error, attempting token refresh...")

        case refresh_google_token(state.refresh_token) do
          {:ok, new_config} ->
            update_streaming_account_tokens(state.user_id, new_config)
            Logger.info("Token refreshed, retrying API call")
            # Retry with new token
            api_call_fn.(new_config.access_token)

          {:error, refresh_error} ->
            Logger.error("Token refresh failed: #{inspect(refresh_error)}")
            # Return original 401 error
            error
        end

      result ->
        result
    end
  end

  defp token_needs_refresh?(nil), do: true

  defp token_needs_refresh?(expires_at) do
    # Refresh if token expires within 5 minutes
    DateTime.diff(expires_at, DateTime.utc_now(), :second) < 300
  end

  defp refresh_google_token(refresh_token) do
    client_id = System.get_env("GOOGLE_CLIENT_ID")
    client_secret = System.get_env("GOOGLE_CLIENT_SECRET")

    case Req.post("https://oauth2.googleapis.com/token",
           form: [
             client_id: client_id,
             client_secret: client_secret,
             refresh_token: refresh_token,
             grant_type: "refresh_token"
           ]
         ) do
      {:ok, %{status: 200, body: body}} ->
        new_refresh_token = Map.get(body, "refresh_token", refresh_token)

        {:ok,
         %{
           access_token: body["access_token"],
           refresh_token: new_refresh_token,
           expires_at: DateTime.add(DateTime.utc_now(), body["expires_in"], :second)
         }}

      {:ok, %{status: status, body: body}} ->
        Logger.error("Google token refresh failed with status #{status}: #{inspect(body)}")
        {:error, {:http_error, status, body}}

      {:error, reason} ->
        Logger.error("Google token refresh request failed: #{inspect(reason)}")
        {:error, reason}
    end
  end

  defp update_streaming_account_tokens(user_id, new_config) do
    alias Streampai.Accounts.StreamingAccount

    require Ash.Query

    # Get the user for actor context
    case Ash.get(Streampai.Accounts.User, user_id, authorize?: false) do
      {:ok, user} ->
        # Find the YouTube streaming account
        query =
          StreamingAccount
          |> Ash.Query.for_read(:read, %{}, actor: user)
          |> Ash.Query.filter(user_id: user_id, platform: :youtube)

        case Ash.read(query, actor: user) do
          {:ok, [account]} ->
            # Update the tokens
            account
            |> Ash.Changeset.for_update(:refresh_token, %{
              access_token: new_config.access_token,
              refresh_token: new_config.refresh_token,
              access_token_expires_at: new_config.expires_at
            })
            |> Ash.update(actor: user)

          {:ok, []} ->
            Logger.warning("No YouTube streaming account found for user #{user_id}")
            {:error, :account_not_found}

          {:error, reason} ->
            Logger.error("Failed to read streaming account: #{inspect(reason)}")
            {:error, reason}
        end

      {:error, reason} ->
        Logger.error("Failed to load user #{user_id}: #{inspect(reason)}")
        {:error, reason}
    end
  end
end
