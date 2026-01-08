defmodule Streampai.Twitch.EventsubClient do
  @moduledoc """
  Twitch EventSub WebSocket client for receiving chat messages and events.

  This module provides real-time access to Twitch chat messages using Twitch's
  modern EventSub WebSocket API. Messages are received via WebSocket, while
  sending messages requires using the REST API (see `Streampai.Twitch.ApiClient.send_chat_message/3`).

  ## EventSub Flow
  1. Connect to wss://eventsub.wss.twitch.tv/ws
  2. Receive session_welcome message with session_id
  3. Subscribe to channel.chat.message event type
  4. Receive notifications as JSON
  5. Respond to keepalive pings
  6. Handle reconnection on session_reconnect messages

  ## Message Types
  - session_welcome - Initial connection, provides session_id
  - session_keepalive - Periodic ping to keep connection alive
  - notification - Actual events (chat messages, etc.)
  - session_reconnect - Server requesting reconnection to new URL
  - revocation - Subscription was revoked
  """

  use GenServer

  alias Streampai.Stream.EventPersister

  require Logger

  @websocket_url "wss://eventsub.wss.twitch.tv/ws"
  @reconnect_delay 5000
  @max_reconnect_attempts 10
  @subscription_timeout 10_000

  defstruct [
    :user_id,
    :livestream_id,
    :broadcaster_id,
    :access_token,
    :websocket_pid,
    :stream_ref,
    :session_id,
    :callback_pid,
    :reconnect_attempts,
    :subscription_pending,
    max_reconnect_attempts: @max_reconnect_attempts
  ]

  ## Public API

  @doc """
  Starts the Twitch EventSub client.

  ## Parameters
  - `user_id`: The streamer's user ID (internal system ID)
  - `livestream_id`: The active livestream ID
  - `broadcaster_id`: Twitch broadcaster user ID
  - `access_token`: OAuth 2.0 access token with user:read:chat scope
  - `callback_pid`: Process to receive chat messages (defaults to caller)
  """
  def start_link(user_id, livestream_id, broadcaster_id, access_token, callback_pid \\ nil) do
    callback_pid = callback_pid || self()

    init_args = %{
      user_id: user_id,
      livestream_id: livestream_id,
      broadcaster_id: broadcaster_id,
      access_token: access_token,
      callback_pid: callback_pid
    }

    GenServer.start_link(__MODULE__, init_args)
  end

  @doc """
  Stops the EventSub client.
  """
  def stop(pid) do
    GenServer.stop(pid, :normal)
  end

  @doc """
  Gets the current connection status.
  """
  def get_status(pid) do
    GenServer.call(pid, :get_status)
  end

  ## GenServer Callbacks

  @impl true
  def init(%{
        user_id: user_id,
        livestream_id: livestream_id,
        broadcaster_id: broadcaster_id,
        access_token: access_token,
        callback_pid: callback_pid
      }) do
    Logger.metadata(user_id: user_id, component: :twitch_eventsub_client)

    state = %__MODULE__{
      user_id: user_id,
      livestream_id: livestream_id,
      broadcaster_id: broadcaster_id,
      access_token: access_token,
      callback_pid: callback_pid,
      reconnect_attempts: 0
    }

    # Subscribe to token updates from TwitchManager
    Phoenix.PubSub.subscribe(Streampai.PubSub, "twitch_token:#{user_id}")

    send(self(), :connect)

    {:ok, state}
  end

  @impl true
  def handle_info(:connect, state) do
    Logger.info("Connecting to Twitch EventSub at #{@websocket_url}")

    case connect_websocket(state) do
      {:ok, ws_pid, stream_ref} ->
        new_state = %{
          state
          | websocket_pid: ws_pid,
            stream_ref: stream_ref,
            reconnect_attempts: 0
        }

        Logger.info("Successfully connected to Twitch EventSub")
        {:noreply, new_state}

      {:error, reason} ->
        Logger.error("Failed to connect to Twitch EventSub: #{inspect(reason)}")
        handle_reconnect(state, reason)
    end
  end

  @impl true
  def handle_info(:subscription_timeout, state) do
    Logger.error("EventSub subscription timed out - no welcome message received")
    handle_reconnect(state, :subscription_timeout)
  end

  @impl true
  def handle_info(:reconnect, state) do
    if state.reconnect_attempts < state.max_reconnect_attempts do
      Logger.info(
        "Reconnecting to Twitch EventSub (#{state.reconnect_attempts + 1}/#{state.max_reconnect_attempts})"
      )

      cleanup_connection(state)
      send(self(), :connect)

      {:noreply,
       %{
         state
         | websocket_pid: nil,
           stream_ref: nil,
           reconnect_attempts: state.reconnect_attempts + 1
       }}
    else
      Logger.error("Max reconnection attempts reached for Twitch EventSub")
      send(state.callback_pid, {:twitch_eventsub_ended, :max_reconnects_reached})
      {:stop, :normal, state}
    end
  end

  @impl true
  def handle_info({:gun_ws, _conn_pid, _stream_ref, {:text, message}}, state) do
    process_eventsub_message(message, state)
  end

  @impl true
  def handle_info({:gun_ws, _conn_pid, _stream_ref, {:close, code, reason}}, state) do
    Logger.warning("WebSocket closed with code #{code}: #{reason}")
    handle_reconnect(state, {:closed, code, reason})
  end

  @impl true
  def handle_info({:gun_down, _conn_pid, _protocol, reason, _}, state) do
    Logger.error("WebSocket connection down: #{inspect(reason)}")
    handle_reconnect(state, {:gun_down, reason})
  end

  @impl true
  def handle_info({:gun_up, _conn_pid, _protocol}, state) do
    Logger.debug("Gun connection up")
    {:noreply, state}
  end

  @impl true
  def handle_info({:gun_upgrade, _conn_pid, _stream_ref, ["websocket"], _headers}, state) do
    Logger.debug("WebSocket upgrade successful")
    # Start timeout for receiving welcome message
    Process.send_after(self(), :subscription_timeout, @subscription_timeout)
    {:noreply, state}
  end

  @impl true
  def handle_info({:gun_response, _conn_pid, _stream_ref, _is_fin, _status, _headers}, state) do
    {:noreply, state}
  end

  @impl true
  def handle_info({:gun_error, _conn_pid, _stream_ref, reason}, state) do
    Logger.error("Gun error: #{inspect(reason)}")
    handle_reconnect(state, {:gun_error, reason})
  end

  @impl true
  def handle_info({:gun_error, _conn_pid, reason}, state) do
    Logger.error("Gun connection error: #{inspect(reason)}")
    handle_reconnect(state, {:gun_error, reason})
  end

  @impl true
  def handle_info({:token_updated, _user_id, new_token}, state) do
    Logger.info("Received updated Twitch token, updating state")
    new_state = %{state | access_token: new_token}

    # If we're in a reconnect loop (likely due to 401), trigger immediate reconnect with fresh token
    if state.reconnect_attempts > 0 do
      Logger.info("Triggering immediate reconnect with fresh token")
      send(self(), :reconnect)
    end

    {:noreply, new_state}
  end

  @impl true
  def handle_info(msg, state) do
    Logger.debug("Unhandled message: #{inspect(msg)}")
    {:noreply, state}
  end

  @impl true
  def handle_call(:get_status, _from, state) do
    status = %{
      connected: state.websocket_pid != nil,
      session_id: state.session_id,
      broadcaster_id: state.broadcaster_id,
      reconnect_attempts: state.reconnect_attempts
    }

    {:reply, status, state}
  end

  @impl true
  def terminate(_reason, state) do
    cleanup_connection(state)
    :ok
  end

  ## Private Functions

  defp connect_websocket(_state) do
    uri = URI.parse(@websocket_url)
    port = uri.port || 443

    open_opts = %{
      protocols: [:http],
      transport: :tls,
      tls_opts: [
        verify: :verify_peer,
        cacertfile: to_charlist(CAStore.file_path()),
        customize_hostname_check: [
          match_fun: :public_key.pkix_verify_hostname_match_fun(:https)
        ]
      ]
    }

    with {:ok, conn_pid} <- :gun.open(to_charlist(uri.host), port, open_opts),
         {:ok, _protocol} <- :gun.await_up(conn_pid, 5000),
         stream_ref = :gun.ws_upgrade(conn_pid, uri.path || "/"),
         {:ok, _ws_upgraded} <- wait_for_ws_upgrade(conn_pid, stream_ref) do
      {:ok, conn_pid, stream_ref}
    else
      {:error, reason} -> {:error, reason}
      error -> {:error, error}
    end
  end

  defp wait_for_ws_upgrade(conn_pid, stream_ref) do
    receive do
      {:gun_upgrade, ^conn_pid, ^stream_ref, ["websocket"], _headers} ->
        {:ok, :upgraded}

      {:gun_response, ^conn_pid, ^stream_ref, _is_fin, status, _headers} ->
        {:error, {:http_error, status}}

      {:gun_error, ^conn_pid, ^stream_ref, reason} ->
        {:error, reason}
    after
      5000 ->
        {:error, :upgrade_timeout}
    end
  end

  defp process_eventsub_message(raw_message, state) do
    case Jason.decode(raw_message) do
      {:ok, message} ->
        handle_eventsub_message(message, state)

      {:error, reason} ->
        Logger.error("Failed to parse EventSub message: #{inspect(reason)}")
        {:noreply, state}
    end
  end

  defp handle_eventsub_message(
         %{"metadata" => %{"message_type" => "session_welcome"}} = msg,
         state
       ) do
    session_id = get_in(msg, ["payload", "session", "id"])
    Logger.info("Received EventSub welcome, session_id: #{session_id}")

    # Subscribe to chat messages
    case subscribe_to_chat_messages(state, session_id) do
      :ok ->
        new_state = %{state | session_id: session_id, subscription_pending: false}
        {:noreply, new_state}

      {:error, {:missing_scopes, _}} ->
        # Don't reconnect for scope issues - user needs to reconnect their account
        Logger.error(
          "Cannot subscribe: missing OAuth scopes. EventSub will remain disconnected until account is reconnected."
        )

        send(state.callback_pid, {:twitch_eventsub_ended, :missing_scopes})
        {:stop, :normal, state}

      {:error, reason} ->
        Logger.error("Failed to subscribe to chat messages: #{inspect(reason)}")
        handle_reconnect(state, reason)
    end
  end

  defp handle_eventsub_message(%{"metadata" => %{"message_type" => "session_keepalive"}}, state) do
    Logger.debug("Received EventSub keepalive")
    {:noreply, state}
  end

  defp handle_eventsub_message(%{"metadata" => %{"message_type" => "notification"}} = msg, state) do
    subscription_type = get_in(msg, ["metadata", "subscription_type"])
    event = get_in(msg, ["payload", "event"])

    case subscription_type do
      "channel.chat.message" ->
        handle_chat_message(event, state)
        {:noreply, state}

      _ ->
        Logger.debug("Received EventSub notification: #{subscription_type}")
        {:noreply, state}
    end
  end

  defp handle_eventsub_message(
         %{"metadata" => %{"message_type" => "session_reconnect"}} = msg,
         state
       ) do
    reconnect_url = get_in(msg, ["payload", "session", "reconnect_url"])
    Logger.warning("EventSub requested reconnection to: #{reconnect_url}")
    # TODO: Handle reconnection to new URL
    handle_reconnect(state, :session_reconnect)
  end

  defp handle_eventsub_message(%{"metadata" => %{"message_type" => "revocation"}}, state) do
    Logger.error("EventSub subscription was revoked")
    handle_reconnect(state, :subscription_revoked)
  end

  defp handle_eventsub_message(msg, state) do
    Logger.debug("Received unknown EventSub message: #{inspect(msg)}")
    {:noreply, state}
  end

  defp subscribe_to_chat_messages(state, session_id) do
    client_id = Application.get_env(:streampai, :twitch_client_id)

    url = "https://api.twitch.tv/helix/eventsub/subscriptions"

    headers = [
      {"Authorization", "Bearer #{state.access_token}"},
      {"Client-Id", client_id},
      {"Content-Type", "application/json"}
    ]

    body =
      Jason.encode!(%{
        type: "channel.chat.message",
        version: "1",
        condition: %{
          broadcaster_user_id: state.broadcaster_id,
          user_id: state.broadcaster_id
        },
        transport: %{
          method: "websocket",
          session_id: session_id
        }
      })

    case Req.post(url: url, headers: headers, body: body) do
      {:ok, %{status: status, body: response_body}} when status in 200..299 ->
        Logger.info("Successfully subscribed to channel.chat.message")
        Logger.debug("Subscription response: #{inspect(response_body)}")
        :ok

      {:ok, %{status: 403, body: response_body}} ->
        Logger.error("""
        Failed to subscribe to Twitch EventSub: Missing required OAuth scopes.

        The Twitch account needs to be reconnected with the following scopes:
        - user:read:chat (to read chat messages)
        - channel:bot (to send chat messages)

        Please disconnect and reconnect your Twitch account at: /api/streaming/connect/twitch

        Error: #{inspect(response_body)}
        """)

        {:error, {:missing_scopes, response_body}}

      {:ok, %{status: status, body: response_body}} ->
        Logger.error("Failed to subscribe: HTTP #{status}, body: #{inspect(response_body)}")
        {:error, {:http_error, status, response_body}}

      {:error, reason} ->
        Logger.error("Failed to subscribe: #{inspect(reason)}")
        {:error, reason}
    end
  end

  defp handle_chat_message(event, state) do
    Logger.debug("Received chat message event: #{inspect(event)}")

    message_data = %{
      id: event["message_id"],
      username: event["chatter_user_name"],
      message: event["message"]["text"],
      platform: :twitch,
      timestamp: parse_timestamp(event["message_id"]),
      author_channel_id: event["chatter_user_id"],
      color: event["color"],
      badges: parse_badges(event["badges"]),
      is_moderator: has_badge?(event["badges"], "moderator"),
      is_subscriber: has_badge?(event["badges"], "subscriber"),
      is_vip: has_badge?(event["badges"], "vip"),
      cheer: event["cheer"],
      reply: event["reply"]
    }

    broadcast_chat_message(state, message_data)
    queue_message_for_persistence(state, message_data)
  end

  defp parse_timestamp(message_id) when is_binary(message_id) do
    # Twitch message IDs contain timestamp - try to extract it
    # Format: UUID-like but first part is timestamp
    # For now, just use current time
    DateTime.utc_now()
  end

  defp parse_timestamp(_), do: DateTime.utc_now()

  defp parse_badges(nil), do: []

  defp parse_badges(badges) when is_list(badges) do
    Enum.map(badges, fn badge ->
      %{
        set_id: badge["set_id"],
        id: badge["id"],
        info: badge["info"]
      }
    end)
  end

  defp parse_badges(_), do: []

  defp has_badge?(nil, _badge_name), do: false

  defp has_badge?(badges, badge_name) when is_list(badges) do
    Enum.any?(badges, fn badge ->
      badge["set_id"] == badge_name
    end)
  end

  defp has_badge?(_, _), do: false

  defp broadcast_chat_message(_state, _message_data) do
    # Chat messages are persisted via EventPersister and synced to frontend via Electric SQL.
    # No PubSub broadcast needed.
    :ok
  end

  defp queue_message_for_persistence(state, message_data) do
    is_owner = message_data.author_channel_id == state.broadcaster_id

    message_attrs = %{
      id: message_data.id,
      message: message_data.message,
      sender_username: message_data.username,
      platform: :twitch,
      sender_channel_id: message_data.author_channel_id,
      sender_is_moderator: message_data.is_moderator,
      sender_is_patreon: message_data.is_subscriber,
      user_id: state.user_id,
      livestream_id: state.livestream_id,
      is_owner: is_owner
    }

    author_attrs = %{
      viewer_id: message_data.author_channel_id,
      user_id: state.user_id,
      display_name: message_data.username,
      avatar_url: nil,
      channel_url: "https://www.twitch.tv/#{String.downcase(message_data.username)}",
      is_verified: false,
      is_owner: is_owner,
      is_moderator: message_data.is_moderator,
      is_patreon: message_data.is_subscriber
    }

    EventPersister.add_message({message_attrs, author_attrs})
  end

  defp handle_reconnect(state, _reason) do
    Process.send_after(self(), :reconnect, @reconnect_delay)
    {:noreply, %{state | websocket_pid: nil, stream_ref: nil, session_id: nil}}
  end

  defp cleanup_connection(%{websocket_pid: nil}), do: :ok

  defp cleanup_connection(state) do
    if state.websocket_pid do
      :gun.close(state.websocket_pid)
    end
  end
end
