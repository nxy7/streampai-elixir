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
  @token_info_url "https://www.googleapis.com/oauth2/v3/tokeninfo"

  # Default request timeout in milliseconds
  @default_timeout 30_000

  @type access_token :: String.t()
  @type api_result :: {:ok, map()} | {:error, term()}
  @type part_param :: String.t() | [String.t()]

  # Build base request options
  defp base_opts(access_token) do
    [
      base_url: @base_url,
      auth: {:bearer, access_token},
      receive_timeout: @default_timeout
    ]
  end

  ## Authentication Validation

  @doc """
  Validates an OAuth 2.0 access token and returns token information including scopes.

  This is useful for verifying that a token is valid and has the necessary YouTube scopes.

  ## Returns
  - `{:ok, token_info}` - Token is valid, returns info including scopes, expiry, etc.
  - `{:error, reason}` - Token is invalid or request failed

  ## Example
      {:ok, info} = ApiClient.validate_token(access_token)
      # Returns: %{
      #   "aud" => "client_id",
      #   "scope" => "https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.force-ssl",
      #   "exp" => "1234567890",
      #   "expires_in" => "3599"
      # }
  """
  @spec validate_token(access_token) :: api_result()
  def validate_token(access_token) do
    [
      url: @token_info_url,
      params: %{access_token: access_token},
      receive_timeout: @default_timeout
    ]
    |> Req.get()
    |> handle_response()
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

    req_opts =
      base_opts(access_token) ++ [url: "/liveChat/messages", params: params, json: message_data]

    req_opts
    |> Req.post()
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

    req_opts = base_opts(access_token) ++ [url: "/liveChat/messages", params: params]

    req_opts
    |> Req.delete()
    |> handle_response()
  end

  @doc """
  Bans a user from a live chat (permanent or temporary).

  ## Parameters
  - `access_token`: OAuth 2.0 access token
  - `live_chat_id`: The ID of the live chat
  - `channel_id`: The channel ID of the user to ban
  - `opts`: Options
    - `:type` - "permanent" or "temporary" (default: "permanent")
    - `:duration_seconds` - Ban duration for temporary bans (default: 300)

  ## Example
      ApiClient.ban_user(token, chat_id, user_channel_id, type: "temporary", duration_seconds: 600)
  """
  @spec ban_user(access_token, String.t(), String.t(), keyword()) :: api_result()
  def ban_user(access_token, live_chat_id, channel_id, opts \\ []) do
    ban_type = Keyword.get(opts, :type, "permanent")
    duration_seconds = Keyword.get(opts, :duration_seconds, 300)

    ban_data = %{
      snippet: %{
        liveChatId: live_chat_id,
        type: ban_type,
        bannedUserDetails: %{
          channelId: channel_id
        }
      }
    }

    ban_data =
      if ban_type == "temporary" do
        put_in(ban_data, [:snippet, :banDurationSeconds], duration_seconds)
      else
        ban_data
      end

    params = %{part: "snippet"}
    req_opts = base_opts(access_token) ++ [url: "/liveChat/bans", params: params, json: ban_data]

    req_opts
    |> Req.post()
    |> handle_response()
  end

  @doc """
  Unbans a user from a live chat.

  ## Parameters
  - `access_token`: OAuth 2.0 access token
  - `ban_id`: The ID of the ban to remove
  """
  @spec unban_user(access_token, String.t()) :: api_result()
  def unban_user(access_token, ban_id) do
    params = %{id: ban_id}
    req_opts = base_opts(access_token) ++ [url: "/liveChat/bans", params: params]

    req_opts
    |> Req.delete()
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

    req_opts = base_opts(access_token) ++ [url: "/liveBroadcasts", params: params]

    req_opts
    |> Req.get()
    |> handle_response()
  end

  @doc """
  Gets a single live broadcast by ID.

  ## Parameters
  - `access_token`: OAuth 2.0 access token
  - `id`: The broadcast ID to retrieve
  - `part`: Resource parts to include (e.g., "snippet,status,contentDetails")
  - `opts`: Optional parameters

  ## Returns
  - `{:ok, broadcast}` - Successfully retrieved broadcast
  - `{:error, reason}` - Failed to retrieve broadcast
  """
  @spec get_live_broadcast(access_token, String.t(), part_param, keyword()) :: api_result()
  def get_live_broadcast(access_token, id, part, opts \\ []) do
    params =
      opts
      |> Keyword.put(:id, id)
      |> Keyword.put(:part, normalize_part_param(part))
      |> Enum.reject(fn {_k, v} -> is_nil(v) end)
      |> Map.new()
      |> normalize_broadcast_params()

    req_opts = base_opts(access_token) ++ [url: "/liveBroadcasts", params: params]

    case req_opts |> Req.get() |> handle_response() do
      {:ok, %{"items" => [broadcast | _]}} -> {:ok, broadcast}
      {:ok, %{"items" => []}} -> {:error, :not_found}
      error -> error
    end
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

    req_opts =
      base_opts(access_token) ++ [url: "/liveBroadcasts", params: params, json: broadcast_data]

    req_opts
    |> Req.post()
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

    req_opts =
      base_opts(access_token) ++ [url: "/liveBroadcasts", params: params, json: broadcast_data]

    req_opts
    |> Req.put()
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

    req_opts = base_opts(access_token) ++ [url: "/liveBroadcasts/bind", params: params, body: ""]

    req_opts
    |> Req.post()
    |> handle_response()
  end

  @doc """
  Transitions a broadcast to a new status (testing, live, or complete).

  ## Parameters
  - `access_token`: OAuth 2.0 access token
  - `broadcast_id`: The ID of the broadcast to transition
  - `broadcast_status`: New status ("testing", "live", or "complete")
  - `part`: Resource parts to include (typically "id,snippet,status")
  - `opts`: Additional options

  ## Example
      {:ok, result} = ApiClient.transition_live_broadcast(token, broadcast_id, "live", "id,status")
  """
  @spec transition_live_broadcast(access_token, String.t(), String.t(), part_param, keyword()) ::
          api_result()
  def transition_live_broadcast(access_token, broadcast_id, broadcast_status, part, opts \\ []) do
    params = %{
      id: broadcast_id,
      broadcastStatus: broadcast_status,
      part: normalize_part_param(part)
    }

    req_opts =
      base_opts(access_token) ++ [url: "/liveBroadcasts/transition", params: params] ++ opts

    req_opts
    |> Req.post()
    |> handle_response()
  end

  @doc """
  Gets video details including live streaming information.

  ## Parameters
  - `access_token`: OAuth 2.0 access token
  - `video_id`: The video ID (same as broadcast ID for live streams)
  - `part`: Resource parts to include (typically "liveStreamingDetails")
  - `opts`: Additional options

  ## Example
      {:ok, video} = ApiClient.get_video(token, video_id, "liveStreamingDetails")
      active_chat_id = get_in(video, ["liveStreamingDetails", "activeLiveChatId"])
  """
  @spec get_video(access_token, String.t(), part_param, keyword()) :: api_result()
  def get_video(access_token, video_id, part, opts \\ []) do
    params = %{
      id: video_id,
      part: normalize_part_param(part)
    }

    req_opts = base_opts(access_token) ++ [url: "/videos", params: params] ++ opts

    req_opts
    |> Req.get()
    |> handle_response()
    |> case do
      {:ok, %{"items" => []}} ->
        {:error, :video_not_found}

      {:ok, %{"items" => videos}} ->
        {:ok, List.first(videos)}

      error ->
        error
    end
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

    req_opts = base_opts(access_token) ++ [url: "/liveBroadcasts", params: params]

    req_opts
    |> Req.delete()
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

    req_opts = base_opts(access_token) ++ [url: "/liveStreams", params: params]

    req_opts
    |> Req.get()
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

    req_opts = base_opts(access_token) ++ [url: "/liveStreams", params: params, json: stream_data]

    req_opts
    |> Req.post()
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

    req_opts = base_opts(access_token) ++ [url: "/liveStreams", params: params, json: stream_data]

    req_opts
    |> Req.put()
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

    req_opts = base_opts(access_token) ++ [url: "/liveStreams", params: params]

    req_opts
    |> Req.delete()
    |> handle_response()
  end

  ## Members API

  @doc """
  Lists members of a YouTube channel (requires membership/sponsors).

  ## Parameters
  - `access_token`: OAuth 2.0 access token
  - `part`: Resource parts to include (typically "snippet")
  - `opts`: Optional parameters
    - `filter_by_member_channel_id`: Filter by specific member channel IDs (comma-separated string)
    - `has_access_to_level`: Filter by membership level ID
    - `max_results`: Maximum number of results (0-50, default 5)
    - `mode`: Filter mode ("all_current" or "updates", default "all_current")
    - `page_token`: Page token for pagination

  ## Example
      {:ok, result} = ApiClient.list_members(token, "snippet", max_results: 50)
      members = result["items"]
  """
  @spec list_members(access_token, part_param, keyword()) :: api_result()
  def list_members(access_token, part, opts \\ []) do
    params =
      opts
      |> Keyword.take([
        :filter_by_member_channel_id,
        :has_access_to_level,
        :max_results,
        :mode,
        :page_token
      ])
      |> Keyword.put(:part, normalize_part_param(part))
      |> Enum.reject(fn {_k, v} -> is_nil(v) end)
      |> Map.new()
      |> normalize_members_params()

    req_opts = base_opts(access_token) ++ [url: "/members", params: params]

    req_opts
    |> Req.get()
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

  # Converts snake_case parameter names to camelCase for Members API
  defp normalize_members_params(params) do
    Map.new(params, fn
      {:filter_by_member_channel_id, value} -> {"filterByMemberChannelId", value}
      {:has_access_to_level, value} -> {"hasAccessToLevel", value}
      {:max_results, value} -> {"maxResults", value}
      {:page_token, value} -> {"pageToken", value}
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
