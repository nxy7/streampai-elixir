defmodule Streampai.YouTube.IntegrationExample do
  @moduledoc """
  Complete integration example showing how to use YouTube Live Streaming API
  with real-time chat streaming.

  This example demonstrates:
  1. Creating a live broadcast
  2. Creating a live stream
  3. Binding stream to broadcast
  4. Starting real-time chat streaming
  5. Handling chat messages and events
  6. Managing the full streaming lifecycle

  ## Prerequisites

  1. OAuth 2.0 setup with YouTube Data API scope
  2. YouTube channel with live streaming enabled
  3. Valid access token with required permissions

  ## Required Scopes
  - https://www.googleapis.com/auth/youtube
  - https://www.googleapis.com/auth/youtube.force-ssl
  """

  require Logger

  alias Streampai.YouTube.ApiClient
  alias Streampai.YouTube.LiveChatStream

  @doc """
  Complete example of setting up a YouTube live stream with chat.

  ## Parameters
  - `access_token`: OAuth 2.0 access token
  - `stream_config`: Stream configuration
    - `title`: Stream title
    - `description`: Stream description
    - `scheduled_start_time`: ISO 8601 timestamp (optional)
    - `privacy_status`: "public", "unlisted", or "private"

  ## Returns
  - `{:ok, %{broadcast: broadcast, stream: stream, chat_pid: pid}}`
  - `{:error, reason}`
  """
  def setup_live_stream_with_chat(access_token, stream_config) do
    with {:ok, broadcast} <- create_live_broadcast(access_token, stream_config),
         {:ok, stream} <- create_live_stream(access_token, stream_config),
         {:ok, bound_broadcast} <- bind_stream_to_broadcast(access_token, broadcast["id"], stream["id"]),
         {:ok, chat_id} <- extract_chat_id(bound_broadcast),
         {:ok, chat_pid} <- start_chat_streaming(access_token, chat_id) do

      result = %{
        broadcast: bound_broadcast,
        stream: stream,
        chat_id: chat_id,
        chat_pid: chat_pid,
        stream_key: get_in(stream, ["cdn", "ingestionInfo", "streamName"]),
        rtmp_url: get_in(stream, ["cdn", "ingestionInfo", "ingestionAddress"])
      }

      Logger.info("Live stream setup complete: #{inspect(result, pretty: true)}")
      {:ok, result}
    else
      error ->
        Logger.error("Failed to setup live stream: #{inspect(error)}")
        error
    end
  end

  @doc """
  Starts a simple chat message handler that logs all messages.
  """
  def start_chat_logger(access_token, chat_id) do
    handler_pid = spawn(fn -> chat_message_handler() end)
    LiveChatStream.start_stream(access_token, chat_id, handler_pid)
  end

  @doc """
  Starts a chat message handler that processes different event types.
  """
  def start_advanced_chat_handler(access_token, chat_id, opts \\ []) do
    callbacks = %{
      text_message: Keyword.get(opts, :on_text_message, &default_text_handler/1),
      super_chat: Keyword.get(opts, :on_super_chat, &default_super_chat_handler/1),
      new_subscriber: Keyword.get(opts, :on_new_subscriber, &default_subscriber_handler/1),
      moderation: Keyword.get(opts, :on_moderation, &default_moderation_handler/1)
    }

    handler_pid = spawn(fn -> advanced_chat_handler(callbacks) end)
    LiveChatStream.start_stream(access_token, chat_id, handler_pid, opts)
  end

  ## Private Functions

  defp create_live_broadcast(access_token, config) do
    broadcast_data = %{
      snippet: %{
        title: Map.get(config, :title, "Live Stream"),
        description: Map.get(config, :description, ""),
        scheduledStartTime: Map.get(config, :scheduled_start_time)
      } |> Enum.reject(fn {_, v} -> is_nil(v) end) |> Map.new(),
      status: %{
        privacyStatus: Map.get(config, :privacy_status, "public"),
        selfDeclaredMadeForKids: false
      }
    }

    Logger.info("Creating live broadcast: #{config[:title]}")
    ApiClient.insert_live_broadcast(access_token, "snippet,status", broadcast_data)
  end

  defp create_live_stream(access_token, config) do
    stream_data = %{
      snippet: %{
        title: "#{Map.get(config, :title, "Live Stream")} - Stream"
      },
      cdn: %{
        format: "1080p",
        ingestionType: "rtmp",
        resolution: "variable"
      }
    }

    Logger.info("Creating live stream")
    ApiClient.insert_live_stream(access_token, "snippet,cdn", stream_data)
  end

  defp bind_stream_to_broadcast(access_token, broadcast_id, stream_id) do
    Logger.info("Binding stream #{stream_id} to broadcast #{broadcast_id}")
    ApiClient.bind_live_broadcast(access_token, broadcast_id, "snippet,status", stream_id: stream_id)
  end

  defp extract_chat_id(broadcast) do
    case get_in(broadcast, ["snippet", "liveChatId"]) do
      nil -> {:error, :no_live_chat_id}
      chat_id -> {:ok, chat_id}
    end
  end

  defp start_chat_streaming(access_token, chat_id) do
    Logger.info("Starting real-time chat streaming for chat_id: #{chat_id}")
    LiveChatStream.start_stream(access_token, chat_id)
  end

  # Simple chat message handler
  defp chat_message_handler do
    receive do
      {:chat_message, message} ->
        author = get_in(message, ["authorDetails", "displayName"]) || "Unknown"
        text = get_in(message, ["snippet", "displayMessage"]) || ""
        message_type = get_in(message, ["snippet", "type"])

        Logger.info("[CHAT] #{author}: #{text} (type: #{message_type})")
        chat_message_handler()

      {:chat_error, reason} ->
        Logger.error("[CHAT ERROR] #{inspect(reason)}")
        chat_message_handler()

      {:chat_ended, reason} ->
        Logger.info("[CHAT ENDED] #{inspect(reason)}")
        :ok

      other ->
        Logger.debug("[CHAT UNKNOWN] #{inspect(other)}")
        chat_message_handler()
    end
  end

  # Advanced chat message handler with event-specific callbacks
  defp advanced_chat_handler(callbacks) do
    receive do
      {:chat_message, message} ->
        handle_chat_event(message, callbacks)
        advanced_chat_handler(callbacks)

      {:chat_error, reason} ->
        Logger.error("[CHAT ERROR] #{inspect(reason)}")
        advanced_chat_handler(callbacks)

      {:chat_ended, reason} ->
        Logger.info("[CHAT ENDED] #{inspect(reason)}")
        :ok

      other ->
        Logger.debug("[CHAT UNKNOWN] #{inspect(other)}")
        advanced_chat_handler(callbacks)
    end
  end

  defp handle_chat_event(message, callbacks) do
    message_type = get_in(message, ["snippet", "type"])

    case message_type do
      "textMessageEvent" ->
        callbacks.text_message.(message)

      "superChatEvent" ->
        callbacks.super_chat.(message)

      "newSponsorEvent" ->
        callbacks.new_subscriber.(message)

      type when type in ["messageDeletedEvent", "userBannedEvent", "moderatorAddedEvent"] ->
        callbacks.moderation.(message)

      _other ->
        Logger.debug("Unhandled message type: #{message_type}")
    end
  end

  # Default event handlers
  defp default_text_handler(message) do
    author = get_in(message, ["authorDetails", "displayName"])
    text = get_in(message, ["snippet", "displayMessage"])
    Logger.info("[TEXT] #{author}: #{text}")
  end

  defp default_super_chat_handler(message) do
    author = get_in(message, ["authorDetails", "displayName"])
    amount = get_in(message, ["snippet", "superChatDetails", "amountDisplayString"])
    text = get_in(message, ["snippet", "displayMessage"])
    Logger.info("[SUPER CHAT] #{author} (#{amount}): #{text}")
  end

  defp default_subscriber_handler(message) do
    author = get_in(message, ["authorDetails", "displayName"])
    Logger.info("[NEW SUBSCRIBER] #{author} just subscribed!")
  end

  defp default_moderation_handler(message) do
    message_type = get_in(message, ["snippet", "type"])
    Logger.info("[MODERATION] #{message_type}: #{inspect(message)}")
  end

  ## Utility Functions

  @doc """
  Cleanup function to properly stop streaming and clean up resources.
  """
  def cleanup_stream(stream_data) do
    # Stop chat streaming
    if Map.has_key?(stream_data, :chat_pid) do
      LiveChatStream.stop_stream(stream_data.chat_pid)
    end

    # Note: Broadcast and stream cleanup would typically be handled
    # by the streaming software (OBS, etc.) or manual YouTube dashboard actions
    Logger.info("Stream cleanup completed")
    :ok
  end

  @doc """
  Example of sending a chat message during the stream.
  """
  def send_chat_message(access_token, chat_id, message_text) do
    message_data = %{
      snippet: %{
        liveChatId: chat_id,
        type: "textMessageEvent",
        textMessageDetails: %{
          messageText: message_text
        }
      }
    }

    ApiClient.insert_live_chat_message(access_token, "snippet", message_data)
  end

  @doc """
  Get stream statistics and status.
  """
  def get_stream_stats(access_token, broadcast_id) do
    ApiClient.list_live_broadcasts(access_token, "snippet,status,statistics", id: [broadcast_id])
  end
end