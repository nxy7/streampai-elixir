defmodule Streampai.YouTube.ApiClient do
  @moduledoc """
  YouTube Live Streaming API v3 client for managing live broadcasts, streams, and chat messages.

  This module provides a comprehensive interface to YouTube's Live Streaming API,
  supporting live broadcasts, live streams, and live chat message operations.

  ## Authentication
  Requires OAuth 2.0 access token with appropriate YouTube scopes.

  ## Rate Limits
  YouTube API has quota limits. Monitor your usage through Google Cloud Console.
  """

  require Logger

  @base_url "https://www.googleapis.com/youtube/v3"

  # Default request timeout in milliseconds
  @default_timeout 30_000

  @type access_token :: String.t()
  @type api_result :: {:ok, map()} | {:error, term()}
  @type part_param :: String.t() | [String.t()]

  # Client configuration
  defp client(access_token) do
    Req.new(
      base_url: @base_url,
      headers: [
        {"Authorization", "Bearer #{access_token}"},
        {"Accept", "application/json"},
        {"Content-Type", "application/json"}
      ],
      receive_timeout: @default_timeout
    )
  end

  ## Live Chat Messages API

  @doc """
  Streams live chat messages in real-time using gRPC.

  For real-time chat streaming, use `Streampai.YouTube.LiveChatStream.start_stream/3` instead.
  This function is kept for reference but real-time streaming requires gRPC.

  ## Example
      # For real-time streaming:
      {:ok, pid} = LiveChatStream.start_stream(access_token, live_chat_id, self())

      # Messages will be received as:
      # {:chat_message, message}
  """
  def stream_live_chat_messages(_access_token, _live_chat_id, _opts \\ []) do
    {:error, :use_grpc_streaming, "Use Streampai.YouTube.LiveChatStream for real-time streaming"}
  end

  @doc """
  Inserts a live chat message into a live broadcast.

  ## Parameters
  - `access_token`: OAuth 2.0 access token
  - `part`: Resource parts to include (typically "snippet")
  - `message_data`: Message data containing snippet with liveChatId and textMessageDetails

  ## Example
      message_data = %{
        snippet: %{
          liveChatId: "chat_id",
          type: "textMessageEvent",
          textMessageDetails: %{
            messageText: "Hello from the API!"
          }
        }
      }
      {:ok, result} = ApiClient.insert_live_chat_message(token, "snippet", message_data)
  """
  @spec insert_live_chat_message(access_token, part_param, map()) :: api_result()
  def insert_live_chat_message(access_token, part, message_data) do
    params = %{part: normalize_part_param(part)}

    access_token
    |> client()
    |> Req.post(url: "/liveChat/messages", params: params, json: message_data)
    |> handle_response()
  end

  @doc """
  Deletes a live chat message.

  ## Parameters
  - `access_token`: OAuth 2.0 access token
  - `message_id`: The ID of the message to delete
  """
  @spec delete_live_chat_message(access_token, String.t()) :: api_result()
  def delete_live_chat_message(access_token, message_id) do
    params = %{id: message_id}

    access_token
    |> client()
    |> Req.delete(url: "/liveChat/messages", params: params)
    |> handle_response()
  end

  ## Live Broadcasts API

  @doc """
  Lists live broadcasts for the authenticated user.

  ## Parameters
  - `access_token`: OAuth 2.0 access token
  - `part`: Resource parts to include
  - `opts`: Optional parameters
    - `broadcast_status`: Filter by status ("active", "all", "completed", "upcoming")
    - `broadcast_type`: Filter by type ("all", "event", "persistent")
    - `id`: List of broadcast IDs to retrieve
    - `max_results`: Maximum number of results (0-50, default 5)
    - `mine`: Return broadcasts owned by authenticated user
    - `on_behalf_of_content_owner`: Content owner ID
    - `on_behalf_of_content_owner_channel`: Channel ID
    - `page_token`: Page token for pagination
  """
  @spec list_live_broadcasts(access_token, part_param, keyword()) :: api_result()
  def list_live_broadcasts(access_token, part, opts \\ []) do
    params =
      opts
      |> Keyword.take([
        :broadcast_status,
        :broadcast_type,
        :id,
        :max_results,
        :mine,
        :on_behalf_of_content_owner,
        :on_behalf_of_content_owner_channel,
        :page_token
      ])
      |> Keyword.put(:part, normalize_part_param(part))
      |> Enum.reject(fn {_k, v} -> is_nil(v) end)
      |> Map.new()
      |> normalize_broadcast_params()

    access_token
    |> client()
    |> Req.get(url: "/liveBroadcasts", params: params)
    |> handle_response()
  end

  @doc """
  Creates a new live broadcast.

  ## Parameters
  - `access_token`: OAuth 2.0 access token
  - `part`: Resource parts to include
  - `broadcast_data`: Broadcast data containing snippet and status
  - `opts`: Optional parameters
    - `on_behalf_of_content_owner`: Content owner ID
    - `on_behalf_of_content_owner_channel`: Channel ID

  ## Example
      broadcast_data = %{
        snippet: %{
          title: "My Live Broadcast",
          scheduledStartTime: "2024-01-01T12:00:00Z",
          description: "A test broadcast"
        },
        status: %{
          privacyStatus: "public"
        }
      }
      {:ok, broadcast} = ApiClient.insert_live_broadcast(token, "snippet,status", broadcast_data)
  """
  @spec insert_live_broadcast(access_token, part_param, map(), keyword()) :: api_result()
  def insert_live_broadcast(access_token, part, broadcast_data, opts \\ []) do
    params =
      opts
      |> Keyword.take([:on_behalf_of_content_owner, :on_behalf_of_content_owner_channel])
      |> Keyword.put(:part, normalize_part_param(part))
      |> Enum.reject(fn {_k, v} -> is_nil(v) end)
      |> Map.new()
      |> normalize_broadcast_params()

    access_token
    |> client()
    |> Req.post(url: "/liveBroadcasts", params: params, json: broadcast_data)
    |> handle_response()
  end

  @doc """
  Updates an existing live broadcast.

  ## Parameters
  - `access_token`: OAuth 2.0 access token
  - `part`: Resource parts to update
  - `broadcast_data`: Updated broadcast data (must include ID)
  - `opts`: Optional parameters (same as insert_live_broadcast)
  """
  @spec update_live_broadcast(access_token, part_param, map(), keyword()) :: api_result()
  def update_live_broadcast(access_token, part, broadcast_data, opts \\ []) do
    params =
      opts
      |> Keyword.take([:on_behalf_of_content_owner, :on_behalf_of_content_owner_channel])
      |> Keyword.put(:part, normalize_part_param(part))
      |> Enum.reject(fn {_k, v} -> is_nil(v) end)
      |> Map.new()
      |> normalize_broadcast_params()

    access_token
    |> client()
    |> Req.put(url: "/liveBroadcasts", params: params, json: broadcast_data)
    |> handle_response()
  end

  @doc """
  Binds a live stream to a live broadcast.

  ## Parameters
  - `access_token`: OAuth 2.0 access token
  - `id`: Broadcast ID
  - `part`: Resource parts to return
  - `opts`: Optional parameters
    - `stream_id`: ID of the stream to bind
    - `on_behalf_of_content_owner`: Content owner ID
    - `on_behalf_of_content_owner_channel`: Channel ID
  """
  @spec bind_live_broadcast(access_token, String.t(), part_param, keyword()) :: api_result()
  def bind_live_broadcast(access_token, id, part, opts \\ []) do
    params =
      opts
      |> Keyword.take([
        :stream_id,
        :on_behalf_of_content_owner,
        :on_behalf_of_content_owner_channel
      ])
      |> Keyword.put(:id, id)
      |> Keyword.put(:part, normalize_part_param(part))
      |> Enum.reject(fn {_k, v} -> is_nil(v) end)
      |> Map.new()
      |> normalize_broadcast_params()

    access_token
    |> client()
    |> Req.post(url: "/liveBroadcasts/bind", params: params)
    |> handle_response()
  end

  @doc """
  Deletes a live broadcast.

  ## Parameters
  - `access_token`: OAuth 2.0 access token
  - `id`: Broadcast ID to delete
  - `opts`: Optional parameters
    - `on_behalf_of_content_owner`: Content owner ID
    - `on_behalf_of_content_owner_channel`: Channel ID
  """
  @spec delete_live_broadcast(access_token, String.t(), keyword()) :: api_result()
  def delete_live_broadcast(access_token, id, opts \\ []) do
    params =
      opts
      |> Keyword.take([:on_behalf_of_content_owner, :on_behalf_of_content_owner_channel])
      |> Keyword.put(:id, id)
      |> Enum.reject(fn {_k, v} -> is_nil(v) end)
      |> Map.new()
      |> normalize_broadcast_params()

    access_token
    |> client()
    |> Req.delete(url: "/liveBroadcasts", params: params)
    |> handle_response()
  end

  ## Live Streams API

  @doc """
  Lists live streams for the authenticated user.

  ## Parameters
  - `access_token`: OAuth 2.0 access token
  - `part`: Resource parts to include
  - `opts`: Optional parameters
    - `id`: List of stream IDs to retrieve
    - `max_results`: Maximum number of results (0-50, default 5)
    - `mine`: Return streams owned by authenticated user
    - `on_behalf_of_content_owner`: Content owner ID
    - `on_behalf_of_content_owner_channel`: Channel ID
    - `page_token`: Page token for pagination
  """
  @spec list_live_streams(access_token, part_param, keyword()) :: api_result()
  def list_live_streams(access_token, part, opts \\ []) do
    params =
      opts
      |> Keyword.take([
        :id,
        :max_results,
        :mine,
        :on_behalf_of_content_owner,
        :on_behalf_of_content_owner_channel,
        :page_token
      ])
      |> Keyword.put(:part, normalize_part_param(part))
      |> Enum.reject(fn {_k, v} -> is_nil(v) end)
      |> Map.new()
      |> normalize_broadcast_params()

    access_token
    |> client()
    |> Req.get(url: "/liveStreams", params: params)
    |> handle_response()
  end

  @doc """
  Creates a new live stream.

  ## Parameters
  - `access_token`: OAuth 2.0 access token
  - `part`: Resource parts to include
  - `stream_data`: Stream data containing snippet and cdn
  - `opts`: Optional parameters
    - `on_behalf_of_content_owner`: Content owner ID
    - `on_behalf_of_content_owner_channel`: Channel ID

  ## Example
      stream_data = %{
        snippet: %{
          title: "My Live Stream",
          description: "Stream description"
        },
        cdn: %{
          format: "1080p",
          ingestionType: "rtmp"
        }
      }
      {:ok, stream} = ApiClient.insert_live_stream(token, "snippet,cdn", stream_data)
  """
  @spec insert_live_stream(access_token, part_param, map(), keyword()) :: api_result()
  def insert_live_stream(access_token, part, stream_data, opts \\ []) do
    params =
      opts
      |> Keyword.take([:on_behalf_of_content_owner, :on_behalf_of_content_owner_channel])
      |> Keyword.put(:part, normalize_part_param(part))
      |> Enum.reject(fn {_k, v} -> is_nil(v) end)
      |> Map.new()
      |> normalize_broadcast_params()

    access_token
    |> client()
    |> Req.post(url: "/liveStreams", params: params, json: stream_data)
    |> handle_response()
  end

  @doc """
  Updates an existing live stream.

  ## Parameters
  - `access_token`: OAuth 2.0 access token
  - `part`: Resource parts to update
  - `stream_data`: Updated stream data (must include ID)
  - `opts`: Optional parameters (same as insert_live_stream)
  """
  @spec update_live_stream(access_token, part_param, map(), keyword()) :: api_result()
  def update_live_stream(access_token, part, stream_data, opts \\ []) do
    params =
      opts
      |> Keyword.take([:on_behalf_of_content_owner, :on_behalf_of_content_owner_channel])
      |> Keyword.put(:part, normalize_part_param(part))
      |> Enum.reject(fn {_k, v} -> is_nil(v) end)
      |> Map.new()
      |> normalize_broadcast_params()

    access_token
    |> client()
    |> Req.put(url: "/liveStreams", params: params, json: stream_data)
    |> handle_response()
  end

  @doc """
  Deletes a live stream.

  ## Parameters
  - `access_token`: OAuth 2.0 access token
  - `id`: Stream ID to delete
  - `opts`: Optional parameters
    - `on_behalf_of_content_owner`: Content owner ID
    - `on_behalf_of_content_owner_channel`: Channel ID
  """
  @spec delete_live_stream(access_token, String.t(), keyword()) :: api_result()
  def delete_live_stream(access_token, id, opts \\ []) do
    params =
      opts
      |> Keyword.take([:on_behalf_of_content_owner, :on_behalf_of_content_owner_channel])
      |> Keyword.put(:id, id)
      |> Enum.reject(fn {_k, v} -> is_nil(v) end)
      |> Map.new()
      |> normalize_broadcast_params()

    access_token
    |> client()
    |> Req.delete(url: "/liveStreams", params: params)
    |> handle_response()
  end

  ## Utility Functions

  @doc """
  Gets the live chat ID for a given broadcast ID.
  This is a convenience function that retrieves a broadcast and extracts its live chat ID.
  """
  @spec get_live_chat_id(access_token, String.t()) :: {:ok, String.t()} | {:error, term()}
  def get_live_chat_id(access_token, broadcast_id) do
    case list_live_broadcasts(access_token, "snippet", id: [broadcast_id]) do
      {:ok, %{"items" => [broadcast | _]}} ->
        case get_in(broadcast, ["snippet", "liveChatId"]) do
          nil -> {:error, :no_live_chat_id}
          chat_id -> {:ok, chat_id}
        end

      {:ok, %{"items" => []}} ->
        {:error, :broadcast_not_found}

      error ->
        error
    end
  end

  ## Private Functions

  # Normalizes part parameter to comma-separated string
  defp normalize_part_param(part) when is_binary(part), do: part
  defp normalize_part_param(parts) when is_list(parts), do: Enum.join(parts, ",")

  # Converts snake_case parameter names to camelCase for YouTube API
  defp normalize_broadcast_params(params) do
    Map.new(params, fn
      {:broadcast_status, value} -> {"broadcastStatus", value}
      {:broadcast_type, value} -> {"broadcastType", value}
      {:max_results, value} -> {"maxResults", value}
      {:on_behalf_of_content_owner, value} -> {"onBehalfOfContentOwner", value}
      {:on_behalf_of_content_owner_channel, value} -> {"onBehalfOfContentOwnerChannel", value}
      {:page_token, value} -> {"pageToken", value}
      {:stream_id, value} -> {"streamId", value}
      {key, value} when is_atom(key) -> {Atom.to_string(key), value}
      {key, value} -> {key, value}
    end)
  end

  # Handles HTTP responses consistently
  defp handle_response({:ok, %{status: status, body: body}}) when status in 200..299 do
    {:ok, body}
  end

  defp handle_response({:ok, %{status: status, body: body}}) do
    Logger.warning("YouTube API request failed with status #{status}: #{inspect(body)}")
    {:error, {:http_error, status, body}}
  end

  defp handle_response({:error, reason}) do
    Logger.error("YouTube API request failed: #{inspect(reason)}")
    {:error, reason}
  end
end
