defmodule Streampai.LivestreamManager.Platforms.TwitchManager do
  @moduledoc """
  Manages Twitch-specific functionality for a user's livestream.
  Handles chat, events, API calls, and WebSocket connections.
  """
  @behaviour Streampai.LivestreamManager.Platforms.StreamPlatformManager

  use GenServer

  alias Streampai.LivestreamManager.CloudflareManager
  alias Streampai.LivestreamManager.StreamEvents
  alias Streampai.LivestreamManager.StreamStateServer
  alias Streampai.LivestreamManager.UserStreamManager
  alias Streampai.Twitch.ApiClient
  alias Streampai.Twitch.EventsubClient

  require Logger

  defstruct [
    :user_id,
    :livestream_id,
    :access_token,
    :refresh_token,
    :expires_at,
    :channel_id,
    :username,
    :websocket_pid,
    :eventsub_client_pid,
    :stream_key,
    :cloudflare_output_id,
    # :connecting, :connected, :disconnected, :error
    :connection_status,
    :last_viewer_count,
    :chat_enabled
  ]

  def start_link(user_id, config) when is_binary(user_id) do
    GenServer.start_link(__MODULE__, {user_id, config}, name: via_tuple(user_id))
  end

  @impl true
  def init({user_id, config}) do
    Logger.metadata(component: :twitch_manager, user_id: user_id)

    # Extract channel_id and username from extra_data if available
    extra_data = Map.get(config, :extra_data, %{})
    channel_id = Map.get(extra_data, "uid")
    username = Map.get(extra_data, "nickname") || Map.get(extra_data, "name")

    state = %__MODULE__{
      user_id: user_id,
      access_token: config.access_token,
      refresh_token: config.refresh_token,
      expires_at: config.expires_at,
      channel_id: channel_id,
      username: username,
      connection_status: :disconnected,
      last_viewer_count: 0,
      chat_enabled: true,
      eventsub_client_pid: nil
    }

    # Start connection and fetch stream key
    send(self(), :connect)

    Logger.info("TwitchManager started for user #{user_id}, channel_id: #{channel_id}, username: #{username}")

    {:ok, state}
  end

  # Client API - StreamPlatformManager behaviour implementation

  @impl true
  @doc """
  Starts streaming with the given livestream ID and optional metadata.
  """
  def start_streaming(user_id, livestream_id, metadata \\ %{}) do
    GenServer.call(via_tuple(user_id), {:start_streaming, livestream_id, metadata})
  end

  @impl true
  @doc """
  Stops the current stream.
  """
  def stop_streaming(user_id) do
    case GenServer.call(via_tuple(user_id), :stop_streaming) do
      :ok -> {:ok, %{stopped_at: DateTime.utc_now()}}
      error -> error
    end
  end

  @impl true
  @doc """
  Sends a chat message to the Twitch channel.
  """
  def send_chat_message(user_id, message) when is_binary(user_id) and is_binary(message) do
    GenServer.cast(via_tuple(user_id), {:send_chat_message, message})
    {:ok, "message_sent"}
  end

  @impl true
  @doc """
  Updates stream metadata (title, category, etc.).
  """
  def update_stream_metadata(user_id, metadata) when is_binary(user_id) and is_map(metadata) do
    GenServer.cast(via_tuple(user_id), {:update_stream_metadata, metadata})
    {:ok, metadata}
  end

  @impl true
  @doc """
  Gets current Twitch connection status and info.
  """
  def get_status(user_id) when is_binary(user_id) do
    status = GenServer.call(via_tuple(user_id), :get_status)
    {:ok, status}
  end

  @impl true
  @doc """
  Deletes a chat message (not currently supported by Twitch Helix API).
  """
  def delete_message(_user_id, _message_id) do
    {:error, :not_supported}
  end

  @impl true
  @doc """
  Bans a user from the chat permanently.
  """
  def ban_user(user_id, target_user_id, reason \\ nil) when is_binary(user_id) do
    GenServer.call(via_tuple(user_id), {:ban_user, target_user_id, reason})
  end

  @impl true
  @doc """
  Timeouts a user in the chat for a specified duration.
  """
  def timeout_user(user_id, target_user_id, duration_seconds, reason \\ nil) when is_binary(user_id) do
    GenServer.call(via_tuple(user_id), {:timeout_user, target_user_id, duration_seconds, reason})
  end

  @impl true
  @doc """
  Unbans a user from the chat.
  Note: ban_id parameter is user_id for Twitch API.
  """
  def unban_user(user_id, target_user_id) when is_binary(user_id) do
    GenServer.call(via_tuple(user_id), {:unban_user, target_user_id})
  end

  # Server callbacks

  @impl true
  def handle_info(:connect, state) do
    # Fetch user info and stream key
    new_state =
      case fetch_twitch_user_info(state) do
        {:ok, updated_state} ->
          # Start periodic tasks
          schedule_viewer_count_check()
          schedule_token_refresh()

          Logger.info("Connected to Twitch for user #{state.user_id}")
          updated_state

        {:error, reason} ->
          Logger.error("Failed to connect to Twitch: #{inspect(reason)}")
          %{state | connection_status: :error}
      end

    {:noreply, new_state}
  end

  @impl true
  def handle_info(:check_viewer_count, state) do
    {:ok, stream_info} = get_stream_info(state)

    if stream_info.viewer_count != state.last_viewer_count do
      # Broadcast viewer count update via PubSub
      Phoenix.PubSub.broadcast(
        Streampai.PubSub,
        "viewer_counts:#{state.user_id}",
        {:viewer_update, :twitch, stream_info.viewer_count}
      )

      # Update stream state
      update_platform_status(state, %{viewer_count: stream_info.viewer_count})

      # Update StreamActor with viewer count
      UserStreamManager.update_stream_actor_viewers(
        state.user_id,
        :twitch,
        stream_info.viewer_count
      )
    end

    schedule_viewer_count_check()
    {:noreply, %{state | last_viewer_count: stream_info.viewer_count}}
  end

  @impl true
  def handle_info(:refresh_token, state) do
    {:ok, new_state} = refresh_access_token(state)
    Logger.info("Refreshed Twitch token for user #{state.user_id}")
    schedule_token_refresh()
    {:noreply, new_state}
  end

  @impl true
  def handle_info({:websocket_event, event}, state) do
    process_twitch_event(event, state)
    {:noreply, state}
  end

  @impl true
  def handle_info({:twitch_message, :chat_message, _data}, state) do
    # Chat messages are already broadcast by EventsubClient, no need to rebroadcast
    {:noreply, state}
  end

  @impl true
  def handle_info({:twitch_eventsub_ended, :missing_scopes}, state) do
    Logger.warning("""
    Twitch EventSub disconnected: Missing OAuth scopes.

    Chat messages will not be received until the Twitch account is reconnected.
    Please disconnect and reconnect Twitch at: /streaming/connect/twitch
    """)

    {:noreply, %{state | eventsub_client_pid: nil}}
  end

  @impl true
  def handle_info({:twitch_eventsub_ended, reason}, state) do
    Logger.warning("Twitch EventSub ended: #{inspect(reason)}")
    {:noreply, %{state | eventsub_client_pid: nil}}
  end

  @impl true
  def handle_cast({:send_chat_message, message}, state) do
    if state.connection_status == :connected and state.chat_enabled and state.channel_id do
      case ApiClient.send_chat_message(
             state.access_token,
             state.channel_id,
             state.channel_id,
             message
           ) do
        {:ok, _response} ->
          Logger.debug("Sent chat message to Twitch for user #{state.user_id}")

        {:error, reason} ->
          Logger.error("Failed to send chat message: #{inspect(reason)}")
      end
    else
      Logger.warning("Cannot send chat message: not connected or missing channel_id")
    end

    {:noreply, state}
  end

  @impl true
  def handle_cast({:update_stream_metadata, metadata}, state) do
    :ok = update_twitch_stream_info(state, metadata)
    Logger.info("Updated Twitch stream metadata for user #{state.user_id}")

    update_platform_status(state, %{
      title: metadata[:title],
      category: metadata[:category]
    })

    {:noreply, state}
  end

  @impl true
  def handle_call({:start_streaming, livestream_id, metadata}, _from, state) do
    Logger.info("Starting stream: #{livestream_id}, stream_key present: #{!is_nil(state.stream_key)}")

    # Start EventSub chat client
    eventsub_client_pid = start_chat_streaming(state, livestream_id)

    # Create Cloudflare output for Twitch if stream key is available
    case create_cloudflare_output(state) do
      {:ok, output_id} ->
        Logger.info("Created Cloudflare output for Twitch: #{output_id}")
        StreamEvents.emit_platform_started(state.user_id, livestream_id, :twitch)

        # Set the stream title if provided
        if metadata[:title] do
          update_twitch_stream_info(state, metadata)
        end

        new_state = %{
          state
          | livestream_id: livestream_id,
            cloudflare_output_id: output_id,
            eventsub_client_pid: eventsub_client_pid
        }

        {:reply, :ok, new_state}

      {:error, :no_stream_key} ->
        Logger.warning(
          "Cannot create Twitch output: no stream key configured. Connection status: #{state.connection_status}"
        )

        # Still start streaming but without Cloudflare output
        StreamEvents.emit_platform_started(state.user_id, livestream_id, :twitch)

        new_state = %{
          state
          | livestream_id: livestream_id,
            eventsub_client_pid: eventsub_client_pid
        }

        {:reply, {:error, :no_stream_key}, new_state}

      {:error, reason} ->
        Logger.error("Failed to create Cloudflare output: #{inspect(reason)}")
        {:reply, {:error, reason}, state}
    end
  end

  @impl true
  def handle_call(:stop_streaming, _from, state) do
    Logger.info("Stopping stream")

    # Stop EventSub chat client
    stop_chat_streaming(state)

    # Cleanup Cloudflare output if it exists
    cleanup_cloudflare_output(state)

    if state.livestream_id do
      StreamEvents.emit_platform_stopped(state.user_id, state.livestream_id, :twitch)
    end

    new_state = %{state | livestream_id: nil, cloudflare_output_id: nil, eventsub_client_pid: nil}
    {:reply, :ok, new_state}
  end

  @impl true
  def handle_call(:get_status, _from, state) do
    # Only include channel_url if actively streaming (livestream_id is set)
    channel_url =
      if state.username && state.livestream_id do
        "https://www.twitch.tv/#{state.username}"
      end

    status = %{
      platform: :twitch,
      connection_status: state.connection_status,
      username: state.username,
      channel_id: state.channel_id,
      last_viewer_count: state.last_viewer_count,
      chat_enabled: state.chat_enabled,
      livestream_id: Map.get(state, :livestream_id),
      channel_url: channel_url
    }

    {:reply, status, state}
  end

  @impl true
  def handle_call({:ban_user, target_user_id, reason}, _from, state) do
    do_ban_user(target_user_id, reason, state)
  end

  @impl true
  def handle_call({:timeout_user, target_user_id, duration_seconds, reason}, _from, state) do
    do_timeout_user(target_user_id, duration_seconds, reason, state)
  end

  @impl true
  def handle_call({:unban_user, target_user_id}, _from, state) do
    do_unban_user(target_user_id, state)
  end

  # Helper functions

  defp fetch_twitch_user_info(state) do
    Logger.info("Fetching Twitch stream key (channel_id already set: #{!is_nil(state.channel_id)})...")

    # If we already have channel_id from extra_data, just try to get the stream key
    if state.channel_id do
      case ApiClient.get_stream_key(state.access_token, state.channel_id) do
        {:ok, stream_key} ->
          new_state = %{
            state
            | connection_status: :connected,
              stream_key: stream_key
          }

          update_platform_status(new_state, %{status: :connected})

          Logger.info(
            "✓ Fetched Twitch stream key for #{state.username} (key length: #{String.length(stream_key)} chars)"
          )

          {:ok, new_state}

        {:error, reason} ->
          Logger.warning(
            "Failed to get Twitch stream key (you may need to reconnect Twitch with proper scopes): #{inspect(reason)}"
          )

          # Still mark as connected since we have channel_id for chat
          new_state = %{state | connection_status: :connected}
          update_platform_status(new_state, %{status: :connected})

          {:ok, new_state}
      end
    else
      # Fallback: fetch user info first if channel_id not in extra_data
      Logger.info("No channel_id in extra_data, fetching from API...")

      with {:get_user, {:ok, user_data}} <-
             {:get_user, ApiClient.get_user_info(state.access_token)},
           broadcaster_id = user_data["id"],
           username = user_data["login"],
           _ = Logger.info("Got Twitch user: #{username} (#{broadcaster_id})"),
           {:get_key, {:ok, stream_key}} <-
             {:get_key, ApiClient.get_stream_key(state.access_token, broadcaster_id)} do
        new_state = %{
          state
          | connection_status: :connected,
            username: username,
            channel_id: broadcaster_id,
            stream_key: stream_key
        }

        update_platform_status(new_state, %{status: :connected})

        Logger.info("✓ Fetched Twitch stream key for #{username} (key length: #{String.length(stream_key)} chars)")

        {:ok, new_state}
      else
        {:get_user, {:error, reason}} ->
          Logger.error("Failed to get Twitch user info: #{inspect(reason)}")
          {:error, reason}

        {:get_key, {:error, reason}} ->
          Logger.warning("Failed to get Twitch stream key: #{inspect(reason)}")
          # Still return ok if we got user info
          {:ok, state}

        error ->
          Logger.error("Unexpected error fetching Twitch info: #{inspect(error)}")
          {:error, error}
      end
    end
  end

  defp get_stream_info(state) do
    case ApiClient.get_stream_info(state.access_token, state.channel_id) do
      {:ok, nil} ->
        # Stream is offline
        {:ok,
         %{
           viewer_count: 0,
           title: nil,
           category: nil,
           started_at: nil
         }}

      {:ok, stream_data} ->
        # Stream is live
        {:ok,
         %{
           viewer_count: Map.get(stream_data, "viewer_count", 0),
           title: Map.get(stream_data, "title"),
           category: Map.get(stream_data, "game_name"),
           started_at: parse_twitch_timestamp(Map.get(stream_data, "started_at"))
         }}

      {:error, reason} ->
        Logger.warning("Failed to get Twitch stream info: #{inspect(reason)}")

        {:ok,
         %{
           viewer_count: state.last_viewer_count || 0,
           title: nil,
           category: nil,
           started_at: nil
         }}
    end
  end

  defp parse_twitch_timestamp(nil), do: nil

  defp parse_twitch_timestamp(timestamp_str) when is_binary(timestamp_str) do
    case DateTime.from_iso8601(timestamp_str) do
      {:ok, datetime, _offset} -> datetime
      _ -> nil
    end
  end

  defp refresh_access_token(state) do
    # TODO: Implement actual token refresh logic
    {:ok, state}
  end

  defp start_chat_streaming(state, livestream_id) do
    if state.channel_id && state.access_token && state.chat_enabled do
      case EventsubClient.start_link(
             state.user_id,
             livestream_id,
             state.channel_id,
             state.access_token,
             self()
           ) do
        {:ok, pid} ->
          Logger.info("Started Twitch EventSub client for broadcaster #{state.channel_id}")
          pid

        {:error, reason} ->
          Logger.error("Failed to start Twitch EventSub client: #{inspect(reason)}")
          nil
      end
    else
      Logger.warning("Cannot start chat: missing channel_id or access token")
      nil
    end
  end

  defp stop_chat_streaming(%{eventsub_client_pid: nil}), do: :ok

  defp stop_chat_streaming(state) do
    if state.eventsub_client_pid && Process.alive?(state.eventsub_client_pid) do
      EventsubClient.stop(state.eventsub_client_pid)
      Logger.info("Stopped Twitch EventSub client")
    end

    :ok
  end

  defp update_twitch_stream_info(state, metadata) do
    params = %{
      title: metadata[:title]
      # Note: Twitch uses game_id, not game name. We would need to look up the game ID
      # from the game name if we want to support category updates.
      # For now, just update the title.
    }

    case ApiClient.update_channel_info(state.access_token, state.channel_id, params) do
      {:ok, _response} ->
        Logger.info("Updated Twitch channel info: #{inspect(params)}")
        :ok

      {:error, reason} ->
        Logger.error("Failed to update Twitch channel info: #{inspect(reason)}")
        :ok
    end
  end

  defp process_twitch_event(%{type: "follow", user_name: username}, state) do
    process_follow_event(username, state)
  end

  defp process_twitch_event(%{type: "subscription", user_name: username, tier: tier}, state) do
    process_subscription_event(username, tier, state)
  end

  defp process_twitch_event(%{type: "raid", from_broadcaster_user_name: username, viewers: viewers}, state) do
    process_raid_event(username, viewers, state)
  end

  defp process_twitch_event(_event, _state), do: :ok

  defp process_follow_event(username, state) do
    _follow_event = %{
      type: :follow,
      user_id: state.user_id,
      platform: :twitch,
      username: username
    }

    # EventBroadcaster.broadcast_event(follow_event)
  end

  defp process_subscription_event(username, tier, state) do
    _sub_event = %{
      type: :subscription,
      user_id: state.user_id,
      platform: :twitch,
      username: username,
      tier: tier
    }

    # EventBroadcaster.broadcast_event(sub_event)
  end

  defp process_raid_event(username, viewers, state) do
    _raid_event = %{
      type: :raid,
      user_id: state.user_id,
      platform: :twitch,
      username: username,
      viewer_count: viewers
    }

    # EventBroadcaster.broadcast_event(raid_event)
  end

  defp update_platform_status(state, status_update) do
    case Registry.lookup(Streampai.LivestreamManager.Registry, {:stream_state, state.user_id}) do
      [{pid, _}] ->
        StreamStateServer.update_platform_status(pid, :twitch, status_update)

      [] ->
        :ok
    end
  end

  defp schedule_viewer_count_check do
    # Every 30 seconds
    Process.send_after(self(), :check_viewer_count, 30_000)
  end

  defp schedule_token_refresh do
    # Every hour
    Process.send_after(self(), :refresh_token, 3_600_000)
  end

  defp via_tuple(user_id) do
    registry_name = get_registry_name()
    {:via, Registry, {registry_name, {:platform_manager, user_id, :twitch}}}
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

  defp create_cloudflare_output(%{stream_key: nil}) do
    {:error, :no_stream_key}
  end

  defp create_cloudflare_output(state) do
    registry_name = get_registry_name()
    # Twitch's primary RTMP ingest server
    rtmp_url = "rtmp://live.twitch.tv/app"

    Logger.info(
      "Creating Cloudflare output with RTMP URL: #{rtmp_url}, stream_key length: #{String.length(state.stream_key)}"
    )

    CloudflareManager.create_platform_output(
      {:via, Registry, {registry_name, {:cloudflare_manager, state.user_id}}},
      :twitch,
      rtmp_url,
      state.stream_key
    )
  end

  defp cleanup_cloudflare_output(%{cloudflare_output_id: nil}), do: :ok

  defp cleanup_cloudflare_output(state) do
    Logger.info("Cleaning up Cloudflare output: #{state.cloudflare_output_id}")
    registry_name = get_registry_name()

    case CloudflareManager.delete_platform_output(
           {:via, Registry, {registry_name, {:cloudflare_manager, state.user_id}}},
           :twitch
         ) do
      :ok ->
        Logger.info("Cloudflare output deleted: #{state.cloudflare_output_id}")

      {:error, reason} ->
        Logger.warning("Failed to delete Cloudflare output: #{inspect(reason)}")
    end
  end

  defp do_ban_user(_target_user_id, _reason, %{channel_id: nil} = state) do
    {:reply, {:error, :no_channel_id}, state}
  end

  defp do_ban_user(target_user_id, reason, state) do
    opts = if reason, do: [reason: reason], else: []

    case ApiClient.ban_user(
           state.access_token,
           state.channel_id,
           state.channel_id,
           target_user_id,
           opts
         ) do
      {:ok, ban_data} ->
        Logger.info("User banned: #{target_user_id}")
        {:reply, {:ok, ban_data}, state}

      {:error, reason} ->
        Logger.error("Failed to ban user: #{inspect(reason)}")
        {:reply, {:error, reason}, state}
    end
  end

  defp do_timeout_user(_target_user_id, _duration_seconds, _reason, %{channel_id: nil} = state) do
    {:reply, {:error, :no_channel_id}, state}
  end

  defp do_timeout_user(target_user_id, duration_seconds, reason, state) do
    opts = [duration: duration_seconds]
    opts = if reason, do: Keyword.put(opts, :reason, reason), else: opts

    case ApiClient.ban_user(
           state.access_token,
           state.channel_id,
           state.channel_id,
           target_user_id,
           opts
         ) do
      {:ok, ban_data} ->
        Logger.info("User timed out: #{target_user_id} for #{duration_seconds}s")
        {:reply, {:ok, ban_data}, state}

      {:error, reason} ->
        Logger.error("Failed to timeout user: #{inspect(reason)}")
        {:reply, {:error, reason}, state}
    end
  end

  defp do_unban_user(_target_user_id, %{channel_id: nil} = state) do
    {:reply, {:error, :no_channel_id}, state}
  end

  defp do_unban_user(target_user_id, state) do
    case ApiClient.unban_user(
           state.access_token,
           state.channel_id,
           state.channel_id,
           target_user_id
         ) do
      :ok ->
        Logger.info("User unbanned: #{target_user_id}")
        {:reply, :ok, state}

      {:error, reason} ->
        Logger.error("Failed to unban user: #{inspect(reason)}")
        {:reply, {:error, reason}, state}
    end
  end
end
