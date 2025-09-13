# Presence-Based UserStreamManager System

## Overview
Automatically manages UserStreamManager processes based on user dashboard presence, ensuring efficient resource utilization and real-time stream processing.

## ⚡ What It Does
- **Automatic Lifecycle Management**: Starts UserStreamManager when users visit dashboard pages
- **Multi-session Awareness**: Only stops processes when ALL user sessions are closed
- **Configurable Cleanup**: Waits 5 seconds (configurable) before cleanup
- **Real-time Processing**: Enables stream monitoring, metrics collection, and event processing

## System Components

### Core Files
- **`presence_manager.ex`** (472 lines) - Main lifecycle orchestrator based on Phoenix.Presence events
- **`user_stream_manager.ex`** - Per-user supervisor for streaming components
- **`presence_helper.ex`** - Debug utilities and state inspection
- **`console_logger.ex`** - Example component that logs activity every second

### Stream Processing Components
- **`stream_state_server.ex`** - Maintains real-time stream state
- **`cloudflare_manager.ex`** - Manages Cloudflare live input/output
- **`metrics_collector.ex`** - Collects streaming metrics and analytics
- **Platform Managers** - `twitch_manager.ex`, `youtube_manager.ex`, etc.

## 🎯 How It Works

### Presence Tracking
1. User visits any dashboard page (`/dashboard/*`)
2. Phoenix.Presence automatically tracks the user session
3. PresenceManager receives presence join event
4. UserStreamManager process starts for the user

### Cleanup Process
1. User closes browser tab/window
2. Phoenix.Presence detects session leave
3. PresenceManager waits for cleanup timeout (5 seconds default)
4. If no other sessions exist, UserStreamManager process stops
5. All associated streaming processes are terminated gracefully

### Multi-Session Handling
- ✅ User has multiple tabs → UserStreamManager stays running
- ✅ User closes one tab → No interruption to stream processing
- ✅ User closes all tabs → Cleanup timer starts
- ✅ User returns before timeout → Cleanup timer resets

## 🔍 Debug & Monitor

### State Inspection
```elixir
# In IEx console - see current system state
iex> Streampai.LivestreamManager.PresenceHelper.debug()

# Check which users have active managers
iex> Streampai.LivestreamManager.PresenceHelper.get_managed_users()

# Check presence tracking
iex> Streampai.LivestreamManager.PresenceHelper.list_presence()
```

### Expected Console Logs
```
[PresenceManager] Phoenix.Presence join: user-id-123
[UserStreamManager:user-id-123] Started for user user-id-123
[UserStreamManager:user-id-123] Console log #1 - 2025-09-07 17:39:20.121132Z
[PresenceManager] Phoenix.Presence leave: user-id-123
[PresenceManager] User user-id-123 cleanup scheduled in 5000ms
[UserStreamManager:user-id-123] Stopping for user user-id-123
```

## ⚙️ Configuration

### Cleanup Timeout
```elixir
# In presence_manager.ex - adjust cleanup delay
@cleanup_timeout 5_000  # 5 seconds (default)
# Change to 30_000 for 30 seconds, etc.
```

### Adding Stream Processing Components
```elixir
# In user_stream_manager.ex - add new child processes
def init(user_id) do
  children = [
    {Streampai.LivestreamManager.ConsoleLogger, user_id},
    {Streampai.LivestreamManager.StreamStateServer, user_id},
    {Streampai.LivestreamManager.MetricsCollector, user_id},
    {Streampai.LivestreamManager.CloudflareManager, user_id},
    # Add your new streaming components here
  ]
  
  Supervisor.init(children, strategy: :one_for_one)
end
```

## Integration Points

### Dashboard Pages
All dashboard LiveViews automatically participate in presence tracking:
- `/dashboard` - Main dashboard
- `/dashboard/stream` - Stream management
- `/dashboard/analytics` - Analytics view  
- `/dashboard/widgets` - Widget configuration
- `/dashboard/settings` - User settings

### Stream Processing
UserStreamManager serves as the supervisor for:
- **Real-time Metrics**: Viewer counts, engagement metrics
- **Event Processing**: Donations, follows, raids, chat messages
- **Platform Integration**: Multi-platform streaming coordination
- **Widget Data**: Real-time data for OBS widgets

### External Integrations
- **Cloudflare Stream**: Live input/output management
- **Platform APIs**: Twitch, YouTube, Facebook, Kick integration
- **Analytics**: Stream performance and audience insights

## Troubleshooting

### Common Issues

**UserStreamManager not starting:**
- Check presence tracking is working: `PresenceHelper.list_presence()`
- Verify dashboard pages are using proper presence tracking
- Check supervisor tree: `:observer.start()`

**Processes not stopping:**
- Confirm cleanup timeout configuration
- Check for process leaks in supervisor tree
- Verify presence leave events are firing

**Multiple processes for same user:**
- Check for duplicate presence joins
- Verify user ID consistency across sessions
- Review presence topic configuration

### Performance Monitoring
```elixir
# Check supervisor process count
iex> Streampai.LivestreamManager.Supervisor |> Supervisor.count_children()

# List all UserStreamManager processes
iex> Streampai.LivestreamManager.DynamicSupervisor |> DynamicSupervisor.count_children()
```

## Benefits

1. **Resource Efficiency**: Stream processing only runs for active users
2. **Automatic Management**: No manual intervention required
3. **Fault Tolerance**: Process crashes don't affect other users
4. **Scalability**: Handles concurrent users independently
5. **Real-time Processing**: Enables live streaming features and analytics

## Related Documentation
- **`USER_STREAM_MANAGER_FLOW.md`** - Detailed technical flow
- **`LIVESTREAM_MANAGER_CONFIG.md`** - Configuration details
- **`ARCHITECTURE.md`** - Overall system architecture

This presence system forms the foundation for Streampai's real-time streaming capabilities and ensures efficient resource utilization across all users.