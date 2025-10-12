# Error Logging Best Practices

This document describes how to properly log errors when showing them to users.

## Why Log User-Facing Errors?

Whenever a user sees an error message, we should log the underlying error details to help with debugging. This ensures we can investigate issues even when users only report "I saw an error".

## Available Helpers

### `flash_error_with_log/3` - The Recommended Way

Use this instead of `flash_error/2` whenever you're showing an error from an operation:

```elixir
# Before (no logging)
{:noreply, flash_error(socket, "Failed to save preferences")}

# After (with automatic logging)
{:noreply, flash_error_with_log(socket, "Failed to save preferences", changeset)}
```

With additional context:

```elixir
{:noreply,
  flash_error_with_log(
    socket,
    "Failed to save preferences",
    changeset,
    user_id: user.id,
    action: :update_preferences
  )}
```

This will log:
```
[error] Failed to save preferences [user_id="123", action=:update_preferences], error: %Ash.Changeset{...}
```

### `log_error/2` - The dbg-like Helper

Use this when you want to log an error without showing a flash message, similar to how `dbg` works:

```elixir
# Log and continue
error
|> log_error("Database query failed")
|> handle_error()

# With context
log_error("User action failed", error, user_id: user.id, action: :update)
```

Returns the error unchanged so it can be used in pipelines.

### When to Use Which Helper

**Use `flash_error_with_log/3`:**
- When showing an error message to the user
- In LiveView event handlers
- When you have both a user-friendly message and the underlying error

**Use `log_error/2`:**
- When you want to log an error but not show a flash message
- In pipeline operations where you want to log and continue
- For debugging complex error flows

**Use regular `flash_error/2`:**
- Only when you're showing a static error message without an underlying error object
- For validation messages that don't need detailed logging

## Examples from the Codebase

### Good: Logging with Context

```elixir
def handle_event("update_donation_preferences", %{"preferences" => params}, socket) do
  # ... setup code ...

  case UserPreferences.update_donation_settings(preferences, min, max, currency) do
    {:ok, updated} ->
      {:noreply, flash_success(socket, "Preferences updated!")}

    {:error, changeset} ->
      error_message = extract_error_message(changeset)

      {:noreply,
        flash_error_with_log(socket, error_message, changeset,
          user_id: current_user.id,
          min_amount: min,
          max_amount: max
        )}
  end
end
```

### Good: Pipeline Logging

```elixir
def complex_operation(data) do
  data
  |> validate_data()
  |> log_error("Validation failed")
  |> transform_data()
  |> log_error("Transform failed")
  |> save_to_db()
end
```

### Bad: No Logging

```elixir
# ❌ Don't do this - user sees error but nothing in logs
{:error, changeset} ->
  {:noreply, flash_error(socket, "Failed to update")}
```

### Bad: Manual Logging

```elixir
# ❌ Don't do this - use the helper instead
{:error, changeset} ->
  Logger.error("Failed to update: #{inspect(changeset)}")
  {:noreply, flash_error(socket, "Failed to update")}
```

## Migration Guide

To update existing code:

1. Find all uses of `flash_error/2` in event handlers
2. Check if they're showing errors from operations
3. Replace with `flash_error_with_log/3` and pass the error + context

Example migration:

```diff
  def handle_event("save", params, socket) do
    case save_data(params) do
      {:ok, data} -> {:noreply, flash_success(socket, "Saved!")}
-     {:error, error} -> {:noreply, flash_error(socket, "Failed to save")}
+     {:error, error} ->
+       {:noreply, flash_error_with_log(socket, "Failed to save", error)}
    end
  end
```

## Testing

When testing, you can assert that errors are properly logged:

```elixir
test "logs error when save fails" do
  log = capture_log(fn ->
    {:noreply, _socket} = handle_event("save", %{}, socket)
  end)

  assert log =~ "Failed to save"
  assert log =~ "error:"
end
```
