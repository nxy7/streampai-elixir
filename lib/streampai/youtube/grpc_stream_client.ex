defmodule Streampai.YouTube.GrpcStreamClient do
  @moduledoc """
  YouTube Live Chat gRPC streaming client using the StreamList RPC method.

  This module provides real-time streaming access to YouTube Live Chat messages
  using the generated gRPC client from the protobuf definitions.
  """

  use GenServer

  alias Streampai.Stream.EventPersister
  alias Streampai.YouTube.TokenManager
  alias Youtube.Api.V3.LiveChatMessageListRequest
  alias Youtube.Api.V3.V3DataLiveChatMessageService.Stub

  require Logger

  defstruct [
    :user_id,
    :livestream_id,
    :access_token,
    :live_chat_id,
    :channel,
    :callback_pid,
    :reconnect_attempts,
    :next_page_token,
    :stream_consumer_pid,
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

  @doc """
  Updates the access token (used after token refresh).
  """
  def update_token(pid, new_token) do
    GenServer.call(pid, {:update_token, new_token})
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
    TokenManager.subscribe(user_id)

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
    result = if state.channel, do: {:ok, state.channel}, else: connect_and_validate(state)

    case result do
      {:ok, channel} ->
        parent_pid = self()

        consumer_pid =
          spawn_link(fn ->
            consume_stream_loop(parent_pid, channel, state)
          end)

        new_state = %{
          state
          | channel: channel,
            stream_consumer_pid: consumer_pid,
            reconnect_attempts: 0
        }

        {:noreply, new_state}

      {:error, {:token_expired, _} = reason} ->
        Logger.warning("Token expired, requesting refresh from TokenManager...")

        case TokenManager.refresh_token(state.user_id) do
          {:ok, new_token} ->
            Logger.info("Token refreshed, reconnecting...")
            new_state = %{state | access_token: new_token}
            send(self(), :connect)
            {:noreply, new_state}

          {:error, refresh_error} ->
            Logger.error("Token refresh failed: #{inspect(refresh_error)}")
            send(state.callback_pid, {:token_expired, reason})
            {:noreply, state}
        end

      {:error, reason} ->
        Logger.error("Failed to connect: #{inspect(reason, pretty: true, limit: :infinity)}")
        handle_reconnect(state, reason)
    end
  end

  @impl true
  def handle_info({:token_updated, _user_id, new_token}, state) do
    Logger.info("Received updated token from TokenManager")
    {:noreply, %{state | access_token: new_token}}
  end

  @impl true
  def handle_info({:stream_batch_complete, next_token}, state) do
    Logger.debug("Stream batch completed, reconnecting with next_page_token...")

    new_state = %{
      state
      | next_page_token: next_token,
        reconnect_attempts: 0,
        stream_consumer_pid: nil
    }

    Process.send_after(self(), :connect, 100)
    {:noreply, new_state}
  end

  @impl true
  def handle_info({:stream_error, reason}, state) do
    Logger.error("Stream error from consumer: #{inspect(reason)}")
    cleanup_connection(state)
    handle_reconnect(%{state | channel: nil}, reason)
  end

  @impl true
  def handle_info({:DOWN, _ref, :process, _pid, _reason}, state) do
    {:noreply, state}
  end

  @impl true
  def handle_info({:gun_up, _conn_pid, _protocol}, state) do
    {:noreply, state}
  end

  @impl true
  def handle_info({:gun_data, _conn_pid, _stream_ref, _fin, _data}, state) do
    {:noreply, state}
  end

  @impl true
  def handle_info({:gun_response, _conn_pid, _stream_ref, _fin, _status, _headers}, state) do
    {:noreply, state}
  end

  @impl true
  def handle_info({:gun_error, _conn_pid, _stream_ref, reason}, state) do
    Logger.error("Gun connection error: #{inspect(reason)}")
    handle_reconnect(state, {:gun_error, reason})
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
           stream_consumer_pid: nil,
           reconnect_attempts: state.reconnect_attempts + 1
       }}
    else
      Logger.error("Max reconnection attempts reached")
      cleanup_connection(state)
      send(state.callback_pid, {:stream_ended, :max_reconnects_reached})
      {:stop, :normal, state}
    end
  end

  @impl true
  def handle_info(msg, state) do
    Logger.debug("Unhandled message: #{inspect(msg)}")
    {:noreply, state}
  end

  @impl true
  def handle_call(:get_status, _from, state) do
    status = %{
      connected: state.channel != nil,
      streaming: state.stream_consumer_pid != nil,
      live_chat_id: state.live_chat_id,
      reconnect_attempts: state.reconnect_attempts
    }

    {:reply, status, state}
  end

  @impl true
  def handle_call({:update_token, new_token}, _from, state) do
    Logger.info("Access token updated")
    {:reply, :ok, %{state | access_token: new_token}}
  end

  @impl true
  def terminate(_reason, state) do
    cleanup_connection(state)
    :ok
  end

  ## Private Functions

  defp connect_and_validate(state) do
    with {:ok, _token_info} <- validate_token(state) do
      connect_grpc(state)
    end
  end

  defp validate_token(state) do
    alias Streampai.YouTube.ApiClient

    Logger.info(
      "Validating access token (length: #{String.length(state.access_token || "")}, is_nil: #{is_nil(state.access_token)})..."
    )

    case ApiClient.validate_token(state.access_token) do
      {:ok, token_info} ->
        scopes = Map.get(token_info, "scope", "")
        expires_in = Map.get(token_info, "expires_in", "unknown")

        Logger.info("""
        ✓ Token is valid
          Expires in: #{expires_in} seconds
          Scopes: #{scopes}
        """)

        {:ok, token_info}

      {:error, {:http_error, 401, _} = reason} ->
        Logger.error("✗ Token validation failed: 401 Unauthorized")
        {:error, {:token_expired, reason}}

      {:error, reason} ->
        Logger.error("✗ Token validation failed: #{inspect(reason)}")
        {:error, {:invalid_token, reason}}
    end
  end

  defp connect_grpc(_state) do
    Logger.info("Connecting to gRPC endpoint: #{@grpc_endpoint}")

    # Create SSL credentials similar to Python's grpc.ssl_channel_credentials()
    cred =
      GRPC.Credential.new(
        ssl: [
          cacertfile: CAStore.file_path()
        ]
      )

    # Configure HTTP/2 keepalive to prevent connection from timing out
    adapter_opts = [
      http2_opts: %{
        # Send ping every 30 seconds
        keepalive: 30_000,
        # Close connection after 3 unacknowledged pings
        keepalive_tolerance: 3
      }
    ]

    case GRPC.Stub.connect(@grpc_endpoint, cred: cred, adapter_opts: adapter_opts) do
      {:ok, channel} ->
        Logger.info("✓ gRPC channel connected successfully")
        Logger.debug("Channel details: #{inspect(channel, pretty: true)}")
        {:ok, channel}

      {:error, reason} ->
        Logger.error("✗ gRPC channel connection failed: #{inspect(reason)}")
        {:error, reason}
    end
  end

  defp start_stream(channel, state) do
    request = %LiveChatMessageListRequest{
      live_chat_id: state.live_chat_id,
      part: ["id", "snippet", "authorDetails"],
      page_token: state.next_page_token,
      profile_image_size: 32
    }

    # Pass authorization as metadata to the RPC call, not channel headers
    metadata = [{"authorization", "Bearer #{state.access_token}"}]

    Stub.stream_list(channel, request, metadata: metadata)
  end

  defp process_response(response, state) do
    items = response.items || []

    Enum.each(items, fn message ->
      process_message(message, state)
    end)
  end

  defp process_message(message, state) do
    Logger.debug("Processing YouTube message: #{inspect(message)}")
    {:ok, event_type} = determine_event_type(message)
    {:ok, processed_data} = extract_message_data(message, event_type)

    queue_event_for_persistence(event_type, processed_data, state)

    broadcast_data = format_for_broadcast(event_type, processed_data)
    send(state.callback_pid, {:youtube_message, event_type, broadcast_data})
  catch
    :error, error ->
      Logger.error("Skipping unsupported message type: #{inspect(error)}")
  end

  defp format_for_broadcast(:chat_message, {message_data, author_details}) do
    Map.merge(message_data, %{
      username: author_details.display_name,
      channel_id: author_details.channel_id,
      is_moderator: author_details.is_moderator,
      is_owner: author_details.is_owner,
      is_sponsor: author_details.is_patreon
    })
  end

  defp format_for_broadcast(_event_type, data), do: data

  defp queue_event_for_persistence(:chat_message, data, state) do
    queue_chat_message_for_persistence(data, state)
  end

  defp queue_event_for_persistence(event_type, data, state) when event_type in [:donation, :subscription] do
    queue_stream_event_for_persistence(data, event_type, state)
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
    message_text =
      case message.snippet.displayed_content do
        {:text_message_details, %{message_text: text}} -> text
        _ -> message.snippet.display_message || ""
      end

    author_details = %{
      channel_id: message.author_details.channel_id,
      display_name: message.author_details.display_name,
      avatar_url: message.author_details.profile_image_url,
      channel_url: message.author_details.channel_url,
      is_verified: message.author_details.is_verified || false,
      is_owner: message.author_details.is_chat_owner || false,
      is_moderator: message.author_details.is_chat_moderator || false,
      is_patreon: message.author_details.is_chat_sponsor || false
    }

    message_data = %{
      id: message.id,
      message: message_text,
      timestamp: message.snippet.published_at
    }

    {:ok, {message_data, author_details}}
  end

  defp extract_message_data(message, :donation) do
    details =
      case message.snippet.displayed_content do
        {:super_chat_details, details} -> details
        {:super_sticker_details, details} -> details
        _ -> %{}
      end

    {:ok,
     %{
       id: message.id,
       username: message.author_details.display_name,
       channel_id: message.author_details.channel_id,
       amount_micros: Map.get(details, :amount_micros),
       currency: Map.get(details, :currency),
       amount_display: Map.get(details, :amount_display_string),
       comment: Map.get(details, :user_comment),
       tier: Map.get(details, :tier),
       timestamp: message.snippet.published_at
     }}
  end

  defp extract_message_data(message, :subscription) do
    details =
      case message.snippet.displayed_content do
        {:new_sponsor_details, details} -> details
        {:member_milestone_chat_details, details} -> details
        {:membership_gifting_details, details} -> details
        {:gift_membership_received_details, details} -> details
        _ -> %{}
      end

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

  defp queue_chat_message_for_persistence({message_data, author_details}, state) do
    message_attrs = %{
      id: message_data.id,
      message: message_data.message,
      sender_username: author_details.display_name,
      platform: :youtube,
      sender_channel_id: author_details.channel_id,
      sender_is_moderator: author_details.is_moderator,
      sender_is_patreon: author_details.is_patreon,
      user_id: state.user_id,
      livestream_id: state.livestream_id,
      is_owner: author_details.is_owner,
      platform_timestamp: message_data.timestamp
    }

    author_attrs = %{
      viewer_id: author_details.channel_id,
      user_id: state.user_id,
      platform: "youtube",
      display_name: author_details.display_name,
      avatar_url: author_details.avatar_url,
      channel_url: author_details.channel_url,
      is_verified: author_details.is_verified,
      is_owner: author_details.is_owner,
      is_moderator: author_details.is_moderator,
      is_patreon: author_details.is_patreon
    }

    EventPersister.add_message({message_attrs, author_attrs})
  end

  defp queue_stream_event_for_persistence(data, event_type, state) do
    processed_data = %{
      username: data.username,
      channel_id: data.channel_id,
      amount_micros: data[:amount_micros],
      amount_cents: convert_to_cents(data[:amount_micros]),
      currency: data[:currency],
      comment: data[:comment],
      metadata: build_event_metadata(data, event_type)
    }

    event_attrs = %{
      type: event_type,
      data: processed_data,
      author_id: data.channel_id,
      platform: :youtube,
      user_id: state.user_id,
      livestream_id: state.livestream_id
    }

    EventPersister.add_event(event_attrs)
  end

  defp convert_to_cents(nil), do: nil
  defp convert_to_cents(micros) when is_integer(micros), do: div(micros, 10_000)

  defp build_event_metadata(data, :donation) do
    %{
      amount_display: data[:amount_display],
      tier: data[:tier]
    }
  end

  defp build_event_metadata(data, :subscription) do
    %{
      details: data[:details]
    }
  end

  defp handle_reconnect(state, _reason) do
    Process.send_after(self(), :reconnect, state.reconnect_delay)
    {:noreply, %{state | stream_consumer_pid: nil}}
  end

  defp cleanup_connection(%{channel: nil}), do: :ok

  defp cleanup_connection(%{channel: channel}) do
    GRPC.Stub.disconnect(channel)
  catch
    kind, reason ->
      Logger.warning("gRPC disconnect failed (#{kind}): #{inspect(reason)}")
      :ok
  end

  defp consume_stream_loop(parent_pid, channel, state) do
    Logger.debug("Starting stream consumption")

    case start_stream(channel, state) do
      {:ok, stream} ->
        result = process_stream_items(stream, state, parent_pid)
        handle_stream_result(result, parent_pid)

      {:error, reason} ->
        Logger.error("Failed to start stream: #{inspect(reason, pretty: true, limit: :infinity)}")
        send(parent_pid, {:stream_error, reason})
    end
  end

  defp process_stream_items(stream, state, parent_pid) do
    Enum.reduce_while(stream, {0, nil}, fn item, {count, _prev_token} ->
      handle_stream_item(item, count, state, parent_pid)
    end)
  end

  defp handle_stream_item({:ok, response}, count, state, _parent_pid) do
    item_count = length(response.items || [])

    if item_count > 0 do
      Logger.debug("Received batch with #{item_count} messages")
    end

    process_response(response, state)
    {:cont, {count + 1, response.next_page_token}}
  end

  defp handle_stream_item({:error, %GRPC.RPCError{} = error}, _count, state, parent_pid) do
    handle_grpc_error(error, state, parent_pid)
    {:halt, {:error, error}}
  end

  defp handle_stream_item({:error, error}, _count, state, _parent_pid) do
    Logger.error("✗ Stream error: #{inspect(error, pretty: true)}")
    send(state.callback_pid, {:stream_ended, {:error, error}})
    {:halt, {:error, error}}
  end

  defp handle_grpc_error(%GRPC.RPCError{status: 16} = error, state, parent_pid) do
    Logger.warning("Token expired during stream, requesting refresh...")

    case TokenManager.refresh_token(state.user_id) do
      {:ok, _new_token} ->
        send(parent_pid, {:stream_error, {:token_refreshed, error}})

      {:error, _reason} ->
        send(state.callback_pid, {:token_expired, error})
    end
  end

  defp handle_grpc_error(%GRPC.RPCError{status: status, message: message} = error, state, _parent_pid) do
    Logger.error("✗ gRPC error during stream consumption")
    Logger.error("  Status code: #{status}")
    Logger.error("  Error message: #{message}")
    send(state.callback_pid, {:stream_ended, {:error, error}})
  end

  defp handle_stream_result({_count, next_token}, parent_pid) when is_binary(next_token) or is_nil(next_token) do
    send(parent_pid, {:stream_batch_complete, next_token})
  end

  defp handle_stream_result({:error, reason}, parent_pid) do
    Logger.error("Stream ended with error: #{inspect(reason)}")
    send(parent_pid, {:stream_error, reason})
  end
end
