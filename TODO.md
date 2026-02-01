# Orphaned Live Output Cleanup

## Problem

All Cloudflare live output cleanup is event-driven (stream stop, process terminate, before stream start). If cleanup fails (SIGKILL, network partition, deploy during active stream, bug), outputs can remain on Cloudflare indefinitely — meaning a streamer's content keeps going to Twitch/YouTube without them knowing.

## Current Cleanup Points

- `OutputManager.cleanup_all/1` — lists all outputs for a live input, deletes each
- Called from: `StopStream.execute/1`, `StreamManager.terminate/3`, before `StartStream.execute/1`
- Per-platform: `PlatformHelpers.cleanup_cloudflare_output/3`
- Auto-stop: 10s encoder disconnect timeout
- PresenceManager: terminates StreamManager 5s after user leaves

## Plan: Periodic Oban Sweep Job

### New file: `lib/streampai/jobs/cleanup_orphaned_outputs_job.ex`

Oban.Worker on `maintenance` queue (concurrency 1).

### Environment Isolation

All environments (dev, staging, prod, worktrees) share the **same Cloudflare account**. Inputs already have `"env"` in their `meta` field (set in `APIClient.create_live_input/2`), and input names follow the pattern `"#{env()}##{user_id}"`.

The sweep job **must only touch inputs belonging to its own environment**:
- Filter `list_live_inputs()` results by `meta["env"] == Application.get_env(:streampai, :env)`
- Skip any input without an `env` meta field (legacy or manually created)
- This prevents dev from deleting prod outputs and vice versa

### API Call Budget

`list_live_inputs()` returns ALL inputs across the account (no server-side env filter). With N users, worst case:

| Step | Calls | Notes |
|------|-------|-------|
| List all inputs | 1 | Returns all inputs for the account |
| Filter by env + has outputs | 0 | Client-side filter, no API call |
| List outputs per orphaned input | M | Only for inputs with no active StreamManager |
| Delete each orphaned output | M * P | P = platforms per input (typically 1-3) |

**Normal case (no orphans):** 1 API call total — just the list. Inputs with active StreamManagers are skipped without any further API calls.

**Worst case (all orphaned):** 1 + M + M*P calls. But this should be extremely rare and self-healing (first run cleans them, subsequent runs are back to 1 call).

**Optimization**: Don't call `list_live_outputs` if the input itself reports 0 outputs (Cloudflare may include output count in the input listing — verify with `include_counts: true`). If not available, we'd need to call `list_live_outputs` for each candidate, which adds M calls. Still acceptable at 5min intervals.

**Recommendation**: Run every 5 minutes. 1 API call per run in steady state is fine. Could reduce to every 15 minutes if Cloudflare rate limits become a concern.

### Mapping Live Inputs to Users

Inputs already store `user_id` in their `meta` field (set in `APIClient.create_live_input/2`):
```elixir
"meta" => %{
  "user_id" => user_id,
  "name" => "#{env()}##{user_id}",
  "env" => env()
}
```

No DB query needed — just read `meta["user_id"]` from the Cloudflare response.

### Implementation

```
perform/1:
  {:ok, inputs, _total} = APIClient.list_live_inputs()
  current_env = Application.get_env(:streampai, :env)

  # Only process inputs from our environment
  our_inputs = Enum.filter(inputs, fn input ->
    get_in(input, ["meta", "env"]) == to_string(current_env)
  end)

  # Get all active StreamManager user_ids from Registry
  active_user_ids = get_active_stream_manager_user_ids()

  for input <- our_inputs do
    user_id = get_in(input, ["meta", "user_id"])
    input_id = input["uid"]

    # Skip if user has an active StreamManager (legitimate streaming)
    if user_id not in active_user_ids do
      # Check if this input has any outputs
      case APIClient.list_live_outputs(input_id) do
        {:ok, outputs} when outputs != [] ->
          for output <- outputs do
            APIClient.delete_live_output(input_id, output["uid"])
          end
          Logger.warning("Cleaned #{length(outputs)} orphaned outputs for user #{user_id}, input #{input_id}")

        _ -> :ok  # No outputs, nothing to clean
      end
    end
  end
```

### Implementation Steps

1. Create `CleanupOrphanedOutputsJob` Oban worker in `lib/streampai/jobs/`
2. Add helper to enumerate active StreamManager user_ids from Registry
3. Add to crontab in `config/config.exs`: `{"*/5 * * * *", Streampai.Jobs.CleanupOrphanedOutputsJob}`
4. Add `unique` option to prevent overlapping runs
5. Add tests with mocked APIClient (already have `Streampai.Cloudflare.MockAPIClient`)

### Edge Cases

- **Deploy rolling restart**: StreamManagers restart during deploy. The 5min interval provides natural buffer since processes restart in seconds. Could add additional safety: check if livestream DB record has `ended_at` set before deleting outputs.
- **Race condition**: StreamManager starts between our Registry check and output deletion. Mitigate by checking Registry again before deleting, or accept that `StartStream` already calls `cleanup_all` which handles this.
- **Rate limiting**: Steady state is 1 API call. Even worst case is bounded by number of users in this environment. Not a concern.
- **Concurrent cleanup**: Use Oban `unique: [period: 300]` to prevent overlapping runs.
- **Input without env meta**: Legacy inputs — skip them, don't touch what we can't identify.
- **Input with env but no user_id**: Skip — can't determine ownership.

### Optional Enhancements (Later)

- Send in-app notification to user when orphaned outputs are cleaned up
- Dashboard indicator showing "outputs active" even when not streaming
- Metric/counter for orphaned output cleanup events (for monitoring)
- Add `include_counts: true` to skip inputs with 0 outputs without a second API call (verify Cloudflare supports this)
