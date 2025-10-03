defmodule Streampai.YouTube.GrpcStreamClient do
  @moduledoc """
  YouTube Live Chat gRPC streaming client using the StreamList RPC method.

  This module provides real-time streaming access to YouTube Live Chat messages
  using the generated gRPC client from the protobuf definitions.
  """

  use GenServer

  alias Streampai.Stream.ChatMessage
  alias Streampai.Stream.StreamEvent
  alias Youtube.Api.V3.LiveChatMessageListRequest
  alias Youtube.Api.V3.V3DataLiveChatMessageService.Stub

  require Logger

  defstruct [
    :user_id,
    :livestream_id,
    :access_token,
    :live_chat_id,
    :channel,
    :stream,
    :stream_task_pid,
    :stream_task_ref,
    :callback_pid,
    :reconnect_attempts,
    max_reconnect_attempts: 5,
    reconnect_delay: 5000
  ]

  @grpc_endpoint "youtube.googleapis.com:443"

  ## Public API

  @doc """
  Starts streaming YouTube Live Chat messages via gRPC.

  ## Parameters
  - `user_id`: The streamer's user ID
  - `livestream_id`: The active livestream ID
  - `access_token`: OAuth 2.0 access token with YouTube scope
  - `live_chat_id`: YouTube live chat ID to stream from
  - `callback_pid`: Optional process to receive messages (defaults to caller)
  """
  def start_link(user_id, livestream_id, access_token, live_chat_id, callback_pid \\ nil) do
    callback_pid = callback_pid || self()

    init_args = %{
      user_id: user_id,
      livestream_id: livestream_id,
      access_token: access_token,
      live_chat_id: live_chat_id,
      callback_pid: callback_pid
    }

    GenServer.start_link(__MODULE__, init_args)
  end

  @doc """
  Stops the gRPC stream.
  """
  def stop(pid) do
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
  def init(%{
        user_id: user_id,
        livestream_id: livestream_id,
        access_token: token,
        live_chat_id: chat_id,
        callback_pid: callback
      }) do
    Logger.metadata(user_id: user_id, component: :youtube_grpc_stream, chat_id: chat_id)

    state = %__MODULE__{
      user_id: user_id,
      livestream_id: livestream_id,
      access_token: token,
      live_chat_id: chat_id,
      callback_pid: callback,
      reconnect_attempts: 0
    }

    send(self(), :connect)

    {:ok, state}
  end

  @impl true
  def handle_info(:connect, state) do
    Logger.info("Connecting to chat")

    case connect_grpc(state) do
      {:ok, channel} ->
        case start_stream(channel, state) do
          {:ok, stream} ->
            {pid, ref} = start_stream_consumer(stream, state)

            new_state = %{
              state
              | channel: channel,
                stream: stream,
                stream_task_pid: pid,
                stream_task_ref: ref,
                reconnect_attempts: 0
            }

            {:noreply, new_state}

          {:error, reason} ->
            Logger.error("Failed to start stream: #{inspect(reason)}")

            handle_reconnect(state, reason)
        end

      {:error, reason} ->
        Logger.error("Failed to connect: #{inspect(reason)}")
        handle_reconnect(state, reason)
    end
  end

  @impl true
  def handle_info({:stream_message, response}, state) do
    process_response(response, state)
    {:noreply, state}
  end

  @impl true
  def handle_info({:stream_complete, :ok}, state) do
    Logger.info("Stream completed normally")
    send(state.callback_pid, {:stream_ended, :completed})
    {:stop, :normal, state}
  end

  @impl true
  def handle_info({:stream_complete, {:error, reason}}, state) do
    Logger.error("Stream completed with error: #{inspect(reason)}")

    handle_reconnect(state, reason)
  end

  @impl true
  def handle_info({:DOWN, ref, :process, pid, reason}, %{stream_task_pid: task_pid, stream_task_ref: task_ref} = state)
      when pid == task_pid and ref == task_ref do
    Logger.error("Stream task crashed: #{inspect(reason)}")

    case reason do
      :normal ->
        {:noreply, %{state | stream_task_pid: nil, stream_task_ref: nil}}

      _ ->
        handle_reconnect(state, {:task_crash, reason})
    end
  end

  @impl true
  def handle_info({:DOWN, _ref, :process, _pid, _reason}, state) do
    # Ignore DOWN messages from other processes
    {:noreply, state}
  end

  @impl true
  def handle_info(:reconnect, state) do
    if state.reconnect_attempts < state.max_reconnect_attempts do
      Logger.info("Reconnecting (#{state.reconnect_attempts + 1}/#{state.max_reconnect_attempts})")

      cleanup_connection(state)
      send(self(), :connect)

      {:noreply,
       %{
         state
         | channel: nil,
           stream: nil,
           stream_task_pid: nil,
           stream_task_ref: nil,
           reconnect_attempts: state.reconnect_attempts + 1
       }}
    else
      Logger.error("Max reconnection attempts reached")
      send(state.callback_pid, {:stream_ended, :max_reconnects_reached})
      {:stop, :normal, state}
    end
  end

  @impl true
  def handle_call(:get_status, _from, state) do
    status = %{
      connected: state.channel != nil,
      streaming: state.stream != nil,
      live_chat_id: state.live_chat_id,
      reconnect_attempts: state.reconnect_attempts
    }

    {:reply, status, state}
  end

  @impl true
  def terminate(_reason, state) do
    # Task.Supervisor will automatically clean up the task
    # We just need to clean up the gRPC connection
    cleanup_connection(state)
    :ok
  end

  ## Private Functions

  defp connect_grpc(state) do
    headers = [{"authorization", "Bearer #{state.access_token}"}]

    case GRPC.Stub.connect(@grpc_endpoint,
           headers: headers,
           adapter_opts: %{http2_opts: %{keepalive: 30_000}}
         ) do
      {:ok, channel} -> {:ok, channel}
      {:error, reason} -> {:error, reason}
    end
  end

  defp start_stream(channel, state) do
    request = %LiveChatMessageListRequest{
      live_chat_id: state.live_chat_id,
      part: ["snippet", "authorDetails"],
      max_results: 200
    }

    case Stub.stream_list(channel, request) do
      {:ok, stream} -> {:ok, stream}
      {:error, reason} -> {:error, reason}
    end
  end

  defp process_response(response, state) do
    items = response.items || []

    Enum.each(items, fn message ->
      process_message(message, state)
    end)
  end

  defp process_message(message, state) do
    with {:ok, event_type} <- determine_event_type(message),
         {:ok, processed_data} <- extract_message_data(message, event_type) do
      case event_type do
        :chat_message ->
          create_chat_message(message, processed_data, state)

        _ ->
          create_stream_event(message, event_type, processed_data, state)
      end

      send(state.callback_pid, {:youtube_message, event_type, processed_data})
    else
      {:error, reason} ->
        Logger.warning("Failed to process message: #{inspect(reason)}")
    end
  end

  defp determine_event_type(message) do
    case message.snippet.type do
      :TEXT_MESSAGE_EVENT -> {:ok, :chat_message}
      :SUPER_CHAT_EVENT -> {:ok, :donation}
      :SUPER_STICKER_EVENT -> {:ok, :donation}
      :NEW_SPONSOR_EVENT -> {:ok, :subscription}
      :MEMBER_MILESTONE_CHAT_EVENT -> {:ok, :subscription}
      :MEMBERSHIP_GIFTING_EVENT -> {:ok, :subscription}
      :GIFT_MEMBERSHIP_RECEIVED_EVENT -> {:ok, :subscription}
      _ -> {:error, :unsupported_message_type}
    end
  end

  defp extract_message_data(message, :chat_message) do
    {:ok,
     %{
       id: message.id,
       username: message.author_details.display_name,
       message: message.snippet.text_message_details.message_text,
       channel_id: message.author_details.channel_id,
       is_moderator: message.author_details.is_chat_moderator || false,
       is_owner: message.author_details.is_chat_owner || false,
       is_sponsor: message.author_details.is_chat_sponsor || false,
       timestamp: message.snippet.published_at
     }}
  end

  defp extract_message_data(message, :donation) do
    details = message.snippet.super_chat_details || message.snippet.super_sticker_details

    {:ok,
     %{
       id: message.id,
       username: message.author_details.display_name,
       channel_id: message.author_details.channel_id,
       amount_micros: details.amount_micros,
       currency: details.currency,
       amount_display: details.amount_display_string,
       comment: details.user_comment,
       tier: details.tier,
       timestamp: message.snippet.published_at
     }}
  end

  defp extract_message_data(message, :subscription) do
    details =
      message.snippet.new_sponsor_details ||
        message.snippet.member_milestone_chat_details ||
        message.snippet.membership_gifting_details

    {:ok,
     %{
       id: message.id,
       username: message.author_details.display_name,
       channel_id: message.author_details.channel_id,
       timestamp: message.snippet.published_at,
       details: details
     }}
  end

  defp extract_message_data(_message, _type), do: {:error, :unsupported_type}

  defp create_chat_message(_message, data, state) do
    ChatMessage.upsert(%{
      id: data.id,
      message: data.message,
      sender_username: data.username,
      platform: :youtube,
      sender_channel_id: data.channel_id,
      sender_is_moderator: data.is_moderator,
      sender_is_patreon: data.is_sponsor,
      user_id: state.user_id,
      livestream_id: state.livestream_id
    })
  end

  defp create_stream_event(message, event_type, data, state) do
    StreamEvent.create(%{
      type: event_type,
      data: data,
      data_raw: message,
      author_id: data.channel_id,
      livestream_id: state.livestream_id,
      user_id: state.user_id,
      platform: :youtube
    })
  end

  defp handle_reconnect(state, _reason) do
    cleanup_connection(state)
    Process.send_after(self(), :reconnect, state.reconnect_delay)
    {:noreply, %{state | channel: nil, stream: nil, stream_task_pid: nil, stream_task_ref: nil}}
  end

  defp cleanup_connection(state) do
    if state.stream do
      GRPC.Stub.end_stream(state.stream)
    end

    if state.channel do
      GRPC.Stub.disconnect(state.channel)
    end
  end

  defp start_stream_consumer(stream, state) do
    parent = self()

    # Use Task.Supervisor for proper OTP supervision
    # The task is supervised and will be automatically cleaned up
    # We monitor it to get :DOWN messages for crash detection/reconnection
    task =
      Task.Supervisor.async_nolink(Streampai.TaskSupervisor, fn ->
        case GRPC.Stub.recv(stream, timeout: :infinity) do
          {:ok, response_stream}
          when is_function(response_stream) or is_struct(response_stream, Stream) ->
            consume_stream(response_stream, parent, state)

          {:ok, response} ->
            # Single response (shouldn't happen with streaming)
            send(parent, {:stream_message, response})
            send(parent, {:stream_complete, :ok})

          {:error, error} ->
            send(parent, {:stream_complete, {:error, error}})
        end
      end)

    # Monitor the task to get :DOWN messages
    ref = Process.monitor(task.pid)
    {task.pid, ref}
  end

  defp consume_stream(response_stream, parent_pid, _state) do
    Enum.each(response_stream, fn
      {:ok, response} ->
        send(parent_pid, {:stream_message, response})

      {:error, error} ->
        Logger.error("Stream item error: #{inspect(error)}")

        send(parent_pid, {:stream_complete, {:error, error}})
        throw(:stream_error)
    end)

    send(parent_pid, {:stream_complete, :ok})
  catch
    :stream_error -> :ok
  end
end
