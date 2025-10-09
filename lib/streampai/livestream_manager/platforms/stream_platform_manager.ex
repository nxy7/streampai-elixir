defmodule Streampai.LivestreamManager.Platforms.StreamPlatformManager do
  @moduledoc """
  Behavior specification for platform-specific stream managers.

  This behavior defines the common interface that all platform managers
  (Twitch, YouTube, Facebook, Kick) must implement to ensure consistent
  functionality across different streaming platforms.

  ## Core Responsibilities

  Platform managers are responsible for:
  - Managing stream lifecycle (start/stop)
  - Sending chat messages
  - Updating stream metadata (title, description, category)
  - Moderating chat (bans, timeouts, message deletion)
  - Maintaining platform-specific connections (WebSocket, gRPC, etc.)

  ## Implementation Requirements

  Each platform manager should:
  1. Implement all required callbacks
  2. Use GenServer for state management
  3. Register with a platform-specific via tuple
  4. Handle platform-specific authentication and token refresh
  5. Broadcast events via Phoenix PubSub

  ## Example Implementation

      defmodule MyApp.Platforms.CustomManager do
        @behaviour Streampai.LivestreamManager.Platforms.StreamPlatformManager
        use GenServer

        @impl true
        def start_streaming(user_id, livestream_id, opts \\\\ []) do
          GenServer.call(via_tuple(user_id), {:start_streaming, livestream_id, opts})
        end

        # ... implement other callbacks
      end
  """

  @doc """
  Starts streaming for the given user.

  ## Parameters
  - `user_id` - The user ID who owns the stream
  - `livestream_id` - Unique identifier for this streaming session
  - `opts` - Optional keyword list with platform-specific options

  ## Returns
  - `{:ok, result}` - Stream started successfully
  - `{:error, reason}` - Failed to start stream

  ## Examples

      iex> start_streaming("user_123", "stream_456")
      {:ok, %{stream_id: "platform_stream_id"}}

      iex> start_streaming("user_123", "stream_456", title: "My Stream")
      {:ok, %{stream_id: "platform_stream_id"}}
  """
  @callback start_streaming(user_id :: binary(), livestream_id :: binary(), opts :: keyword()) ::
              {:ok, map()} | {:error, term()}

  @doc """
  Stops the current stream for the given user.

  ## Parameters
  - `user_id` - The user ID who owns the stream

  ## Returns
  - `{:ok, result}` - Stream stopped successfully
  - `{:error, reason}` - Failed to stop stream

  ## Examples

      iex> stop_streaming("user_123")
      {:ok, %{stopped_at: ~U[2024-01-01 12:00:00Z]}}
  """
  @callback stop_streaming(user_id :: binary()) :: {:ok, map()} | {:error, term()}

  @doc """
  Sends a chat message to the platform.

  ## Parameters
  - `user_id` - The user ID who owns the stream
  - `message` - The message text to send

  ## Returns
  - `{:ok, message_id}` - Message sent successfully
  - `{:error, reason}` - Failed to send message

  ## Examples

      iex> send_chat_message("user_123", "Hello viewers!")
      {:ok, "msg_789"}
  """
  @callback send_chat_message(user_id :: binary(), message :: binary()) ::
              {:ok, binary()} | {:error, term()}

  @doc """
  Updates stream metadata (title, description, category, etc.).

  The metadata map may contain platform-specific fields. Common fields:
  - `title` - Stream title
  - `description` - Stream description
  - `category` or `game` - Category/game being streamed
  - `tags` - Stream tags

  ## Parameters
  - `user_id` - The user ID who owns the stream
  - `metadata` - Map of metadata fields to update

  ## Returns
  - `{:ok, updated_metadata}` - Metadata updated successfully
  - `{:error, reason}` - Failed to update metadata

  ## Examples

      iex> update_stream_metadata("user_123", %{title: "New Title", game: "Just Chatting"})
      {:ok, %{title: "New Title", game: "Just Chatting"}}
  """
  @callback update_stream_metadata(user_id :: binary(), metadata :: map()) ::
              {:ok, map()} | {:error, term()}

  @doc """
  Deletes a chat message.

  ## Parameters
  - `user_id` - The user ID who owns the stream
  - `message_id` - Platform-specific message identifier

  ## Returns
  - `:ok` - Message deleted successfully
  - `{:error, reason}` - Failed to delete message

  ## Examples

      iex> delete_message("user_123", "msg_789")
      :ok
  """
  @callback delete_message(user_id :: binary(), message_id :: binary()) ::
              :ok | {:error, term()}

  @doc """
  Permanently bans a user from the chat.

  ## Parameters
  - `user_id` - The user ID who owns the stream
  - `target_user_id` - Platform-specific identifier of the user to ban
  - `reason` - Optional reason for the ban

  ## Returns
  - `{:ok, ban_id}` - User banned successfully, returns platform ban ID
  - `{:error, reason}` - Failed to ban user

  ## Examples

      iex> ban_user("user_123", "spammer_456")
      {:ok, "ban_789"}

      iex> ban_user("user_123", "spammer_456", "Spam")
      {:ok, "ban_789"}
  """
  @callback ban_user(user_id :: binary(), target_user_id :: binary(), reason :: binary() | nil) ::
              {:ok, binary()} | {:error, term()}

  @doc """
  Temporarily bans (timeouts) a user from the chat.

  ## Parameters
  - `user_id` - The user ID who owns the stream
  - `target_user_id` - Platform-specific identifier of the user to timeout
  - `duration_seconds` - Duration of the timeout in seconds
  - `reason` - Optional reason for the timeout

  ## Returns
  - `{:ok, timeout_id}` - User timed out successfully
  - `{:error, reason}` - Failed to timeout user

  ## Examples

      iex> timeout_user("user_123", "annoying_456", 300)
      {:ok, "timeout_789"}

      iex> timeout_user("user_123", "annoying_456", 600, "Excessive caps")
      {:ok, "timeout_789"}
  """
  @callback timeout_user(
              user_id :: binary(),
              target_user_id :: binary(),
              duration_seconds :: pos_integer(),
              reason :: binary() | nil
            ) ::
              {:ok, binary()} | {:error, term()}

  @doc """
  Unbans a user from the chat.

  ## Parameters
  - `user_id` - The user ID who owns the stream
  - `ban_id` - Platform-specific ban identifier (from ban_user or timeout_user)

  ## Returns
  - `:ok` - User unbanned successfully
  - `{:error, reason}` - Failed to unban user

  ## Examples

      iex> unban_user("user_123", "ban_789")
      :ok
  """
  @callback unban_user(user_id :: binary(), ban_id :: binary()) :: :ok | {:error, term()}

  @doc """
  Gets the current status and configuration of the platform manager.

  Returns information about connection state, authentication, and platform-specific details.

  ## Parameters
  - `user_id` - The user ID who owns the stream

  ## Returns
  - `{:ok, status}` - Status map with platform details
  - `{:error, reason}` - Failed to get status

  ## Examples

      iex> get_status("user_123")
      {:ok, %{
        platform: :twitch,
        connection_status: :connected,
        authenticated: true,
        stream_active: true,
        viewer_count: 42
      }}
  """
  @callback get_status(user_id :: binary()) :: {:ok, map()} | {:error, term()}

  # Optional callbacks for moderation features
  @optional_callbacks [
    delete_message: 2,
    ban_user: 3,
    timeout_user: 4,
    unban_user: 2
  ]
end
