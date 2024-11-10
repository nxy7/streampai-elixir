# Livestream GenServer Architecture Pattern

This document describes the GenServer-based architecture for managing active users and their livestream sessions in Streampai.

## Overview

The system implements a per-user GenServer platform that coordinates all aspects of a user's livestream lifecycle, from login to stream termination. Each user gets their own supervised process tree that manages platform integrations, stream monitoring, and event processing.

## User Flow Requirements

1. **User Login** → Start `UserStreamManager` for the user
2. **Stream Page Access** → Wait for Cloudflare Live Input to show "streaming" status
3. **Streaming Detected** → Show "Start Stream" button to user
4. **Start Stream Clicked** → Create Cloudflare Live Outputs for selected platforms + start monitoring
5. **Stream Stop** → Close all Live Outputs + mark stream as 'finished' (triggered by button or 5-minute disconnect)

## Architecture Design

### Process Hierarchy

```
Application
└── LivestreamManager.Supervisor
    ├── Registry (unique process names)
    ├── DynamicSupervisor (manages UserStreamManagers)
    └── UserStreamManager (per-user supervisor)
        ├── StreamStateServer (stream state & metadata)
        ├── CloudflareInputMonitor (input status polling)
        ├── CloudflareOutputManager (output lifecycle)
        └── PlatformMonitorSupervisor (dynamic)
            ├── TwitchMonitor (messages, events, metrics)
            ├── YouTubeMonitor (messages, events, metrics)
            ├── FacebookMonitor (messages, events, metrics)
            └── KickMonitor (messages, events, metrics)
```

### Core Components

#### 1. UserStreamManager (Supervisor)
- **Purpose**: Main coordinator for a user's entire livestream session
- **Lifecycle**: Started on user login, stopped when user logs out or stream ends
- **Responsibilities**:
  - Supervise all user-specific streaming processes
  - Provide unified API for stream operations
  - Handle process failures and restarts

#### 2. StreamStateServer (GenServer)
- **Purpose**: Central state management for stream status and metadata
- **State**: `:offline`, `:ready`, `:streaming`, `:ending`
- **Data**: Stream title, thumbnail, platform configs, statistics
- **Events**: Broadcasts state changes via PubSub

#### 3. CloudflareInputMonitor (GenServer)
- **Purpose**: Monitor Cloudflare Live Input for streaming status
- **Polling**: Check input status every 10-30 seconds
- **Detection**: Notify when user starts/stops streaming to input
- **Timeout**: Track 5-minute disconnect period for auto-stop

#### 4. CloudflareOutputManager (GenServer)
- **Purpose**: Manage Cloudflare Live Outputs lifecycle
- **Operations**: Create/destroy outputs per platform
- **Coordination**: Works with InputMonitor for start/stop timing
- **Platform Config**: Store output configurations per platform

#### 5. Platform Monitors (GenServer, Dynamic)
- **Purpose**: Platform-specific data collection and monitoring
- **Per-Platform**: Each platform has its own monitoring process
- **Responsibilities**:
  - Collect chat messages
  - Track viewer metrics
  - Process donations/subscriptions
  - Handle platform-specific events
- **Lifecycle**: Started when stream begins, stopped when stream ends

### Process Communication Patterns

#### Registry-based Process Discovery
```elixir
# Process registration pattern
{:via, Registry, {Streampai.LivestreamManager.Registry, {:stream_state, user_id}}}

# Registry keys:
{:user_stream_manager, user_id}     # Main supervisor
{:stream_state, user_id}            # State server
{:cloudflare_input, user_id}        # Input monitor
{:cloudflare_output, user_id}       # Output manager
{:platform_monitor, user_id, platform} # Platform monitors
```

#### PubSub Event Broadcasting
```elixir
# Topics:
"user_stream:#{user_id}"                    # Stream state changes
"user_stream:#{user_id}:statistics"         # Metrics updates
"platform:#{platform}:#{user_id}"          # Platform-specific events
"cloudflare_input:#{user_id}"               # Input status changes
"stream_lifecycle:#{user_id}"               # Start/stop events
```

## Implementation Strategy

### Phase 1: Core Infrastructure
1. Enhance `UserStreamManager` with full component supervision
2. Update `StreamStateServer` with new states and flow logic
3. Implement `CloudflareInputMonitor` with streaming detection
4. Create `CloudflareOutputManager` for output lifecycle

### Phase 2: Platform Integration
1. Implement `PlatformMonitorSupervisor` for dynamic platform management
2. Create platform-specific monitors (Twitch, YouTube, Facebook, Kick)
3. Integrate with existing platform managers and API clients
4. Add platform-specific event processing

### Phase 3: User Integration
1. Add login hooks to start `UserStreamManager`
2. Create stream page integration for "Start Stream" button
3. Implement WebSocket/LiveView integration for real-time updates
4. Add logout/session cleanup handling

## State Management

### Stream States
- `:offline` - User not streaming, no live input detected
- `:ready` - Live input detected and streaming, ready to start outputs
- `:streaming` - Live outputs active, platforms receiving stream
- `:ending` - Stream stop initiated, cleaning up outputs

