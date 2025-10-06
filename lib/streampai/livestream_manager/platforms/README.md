# Stream Platform Managers

This directory contains platform-specific stream managers that handle integration with various streaming platforms (Twitch, YouTube, Facebook, Kick).

## Architecture Overview

All platform managers implement the `StreamPlatformManager` behavior, which defines a unified interface for common streaming operations. This ensures consistent functionality across all supported platforms while allowing platform-specific implementations.

## StreamPlatformManager Behavior

The `StreamPlatformManager` behavior defines the following core operations:

### Stream Lifecycle
- `start_streaming/3` - Start streaming with metadata
- `stop_streaming/1` - Stop the current stream

### Chat & Communication
- `send_chat_message/2` - Send a message to chat

### Stream Management
- `update_stream_metadata/2` - Update title, description, category, etc.

### Moderation (Optional)
- `delete_message/2` - Delete a chat message
- `ban_user/3` - Permanently ban a user
- `timeout_user/4` - Temporarily ban (timeout) a user
- `unban_user/2` - Remove a ban

### Status
- `get_status/1` - Get current platform status

## Platform Implementations

### Twitch Manager
**Module:** `Streampai.LivestreamManager.Platforms.TwitchManager`

**Features:**
- WebSocket-based chat integration
- OAuth token management with automatic refresh
- Real-time viewer count updates
- Stream metadata updates (title, game)
- Chat moderation (when available)

**Authentication:** OAuth 2.0 with refresh tokens

### YouTube Manager
**Module:** `Streampai.LivestreamManager.Platforms.YouTubeManager`

**Features:**
- gRPC-based live chat integration
- YouTube API for stream management
- Full moderation support (ban, timeout, unban, delete messages)
- Live chat message streaming
- Metadata updates

**Authentication:** OAuth 2.0 with service account support

### Facebook Manager
**Module:** `Streampai.LivestreamManager.Platforms.FacebookManager`

**Features:**
- Facebook Live API integration
- Real-time comment streaming
- Basic stream management
- Metadata updates

**Authentication:** OAuth 2.0

### Kick Manager
**Module:** `Streampai.LivestreamManager.Platforms.KickManager`

**Features:**
- Kick API integration
- Chat message support
- Stream metadata updates

**Authentication:** API key-based

## Usage Examples

### Starting a Stream

```elixir
# Start with default options
{:ok, result} = TwitchManager.start_streaming(user_id, stream_uuid)

# Start with metadata
{:ok, result} = YouTubeManager.start_streaming(
  user_id,
  stream_uuid,
  title: "My Awesome Stream",
  category: "Gaming"
)
```

### Sending Chat Messages

```elixir
# All platforms use the same interface
{:ok, message_id} = TwitchManager.send_chat_message(user_id, "Hello chat!")
{:ok, message_id} = YouTubeManager.send_chat_message(user_id, "Hello YouTube!")
```

### Updating Stream Metadata

```elixir
metadata = %{
  title: "New Stream Title",
  game: "Just Chatting",
  tags: ["English", "Chill"]
}

{:ok, updated} = TwitchManager.update_stream_metadata(user_id, metadata)
```

### Moderation

```elixir
# Delete a message (YouTube only currently)
:ok = YouTubeManager.delete_message(user_id, message_id)

# Ban a user permanently
{:ok, ban_id} = YouTubeManager.ban_user(user_id, target_channel_id, "Spam")

# Timeout for 5 minutes
{:ok, timeout_id} = YouTubeManager.timeout_user(user_id, target_channel_id, 300)

# Unban a user
:ok = YouTubeManager.unban_user(user_id, ban_id)
```

## Implementation Guide

When adding a new platform manager:

1. **Create the module** in this directory (e.g., `new_platform_manager.ex`)

2. **Implement the behavior:**
   ```elixir
   defmodule Streampai.LivestreamManager.Platforms.NewPlatformManager do
     @behaviour Streampai.LivestreamManager.Platforms.StreamPlatformManager
     use GenServer

     # Implement required callbacks
     @impl true
     def start_streaming(user_id, stream_uuid, opts \\ []) do
       # Implementation
     end

     # ... implement other callbacks
   end
   ```

3. **Use GenServer** for state management and asynchronous operations

4. **Register with via tuple** for process naming:
   ```elixir
   defp via_tuple(user_id) do
     {:via, Registry, {Streampai.LivestreamManager.Registry, {:new_platform, user_id}}}
   end
   ```

5. **Handle authentication** - manage tokens, refresh, and expiration

6. **Broadcast events** via Phoenix PubSub for real-time updates

7. **Add tests** to ensure behavior compliance

## Common Patterns

### Error Handling
All callbacks should return either `{:ok, result}` or `{:error, reason}` tuples for consistency.

### Async Operations
Use GenServer casts for fire-and-forget operations (e.g., sending chat messages) and calls for synchronous operations that need results.

### PubSub Broadcasting
Broadcast important events to topics like:
- `"viewer_counts:#{user_id}"` - Viewer count updates
- `"stream_status:#{user_id}"` - Stream status changes
- `"chat:#{user_id}:#{platform}"` - Chat messages

### Token Refresh
Implement automatic token refresh for OAuth-based platforms to prevent authentication failures.

## Optional vs Required Callbacks

**Required callbacks** (all platforms must implement):
- `start_streaming/3`
- `stop_streaming/1`
- `send_chat_message/2`
- `update_stream_metadata/2`
- `get_status/1`

**Optional callbacks** (implement if platform supports):
- `delete_message/2`
- `ban_user/3`
- `timeout_user/4`
- `unban_user/2`

Platforms that don't support moderation features can skip the optional callbacks. The behavior will not enforce their implementation.

## Testing

When testing platform managers:

1. Test all behavior callbacks are implemented
2. Test authentication and token refresh
3. Test error handling and edge cases
4. Mock external API calls for reliable tests
5. Test state management and cleanup

## Contributing

When modifying platform managers:

1. Keep the behavior interface consistent
2. Document any platform-specific quirks
3. Maintain backward compatibility
4. Update this README with new features
5. Ensure all tests pass
6. Run `mix credo --strict` to maintain code quality
