# Hooks Feature — Backend Plan

## Concept

Hooks = user-defined automations: **"When [stream event] → do [action]"**. Entirely backend-driven. Always running when user is online.

## Sync Strategy

- **Configs** (bounded) → `Phoenix.Sync.Shape` — hook configs
- **Events** (unbounded) → `Phoenix.Sync.Client.stream` — no materialization

Also refactor `ChatBotServer` to use `Client.stream` for events (separate task).

---

## Data Model

### `StreamHook` (Ash Resource — `Streampai.Stream` domain)

```
stream_hooks
├── id: uuid (PK)
├── user_id: uuid (FK → users)
├── name: string
├── enabled: boolean (default true)
├── trigger_type: enum (:donation, :follow, :raid, :subscription,
│                        :stream_start, :stream_end, :chat_message)
├── conditions: map (JSONB, optional filters)
├── action_type: enum (:webhook, :discord_message, :chat_message, :email)
├── action_config: map (JSONB, action-specific)
├── cooldown_seconds: integer (default 0)
├── last_triggered_at: utc_datetime_usec (nullable)
├── inserted_at / updated_at
```

### `StreamHookLog` (Ash Resource — `Streampai.Stream` domain)

```
stream_hook_logs
├── id: uuid (PK)
├── hook_id: uuid (FK → stream_hooks)
├── user_id: uuid (FK → users)
├── stream_event_id: uuid (nullable)
├── trigger_type / action_type: atoms (denormalized)
├── status: enum (:success, :failure, :skipped_cooldown, :skipped_condition)
├── error_message: string (nullable)
├── executed_at: utc_datetime_usec
├── duration_ms: integer
├── inserted_at
```

---

## Execution Architecture

### Lifecycle: Sibling of StreamManager under UserSupervisor

`HookExecutor` is a peer process started by `PresenceManager` alongside `StreamManager`:

```
PresenceManager (on user join)
  → DynamicSupervisor.start_child(UserSupervisor, {StreamManager, user_id})
  → DynamicSupervisor.start_child(UserSupervisor, {HookExecutor, user_id})   # NEW
```

Once started, neither `StreamManager` nor `HookExecutor` are terminated on user leave. They stay alive. `PresenceManager` just ensures they're running.

### `HookExecutor` GenServer

Registered via `RegistryHelpers` as `:hook_executor`.

**Two subscriptions:**

1. **Hook configs** — `Shape` (bounded):

   ```elixir
   Shape.start_link(from(h in StreamHook, where: h.user_id == ^user_id), replica: :full)
   Shape.subscribe(pid, tag: :hooks_sync)
   ```

2. **Stream events** — `Client.stream` (unbounded, no materialization):
   ```elixir
   stream = Phoenix.Sync.Client.stream(
     from(e in StreamEvent, where: e.user_id == ^user_id),
     replica: :full
   )
   # Consumed via linked Task → sends messages to GenServer
   ```

**On new event:**

```
for hook <- matching_hooks(event.type) do
  if passes_conditions?(hook, event) and not in_cooldown?(hook) do
    Task.start(fn -> execute_and_log(hook, event) end)
  end
end
```

### Stream start/end triggers

`StreamManager` sends lifecycle events to `HookExecutor` via Registry lookup:

```elixir
HookExecutor.trigger_lifecycle_event(user_id, :stream_start, %{...})
HookExecutor.trigger_lifecycle_event(user_id, :stream_end, %{...})
```

Both processes are siblings under the same `UserSupervisor`, both discoverable via Registry.

---

## Action Executor Modules

- `HookActions.Webhook` — HTTP POST/GET with template body
- `HookActions.ChatMessage` — `StreamManager.send_chat_message/2`
- `HookActions.DiscordMessage` — POST to Discord webhook URL

Template interpolation: `{{username}}`, `{{message}}`, `{{amount}}`, `{{currency}}`, `{{platform}}`

---

## Integration Touchpoints

1. **`PresenceManager`** — start/stop `HookExecutor` alongside `StreamManager`
2. **`StreamManager`** — send `:stream_start`/`:stream_end` to `HookExecutor` via Registry
3. **`RegistryHelpers`** — register `:hook_executor`
4. **`SyncController` + `router.ex`** — Electric shape endpoints for hooks + logs
5. **`Streampai.Stream` domain** — add both resources

---

## Implementation Order

### Phase 1: Data model

1. `StreamHook` Ash resource with CRUD actions
2. `StreamHookLog` Ash resource
3. Add to Stream domain
4. `mix ash.codegen add_stream_hooks`
5. Electric shape endpoints

### Phase 2: Execution engine

1. Template interpolation module
2. Action executors: `Webhook`, `ChatMessage`, `DiscordMessage`
3. `HookExecutor` GenServer
4. Wire into `PresenceManager` + `StreamManager`

### Phase 3: ChatBotServer refactor (separate)

Switch events from Shape → Client.stream
