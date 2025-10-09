defmodule Streampai.Twitch.IrcClient do
  @moduledoc """
  Twitch IRC chat client using WebSocket connection.

  This module provides real-time streaming access to Twitch chat messages
  using Twitch's IRC interface over WebSocket (wss://irc-ws.chat.twitch.tv:443).

  ## Message Format
  Twitch IRC uses a subset of IRC protocol with custom extensions (IRCv3 tags).
  Messages follow this format:

  @badge-info=;badges=;color=#FF0000;display-name=UserName :username!username@username.tmi.twitch.tv PRIVMSG #channel :message text

  ## Capabilities
  The client requests these capabilities:
  - twitch.tv/membership - JOIN/PART/NAMES/MODE events
  - twitch.tv/tags - IRCv3 message tags with metadata
  - twitch.tv/commands - Twitch-specific commands (CLEARCHAT, HOSTTARGET, etc.)
  """

  use GenServer

  alias Streampai.Stream.EventPersister

  require Logger

  @websocket_url "wss://irc-ws.chat.twitch.tv:443"
  @reconnect_delay 5000
  @max_reconnect_attempts 10
  @ping_interval 60_000

  defstruct [
    :user_id,
    :livestream_id,
    :username,
    :access_token,
    :channel,
    :websocket_pid,
    :stream_ref,
    :callback_pid,
    :reconnect_attempts,
    :ping_timer,
    max_reconnect_attempts: @max_reconnect_attempts
  ]

  ## Public API

  @doc """
  Starts the Twitch IRC client.

  ## Parameters
  - `user_id`: The streamer's user ID
  - `livestream_id`: The active livestream ID
  - `username`: Twitch username (lowercase)
  - `access_token`: OAuth 2.0 access token
  - `callback_pid`: Process to receive chat messages (defaults to caller)
  """
  def start_link(user_id, livestream_id, username, access_token, callback_pid \\ nil) do
    callback_pid = callback_pid || self()

    init_args = %{
      user_id: user_id,
      livestream_id: livestream_id,
      username: username,
      access_token: access_token,
      callback_pid: callback_pid
    }

    GenServer.start_link(__MODULE__, init_args)
  end

  @doc """
  Stops the IRC client.
  """
  def stop(pid) do
    GenServer.stop(pid, :normal)
  end

  @doc """
  Sends a chat message to the Twitch channel.
  """
  def send_message(pid, message) when is_binary(message) do
    GenServer.cast(pid, {:send_message, message})
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
        username: username,
        access_token: access_token,
        callback_pid: callback_pid
      }) do
    Logger.metadata(user_id: user_id, component: :twitch_irc_client)

    state = %__MODULE__{
      user_id: user_id,
      livestream_id: livestream_id,
      username: String.downcase(username),
      access_token: access_token,
      channel: "##{String.downcase(username)}",
      callback_pid: callback_pid,
      reconnect_attempts: 0
    }

    send(self(), :connect)

    {:ok, state}
  end

  @impl true
  def handle_info(:connect, state) do
    Logger.info("Connecting to Twitch IRC at #{@websocket_url}")

    case connect_websocket(state) do
      {:ok, ws_pid, stream_ref} ->
        # Authenticate and join channel
        authenticate(ws_pid, stream_ref, state)
        join_channel(ws_pid, stream_ref, state)

        # Start periodic ping
        ping_timer = schedule_ping()

        new_state = %{
          state
          | websocket_pid: ws_pid,
            stream_ref: stream_ref,
            reconnect_attempts: 0,
            ping_timer: ping_timer
        }

        Logger.info("Successfully connected to Twitch IRC for channel #{state.channel}")
        {:noreply, new_state}

      {:error, reason} ->
        Logger.error("Failed to connect to Twitch IRC: #{inspect(reason)}")
        handle_reconnect(state, reason)
    end
  end

  @impl true
  def handle_info(:ping, state) do
    if state.websocket_pid && state.stream_ref do
      send_raw(state.websocket_pid, state.stream_ref, "PING :tmi.twitch.tv")
    end

    ping_timer = schedule_ping()
    {:noreply, %{state | ping_timer: ping_timer}}
  end

  @impl true
  def handle_info(:reconnect, state) do
    if state.reconnect_attempts < state.max_reconnect_attempts do
      Logger.info("Reconnecting to Twitch IRC (#{state.reconnect_attempts + 1}/#{state.max_reconnect_attempts})")

      cleanup_connection(state)
      send(self(), :connect)

      {:noreply, %{state | websocket_pid: nil, reconnect_attempts: state.reconnect_attempts + 1}}
    else
      Logger.error("Max reconnection attempts reached for Twitch IRC")
      send(state.callback_pid, {:twitch_irc_ended, :max_reconnects_reached})
      {:stop, :normal, state}
    end
  end

  @impl true
  def handle_info({:gun_ws, _conn_pid, _stream_ref, {:text, message}}, state) do
    process_irc_message(message, state)
    {:noreply, state}
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
  def handle_info(msg, state) do
    Logger.debug("Unhandled message: #{inspect(msg)}")
    {:noreply, state}
  end

  @impl true
  def handle_cast({:send_message, message}, state) do
    if state.websocket_pid && state.stream_ref do
      send_chat_message(state.websocket_pid, state.stream_ref, state.channel, message)
      Logger.debug("Sent message to #{state.channel}: #{message}")
    else
      Logger.warning("Cannot send message: not connected to IRC")
    end

    {:noreply, state}
  end

  @impl true
  def handle_call(:get_status, _from, state) do
    status = %{
      connected: state.websocket_pid != nil,
      channel: state.channel,
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

  defp authenticate(ws_pid, stream_ref, state) do
    # Request capabilities
    send_raw(
      ws_pid,
      stream_ref,
      "CAP REQ :twitch.tv/membership twitch.tv/tags twitch.tv/commands"
    )

    # Authenticate with OAuth token
    send_raw(ws_pid, stream_ref, "PASS oauth:#{state.access_token}")
    send_raw(ws_pid, stream_ref, "NICK #{state.username}")
  end

  defp join_channel(ws_pid, stream_ref, state) do
    send_raw(ws_pid, stream_ref, "JOIN #{state.channel}")
  end

  defp send_chat_message(ws_pid, stream_ref, channel, message) do
    send_raw(ws_pid, stream_ref, "PRIVMSG #{channel} :#{message}")
  end

  defp send_raw(ws_pid, stream_ref, message) do
    :gun.ws_send(ws_pid, stream_ref, {:text, "#{message}\r\n"})
  end

  defp process_irc_message(raw_message, state) do
    # IRC messages can be multiple lines
    raw_message
    |> String.split("\r\n", trim: true)
    |> Enum.each(fn line ->
      process_single_irc_line(line, state)
    end)
  end

  defp process_single_irc_line(line, state) do
    Logger.debug("IRC: #{line}")

    cond do
      String.starts_with?(line, "PING") ->
        handle_ping(line, state)

      String.contains?(line, "PRIVMSG") ->
        handle_privmsg(line, state)

      String.contains?(line, ":Welcome, GLHF!") ->
        Logger.info("Successfully authenticated to Twitch IRC")

      String.contains?(line, "JOIN") ->
        Logger.info("Successfully joined channel #{state.channel}")

      true ->
        :ok
    end
  end

  defp handle_ping(line, state) do
    # PING :tmi.twitch.tv -> PONG :tmi.twitch.tv
    pong = String.replace(line, "PING", "PONG")

    if state.websocket_pid && state.stream_ref do
      send_raw(state.websocket_pid, state.stream_ref, pong)
    end
  end

  defp handle_privmsg(line, state) do
    case parse_privmsg(line) do
      {:ok, message_data} ->
        broadcast_chat_message(state, message_data)
        queue_message_for_persistence(state, message_data)

      {:error, reason} ->
        Logger.warning("Failed to parse PRIVMSG: #{inspect(reason)}")
    end
  end

  defp parse_privmsg(line) do
    # Parse Twitch IRC message with tags
    # Format: @badge-info=;badges=;color=#FF0000;display-name=UserName;... :username!username@username.tmi.twitch.tv PRIVMSG #channel :message text

    with {:ok, tags, rest} <- extract_tags(line),
         {:ok, username, message} <- extract_username_and_message(rest) do
      message_id = Map.get(tags, "id", generate_message_id())
      display_name = Map.get(tags, "display-name", username)
      timestamp = parse_timestamp(Map.get(tags, "tmi-sent-ts"))

      message_data = %{
        id: message_id,
        username: display_name,
        message: message,
        platform: :twitch,
        timestamp: timestamp,
        user_id: Map.get(tags, "user-id"),
        color: Map.get(tags, "color"),
        badges: parse_badges(Map.get(tags, "badges")),
        is_moderator: is_moderator?(tags),
        is_subscriber: is_subscriber?(tags),
        is_vip: is_vip?(tags),
        emotes: Map.get(tags, "emotes")
      }

      {:ok, message_data}
    end
  end

  defp extract_tags(line) do
    if String.starts_with?(line, "@") do
      [tags_str, rest] = String.split(line, " :", parts: 2, trim: true)
      tags_str = String.trim_leading(tags_str, "@")

      tags =
        tags_str
        |> String.split(";")
        |> Map.new(fn tag ->
          case String.split(tag, "=", parts: 2) do
            [key, value] -> {key, value}
            [key] -> {key, ""}
          end
        end)

      {:ok, tags, rest}
    else
      {:ok, %{}, line}
    end
  end

  defp extract_username_and_message(rest) do
    # Format: username!username@username.tmi.twitch.tv PRIVMSG #channel :message text
    case Regex.run(~r/^(\w+)!.+ PRIVMSG #\w+ :(.+)$/, rest) do
      [_full, username, message] -> {:ok, username, message}
      nil -> {:error, :invalid_format}
    end
  end

  defp parse_timestamp(nil), do: DateTime.utc_now()

  defp parse_timestamp(timestamp_ms) when is_binary(timestamp_ms) do
    case Integer.parse(timestamp_ms) do
      {ms, ""} -> DateTime.from_unix!(ms, :millisecond)
      _ -> DateTime.utc_now()
    end
  end

  defp parse_badges(nil), do: []
  defp parse_badges(""), do: []

  defp parse_badges(badges_str) do
    badges_str
    |> String.split(",")
    |> Enum.map(fn badge ->
      case String.split(badge, "/", parts: 2) do
        [name, version] -> %{name: name, version: version}
        [name] -> %{name: name, version: "1"}
      end
    end)
  end

  defp is_moderator?(tags) do
    Map.get(tags, "mod") == "1" || String.contains?(Map.get(tags, "badges", ""), "moderator")
  end

  defp is_subscriber?(tags) do
    String.contains?(Map.get(tags, "badges", ""), "subscriber") ||
      String.contains?(Map.get(tags, "badges", ""), "founder")
  end

  defp is_vip?(tags) do
    String.contains?(Map.get(tags, "badges", ""), "vip")
  end

  defp generate_message_id do
    "twitch_#{:erlang.system_time(:microsecond)}_#{:rand.uniform(999_999)}"
  end

  defp broadcast_chat_message(state, message_data) do
    chat_event = %{
      id: message_data.id,
      username: message_data.username,
      message: message_data.message,
      platform: :twitch,
      timestamp: message_data.timestamp,
      author_channel_id: message_data.user_id,
      is_moderator: message_data.is_moderator,
      is_subscriber: message_data.is_subscriber,
      is_vip: message_data.is_vip,
      color: message_data.color,
      badges: message_data.badges
    }

    Phoenix.PubSub.broadcast(
      Streampai.PubSub,
      "chat:#{state.user_id}",
      {:chat_message, chat_event}
    )

    # Also send to callback pid
    send(state.callback_pid, {:twitch_message, :chat_message, chat_event})
  end

  defp queue_message_for_persistence(state, message_data) do
    message_attrs = %{
      id: message_data.id,
      message: message_data.message,
      sender_username: message_data.username,
      platform: :twitch,
      sender_channel_id: message_data.user_id,
      sender_is_moderator: message_data.is_moderator,
      sender_is_patreon: message_data.is_subscriber,
      user_id: state.user_id,
      livestream_id: state.livestream_id
    }

    author_attrs = %{
      viewer_id: message_data.user_id || message_data.username,
      user_id: state.user_id,
      display_name: message_data.username,
      avatar_url: nil,
      channel_url: "https://www.twitch.tv/#{String.downcase(message_data.username)}",
      is_verified: false,
      is_owner: false,
      is_moderator: message_data.is_moderator,
      is_patreon: message_data.is_subscriber
    }

    EventPersister.add_message({message_attrs, author_attrs})
  end

  defp schedule_ping do
    Process.send_after(self(), :ping, @ping_interval)
  end

  defp handle_reconnect(state, _reason) do
    Process.send_after(self(), :reconnect, @reconnect_delay)
    {:noreply, %{state | websocket_pid: nil}}
  end

  defp cleanup_connection(%{websocket_pid: nil}), do: :ok
  defp cleanup_connection(%{ping_timer: nil}), do: :ok

  defp cleanup_connection(state) do
    if state.ping_timer, do: Process.cancel_timer(state.ping_timer)

    if state.websocket_pid do
      :gun.close(state.websocket_pid)
    end
  end
end
