defmodule Streampai.YouTube.LiveChatStream do
  @moduledoc """
  Real-time YouTube Live Chat streaming using gRPC.

  This module provides streaming access to YouTube Live Chat messages in real-time
  using the YouTube Data API v3 gRPC streaming endpoint.

  ## Usage

      # Start streaming chat messages
      {:ok, pid} = LiveChatStream.start_stream(access_token, live_chat_id, self())

      # Messages will be sent to the calling process as:
      # {:chat_message, %{...}}
      # {:chat_error, reason}
      # {:chat_ended, reason}

  ## Authentication

  Requires OAuth 2.0 access token with YouTube Data API scope:
  - https://www.googleapis.com/auth/youtube.readonly (for reading)
  - https://www.googleapis.com/auth/youtube (for full access)
  """

  use GenServer

  require Logger

  # YouTube API integration disabled - this is example code only

  defstruct [
    :access_token,
    :live_chat_id,
    :client_pid,
    :grpc_connection,
    :stream_ref,
    :callback_pid,
    :heartbeat_timer,
    :reconnect_attempts,
    max_reconnect_attempts: 5,
    reconnect_delay: 5000,
    heartbeat_interval: 30_000
  ]

  @type t :: %__MODULE__{}

  ## Public API

  @doc """
  Starts streaming live chat messages for a given chat ID.

  ## Parameters
  - `access_token`: OAuth 2.0 access token
  - `live_chat_id`: YouTube live chat ID to stream from
  - `callback_pid`: Process to receive messages (defaults to caller)
  - `opts`: Optional configuration
    - `name`: Process name for registration
    - `max_reconnect_attempts`: Maximum reconnection attempts (default: 5)
    - `heartbeat_interval`: Heartbeat interval in ms (default: 30000)

  ## Returns
  - `{:ok, pid}` on success
  - `{:error, reason}` on failure
  """
  def start_stream(access_token, live_chat_id, callback_pid \\ nil, opts \\ []) do
    callback_pid = callback_pid || self()

    init_args = %{
      access_token: access_token,
      live_chat_id: live_chat_id,
      callback_pid: callback_pid,
      opts: opts
    }

    case Keyword.get(opts, :name) do
      nil -> GenServer.start(__MODULE__, init_args)
      name -> GenServer.start(__MODULE__, init_args, name: name)
    end
  end

  @doc """
  Stops the chat stream.
  """
  def stop_stream(pid) do
    GenServer.stop(pid, :normal)
  end

  @doc """
  Gets the current stream status.
  """
  def get_status(pid) do
    GenServer.call(pid, :get_status)
  end

  ## GenServer Callbacks

  @impl true
  def init(%{access_token: token, live_chat_id: chat_id, callback_pid: callback, opts: opts}) do
    Logger.metadata(component: :youtube_live_chat, live_chat_id: chat_id)

    state = %__MODULE__{
      access_token: token,
      live_chat_id: chat_id,
      callback_pid: callback,
      reconnect_attempts: 0,
      max_reconnect_attempts: Keyword.get(opts, :max_reconnect_attempts, 5),
      heartbeat_interval: Keyword.get(opts, :heartbeat_interval, 30_000)
    }

    # Start the gRPC connection process
    send(self(), :connect)

    {:ok, state}
  end

  @impl true
  def handle_info(:connect, state) do
    Logger.info("Connecting to YouTube Live Chat: #{state.live_chat_id}")

    case start_polling(state) do
      {:ok, next_page_token} ->
        Logger.info("Successfully connected to chat, starting to poll for messages")
        schedule_next_poll(0)
        new_state = %{state | stream_ref: next_page_token, reconnect_attempts: 0}
        {:noreply, new_state}

      {:error, reason} ->
        Logger.error("Failed to start chat polling: #{inspect(reason)}")
        send(state.callback_pid, {:chat_error, reason})
        {:stop, reason, state}
    end
  end

  @impl true
  def handle_info(:poll, state) do
    case fetch_messages(state) do
      {:ok, messages, next_page_token, poll_interval} ->
        if length(messages) > 0 do
          Logger.debug("Received #{length(messages)} chat messages")
        end

        Enum.each(messages, fn msg ->
          send(state.callback_pid, {:chat_message, msg})
        end)

        schedule_next_poll(poll_interval)
        new_state = %{state | stream_ref: next_page_token, reconnect_attempts: 0}
        {:noreply, new_state}

      {:error, :chat_disabled} ->
        Logger.info("Chat has been disabled")
        send(state.callback_pid, {:chat_ended, :chat_disabled})
        {:stop, :normal, state}

      {:error, reason} ->
        Logger.warning("Failed to fetch messages: #{inspect(reason)}")
        handle_connection_error(state, reason)
    end
  end

  @impl true
  def handle_info(:heartbeat, state) do
    case send_heartbeat(state) do
      :ok ->
        schedule_heartbeat(state)
        {:noreply, state}

      {:error, reason} ->
        Logger.warning("Heartbeat failed: #{inspect(reason)}")
        handle_connection_error(state, reason)
    end
  end

  @impl true
  def handle_info(:reconnect, state) do
    if state.reconnect_attempts < state.max_reconnect_attempts do
      Logger.info("Attempting to reconnect (#{state.reconnect_attempts + 1}/#{state.max_reconnect_attempts})")

      send(self(), :connect)
      {:noreply, %{state | reconnect_attempts: state.reconnect_attempts + 1}}
    else
      Logger.error("Max reconnection attempts reached, giving up")
      send(state.callback_pid, {:chat_ended, :max_reconnects_reached})
      {:stop, :normal, state}
    end
  end

  @impl true
  def handle_info(msg, state) do
    Logger.debug("Unknown message: #{inspect(msg)}")
    {:noreply, state}
  end

  @impl true
  def handle_call(:get_status, _from, state) do
    status = %{
      connected: state.grpc_connection != nil,
      live_chat_id: state.live_chat_id,
      reconnect_attempts: state.reconnect_attempts,
      max_reconnect_attempts: state.max_reconnect_attempts
    }

    {:reply, status, state}
  end

  @impl true
  def terminate(_reason, state) do
    cleanup_connection(state)
    :ok
  end

  ## Private Functions

  @base_url "https://www.googleapis.com/youtube/v3"

  defp start_polling(state) do
    case fetch_initial_page(state) do
      {:ok, _messages, next_page_token, _poll_interval} ->
        {:ok, next_page_token}

      error ->
        error
    end
  end

  defp fetch_initial_page(state) do
    params = %{
      liveChatId: state.live_chat_id,
      part: "snippet,authorDetails",
      maxResults: 200
    }

    make_request(state, params)
  end

  defp fetch_messages(state) do
    params = %{
      liveChatId: state.live_chat_id,
      part: "snippet,authorDetails",
      maxResults: 200,
      pageToken: state.stream_ref
    }

    make_request(state, params)
  end

  defp make_request(state, params) do
    client =
      Req.new(
        base_url: @base_url,
        headers: [
          {"Authorization", "Bearer #{state.access_token}"},
          {"Accept", "application/json"}
        ]
      )

    case Req.get(client, url: "/liveChat/messages", params: params) do
      {:ok, %{status: 200, body: body}} ->
        messages = Map.get(body, "items", [])
        next_page_token = Map.get(body, "nextPageToken")
        poll_interval = Map.get(body, "pollingIntervalMillis", 5000)

        {:ok, messages, next_page_token, poll_interval}

      {:ok, %{status: 403, body: body}} ->
        case get_in(body, ["error", "errors"]) do
          [%{"reason" => "liveChatDisabled"} | _] ->
            {:error, :chat_disabled}

          [%{"reason" => "liveChatEnded"} | _] ->
            {:error, :chat_disabled}

          _ ->
            {:error, {:forbidden, body}}
        end

      {:ok, %{status: status, body: body}} ->
        {:error, {:http_error, status, body}}

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp schedule_next_poll(interval_ms) do
    Process.send_after(self(), :poll, interval_ms)
  end

  defp send_heartbeat(state) do
    if state.grpc_connection && state.stream_ref do
      :ok
    else
      {:error, :not_connected}
    end
  end

  defp handle_connection_error(state, _reason) do
    cleanup_connection(state)

    # Schedule reconnection
    Process.send_after(self(), :reconnect, state.reconnect_delay)

    new_state = %{state | grpc_connection: nil, stream_ref: nil, heartbeat_timer: nil}

    {:noreply, new_state}
  end

  defp cleanup_connection(state) do
    if state.heartbeat_timer do
      Process.cancel_timer(state.heartbeat_timer)
    end

    if state.grpc_connection do
      safe_disconnect(state.grpc_connection)
    end
  end

  defp safe_disconnect(_connection) do
    # gRPC functionality disabled
    :ok
  end

  defp schedule_heartbeat(state) do
    if state.heartbeat_timer do
      Process.cancel_timer(state.heartbeat_timer)
    end

    timer = Process.send_after(self(), :heartbeat, state.heartbeat_interval)
    %{state | heartbeat_timer: timer}
  end

  ## Convenience Functions

  @doc """
  Creates a simple callback handler that logs all messages.
  Useful for testing and debugging.
  """
  def log_handler do
    spawn(fn -> log_loop() end)
  end

  defp log_loop do
    receive do
      {:chat_message, message} ->
        Logger.info("Chat Message: #{inspect(message)}")
        log_loop()

      {:chat_error, reason} ->
        Logger.error("Chat Error: #{inspect(reason)}")
        log_loop()

      {:chat_ended, reason} ->
        Logger.info("Chat Ended: #{inspect(reason)}")

      other ->
        Logger.debug("Unknown message: #{inspect(other)}")
        log_loop()
    end
  end
end
