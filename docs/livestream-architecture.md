# Livestream Architecture

## Overview

Streampai's livestream system manages multi-platform streaming (Twitch, YouTube, Facebook, Kick) through Cloudflare's Live Input/Output infrastructure. A single `gen_statem` state machine per user orchestrates the entire lifecycle — from Cloudflare input initialization through streaming to cleanup.

## Process Tree

```
UserSupervisor (DynamicSupervisor, one_for_one)
└── StreamManager (gen_statem, per user)
    └── StreamServices (DynamicSupervisor, per user)
        ├── AlertQueue
        ├── TwitchManager
        ├── YouTubeManager
        ├── FacebookManager
        └── KickManager
```

- **UserSupervisor** — top-level `DynamicSupervisor`. Starts a `StreamManager` per user on demand via `get_user_stream/1`.
- **StreamManager** — `gen_statem` state machine. Single source of truth for stream state. Spawns `StreamServices` during init.
- **StreamServices** — `DynamicSupervisor` hosting platform managers and the alert queue. Initializes connected platform managers automatically on startup.

## State Machine

StreamManager uses `:gen_statem` with `[:handle_event_function, :state_enter]` callback modes.

### States

```mermaid
stateDiagram-v2
    [*] --> initializing

    initializing --> offline : encoder offline
    initializing --> ready : encoder already live
    initializing --> error : Cloudflare API failure

    error --> offline : retry succeeds (encoder offline)
    error --> ready : retry succeeds (encoder live)

    offline --> ready : encoder connected
    ready --> offline : encoder disconnected

    ready --> streaming : start_stream

    streaming --> disconnected : encoder disconnected
    streaming --> offline : stop_stream (encoder off)
    streaming --> ready : stop_stream (encoder on)

    disconnected --> streaming : encoder reconnects
    disconnected --> offline : auto-stop / stop_stream (encoder off)
    disconnected --> ready : auto-stop / stop_stream (encoder on)

    offline --> initializing : input deleted (404)
    ready --> initializing : input deleted (404)
    streaming --> initializing : input deleted (404)
    disconnected --> initializing : input deleted (404)
```

| State           | Meaning                                         | Encoder      | Streaming      |
| --------------- | ----------------------------------------------- | ------------ | -------------- |
| `:initializing` | Setting up Cloudflare live inputs               | Unknown      | No             |
| `:offline`      | Inputs ready, encoder not connected             | Disconnected | No             |
| `:ready`        | Encoder connected, can start stream             | Connected    | No             |
| `:streaming`    | Live on platforms                               | Connected    | Yes            |
| `:disconnected` | Encoder dropped mid-stream, 10s auto-stop timer | Disconnected | Yes (draining) |
| `:stopping`     | Cleanup in progress                             | Any          | Ending         |
| `:error`        | Initialization failed, retries in 30s           | Unknown      | No             |

### Transitions

| From             | To                | Trigger                                             |
| ---------------- | ----------------- | --------------------------------------------------- |
| `initializing`   | `offline`         | Inputs ready, encoder offline                       |
| `initializing`   | `ready`           | Inputs ready, encoder already live                  |
| `initializing`   | `error`           | Cloudflare API failure                              |
| `error`          | `offline`/`ready` | Retry succeeds (30s timer)                          |
| `offline`        | `ready`           | Poll/webhook detects encoder connected              |
| `ready`          | `offline`         | Poll/webhook detects encoder disconnected           |
| `ready`          | `streaming`       | `start_stream` call succeeds                        |
| `streaming`      | `disconnected`    | Poll/webhook detects encoder disconnected           |
| `streaming`      | `offline`/`ready` | `stop_stream` call                                  |
| `disconnected`   | `streaming`       | Encoder reconnects within 10s                       |
| `disconnected`   | `offline`/`ready` | Auto-stop after 10s timeout or manual `stop_stream` |
| Any active state | `initializing`    | Cloudflare input deleted (404 on poll)              |

Every state transition is logged via the `:enter` callback.

### State Data

```elixir
%StreamManager{
  user_id: String.t(),
  livestream_id: String.t() | nil,
  started_at: DateTime.t() | nil,
  account_id: String.t(),            # Cloudflare account
  api_token: String.t(),             # Cloudflare token
  horizontal_input: map() | nil,     # Primary Cloudflare live input
  vertical_input: map() | nil,       # Secondary Cloudflare live input
  live_outputs: map(),               # Platform RTMP outputs
  poll_interval: integer(),
  services_pid: pid(),               # StreamServices supervisor
  metrics_collector_pid: pid() | nil
}
```

