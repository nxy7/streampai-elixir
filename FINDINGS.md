# Streampai Audit Findings

Comprehensive security and code quality audit results. Check off items as they are resolved.

**Last updated**: 2026-03-08
**Total findings**: 60+

---

## Table of Contents

- [Critical](#critical)
  - [Security](#critical-security)
  - [Backend](#critical-backend)
- [High](#high)
  - [Security](#high-security)
  - [Backend](#high-backend)
  - [Frontend](#high-frontend)
- [Medium](#medium)
  - [Security](#medium-security)
  - [Backend](#medium-backend)
  - [Frontend](#medium-frontend)
- [Low](#low)

---

## Critical

### Critical — Security

- [ ] **S1: OAuth tokens stored plaintext**
  - **File**: `lib/streampai/integrations/resources/streaming_account.ex:210-218`
  - **Detail**: Fields are marked `sensitive? true` which suppresses log output only. No encryption library exists in the project. A database breach exposes Twitch, YouTube, Discord, and PayPal OAuth tokens in full, enabling complete account takeover on all connected platforms.
  - **Fix**: Encrypt token fields at rest using `cloak_ecto` or equivalent before writing to the database.

- [ ] **S2: SSRF via webhook URLs**
  - **File**: `lib/streampai/stream/hook_actions/webhook.ex:40-47`
  - **Detail**: Outbound HTTP requests are sent to any user-supplied URL with no allowlist or blocklist. An attacker can target AWS instance metadata (`http://169.254.169.254`), internal services, or other RFC-1918 addresses.
  - **Fix**: Validate URLs against an allowlist of permitted hosts/schemes and block private IP ranges before making any outbound request.

- [ ] **S3: Atom exhaustion DoS**
  - **File**: `lib/streampai/stream/changes/atomize_config_keys.ex:26-28`
  - **Detail**: `String.to_atom/1` is called on user-supplied widget config keys. Atoms are never garbage-collected in the BEAM. Approximately 1,048,576 unique atoms will crash the VM. A single authenticated user can trigger this with a script.
  - **Fix**: Replace with `String.to_existing_atom/1` (wrapped in a `rescue`) or use a known-key allowlist map.

---

### Critical — Backend

- [ ] **B1: Migration failures silently ignored**
  - **File**: `lib/streampai/application.ex:101-112`
  - **Detail**: The `rescue` block around migration execution returns `:ok` on failure. The application starts successfully with a potentially broken or outdated schema, causing silent data corruption or runtime errors that are difficult to trace.
  - **Fix**: Remove the rescue or re-raise after logging. Migration failures should halt application startup.

- [ ] **B2: `StreamManager.init` blocks the supervisor**
  - **File**: `lib/streampai/stream/stream_manager.ex:176-177`
  - **Detail**: `StreamServices.start_link` is called synchronously inside `init/1`. If this call is slow or fails, it blocks the entire supervisor tree during startup, delaying all other children and potentially causing cascading timeout failures.
  - **Fix**: Move the call to a `handle_continue(:start_services, state)` callback so `init/1` returns immediately.

- [ ] **B3: `BotManager` does not supervise workers**
  - **File**: `lib/streampai/stream/bot_manager.ex:181-191`
  - **Detail**: Bot workers are started with `Process.monitor` rather than under a `DynamicSupervisor`. When a worker crashes, the monitor delivers a `DOWN` message but no restart logic exists. Crashed bots are permanently lost until the next manual intervention.
  - **Fix**: Start bot workers under the existing `DynamicSupervisor` and let OTP handle restarts.

- [ ] **B4: Zero tests for stream lifecycle and Ash policies**
  - **Detail**: No test coverage exists for stream start/stop lifecycle transitions or for any Ash policy (authorization rules). Policy regressions and lifecycle bugs will not be caught before production.
  - **Fix**: Add ExUnit tests for `stream_manager.ex` state machine transitions and property-based or example-based tests for each Ash policy module.

---

## High

### High — Security

- [ ] **H-S1: Unauthenticated Electric Sync endpoints**
  - **File**: `lib/streampai_web/router.ex:156-182`
  - **Detail**: The `/shapes/*` routes that serve stream events, livestreams, viewers, and per-user data are mounted without any authentication plug. Any unauthenticated request can subscribe to these real-time data streams.
  - **Fix**: Add authentication and authorization checks (scoped to the requesting user) to all Electric shape endpoints.

- [ ] **H-S2: Open redirect**
  - **File**: `lib/streampai_web/controllers/auth_controller.ex:17-21`
  - **Detail**: The fallback clause `url when is_binary(url) -> url` allows a caller to supply an arbitrary redirect destination. An attacker can craft a login link that redirects users to a malicious external site after authentication.
  - **Fix**: Validate the redirect URL against a list of permitted paths or origins before redirecting.

- [ ] **H-S3: Hardcoded signing salt committed to git**
  - **File**: `lib/streampai_web/endpoint.ex:10`
  - **Detail**: `"streampai_session_salt"` is a static string committed to the repository. Anyone with repository access can forge session cookies.
  - **Fix**: Move the salt to an environment variable or application secret loaded at runtime.

- [ ] **H-S4: `EEx.eval_string` with user-supplied email**
  - **File**: `lib/streampai_web/plugs/auth_plug.ex:20-25`
  - **Detail**: Passing a user-controlled value (email) into `EEx.eval_string` enables server-side template injection. A carefully crafted email address can execute arbitrary Elixir expressions on the server.
  - **Fix**: Do not use `EEx.eval_string` with any user-supplied data. Use static templates with explicit variable binding instead.

- [ ] **H-S5: `AshAi.Mcp.Dev` not restricted to `:dev` environment**
  - **File**: `mix.exs`
  - **Detail**: The `AshAi.Mcp.Dev` dependency or plug, which exposes resource inspection tooling, is not guarded by `only: :dev`. If included in production builds, it may expose internal resource metadata.
  - **Fix**: Add `only: :dev` to the dependency declaration and ensure the corresponding router scope is also dev-only.

- [ ] **H-S6: IP spoofing via unverified forwarded headers**
  - **File**: `lib/streampai_web/helpers/conn_helpers.ex:11-30`
  - **Detail**: `CF-Connecting-IP` and `X-Real-IP` headers are trusted without verifying that the request originated from a known Cloudflare IP range. An attacker bypassing Cloudflare can spoof these headers to circumvent IP-based rate limiting or geo-restrictions.
  - **Fix**: Validate the upstream request IP against Cloudflare's published IP ranges before trusting forwarded headers.

---

### High — Backend

- [ ] **H-B1: N+1 queries in calculated fields**
  - **Detail**: The `Platforms` calculation, `HoursStreamedLast30Days`, and `MessagesAmount` all issue per-record queries or load entire event tables into memory to perform counts. Under load, these generate excessive database round-trips.
  - **Fix**: Rewrite as aggregates on the Ash resource or push the computation into a single SQL query using window functions or subqueries.

- [x] **H-B2: 44 occurrences of `authorize?: false`**
  - **Detail**: Throughout the codebase, `authorize?: false` is used instead of passing `actor: SystemActor.system()`. This bypasses the entire Ash policy stack, meaning authorization regressions in system-initiated actions are invisible.
  - **Fix**: Replace all `authorize?: false` calls with explicit system actor usage so policies remain exercised and auditable.

- [ ] **H-B3: 12 unsupervised `Task.start` calls**
  - **Detail**: Fire-and-forget tasks are spawned with `Task.start` rather than `Task.Supervisor.start_child`. Crashes in these tasks are silently lost. A `TaskSupervisor` is already registered in the supervision tree but is not used.
  - **Fix**: Replace all `Task.start` calls with `Task.Supervisor.start_child(Streampai.TaskSupervisor, fn -> ... end)`.

- [ ] **H-B4: `PresenceManager` dual state inconsistency**
  - **Detail**: `PresenceManager` maintains both a `managers` map in its GenServer state and a Registry. These two sources of truth can diverge during concurrent updates, causing incorrect presence reporting.
  - **Fix**: Consolidate to a single source of truth. Use the Registry as the authoritative store and derive the map from it, or vice versa.

- [ ] **H-B5: Bang functions in token refresh GenServer callbacks**
  - **File**: `lib/streampai/integrations/twitch_manager.ex:623-641`
  - **Detail**: `Ash.read_one!` and `Ash.update!` are called inside GenServer callbacks. A database failure raises an exception, crashes the GenServer, and loses the in-progress token refresh. Tokens may become permanently invalid.
  - **Fix**: Use non-bang variants, match on `{:ok, _}` / `{:error, _}`, and handle errors gracefully without crashing the process.

- [ ] **H-B6: `StopStream.execute` bare pattern match crashes `gen_statem`**
  - **File**: `lib/streampai/stream/stream_manager.ex:271,451`
  - **Detail**: The result of `StopStream.execute` is matched without an error clause. If the action returns an error tuple, the `gen_statem` crashes, leaving stream state permanently stuck.
  - **Fix**: Add an error clause that transitions to a safe fallback state and logs the failure.

- [ ] **H-B7: Discord HTTP logic duplicated between `BotManager` and `BotWorker`**
  - **Detail**: Identical HTTP client code for Discord API calls exists in both `bot_manager.ex` and `bot_worker.ex`. Changes to one copy will drift from the other.
  - **Fix**: Extract the shared Discord HTTP logic into a dedicated `Discord.Client` module and call it from both locations.

---

### High — Frontend

- [x] **H-F1: Memory leak — `onMount` cleanup return value ignored**
  - **File**: `frontend/src/lib/widget-registry.tsx:608-639,733-764`
  - **Detail**: `onMount` in SolidJS does not use the return value for cleanup. Returning a cleanup function from `onMount` has no effect; the function is never called. `setInterval` handles created inside these callbacks run indefinitely.
  - **Fix**: Use `onCleanup(() => clearInterval(id))` explicitly alongside `onMount`, or use `createEffect` which does honor cleanup return values.

- [ ] **H-F2: Missing `ErrorBoundary` on critical routes**
  - **Detail**: The stream, analytics, scenes, viewers, and tools routes have no `<ErrorBoundary>` wrapper. Any unhandled throw — including a failed network request or null dereference — produces a white screen with no user-facing error message.
  - **Fix**: Wrap each route's top-level component in an `<ErrorBoundary fallback={...}>` with a meaningful error UI.

- [ ] **H-F3: Two separate widget registries with diverging defaults**
  - **File**: `frontend/src/lib/widget-registry.tsx` and `frontend/src/components/widgetRegistry.tsx`
  - **Detail**: Two independent registry implementations exist with different default configurations. Any change to defaults must be applied to both files manually. They will inevitably drift.
  - **Fix**: Delete one registry and migrate all consumers to the surviving one.

- [x] **H-F4: Large libraries eagerly imported — no lazy loading**
  - **Detail**: `apexcharts` (~1.2 MB) and `hls.js` (~350 KB) are imported at module load time. All users pay the full parse and execution cost even if they never visit a chart or watch a stream.
  - **Fix**: Use dynamic `import()` inside the components that need these libraries, or apply route-level code splitting.

- [ ] **H-F5: `createCollectionCache` created inside hook body — Electric subscription leak**
  - **File**: `frontend/src/lib/useElectric.ts:394,412,433`
  - **Detail**: A new `Map` cache is created on every call to `useElectric`. Each call registers a new Electric subscription that is never cleaned up, causing memory and connection growth proportional to render count.
  - **Fix**: Hoist `createCollectionCache` calls outside the hook or use a stable module-level store with ref counting for cleanup.

---

## Medium

### Medium — Security

- [ ] **M-S1: ETS rate limiter race condition**
  - **Detail**: The rate limiter performs a non-atomic read-modify-write against ETS. Two concurrent requests can both read the same counter value before either increments it, allowing both through.
  - **Fix**: Use `:ets.update_counter/4` for atomic increment-and-read operations.

- [ ] **M-S2: Sign-out redirects to arbitrary `Referer` origin**
  - **Detail**: The sign-out handler uses the `Referer` header to determine where to send the user after logout. An attacker can set a crafted `Referer` header to redirect users to an external site.
  - **Fix**: Ignore the `Referer` header on sign-out. Always redirect to a fixed internal path.

- [ ] **M-S3: File upload content-type not validated server-side**
  - **Detail**: Uploaded files are accepted based on the client-supplied `Content-Type` header without server-side inspection of actual file contents. Malicious files can be uploaded with a benign MIME type.
  - **Fix**: Use magic-byte inspection (e.g., `file_type` library) to validate actual file content regardless of the declared content type.

- [ ] **M-S4: WebSocket channel topic ignores user ownership**
  - **Detail**: Channel join allows `_user_id` to be provided by the client without verifying it matches the authenticated session. A client can subscribe to another user's channel topic.
  - **Fix**: Derive the user ID from the verified socket assigns rather than from the client-supplied topic parameter.

- [ ] **M-S5: Paddle webhook has no timestamp replay protection**
  - **Detail**: Incoming Paddle webhook requests are signature-verified but not checked for timestamp freshness. A valid webhook payload captured earlier can be replayed indefinitely.
  - **Fix**: Reject webhooks with a timestamp older than a configurable threshold (e.g., 5 minutes).

- [ ] **M-S6: Production IP address hardcoded in source**
  - **Detail**: A production IP (`194.9.78.14`) is hardcoded in source files. This unnecessarily exposes infrastructure topology in the public repository.
  - **Fix**: Move all environment-specific addresses to configuration or environment variables.

---

### Medium — Backend

- [ ] **M-B1: `CurrentStreamData` policies use `authorize_if always()`**
  - **Detail**: Using `authorize_if always()` as a policy means any authenticated user can update any other user's current stream data. There is no ownership check.
  - **Fix**: Replace with `authorize_if relates_to_actor_via(:user)` or an equivalent ownership-scoped policy.

- [ ] **M-B2: `StreamHook.create` uses `accept [:*]`**
  - **Detail**: Accepting all attributes on create means any future sensitive attributes added to the resource will be automatically writable by external callers without an explicit code change.
  - **Fix**: Replace with an explicit `accept [...]` list of permitted attributes.

- [ ] **M-B3: `EventPersister` flush interval is 50ms**
  - **Detail**: The persister wakes up 20 times per second regardless of whether there are any events to flush. This creates unnecessary CPU and database overhead when the system is idle.
  - **Fix**: Increase the interval (e.g., 500ms–1000ms) or switch to a demand-driven flush triggered by incoming events.

- [ ] **M-B4: `get_or_create_for_user` pattern repeated 12+ times**
  - **Detail**: The same get-or-create logic is duplicated across multiple `CurrentStreamData` action handlers. Any bug fix or behavior change must be applied in all 12+ locations.
  - **Fix**: Extract into a single shared function or Ash action and call it from all sites.

- [ ] **M-B5: `parse_number/1` duplicated in 3 modules**
  - **Detail**: Identical number-parsing helper logic exists in three separate modules.
  - **Fix**: Move to a shared utility module (e.g., `Streampai.Helpers`) and import from there.

- [ ] **M-B6: Manual uniqueness check races with DB identity constraint**
  - **Detail**: Application-level uniqueness checks are performed before insert, but the window between check and insert allows duplicate records to be created under concurrent load. The database constraint then raises an unhandled error.
  - **Fix**: Remove the application-level check and handle the database constraint error gracefully at the call site.

- [ ] **M-B7: `TwitchManager` reads env vars directly via `System.get_env`**
  - **Detail**: Environment variables are read directly with `System.get_env` rather than through `Application.get_env` / app config. This bypasses the standard configuration system and makes the values invisible to `Config.Provider` and release tooling.
  - **Fix**: Move all env var access to `config/runtime.exs` and read values through `Application.get_env`.

---

### Medium — Frontend

- [ ] **M-F1: `toSnakeCase` / `mapConfig` copy-pasted into 3 widget routes**
  - **Detail**: Utility functions are duplicated across three widget route files despite `createWidgetRoute.tsx` existing as a shared abstraction. Fixes applied to one copy will not propagate.
  - **Fix**: Move shared utilities into `createWidgetRoute.tsx` and remove the duplicates.

- [ ] **M-F2: Double `useRecentUserStreamEvents` call in dashboard**
  - **Detail**: The dashboard component calls `useRecentUserStreamEvents` twice, resulting in the same data being fetched and subscribed to via two separate Electric shapes.
  - **Fix**: Call the hook once, store the result in a variable, and pass it to both consumers.

- [ ] **M-F3: `setInterval` in component body outside `onMount`**
  - **File**: `frontend/src/components/TimersPanel.tsx`
  - **Detail**: An interval is created directly in the component body on every render rather than inside `onMount`. This creates a new interval on every reactive update.
  - **Fix**: Move the `setInterval` call inside `onMount` and pair it with `onCleanup(() => clearInterval(id))`.

- [ ] **M-F4: `setTimeout` inside `createEffect` without cleanup**
  - **Detail**: Multiple `createEffect` callbacks create `setTimeout` calls without registering a corresponding `onCleanup`. When the effect re-runs, stale timeouts accumulate.
  - **Fix**: Add `onCleanup(() => clearTimeout(id))` inside each `createEffect` that creates a timeout.

- [ ] **M-F5: `console.error` swallowed instead of surfacing errors to users**
  - **Detail**: At least 10 locations catch errors and call `console.error` without displaying any feedback to the user. Failures are invisible in production.
  - **Fix**: Add user-facing error notifications (toast, inline message, or error boundary fallback) for all caught errors in user-initiated flows.

- [ ] **M-F6: `as any` casts on RPC SDK fields in 5 files**
  - **Detail**: Five files work around narrow SDK types using `as any`, which disables type checking for those fields. Type errors in those areas will not be caught at compile time.
  - **Fix**: Widen the SDK types in `frontend/src/sdk/ash_rpc.ts` (via `mix ash.codegen` if schema-driven) or add proper type assertions.

- [ ] **M-F7: 6 dead exports in `electric.ts` / `useElectric.ts` creating shape subscriptions**
  - **File**: `frontend/src/lib/electric.ts`, `frontend/src/lib/useElectric.ts`
  - **Detail**: Exported functions that are never imported still register Electric shape subscriptions when the module loads. These are wasted persistent connections.
  - **Fix**: Remove unused exports. Verify with a dead-code tool (e.g., `knip`) before deleting.

- [ ] **M-F8: No route-level code splitting**
  - **Detail**: All routes are bundled into a single chunk. Initial load size grows with every new route added.
  - **Fix**: Apply `lazy(() => import(...))` at the route level using SolidJS Start's built-in lazy routing support.

---

## Low

- [ ] **L1: No body size limit on `Plug.Parsers`**
  - **Detail**: JSON request body parsing uses the default unlimited size. A large payload can consume significant memory per connection.
  - **Fix**: Set an explicit `:length` limit on `Plug.Parsers` (e.g., `length: 4_000_000`).

- [ ] **L2: CSRF cookie lifetime is 1 year**
  - **Detail**: A one-year CSRF cookie lifetime is longer than necessary and increases the window for token theft.
  - **Fix**: Reduce cookie max-age to match the session lifetime or use session-scoped (non-persistent) CSRF tokens.

- [ ] **L3: Dev PostgreSQL credentials hardcoded in `runtime.exs`**
  - **File**: `config/runtime.exs`
  - **Detail**: `postgres:postgres` credentials are hardcoded. While acceptable for development, these should use environment variables to avoid being committed to shared repositories or reused in other environments.
  - **Fix**: Read from `DATABASE_URL` or individual env vars, falling back to the dev defaults only when explicitly in `:dev`.

- [ ] **L4: Email domain blocklist has only 3 entries**
  - **Detail**: The disposable email domain blocklist is too small to be meaningful as a security control.
  - **Fix**: Either remove the blocklist (security through obscurity is not effective here) or integrate a maintained third-party blocklist.

- [ ] **L5: `Counter.tsx` SolidJS starter template still in codebase**
  - **Detail**: The default SolidJS counter component from the project template remains in the codebase and is not used.
  - **Fix**: Delete the file.

- [ ] **L6: Icon-only buttons use `title` instead of `aria-label`**
  - **Detail**: Dashboard icon buttons rely on the `title` attribute for accessible names. `title` is not reliably announced by screen readers and does not satisfy WCAG 2.1 Success Criterion 4.1.2.
  - **Fix**: Replace `title` with `aria-label` on all icon-only interactive elements.

- [ ] **L7: Canvas drag-and-drop has no keyboard alternative**
  - **Detail**: The scene canvas drag-and-drop interaction is not operable via keyboard. This excludes keyboard-only users and fails WCAG 2.1 Success Criterion 2.1.1.
  - **Fix**: Implement a keyboard-accessible alternative for repositioning canvas elements (e.g., arrow-key movement on focused items).

- [ ] **L8: `show_sensitive_data_on_connection_error: true` in base config**
  - **File**: `config/config.exs`
  - **Detail**: This Ecto setting prints sensitive database connection parameters (including credentials) in error output. It is set in the base config, which is inherited by production unless explicitly overridden.
  - **Fix**: Set this to `false` in `config/config.exs`. Only enable it locally via `config/dev.exs` if needed.

---

## Summary

| Severity | Count | Fixed |
|----------|-------|-------|
| Critical | 7 | 0 |
| High | 14 | 0 |
| Medium | 15 | 0 |
| Low | 8 | 0 |
| **Total** | **44** | **0** |
