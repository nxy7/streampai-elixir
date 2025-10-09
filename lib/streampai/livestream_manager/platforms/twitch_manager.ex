defmodule Streampai.LivestreamManager.Platforms.TwitchManager do
  @moduledoc """
  Manages Twitch-specific functionality for a user's livestream.
  Handles chat, events, API calls, and WebSocket connections.
  """
  use GenServer

  alias Streampai.LivestreamManager.StreamEvents
  alias Streampai.LivestreamManager.StreamStateServer

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

    state = %__MODULE__{
      user_id: user_id,
      access_token: config.access_token,
      refresh_token: config.refresh_token,
      expires_at: config.expires_at,
      connection_status: :disconnected,
      last_viewer_count: 0,
      chat_enabled: true
    }

    # Start connection process
    send(self(), :connect)

    Logger.info("TwitchManager started for user #{user_id}")
    {:ok, state}
  end

  # Client API

  @doc """
  Starts streaming with the given livestream ID.
  """
  def start_streaming(user_id, livestream_id) do
    GenServer.call(via_tuple(user_id), {:start_streaming, livestream_id})
  end

  @doc """
  Stops the current stream.
  """
  def stop_streaming(user_id) do
    GenServer.call(via_tuple(user_id), :stop_streaming)
  end

  @doc """
  Sends a chat message to the Twitch channel.
  """
  def send_chat_message(pid, message) when is_pid(pid) do
    GenServer.cast(pid, {:send_chat_message, message})
  end

  def send_chat_message(user_id, message) when is_binary(user_id) do
    GenServer.cast(via_tuple(user_id), {:send_chat_message, message})
  end

  @doc """
  Updates stream metadata (title, category, etc.).
  """
  def update_stream_metadata(pid, metadata) when is_pid(pid) do
    GenServer.cast(pid, {:update_stream_metadata, metadata})
  end

  def update_stream_metadata(user_id, metadata) when is_binary(user_id) do
    GenServer.cast(via_tuple(user_id), {:update_stream_metadata, metadata})
  end

  @doc """
  Gets current Twitch connection status and info.
  """
  def get_status(server) do
    GenServer.call(server, :get_status)
  end

  # Server callbacks

  @impl true
  def handle_info(:connect, state) do
    {:ok, new_state} = authenticate_and_connect(state)
    # Start periodic tasks
    schedule_viewer_count_check()
    schedule_token_refresh()

    Logger.info("Connected to Twitch for user #{state.user_id}")
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
  def handle_cast({:send_chat_message, message}, state) do
    if state.connection_status == :connected and state.chat_enabled do
      :ok = send_twitch_chat_message(state, message)
      Logger.debug("Sent chat message to Twitch for user #{state.user_id}")
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
  def handle_call({:start_streaming, livestream_id}, _from, state) do
    Logger.info("Starting stream: #{livestream_id}")
    StreamEvents.emit_platform_started(state.user_id, livestream_id, :twitch)
    new_state = %{state | livestream_id: livestream_id}
    {:reply, :ok, new_state}
  end

  @impl true
  def handle_call(:stop_streaming, _from, state) do
    Logger.info("Stopping stream")

    if state.livestream_id do
      StreamEvents.emit_platform_stopped(state.user_id, state.livestream_id, :twitch)
    end

    new_state = %{state | livestream_id: nil}
    {:reply, :ok, new_state}
  end

  @impl true
  def handle_call(:get_status, _from, state) do
    status = %{
      platform: :twitch,
      connection_status: state.connection_status,
      username: state.username,
      channel_id: state.channel_id,
      last_viewer_count: state.last_viewer_count,
      chat_enabled: state.chat_enabled,
      livestream_id: Map.get(state, :livestream_id)
    }

    {:reply, status, state}
  end

  # Helper functions

  defp authenticate_and_connect(state) do
    # TODO: Implement actual Twitch authentication and WebSocket connection
    # For now, return mock success
    new_state = %{
      state
      | connection_status: :connected,
        username: "mock_user_#{String.slice(state.user_id, 0, 8)}",
        channel_id: "123456789"
    }

    update_platform_status(new_state, %{status: :connected})

    {:ok, new_state}
  end

  defp get_stream_info(_state) do
    # TODO: Implement actual Twitch API call to get stream info
    # For now, return mock data with random viewer count
    {:ok,
     %{
       viewer_count: :rand.uniform(1000),
       title: "Mock Stream Title",
       category: "Just Chatting",
       started_at: DateTime.utc_now()
     }}
  end

  defp refresh_access_token(state) do
    # TODO: Implement actual token refresh logic
    {:ok, state}
  end

  defp send_twitch_chat_message(state, message) do
    # TODO: Implement actual chat message sending via Twitch IRC/API
    Logger.info("Mock: Sending message '#{message}' to Twitch channel #{state.channel_id}")
    :ok
  end

  defp update_twitch_stream_info(_state, metadata) do
    # TODO: Implement actual Twitch API call to update stream info
    Logger.info("Mock: Updating Twitch stream - #{inspect(metadata)}")
    :ok
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
end
