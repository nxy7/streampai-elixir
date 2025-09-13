# Inline Snapshot Testing Guide

This project uses **Mneme** for inline snapshot testing, which helps catch unintended changes in your application's output by automatically updating expected values directly in your test code.

## What is Inline Snapshot Testing?

Inline snapshot testing captures the output of your code and automatically writes expected values **directly into your test files** - no external snapshot files needed!

**Key Differences from External Snapshots:**
- ✅ **Inline snapshots** - Expected values written directly in test code  
- ✅ **No external files** - Everything lives in your test files
- ✅ **Interactive updates** - Mneme prompts you when values change
- ✅ **Auto-formatting** - Uses your project's code formatter

**Benefits:**
- ✅ **Catch regressions** - Detect unexpected changes in output
- ✅ **Fast feedback** - Quickly identify when components change  
- ✅ **Living documentation** - Expected values visible in test code
- ✅ **Comprehensive testing** - Test entire component/API outputs
- ✅ **No file management** - No external snapshot files to track

## Setup

Mneme is already configured in this project:

```elixir
# mix.exs
{:mneme, "~> 0.10.1", only: [:test, :dev]}
```

## Writing Inline Snapshot Tests

### Basic Usage

1. **Add `use Mneme`** to your test module
2. **Use `auto_assert/1`** to create inline assertions

```elixir
defmodule MyAppWeb.ComponentTest do
  use MyAppWeb.ConnCase
  use Mneme
  
  test "renders component correctly" do
    html = render_component(&my_component/1, %{name: "John"})
    auto_assert(html) # Expected value will be written here automatically!
  end
end
```

**After first run, your test becomes:**
```elixir
test "renders component correctly" do
  html = render_component(&my_component/1, %{name: "John"})
  auto_assert(html == "<div>Hello John!</div>") # Automatically written!
end
```

### Component Testing

```elixir
defmodule StreampaiWeb.Components.DashboardLayoutTest do
  use StreampaiWeb.ConnCase
  use Mneme
  import Phoenix.LiveViewTest
  import StreampaiWeb.Components.DashboardLayout

  test "renders basic dashboard layout" do
    assigns = %{
      current_user: %{id: "123", email: "test@example.com"},
      current_page: "dashboard",
      page_title: "Test Dashboard"
    }

    html = render_component(&dashboard_layout/1, assigns)
    auto_assert(html) # Full HTML will be written inline
  end
end
```

### API Response Testing

```elixir
defmodule StreampaiWeb.ApiTest do
  use StreampaiWeb.ConnCase  
  use Mneme
  
  test "GET /api/users returns user list" do
    response = 
      conn
      |> get("/api/users")
      |> json_response(200)
    
    # Remove dynamic fields for consistent snapshots
    stable_response = Map.delete(response, "timestamp")
    auto_assert(stable_response) # JSON structure written inline
  end
end
```

### Data Structure Testing

```elixir
test "user resource has expected attributes" do
  attributes = Ash.Resource.Info.attributes(User)
  
  attribute_info = 
    attributes
    |> Enum.map(&%{name: &1.name, type: &1.type})
    |> Enum.sort_by(& &1.name)
    
  auto_assert(attribute_info) # Full attribute structure inline
end
```

## Running Tests

### Interactive Mode (Recommended)
```bash
mix test                    # Run normally - Mneme will prompt for updates
mix test --interactive      # Explicit interactive mode
```

### Run in CI/Non-Interactive Mode
```bash
CI=true mix test           # Will fail if snapshots don't match
```

### Generate Initial Snapshots
```bash
mix test                   # First run - Mneme prompts to create snapshots
```

### Watch Mode
```bash
mix mneme.watch           # Auto-run tests when files change
```

### Run Single Test  
```bash
mix test test/path/to/test.exs:10  # Line number
```

## How Mneme Works

### First Run
1. Test runs with `auto_assert(value)`
2. Mneme prompts: **"Accept this assertion?"** 
3. You type `y` to accept
4. Mneme writes: `auto_assert(value == expected_result)`