## Initialization Flow

1. `init/1` loads Cloudflare config, creates empty state struct, starts `StreamServices`
2. Dispatches `{:next_event, :internal, :initialize}`
3. `:initialize` handler:
   - Loads `CurrentStreamData` from DB (restores `livestream_id` if stream was active)
   - Calls `InputManager.get_live_inputs/1` — fetches or creates horizontal + vertical Cloudflare inputs
   - Starts input status polling
   - Calls `InputManager.check_streaming_status/1` to determine initial state
   - If restoring to `:streaming` (app restarted mid-stream) → calls `maybe_reattach_platforms/1` to reconnect platform managers (see below)
   - If encoder is already live → transitions to `:ready` (writes `live_input_uid` + `input_streaming: true`)
   - If encoder is offline → transitions to `:offline` (writes `live_input_uid`)
   - On failure → transitions to `:error`, schedules `:retry_initialize` in 30s

### Platform Reattach on Restore

When the app restarts while a stream is running, `StreamManager` restores to `:streaming` state from DB but platform managers (Twitch, YouTube, Kick) are gone. The reattach flow:

1. `maybe_reattach_platforms/1` reads platform data columns (`twitch_data`, `youtube_data`, `kick_data`) from `CurrentStreamData`
2. For each platform with `"status" => "live"`, spawns a Task calling `PlatformCoordinator.reattach_platforms/3`
3. `reattach_platforms` starts each platform manager and calls `reattach_streaming/3` instead of `start_streaming` — this restores state (IDs, connections) without creating duplicate platform resources (Cloudflare outputs, YouTube broadcasts, etc.)
4. Reconnection data (livestream_id, cloudflare IDs, broadcast IDs, etc.) is stored in the platform `*_data` columns during the original `start_streaming` call via `store_reconnection_data/1`

## Cloudflare Integration

### InputManager

Manages live inputs (RTMP/SRT/WebRTC ingest points).

- **`get_live_inputs/1`** — gets or creates both horizontal and vertical inputs via `LiveInput.get_or_fetch_for_user_with_test_mode`
- **`check_streaming_status/1`** — polls Cloudflare API for both inputs. Returns `:live` if either is connected, `:offline` if both are idle, `{:error, :input_deleted}` on 404
- **`handle_deletion/1`** — clears input state, deletes stale DB records, triggers re-initialization

### OutputManager

Manages live outputs (RTMP forwarding to platforms).

- **`enable/1`** / **`disable/1`** — toggles all outputs on/off via Cloudflare API
- **`cleanup_all/1`** — fetches and deletes all outputs for the input
- **`update/2`** — creates outputs for a set of platform configs
- **`delete/3`** — removes a single platform output

Platform RTMP endpoints:

- Twitch: `rtmp://live.twitch.tv/app`
- YouTube: `rtmp://a.rtmp.youtube.com/live2`
- Facebook: `rtmps://live-api-s.facebook.com:443/rtmp`
- Kick: `rtmp://ingest.kick.com/live`

### Input Status Polling

Polls Cloudflare every 5s (configurable via `:cloudflare_input_poll_interval`). Polling runs in `:offline`, `:ready`, `:streaming`, and `:disconnected` states. Ignored during `:initializing` and `:error`.

Status changes trigger state transitions via `apply_input_status_change/3`:

- `:live` detected in `:offline` → move to `:ready`
- `:offline` detected in `:ready` → move to `:offline`
- `:offline` detected in `:streaming` → move to `:disconnected` (starts 10s auto-stop timer)
- `:live` detected in `:disconnected` → move back to `:streaming`
- `:input_deleted` → re-initialize inputs

Cloudflare webhooks (`stream.live_input.connected` / `stream.live_input.disconnected`) also trigger the same transitions as a faster signal path.

## Stream Lifecycle

### Starting a Stream

