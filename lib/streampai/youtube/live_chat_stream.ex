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

  defstruct [
    :access_token,
    :live_chat_id,
    :client_pid,
    :grpc_channel,
    :stream_task,
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
    Logger.info("YouTube Live Chat streaming is disabled (integration example only)")
    Logger.info("Chat ID: #{state.live_chat_id}")

    # Since gRPC is disabled, we'll stop the process
    {:stop, :normal, state}
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
  def handle_info({:stream_message, response}, state) do
    # Process the streaming response from YouTube
    # The response is already a decoded protobuf message
    case process_stream_response(response) do
      {:ok, messages} ->
        # Send each chat message to the callback process
        Enum.each(messages, fn msg ->
          send(state.callback_pid, {:chat_message, msg})
        end)

        {:noreply, state}

      {:error, reason} ->
        Logger.warning("Failed to process stream response: #{inspect(reason)}")
        {:noreply, state}
    end
  end

  @impl true
  def handle_info({:stream_error, %GRPC.RPCError{status: status, message: message}}, state) do
    Logger.error("gRPC error - Status: #{status}, Message: #{message}")
    send(state.callback_pid, {:chat_error, {:grpc_error, status, message}})
    handle_connection_error(state, {:grpc_error, status})
  end

  @impl true
  def handle_info({:stream_error, reason}, state) do
    Logger.error("Stream error: #{inspect(reason)}")
    send(state.callback_pid, {:chat_error, reason})
    handle_connection_error(state, reason)
  end

  @impl true
  def handle_info(:stream_ended, state) do
    Logger.info("YouTube Live Chat stream ended normally")
    send(state.callback_pid, {:chat_ended, :normal})
    handle_connection_error(state, :stream_ended)
  end

  @impl true
  def handle_info({:stream_crashed, error}, state) do
    Logger.error("Stream task crashed: #{inspect(error)}")
    send(state.callback_pid, {:chat_error, {:stream_crash, error}})
    handle_connection_error(state, {:crash, error})
  end

  @impl true
  def handle_info({:DOWN, _ref, :process, pid, reason}, state) when pid == state.stream_task do
    Logger.warning("Stream task terminated: #{inspect(reason)}")
    handle_connection_error(state, {:task_down, reason})
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
  def handle_call(:get_status, _from, state) do
    status = %{
      connected: state.grpc_channel != nil && state.stream_task != nil,
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

  defp send_heartbeat(state) do
    if state.grpc_channel && state.stream_task && Process.alive?(state.stream_task) do
      # The Gun adapter maintains the HTTP/2 connection automatically
      # We just check if our stream task is still alive
      :ok
    else
      {:error, :not_connected}
    end
  end

  defp process_stream_response(%YouTube.V3.LiveChatMessages.StreamListResponse{items: items}) do
    # Transform the protobuf response into our internal format
    messages =
      Enum.map(items, fn item ->
        %{
          id: item.id,
          type: item.snippet.type,
          author: %{
            channel_id: item.author_details.channel_id,
            display_name: item.author_details.display_name,
            profile_image_url: item.author_details.profile_image_url,
            is_verified: item.author_details.is_verified,
            is_moderator: item.author_details.is_chat_moderator,
            is_owner: item.author_details.is_chat_owner,
            is_sponsor: item.author_details.is_chat_sponsor
          },
          message: get_message_content(item.snippet),
          published_at: item.snippet.published_at,
          super_chat: extract_super_chat(item.snippet),
          super_sticker: extract_super_sticker(item.snippet)
        }
      end)

    {:ok, messages}
  rescue
    e -> {:error, e}
  end

  defp get_message_content(%{text_message_details: %{message_text: text}}) when not is_nil(text) do
    text
  end

  defp get_message_content(%{display_message: display}) when not is_nil(display) do
    display
  end

  defp get_message_content(_), do: ""

  defp extract_super_chat(%{super_chat_details: details}) when not is_nil(details) do
    %{
      amount_micros: details.amount_micros,
      currency: details.currency,
      amount_display: details.amount_display_string,
      user_comment: details.user_comment,
      tier: details.tier
    }
  end

  defp extract_super_chat(_), do: nil

  defp extract_super_sticker(%{super_sticker_details: details}) when not is_nil(details) do
    %{
      amount_micros: details.amount_micros,
      currency: details.currency,
      amount_display: details.amount_display_string,
      tier: details.tier,
      sticker_id: details.super_sticker_metadata.sticker_id
    }
  end

  defp extract_super_sticker(_), do: nil

  defp handle_connection_error(state, _reason) do
    cleanup_connection(state)

    # Schedule reconnection
    Process.send_after(self(), :reconnect, state.reconnect_delay)

    new_state = %{state | grpc_channel: nil, stream_task: nil, heartbeat_timer: nil}

    {:noreply, new_state}
  end

  defp cleanup_connection(state) do
    if state.heartbeat_timer do
      Process.cancel_timer(state.heartbeat_timer)
    end

    # Clean up the stream task if it's running
    if state.stream_task && Process.alive?(state.stream_task) do
      Process.exit(state.stream_task, :shutdown)
    end

    # Close the gRPC channel
    if state.grpc_channel do
      GRPC.Stub.disconnect(state.grpc_channel)
    end
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