### State Transitions
```
:offline → :ready     (Cloudflare Live Input starts streaming)
:ready → :streaming   (User clicks "Start Stream" button)
:streaming → :ending  (User clicks stop OR 5-minute disconnect)
:ending → :offline    (Cleanup complete)
```

### Data Flow
1. **Input Detection**: `CloudflareInputMonitor` polls → updates `StreamStateServer` → broadcasts to UI
2. **Stream Start**: UI button → `UserStreamManager` → `CloudflareOutputManager` → create outputs → start platform monitors
3. **Stream Stop**: UI button or timeout → stop platform monitors → destroy outputs → update state
4. **Events**: Platform monitors → `StreamStateServer` statistics → broadcast to UI/widgets

## Error Handling & Fault Tolerance

### Supervision Strategy
- **UserStreamManager**: `:one_for_one` - individual component failures don't affect others
- **PlatformMonitorSupervisor**: `:one_for_one` - platform failures are isolated
- **DynamicSupervisor**: `:one_for_one` - user failures don't affect other users

### Failure Recovery
1. **Platform Monitor Crash**: Automatic restart, re-establish connections
2. **Cloudflare Monitor Crash**: Restart with current state, resume polling
3. **Stream State Crash**: Restart with database recovery, re-notify components
4. **User Manager Crash**: Full user session restart, notify user of interruption

### Timeouts & Circuit Breakers
- **API Calls**: 10-30 second timeouts with exponential backoff
- **Platform Reconnection**: Circuit breaker pattern for failing platforms
- **Input Polling**: Graceful degradation if Cloudflare API is down
- **Disconnect Detection**: 5-minute grace period before auto-stop

## Configuration

### Environment Variables
```bash
# Polling intervals (milliseconds)
CLOUDFLARE_INPUT_POLL_INTERVAL=15000
PLATFORM_EVENT_POLL_INTERVAL=5000
STREAM_DISCONNECT_TIMEOUT=300000  # 5 minutes

# Process limits
MAX_CONCURRENT_USERS=1000
MAX_PLATFORMS_PER_USER=10
PLATFORM_MONITOR_TIMEOUT=30000

# Monitoring
STREAM_METRICS_BROADCAST_INTERVAL=10000
EVENT_HISTORY_SIZE=100
```

### Application Configuration
```elixir
config :streampai, :livestream_manager,
  # Registry for process lookup
  registry_name: Streampai.LivestreamManager.Registry,
  
  # User limits
  max_concurrent_users: 1000,
  max_platforms_per_user: 10,
  
  # Monitoring intervals
  cloudflare_input_poll_interval: 15_000,
  platform_event_poll_interval: 5_000,
  disconnect_timeout: 300_000,
  
  # Process timeouts
  platform_monitor_timeout: 30_000,
  api_call_timeout: 10_000
```

## Testing Strategy

### Unit Tests
- Individual GenServer state management
- Platform monitor event processing
- Cloudflare API integration mocking
- State transition validation

### Integration Tests
- Full user flow from login to stream end
- Platform failure and recovery scenarios
- Concurrent user streaming
- Timeout and cleanup behavior

### Load Tests
- Multiple concurrent users
- Platform API rate limiting
- Memory usage under load
- Process supervision under stress

## Monitoring & Observability

### Telemetry Events
```elixir
[:livestream_manager, :user_session, :started]
[:livestream_manager, :user_session, :ended]
[:livestream_manager, :stream, :state_changed]
[:livestream_manager, :platform, :monitor_started]
[:livestream_manager, :platform, :event_processed]
[:livestream_manager, :cloudflare, :input_status_checked]
[:livestream_manager, :cloudflare, :output_created]
[:livestream_manager, :cloudflare, :output_destroyed]
```

### Metrics to Track
- Active user sessions
- Stream state distribution
- Platform monitor health
- API response times
- Event processing rates
- Memory usage per user

### Logging Strategy
- User session lifecycle events
- Platform connection status changes
- Stream state transitions
- Error conditions and recovery
- Performance metrics

## Security Considerations

### Process Isolation
- Each user gets isolated process tree
- Platform tokens stored per-user process
- No shared state between users
- Process crashes don't leak data

### Token Management
- Platform tokens refreshed automatically
- Expired tokens trigger re-authentication
- Secure token storage in process state
- Token revocation handling

### Rate Limiting
- Per-user API rate limiting
- Platform-specific rate limits
- Graceful degradation on limits
- User notification of rate limit issues

## Future Enhancements

### Scalability
- Horizontal scaling across nodes
- Process distribution strategies
- Database sharding by user
- CDN integration for global reach

### Features
- Multi-stream support per user
- Advanced scheduling and automation
- Custom platform integrations
- Analytics and reporting dashboard

### Performance
- Connection pooling for platform APIs
- Caching strategies for frequent data
- Background job processing for heavy tasks
- Stream quality optimization

---

This architecture provides a robust, scalable foundation for managing livestream sessions while maintaining fault tolerance and clear separation of concerns. Each component has a single responsibility and communicates through well-defined interfaces, making the system maintainable and extensible.