1. User calls `start_stream/2` — only allowed in `:ready` state
2. `StartStream.execute/2`:
   - Creates `Livestream` DB record
   - Writes streaming status to `StreamManagerState` (title, description, tags, thumbnail)
   - Cleans up stale Cloudflare outputs
   - Starts metrics collector
   - Calls `PlatformCoordinator.start_streaming/4` — starts on selected platforms in parallel
   - Records platform statuses (connecting/error) in DB
   - Returns `{:ok, livestream_id, data}` or `{:error, :all_platforms_failed}`
3. StreamManager enables Cloudflare outputs and transitions to `:streaming`

### Stopping a Stream

1. User calls `stop_stream/1` — allowed in `:streaming` or `:disconnected`
2. StreamManager disables Cloudflare outputs
3. `StopStream.execute/1`:
   - Writes stopping status to DB
   - Finalizes `Livestream` record (sets `ended_at`)
   - Stops platform streaming in parallel
   - Stops metrics collector
   - Cleans up all Cloudflare outputs
   - Writes stopped status to DB
4. Clears all platform statuses from `StreamManagerState`
5. Checks current encoder status to pick target state (`:ready` if still connected, `:offline` if not)

### Auto-Stop on Disconnect

When encoder disconnects during streaming:

1. Transitions to `:disconnected` with a `{:state_timeout, 10_000, :auto_stop}` action
2. If encoder reconnects within 10s → transitions back to `:streaming`
3. If timeout fires → disables outputs, stops stream, clears platforms, transitions to `:offline` or `:ready`

## PlatformCoordinator

Starts/stops/reattaches streaming on external platforms in parallel using `Task.async`.

- `start_streaming/4` — accepts optional `selected_platforms` list (nil = all connected accounts). Ensures platform manager is running, then calls `start_streaming` on each platform module.
- `stop_streaming/1` — stops all active platforms in parallel.
- `reattach_platforms/3` — reconnects platform managers after app restart. For each platform with stored `"status" => "live"` data, starts the manager and calls `reattach_streaming/3` to restore state without creating duplicate resources.
- `get_active_platforms/1` — loads user's connected streaming accounts from DB.

## CurrentStreamData (DB ↔ Frontend Sync)

`CurrentStreamData` is an Ash resource synced to the frontend via Electric SQL. It uses separate columns instead of a single JSONB blob, making Electric sync more granular.

### Columns

| Column            | Type     | Contents                                                                                                                             |
| ----------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `status`          | `string` | Current stream status: `idle`, `streaming`, `disconnected`, `error`, `stopping`                                                      |
| `stream_data`     | `map`    | Core stream info: `livestream_id`, `started_at`, `title`, `description`, `tags`, `error`                                             |
| `cloudflare_data` | `map`    | Cloudflare input state: `live_input_uid`, `input_streaming`                                                                          |
| `youtube_data`    | `map`    | YouTube platform status + reconnection data: `status`, `viewer_count`, `url`, `broadcast_id`, `stream_id`, `chat_id`, cloudflare IDs |
| `twitch_data`     | `map`    | Twitch platform status + reconnection data: `status`, `viewer_count`, `livestream_id`, cloudflare IDs                                |
| `kick_data`       | `map`    | Kick platform status + reconnection data: `status`, `stream_key`, cloudflare IDs                                                     |

The platform `*_data` columns serve double duty: they store live platform status for the frontend AND reconnection data used by `reattach_platforms` after app restart.

### Key Actions

- `upsert_for_user` — creates or updates the record for a user
- `update_platform_data` — merges new data into a specific platform column (preserves existing fields)
- `update_metadata` — updates stream title/description in `stream_data`

## Frontend Integration

The frontend uses the `useStreamActor` hook to read `CurrentStreamData` via Electric SQL in real-time. Key accessors:

- `streamStatus()` — current state string
- `encoderConnected()` — reads `cloudflare_data.input_streaming`
- `liveInputUid()` — reads `cloudflare_data.live_input_uid` for Cloudflare iframe preview
- `livestreamId()` — reads `stream_data.livestream_id`
- `platformStatuses()` — aggregates `youtube_data`, `twitch_data`, `kick_data` into a map

The live preview uses `https://videodelivery.net/{INPUT_UID}/iframe` with LL-HLS (~3s latency) for RTMP/SRT ingest.

## Chat Message Flow

### Sending Messages (Streamer → Platforms)

