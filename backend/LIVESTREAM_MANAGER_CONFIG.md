# Livestream Manager Configuration Guide

This document provides comprehensive configuration guidance for the Livestream Manager system in Streampai.

## Table of Contents

1. [Overview](#overview)
2. [Environment Variables](#environment-variables)
3. [Application Configuration](#application-configuration)
4. [Database Configuration](#database-configuration)
5. [Platform Integration](#platform-integration)
6. [Cloudflare Stream Configuration](#cloudflare-stream-configuration)
7. [Process Registry & Supervision](#process-registry--supervision)
8. [Event Broadcasting](#event-broadcasting)
9. [Testing Configuration](#testing-configuration)
10. [Performance Tuning](#performance-tuning)
11. [Troubleshooting](#troubleshooting)

## Overview

The Livestream Manager is a distributed system that manages multiple user streams, platform integrations, and real-time event processing. It consists of several key components:

- **Stream State Servers**: Per-user GenServers that maintain stream state
- **Platform Managers**: Handle platform-specific integrations (Twitch, YouTube, etc.)
- **Event Broadcasters**: Manage real-time event distribution
- **Cloudflare Integration**: Stream input/output management
- **Alert System**: Handle donations, follows, and other stream events

## Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/streampai_dev"

# Authentication
TOKEN_SIGNING_SECRET="your-jwt-signing-secret-here"

# Cloudflare Stream
CLOUDFLARE_API_TOKEN="your-cloudflare-api-token"
CLOUDFLARE_ACCOUNT_ID="your-cloudflare-account-id"

# Platform OAuth Credentials
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:4000/auth/google/callback"

TWITCH_CLIENT_ID="your-twitch-client-id"
TWITCH_CLIENT_SECRET="your-twitch-client-secret"
```

### Optional Variables

```bash
# Logging
LOG_LEVEL="info"  # debug, info, warn, error

# Performance
MAX_USER_STREAMS="1000"
EVENT_HISTORY_SIZE="100"
ALERT_QUEUE_SIZE="50"

# Platform Rate Limits
TWITCH_RATE_LIMIT_PER_MINUTE="100"
YOUTUBE_RATE_LIMIT_PER_MINUTE="100"

# Testing
TEST_MODE="false"  # Set to "true" in test environment
```

## Application Configuration

### config/dev.exs

```elixir
import Config

config :streampai,
  # Livestream Manager settings
  max_user_streams: 100,
  event_history_size: 50,
  alert_processing_interval: 1000,
  platform_sync_interval: 30_000,
  
  # Registry configuration
  registry_name: Streampai.LivestreamManager.Registry,
  
  # PubSub configuration
  pubsub_name: Streampai.PubSub,
  
  # Authentication
  token_signing_secret: System.get_env("TOKEN_SIGNING_SECRET") || "dev-secret-key"

# Platform-specific configuration
config :streampai, :platform_config,
  twitch: [
    api_base_url: "https://api.twitch.tv/helix",
    auth_url: "https://id.twitch.tv/oauth2",
    rate_limit: [requests: 800, per: :minute]
  ],
  youtube: [
    api_base_url: "https://www.googleapis.com/youtube/v3",
    rate_limit: [requests: 100, per: :minute]
  ]

# Cloudflare Stream configuration
config :streampai, :cloudflare,
  api_token: System.get_env("CLOUDFLARE_API_TOKEN"),
  account_id: System.get_env("CLOUDFLARE_ACCOUNT_ID"),
  api_base_url: "https://api.cloudflare.com/client/v4",
  default_input_config: %{
    meta: %{name: "StreamPAI Input"},
    recording: %{mode: "automatic"}
  }
```

### config/prod.exs

```elixir
import Config

config :streampai,
  # Production settings - higher limits
  max_user_streams: 10_000,
  event_history_size: 100,
  alert_processing_interval: 500,
  platform_sync_interval: 60_000,
  
  # Security
  token_signing_secret: System.get_env("TOKEN_SIGNING_SECRET")

# Production platform limits
config :streampai, :platform_config,
  twitch: [
    rate_limit: [requests: 1200, per: :minute]
  ],
  youtube: [
    rate_limit: [requests: 200, per: :minute]
  ]
```

### config/test.exs

```elixir
import Config

# Set test mode flag
config :streampai, test_mode: true

# Test-specific settings
config :streampai,
  max_user_streams: 10,
  event_history_size: 5,
  alert_processing_interval: 100,
  platform_sync_interval: 1000

# Mock platform configuration for testing
config :streampai, :platform_config,
  twitch: [
    api_base_url: "http://localhost:4001/mock/twitch",
    rate_limit: [requests: 1000, per: :minute]
  ]
```

## Database Configuration

### Streaming Accounts Table

The Livestream Manager requires the `streaming_account` table to store platform authentication:

```sql
CREATE TABLE streaming_account (
  user_id UUID NOT NULL,
  platform VARCHAR NOT NULL,
  access_token VARCHAR NOT NULL,
  refresh_token VARCHAR NOT NULL,
  access_token_expires_at TIMESTAMPTZ NOT NULL,
  extra_data JSONB NOT NULL DEFAULT '{}',
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, platform)
);
```

### Indexes

```sql
-- Index for token expiration queries
CREATE INDEX idx_streaming_account_expires_at 
ON streaming_account (access_token_expires_at) 
WHERE access_token_expires_at < NOW();

-- Index for user lookups
CREATE INDEX idx_streaming_account_user_id ON streaming_account (user_id);
```

## Platform Integration

### Twitch Configuration

```elixir
# In your application configuration
config :streampai, :twitch,
  client_id: System.get_env("TWITCH_CLIENT_ID"),
  client_secret: System.get_env("TWITCH_CLIENT_SECRET"),
  redirect_uri: System.get_env("TWITCH_REDIRECT_URI"),
  scopes: [
    "chat:read",
    "chat:edit", 
    "channel:read:subscriptions",
    "bits:read",
    "channel:read:redemptions"
  ],
  webhook_secret: System.get_env("TWITCH_WEBHOOK_SECRET")
```

### YouTube Configuration

```elixir
config :streampai, :youtube,
  client_id: System.get_env("GOOGLE_CLIENT_ID"),
  client_secret: System.get_env("GOOGLE_CLIENT_SECRET"),
  redirect_uri: System.get_env("GOOGLE_REDIRECT_URI"),
  scopes: [
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/youtube.force-ssl"
  ]
```

## Cloudflare Stream Configuration

### Basic Setup

```elixir
config :streampai, :cloudflare,
  api_token: System.get_env("CLOUDFLARE_API_TOKEN"),
  account_id: System.get_env("CLOUDFLARE_ACCOUNT_ID"),
  
  # Default input configuration
  default_input_config: %{
    meta: %{
      name: "StreamPAI Live Input"
    },
    recording: %{
      mode: "automatic",
      timeoutSeconds: 3600
    }
  },
  
  # Output templates
  output_templates: %{
    twitch: %{
      streamKey: "{TWITCH_STREAM_KEY}",
      url: "rtmp://live.twitch.tv/live"
    },
    youtube: %{
      streamKey: "{YOUTUBE_STREAM_KEY}",
      url: "rtmp://a.rtmp.youtube.com/live2"
    }
  }
```

### Webhook Configuration

```elixir
config :streampai, :cloudflare_webhooks,
  secret: System.get_env("CLOUDFLARE_WEBHOOK_SECRET"),
  endpoint: "/webhooks/cloudflare",
  events: [
    "live_input.connected",
    "live_input.disconnected", 
    "live_input.recording_started",
    "live_input.recording_ended"
  ]
```

## Process Registry & Supervision

### Registry Configuration

```elixir
# In your application.ex supervision tree
children = [
  # Registry for livestream processes
  {Registry, keys: :unique, name: Streampai.LivestreamManager.Registry},
  
  # Main supervisor
  {Streampai.LivestreamManager.Supervisor, []},
  
  # Event broadcaster
  {Streampai.LivestreamManager.EventBroadcaster, []}
]
```

### Supervisor Strategy

```elixir
# Configure supervision strategy
def init(_args) do
  children = [
    {DynamicSupervisor, name: Streampai.LivestreamManager.UserSupervisor, strategy: :one_for_one},
    {Streampai.LivestreamManager.PlatformSupervisor, []},
    {Streampai.LivestreamManager.CloudflareSupervisor, []}
  ]

  Supervisor.init(children, strategy: :rest_for_one)
end
```

## Event Broadcasting

### PubSub Topics

The system uses Phoenix.PubSub for real-time event broadcasting:

```elixir
# Stream state changes
"user_stream:{user_id}"

# Statistics updates  
"user_stream:{user_id}:statistics"

# Platform events
"platform:{platform}:{user_id}"

# Global events
"livestream:global"
```

### Event Configuration

```elixir
config :streampai, :event_broadcasting,
  # Maximum events to keep in history
  history_size: 100,
  
  # Event types to broadcast globally
  global_events: [
    :stream_started,
    :stream_ended,
    :platform_connected,
    :platform_disconnected
  ],
  
  # Rate limiting for event processing
  rate_limit: [
    events: 1000,
    per: :minute,
    per_user: 100
  ]
```

## Testing Configuration

### Test Environment Setup

```elixir
# config/test.exs additions
config :streampai, 
  # Enable test mode
  test_mode: true,
  
  # Reduced limits for faster tests
  max_user_streams: 5,
  event_history_size: 3,
  alert_processing_interval: 10,
  
  # Mock external services
  mock_platforms: true,
  mock_cloudflare: true

# Test database with partitioning
config :streampai, Streampai.Repo,
  database: "streampai_test#{System.get_env("MIX_TEST_PARTITION")}",
  pool: Ecto.Adapters.SQL.Sandbox,
  pool_size: System.schedulers_online() * 2
```

### Test-Specific Environment Variables

```bash
# Set these in your test environment
export TEST_MODE=true
export TOKEN_SIGNING_SECRET="test-secret-key"
export CLOUDFLARE_API_TOKEN="test_token"
export CLOUDFLARE_ACCOUNT_ID="test_account"
```

## Performance Tuning

### GenServer Pool Configuration

```elixir
config :streampai, :performance,
  # Stream state server settings
  stream_server_hibernate_after: 5000,
  stream_server_timeout: 30000,
  
  # Platform manager pools
  platform_manager_pool_size: 10,
  platform_manager_max_overflow: 5,
  
  # Event processing
  event_batch_size: 50,
  event_batch_timeout: 100
```

### Memory Management

```elixir
config :streampai, :memory,
  # Garbage collection settings
  force_gc_after: 1000,
  hibernate_inactive_processes: true,
  
  # Process limits
  max_processes_per_user: 10,
  process_memory_limit: 100_000_000  # 100MB
```

## Monitoring & Metrics

### Telemetry Configuration

```elixir
config :streampai, :telemetry,
  metrics: [
    # Stream metrics
    summary("livestream.stream_state_server.call_duration"),
    counter("livestream.stream_state_server.calls_total"),
    
    # Platform metrics
    counter("livestream.platform.api_calls_total"),
    counter("livestream.platform.api_errors_total"),
    
    # Event metrics
    counter("livestream.events.processed_total"),
    gauge("livestream.events.queue_size")
  ]
```

### Health Checks

```elixir
config :streampai, :health_checks,
  # Check intervals
  platform_health_check_interval: 60_000,
  cloudflare_health_check_interval: 30_000,
  
  # Failure thresholds
  max_consecutive_failures: 5,
  health_check_timeout: 10_000
```

## Troubleshooting

### Common Issues

#### 1. CloudflareAPIClient Singleton Conflicts

**Problem**: Tests fail with "already started" errors

**Solution**: Ensure test mode is enabled in config/test.exs:

```elixir
config :streampai, test_mode: true
```

#### 2. JWT Authentication Failures

**Problem**: Invalid JWT signing secret format

**Solution**: Set TOKEN_SIGNING_SECRET environment variable:

```bash
export TOKEN_SIGNING_SECRET="your-secret-key"
```

#### 3. Platform API Rate Limits

**Problem**: Platform API calls failing due to rate limits

**Solution**: Adjust rate limit configuration:

```elixir
config :streampai, :platform_config,
  twitch: [
    rate_limit: [requests: 600, per: :minute]  # Reduced from default
  ]
```

#### 4. Registry Conflicts in Tests

**Problem**: Process registry conflicts between test runs

**Solution**: Use test-specific registry names and proper cleanup:

```elixir
setup do
  registry_name = :"TestRegistry_#{:rand.uniform(1000000)}"
  {:ok, _} = Registry.start_link(keys: :unique, name: registry_name)
  Process.put(:test_registry_name, registry_name)
  %{registry_name: registry_name}
end
```

### Debug Configuration

```elixir
# For debugging, enable verbose logging
config :logger, level: :debug

config :streampai, :debug,
  log_platform_requests: true,
  log_event_processing: true,
  log_process_lifecycle: true
```

### Performance Issues

1. **High Memory Usage**: Check `event_history_size` and `max_user_streams` settings
2. **Slow Response Times**: Verify database connection pool size and platform API timeouts
3. **Process Count**: Monitor via `:observer.start()` and adjust supervision strategies

## Production Checklist

Before deploying to production:

- [ ] All required environment variables set
- [ ] Database migrations run
- [ ] Platform OAuth applications configured
- [ ] Cloudflare API credentials valid
- [ ] JWT signing secret is cryptographically secure
- [ ] Rate limits configured appropriately
- [ ] Monitoring and alerting configured
- [ ] Health checks enabled
- [ ] Log levels set appropriately
- [ ] Memory limits configured
- [ ] Backup strategy in place

## Configuration Validation

Use this script to validate your configuration:

```elixir
defmodule ConfigValidator do
  def validate_livestream_config do
    required_env_vars = [
      "DATABASE_URL",
      "TOKEN_SIGNING_SECRET", 
      "CLOUDFLARE_API_TOKEN",
      "CLOUDFLARE_ACCOUNT_ID"
    ]
    
    missing_vars = Enum.filter(required_env_vars, &(System.get_env(&1) == nil))
    
    case missing_vars do
      [] -> 
        IO.puts("✅ All required environment variables are set")
      vars ->
        IO.puts("❌ Missing environment variables: #{Enum.join(vars, ", ")}")
    end
    
    # Validate application config
    config_checks = [
      {:max_user_streams, Application.get_env(:streampai, :max_user_streams)},
      {:registry_name, Application.get_env(:streampai, :registry_name)},
      {:pubsub_name, Application.get_env(:streampai, :pubsub_name)}
    ]
    
    Enum.each(config_checks, fn {key, value} ->
      if value do
        IO.puts("✅ #{key}: #{inspect(value)}")
      else
        IO.puts("❌ #{key}: not configured")
      end
    end)
  end
end

# Run validation
ConfigValidator.validate_livestream_config()
```

This comprehensive configuration guide should help you properly set up and maintain the Livestream Manager system in different environments.