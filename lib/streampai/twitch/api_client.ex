defmodule Streampai.Twitch.ApiClient do
  @moduledoc """
  Twitch Helix API client for managing channel information and stream keys.

  This module provides an interface to Twitch's Helix API for retrieving
  channel stream keys and other streaming-related operations.

  ## Authentication
  Requires OAuth 2.0 access token with appropriate Twitch scopes.
  """

  import Streampai.HTTP.ResponseHandler, only: [handle_http_response: 2]

  require Logger

  @base_url "https://api.twitch.tv/helix"
  @default_timeout 30_000

  @type access_token :: String.t()
  @type api_result :: {:ok, map()} | {:error, term()}

  @doc """
  Gets the broadcaster's stream key.

  Requires the `channel:manage:broadcast` scope.

  ## Parameters
  - `access_token`: OAuth 2.0 access token with channel:manage:broadcast scope
  - `broadcaster_id`: The ID of the broadcaster to get the stream key for

  ## Returns
  - `{:ok, %{"stream_key" => stream_key}}` - Successfully retrieved stream key
  - `{:error, reason}` - Failed to retrieve stream key

  ## Example
      {:ok, %{"stream_key" => key}} = ApiClient.get_stream_key(token, broadcaster_id)
  """
  @spec get_stream_key(access_token, String.t()) :: api_result()
  def get_stream_key(access_token, broadcaster_id) do
    client_id = Application.get_env(:streampai, :twitch_client_id)

    headers = [
      {"Authorization", "Bearer #{access_token}"},
      {"Client-Id", client_id}
    ]

    params = %{broadcaster_id: broadcaster_id}

    [
      url: "#{@base_url}/streams/key",
      headers: headers,
      params: params,
      receive_timeout: @default_timeout
    ]
    |> Req.get()
    |> handle_http_response("Twitch")
    |> extract_stream_key()
  end

  @doc """
  Gets stream information for the specified broadcaster.

  ## Parameters
  - `access_token`: OAuth 2.0 access token
  - `broadcaster_id`: The ID of the broadcaster

  ## Returns
  - `{:ok, stream_data}` - Successfully retrieved stream info (nil if offline)
  - `{:error, reason}` - Failed to retrieve stream info
  """
  @spec get_stream_info(access_token, String.t()) :: api_result()
  def get_stream_info(access_token, broadcaster_id) do
    client_id = Application.get_env(:streampai, :twitch_client_id)

    headers = [
      {"Authorization", "Bearer #{access_token}"},
      {"Client-Id", client_id}
    ]

    params = %{user_id: broadcaster_id}

    [
      url: "#{@base_url}/streams",
      headers: headers,
      params: params,
      receive_timeout: @default_timeout
    ]
    |> Req.get()
    |> handle_http_response("Twitch")
    |> extract_stream_data()
  end

  @doc """
  Updates channel information (title and game/category).

  Requires the `channel:manage:broadcast` scope.

  ## Parameters
  - `access_token`: OAuth 2.0 access token
  - `broadcaster_id`: The ID of the broadcaster
  - `params`: Map with `:title` and/or `:game_id` keys

  ## Returns
  - `{:ok, updated_data}` - Successfully updated channel info
  - `{:error, reason}` - Failed to update channel info
  """
  @spec update_channel_info(access_token, String.t(), map()) :: api_result()
  def update_channel_info(access_token, broadcaster_id, params) do
    client_id = Application.get_env(:streampai, :twitch_client_id)

    headers = [
      {"Authorization", "Bearer #{access_token}"},
      {"Client-Id", client_id},
      {"Content-Type", "application/json"}
    ]

    # Build the update body - only include provided fields
    body =
      %{}
      |> maybe_put(:title, Map.get(params, :title))
      |> maybe_put(:game_id, Map.get(params, :game_id))
      |> Jason.encode!()

    query_params = %{broadcaster_id: broadcaster_id}

    [
      url: "#{@base_url}/channels",
      headers: headers,
      params: query_params,
      body: body,
      receive_timeout: @default_timeout
    ]
    |> Req.patch()
    |> handle_http_response("Twitch")
  end

  @doc """
  Gets the authenticated user's information.

  Useful for getting the broadcaster_id from an access token.

  ## Parameters
  - `access_token`: OAuth 2.0 access token

  ## Returns
  - `{:ok, user_data}` - Successfully retrieved user info
  - `{:error, reason}` - Failed to retrieve user info
  """
  @spec get_user_info(access_token) :: api_result()
  def get_user_info(access_token) do
    client_id = Application.get_env(:streampai, :twitch_client_id)

    headers = [
      {"Authorization", "Bearer #{access_token}"},
      {"Client-Id", client_id}
    ]

    [
      url: "#{@base_url}/users",
      headers: headers,
      receive_timeout: @default_timeout
    ]
    |> Req.get()
    |> handle_http_response("Twitch")
    |> extract_first_user()
  end

  @doc """
  Sends a chat message to a Twitch channel.

  Requires the `channel:bot` scope or moderator permissions in the channel.

  ## Parameters
  - `access_token`: OAuth 2.0 access token with channel:bot scope
  - `broadcaster_id`: The ID of the broadcaster's channel
  - `sender_id`: The ID of the user sending the message (usually the bot)
  - `message`: The message text to send

  ## Returns
  - `{:ok, response_data}` - Successfully sent message
  - `{:error, reason}` - Failed to send message

  ## Example
      {:ok, result} = ApiClient.send_chat_message(token, "12345", "67890", "Hello chat!")
  """
  @spec send_chat_message(access_token, String.t(), String.t(), String.t()) :: api_result()
  def send_chat_message(access_token, broadcaster_id, sender_id, message) do
    client_id = Application.get_env(:streampai, :twitch_client_id)

    headers = [
      {"Authorization", "Bearer #{access_token}"},
      {"Client-Id", client_id},
      {"Content-Type", "application/json"}
    ]

    body =
      Jason.encode!(%{
        broadcaster_id: broadcaster_id,
        sender_id: sender_id,
        message: message
      })

    [
      url: "#{@base_url}/chat/messages",
      headers: headers,
      body: body,
      receive_timeout: @default_timeout
    ]
    |> Req.post()
    |> handle_http_response("Twitch")
  end

  @doc """
  Bans a user from the broadcaster's chat room or puts them in a timeout.

  Requires the `moderator:manage:banned_users` scope.

  ## Parameters
  - `access_token`: OAuth 2.0 access token with moderator:manage:banned_users scope
  - `broadcaster_id`: The ID of the broadcaster's channel
  - `moderator_id`: The ID of the moderator performing the ban
  - `user_id`: The ID of the user to ban
  - `opts`: Optional keyword list
    - `:duration` - Duration of the timeout in seconds (omit for permanent ban, max 1209600 = 14 days)
    - `:reason` - The reason for the ban/timeout

  ## Returns
  - `{:ok, ban_data}` - Successfully banned user, returns ban details including ban ID
  - `{:error, reason}` - Failed to ban user

  ## Example
      # Permanent ban
      {:ok, ban} = ApiClient.ban_user(token, "12345", "12345", "67890", reason: "Spam")

      # 5 minute timeout
      {:ok, ban} = ApiClient.ban_user(token, "12345", "12345", "67890", duration: 300)
  """
  @spec ban_user(access_token, String.t(), String.t(), String.t(), keyword()) :: api_result()
  def ban_user(access_token, broadcaster_id, moderator_id, user_id, opts \\ []) do
    client_id = Application.get_env(:streampai, :twitch_client_id)

    headers = [
      {"Authorization", "Bearer #{access_token}"},
      {"Client-Id", client_id},
      {"Content-Type", "application/json"}
    ]

    params = %{
      broadcaster_id: broadcaster_id,
      moderator_id: moderator_id
    }

    body_data =
      %{user_id: user_id}
      |> maybe_put(:duration, Keyword.get(opts, :duration))
      |> maybe_put(:reason, Keyword.get(opts, :reason))

    body = Jason.encode!(%{data: body_data})

    [
      url: "#{@base_url}/moderation/bans",
      headers: headers,
      params: params,
      body: body,
      receive_timeout: @default_timeout
    ]
    |> Req.post()
    |> handle_http_response("Twitch")
    |> extract_first_ban()
  end

  @doc """
  Removes a ban or timeout on a user.

  Requires the `moderator:manage:banned_users` scope.

  ## Parameters
  - `access_token`: OAuth 2.0 access token with moderator:manage:banned_users scope
  - `broadcaster_id`: The ID of the broadcaster's channel
  - `moderator_id`: The ID of the moderator removing the ban
  - `user_id`: The ID of the user to unban

  ## Returns
  - `:ok` - Successfully unbanned user
  - `{:error, reason}` - Failed to unban user

  ## Example
      :ok = ApiClient.unban_user(token, "12345", "12345", "67890")
  """
  @spec unban_user(access_token, String.t(), String.t(), String.t()) ::
          :ok | {:error, term()}
  def unban_user(access_token, broadcaster_id, moderator_id, user_id) do
    client_id = Application.get_env(:streampai, :twitch_client_id)

    headers = [
      {"Authorization", "Bearer #{access_token}"},
      {"Client-Id", client_id}
    ]

    params = %{
      broadcaster_id: broadcaster_id,
      moderator_id: moderator_id,
      user_id: user_id
    }

    [
      url: "#{@base_url}/moderation/bans",
      headers: headers,
      params: params,
      receive_timeout: @default_timeout
    ]
    |> Req.delete()
    |> case do
      {:ok, %{status: 204}} -> :ok
      {:ok, %{status: status, body: body}} -> {:error, {:http_error, status, body}}
      {:error, reason} -> {:error, reason}
    end
  end

  ## Channel Statistics API

  @doc """
  Gets the total follower count for a broadcaster.

  Requires the `moderator:read:followers` scope.

  ## Parameters
  - `access_token`: OAuth 2.0 access token with moderator:read:followers scope
  - `broadcaster_id`: The ID of the broadcaster

  ## Returns
  - `{:ok, %{follower_count: integer}}` - Total follower count
  - `{:error, reason}` - Failed to retrieve follower count

  ## Example
      {:ok, %{follower_count: 10000}} = ApiClient.get_follower_count(token, broadcaster_id)
  """
  @spec get_follower_count(access_token, String.t()) :: api_result()
  def get_follower_count(access_token, broadcaster_id) do
    client_id = Application.get_env(:streampai, :twitch_client_id)

    headers = [
      {"Authorization", "Bearer #{access_token}"},
      {"Client-Id", client_id}
    ]

    params = %{broadcaster_id: broadcaster_id, first: 1}

    [
      url: "#{@base_url}/channels/followers",
      headers: headers,
      params: params,
      receive_timeout: @default_timeout
    ]
    |> Req.get()
    |> handle_http_response("Twitch")
    |> case do
      {:ok, %{"total" => total}} -> {:ok, %{follower_count: total}}
      {:ok, response} -> {:error, {:unexpected_response, response}}
      error -> error
    end
  end

  @doc """
  Gets the total subscriber count for a broadcaster (paid subscriptions).

  Requires the `channel:read:subscriptions` scope.

  ## Parameters
  - `access_token`: OAuth 2.0 access token with channel:read:subscriptions scope
  - `broadcaster_id`: The ID of the broadcaster

  ## Returns
  - `{:ok, %{subscriber_count: integer, points: integer}}` - Subscriber stats
  - `{:error, reason}` - Failed to retrieve subscriber count

  ## Example
      {:ok, %{subscriber_count: 500, points: 1250}} = ApiClient.get_subscriber_count(token, broadcaster_id)
  """
  @spec get_subscriber_count(access_token, String.t()) :: api_result()
  def get_subscriber_count(access_token, broadcaster_id) do
    client_id = Application.get_env(:streampai, :twitch_client_id)

    headers = [
      {"Authorization", "Bearer #{access_token}"},
      {"Client-Id", client_id}
    ]

    params = %{broadcaster_id: broadcaster_id, first: 1}

    [
      url: "#{@base_url}/subscriptions",
      headers: headers,
      params: params,
      receive_timeout: @default_timeout
    ]
    |> Req.get()
    |> handle_http_response("Twitch")
    |> case do
      {:ok, %{"total" => total, "points" => points}} ->
        {:ok, %{subscriber_count: total, points: points}}

      {:ok, %{"total" => total}} ->
        {:ok, %{subscriber_count: total, points: 0}}

      {:ok, response} ->
        {:error, {:unexpected_response, response}}

      error ->
        error
    end
  end

  @doc """
  Gets all channel statistics for a broadcaster.

  Combines follower count and subscriber count into a single call.

  ## Parameters
  - `access_token`: OAuth 2.0 access token
  - `broadcaster_id`: The ID of the broadcaster

  ## Returns
  - `{:ok, %{follower_count: integer, subscriber_count: integer}}` - Combined stats
  - `{:error, reason}` - Failed to retrieve statistics

  ## Example
      {:ok, stats} = ApiClient.get_channel_stats(token, broadcaster_id)
  """
  @spec get_channel_stats(access_token, String.t()) :: api_result()
  def get_channel_stats(access_token, broadcaster_id) do
    # Fetch both stats in parallel using Task
    follower_task = Task.async(fn -> get_follower_count(access_token, broadcaster_id) end)
    subscriber_task = Task.async(fn -> get_subscriber_count(access_token, broadcaster_id) end)

    follower_result = Task.await(follower_task, @default_timeout)
    subscriber_result = Task.await(subscriber_task, @default_timeout)

    case {follower_result, subscriber_result} do
      {{:ok, %{follower_count: followers}}, {:ok, %{subscriber_count: subs}}} ->
        {:ok, %{follower_count: followers, subscriber_count: subs}}

      {{:ok, %{follower_count: followers}}, {:error, _}} ->
        {:ok, %{follower_count: followers, subscriber_count: nil}}

      {{:error, _}, {:ok, %{subscriber_count: subs}}} ->
        {:ok, %{follower_count: nil, subscriber_count: subs}}

      {{:error, reason}, _} ->
        {:error, reason}
    end
  end

  ## Private Functions

  defp extract_stream_key({:ok, %{"data" => [%{"stream_key" => stream_key}]}}) do
    {:ok, stream_key}
  end

  defp extract_stream_key({:ok, %{"data" => []}}) do
    {:error, :no_stream_key_found}
  end

  defp extract_stream_key({:ok, response}) do
    Logger.warning("Unexpected Twitch API response format: #{inspect(response)}")
    {:error, :unexpected_response_format}
  end

  defp extract_stream_key(error), do: error

  defp extract_stream_data({:ok, %{"data" => [stream_data | _]}}), do: {:ok, stream_data}
  defp extract_stream_data({:ok, %{"data" => []}}), do: {:ok, nil}
  defp extract_stream_data(error), do: error

  defp extract_first_user({:ok, %{"data" => [user | _]}}), do: {:ok, user}
  defp extract_first_user({:ok, %{"data" => []}}), do: {:error, :user_not_found}
  defp extract_first_user(error), do: error

  defp extract_first_ban({:ok, %{"data" => [ban | _]}}), do: {:ok, ban}
  defp extract_first_ban({:ok, %{"data" => []}}), do: {:error, :ban_not_created}
  defp extract_first_ban(error), do: error

  defp maybe_put(map, _key, nil), do: map
  defp maybe_put(map, key, value), do: Map.put(map, key, value)
end