1. Frontend calls `StreamAction.send_message` RPC
2. `send_message` creates a `StreamEvent` with `is_sent_by_streamer: true` and `platform: nil`
3. Calls `StreamManager.send_chat_message` → `StreamServices.broadcast_message`
4. `broadcast_message` sends to each platform in parallel via `Task.async`
5. Each platform's `send_chat_message` returns the platform-assigned message ID
6. The message ID is immediately registered in `EventPersister` (via ETS) for echo detection
7. Delivery status is updated on the original `StreamEvent`

### Receiving Messages (Platforms → DB)

1. Platform clients (Twitch EventSub, YouTube gRPC) receive chat messages
2. Messages are queued via `EventPersister.add_message/1`
3. `EventPersister` checks if the message ID matches a recently sent message (echo detection)
4. If it's an echo → message is skipped (not persisted)
5. If not → message is batched and bulk-upserted as a `StreamEvent`
6. Frontend receives new events via Electric SQL sync

### Echo Detection

When the streamer sends a message through Streampai, each platform echoes it back through their chat feed. To avoid duplicates:

- Platform message IDs are registered in an ETS table (`register_sent_message_id/2`) immediately when each platform API responds
- When `EventPersister` receives a message, it checks the ETS table by `{user_id, message_id}`
- Matching entries are consumed (deleted from ETS) and the message is skipped
- Unmatched entries expire after 30s via periodic cleanup in the flush timer

## PubSub Topics

Active PubSub topics in the livestream system:

| Topic Pattern                    | Message Type                        | Purpose                                    |
| -------------------------------- | ----------------------------------- | ------------------------------------------ |
| `viewer_counts:#{user_id}`       | `{:viewer_update, platform, count}` | Platform managers → metrics collector      |
| `alertbox:#{user_id}`            | `{:alert_event, event}`             | AlertQueue → alertbox OBS overlay widget   |
| `alertqueue:#{user_id}`          | `{:queue_update, data}`             | AlertQueue → frontend queue management UI  |
| `widget_events:#{user_id}:timer` | `{:timer_event, event}`             | TimerManager → timer widget                |
| `widget_events:#{user_id}:timer` | `{:timer_tick, data}`               | TimerManager → timer widget (every second) |
| `youtube_token:#{user_id}`       | `{:token_update, token}`            | TokenManager → YouTube platform manager    |
| `twitch_token:#{user_id}`        | `{:token_update, token}`            | TwitchManager → internal token refresh     |

Note: Chat messages, stream status, and encoder status are **not** broadcast via PubSub — they flow through the database and Electric SQL sync.

## Key Files

| File                                                                           | Purpose                                                   |
| ------------------------------------------------------------------------------ | --------------------------------------------------------- |
| `lib/streampai/livestream_manager/stream_manager.ex`                           | gen_statem state machine                                  |
| `lib/streampai/livestream_manager/user_supervisor.ex`                          | DynamicSupervisor for StreamManagers                      |
| `lib/streampai/livestream_manager/stream_services.ex`                          | DynamicSupervisor for platform managers + chat broadcast  |
| `lib/streampai/livestream_manager/stream_manager/cloudflare/input_manager.ex`  | Cloudflare input CRUD + polling                           |
| `lib/streampai/livestream_manager/stream_manager/cloudflare/output_manager.ex` | Cloudflare output CRUD + toggling                         |
| `lib/streampai/livestream_manager/stream_manager/platform_coordinator.ex`      | Multi-platform start/stop/reattach orchestration          |
| `lib/streampai/livestream_manager/stream_manager/actions/start_stream.ex`      | Start stream workflow                                     |
| `lib/streampai/livestream_manager/stream_manager/actions/stop_stream.ex`       | Stop stream workflow                                      |
| `lib/streampai/livestream_manager/circuit_breaker.ex`                          | ETS-based circuit breaker (closed/open/half-open)         |
| `lib/streampai/livestream_manager/retry_strategy.ex`                           | Exponential backoff with jitter                           |
| `lib/streampai/stream/current_stream_data.ex`                                  | Ash resource for DB state (Electric sync)                 |
| `lib/streampai/stream/event_persister.ex`                                      | Batched chat message persistence + echo filtering         |
| `lib/streampai/stream/stream_action.ex`                                        | Ash actions for stream control (send_message, start/stop) |
| `frontend/src/lib/useElectric.ts`                                              | `useStreamActor` hook                                     |
| `frontend/src/components/stream/LiveInputPreview.tsx`                          | Cloudflare iframe preview                                 |