### Subsequent Runs
1. Test compares `value` with `expected_result`
2. If different, Mneme prompts with a diff
3. Accept (`y`) to update or reject (`n`) to fix code

### Example Interactive Session
```bash
$ mix test test/example_test.exs

1) test example assertion
   Accept this assertion? [Yn] y

   auto_assert(%{count: 5, status: :ok})

.

Finished in 0.1 seconds
1 test, 0 failures
```

**No external files** - everything is in your test code!

## Best Practices

### ✅ Do

- **Review inline assertions carefully** before accepting
- **Clean up data** - Remove timestamps, UUIDs, or random values before asserting
- **Use descriptive test names** - They become part of your code documentation
- **Test critical components** - Focus on important UI components and APIs  
- **Accept updates intentionally** when making legitimate changes
- **Commit test changes** - Inline assertions are part of your code

### ❌ Don't  

- **Auto-approve all changes** without review
- **Assert non-deterministic data** (timestamps, UUIDs) without cleaning
- **Test implementation details** - Focus on outputs, not internals
- **Assert overly large outputs** without necessity
- **Ignore assertion failures** - They indicate real changes
- **Skip the interactive prompts** - They're your safety net

## Handling Changes

### Expected Changes (Features/Fixes)
1. Run `mix test` - Mneme shows you the diff
2. Review the changes carefully
3. Type `y` to accept if the change is intentional
4. Commit both code and updated test changes

### Unexpected Changes (Regressions)  
1. Run `mix test` - Mneme shows you what changed
2. Type `n` to reject the change
3. Fix the underlying issue in your code
4. Run tests again to verify fix

### Cleaning Dynamic Data

```elixir
test "api response structure" do
  response = 
    conn
    |> get("/api/data")
    |> json_response(200)
    
  # Remove dynamic fields before asserting  
  cleaned_response = 
    response
    |> Map.delete("timestamp")
    |> Map.delete("request_id")
    
  auto_assert(cleaned_response)
end
```

## Integration with CI/CD

Inline snapshot tests work great in CI/CD:

```bash
# In your CI pipeline
mix deps.get
CI=true mix test  # Will fail if assertions don't match
```

**CI automatically detected** - Mneme runs in non-interactive mode when `CI=true` is set.

## Example Tests in This Project

- **`test/streampai_web/components/dashboard_layout_test.exs`** - Component inline snapshot testing
- **`test/streampai_web/controllers/echo_controller_test.exs`** - API response inline snapshot testing  
- **`test/streampai/accounts/user_test.exs`** - Data structure inline snapshot testing
- **`test/streampai_web/live/dashboard_live_test.exs`** - LiveView inline snapshot testing

## Troubleshooting

### Test Fails with "No pattern present"
- **First run**: Run `mix test` interactively and accept the assertion with `y`
- **Missing assertion**: Make sure you have `auto_assert(value)` in your test

### Test Fails with "Mneme is running in non-interactive mode"
- **Run interactively**: Use `mix test` instead of `CI=true mix test`
- **Add pattern manually**: You can write the expected pattern yourself if needed

### Assertion Pattern Too Large
- **Clean dynamic data**: Remove timestamps, IDs, etc. before asserting
- **Focus testing**: Assert specific parts of the output instead of everything  
- **Structured assertions**: Test maps/structs with just the important fields

### Mneme Won't Update Assertions
- **Check file permissions**: Ensure test files are writable
- **Verify syntax**: Make sure your test syntax is correct
- **Interactive mode**: Ensure you're not in CI mode (`CI=true`)

## Snapshot Testing vs. Traditional Testing

| Traditional Testing | Snapshot Testing |
|-------------------|------------------|
| Specify exact expected values | Captures entire output automatically |
| Manually update assertions | Updates with single command |  
| Tests specific properties | Tests complete structure |
| Good for logic testing | Great for UI/API regression testing |
| Less maintenance for small changes | Better for comprehensive output validation |

Use **both approaches** together for comprehensive test coverage!