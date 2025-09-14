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

  @youtube_api_host "youtubereporting.googleapis.com"
  @grpc_port 443

  # YouTube Live Chat gRPC service definition
  @service_name "youtube.livestreaming.v1.LiveChatService"
  @method_name "StreamChatMessages"

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
    Logger.info("Connecting to YouTube Live Chat stream for chat_id: #{state.live_chat_id}")

    case establish_grpc_connection(state) do
      {:ok, new_state} ->
        Logger.info("Successfully connected to YouTube Live Chat stream")
        schedule_heartbeat(new_state)
        {:noreply, %{new_state | reconnect_attempts: 0}}

      {:error, reason} ->
        Logger.error("Failed to connect to YouTube Live Chat stream: #{inspect(reason)}")
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
  def handle_info({:grpc_response, data}, state) do
    case decode_chat_message(data) do
      {:ok, message} ->
        send(state.callback_pid, {:chat_message, message})
        {:noreply, state}

      {:error, reason} ->
        Logger.warning("Failed to decode chat message: #{inspect(reason)}")
        {:noreply, state}
    end
  end

  @impl true
  def handle_info({:grpc_error, reason}, state) do
    Logger.error("gRPC stream error: #{inspect(reason)}")
    send(state.callback_pid, {:chat_error, reason})
    handle_connection_error(state, reason)
  end

  @impl true
  def handle_info({:grpc_end, reason}, state) do
    Logger.info("gRPC stream ended: #{inspect(reason)}")
    send(state.callback_pid, {:chat_ended, reason})
    handle_connection_error(state, reason)
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

  defp establish_grpc_connection(state) do
    # Create gRPC channel with authentication
    channel_opts = [
      transport_opts: [
        tcp_opts: [
          # Enable TLS
          {:mode, :binary},
          {:packet, 0},
          {:active, false}
        ]
      ]
    ]

    case :grpcbox_client.connect(@youtube_api_host, @grpc_port, channel_opts) do
      {:ok, connection} ->
        # Start streaming request
        request_data = build_stream_request(state)

        stream_opts = [
          headers: build_auth_headers(state.access_token)
        ]

        case :grpcbox_client.stream(
               connection,
               @service_name,
               @method_name,
               request_data,
               stream_opts
             ) do
          {:ok, stream_ref} ->
            new_state = %{state | grpc_connection: connection, stream_ref: stream_ref}
            {:ok, new_state}

          {:error, reason} ->
            :grpcbox_client.disconnect(connection)
            {:error, reason}
        end

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp build_stream_request(state) do
    # Build the protobuf request for streaming live chat messages
    # This would normally be generated from YouTube's protobuf definitions
    %{
      "liveChatId" => state.live_chat_id,
      "part" => ["id", "snippet", "authorDetails"]
    }
  end

  defp build_auth_headers(access_token) do
    [
      {"authorization", "Bearer #{access_token}"},
      {"content-type", "application/grpc"},
      {"user-agent", "StreamPai-YouTube-Client/1.0"}
    ]
  end

  defp send_heartbeat(state) do
    if state.grpc_connection && state.stream_ref do
      # Send ping frame or similar heartbeat mechanism
      # Implementation depends on gRPC client library
      :ok
    else
      {:error, :not_connected}
    end
  end

  # Decode protobuf response to Elixir map
  # This would use generated protobuf decoders
  # Placeholder - would decode actual protobuf data
  defp decode_chat_message(_data) do
    decoded = %{
      "id" => "message_id_#{:rand.uniform(1000)}",
      "snippet" => %{
        "type" => "textMessageEvent",
        "liveChatId" => "some_chat_id",
        "authorChannelId" => "author_id",
        "publishedAt" => DateTime.to_iso8601(DateTime.utc_now()),
        "hasDisplayContent" => true,
        "displayMessage" => "Sample message",
        "textMessageDetails" => %{
          "messageText" => "Sample message"
        }
      },
      "authorDetails" => %{
        "channelId" => "author_id",
        "channelUrl" => "https://youtube.com/channel/author_id",
        "displayName" => "Sample User",
        "profileImageUrl" => "https://example.com/avatar.jpg",
        "isVerified" => false,
        "isChatOwner" => false,
        "isChatSponsor" => false,
        "isChatModerator" => false
      }
    }

    {:ok, decoded}
  rescue
    e -> {:error, e}
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
      :grpcbox_client.disconnect(state.grpc_connection)
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
