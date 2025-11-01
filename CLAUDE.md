# CLAUDE.md
ALWAYS SEE AGENTS.md with USAGE RULES BEFORE IMPLEMENTING ANYTHING.
After implementing changes make sure the app compiles.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🏗️ Architecture Overview (Quick Reference)

**Current Architecture**: SolidJS SPA Frontend + Elixir/Ash Backend

- **Frontend**: SolidJS SPA in `frontend/` directory (port 3000-3003)
  - Start: `cd frontend && npm run dev`
  - File-based routing, Tailwind CSS v4, TypeScript
  - Design system in `src/styles/design-system.ts`

- **Backend**: Elixir/Phoenix/Ash API server (port 4000)
  - Start: `mix phx.server`
  - Exposes Ash resources via RPC endpoints
  - Session-based authentication with cookies

- **Communication**: Type-safe RPC via AshTypescript
  - SDK auto-generated at `frontend/src/sdk/ash_rpc.ts`
  - Run `mix ash.codegen` after Ash changes

**Legacy Note**: Some LiveView pages still exist (admin, legacy widgets). Gradual migration to SolidJS in progress.

## Development Commands

### Backend (Elixir/Phoenix) Setup and Development
- `mix setup` - Install dependencies, setup database, build assets (complete setup)
- `mix phx.server` - Start Phoenix development server at http://localhost:4000
- `PORT=4001 mix phx.server` - Start server on custom port (useful for multiple instances)
- `iex -S mix phx.server` - Start server with interactive Elixir shell
- `just elixir-start` - Alternative way to start server (uses Justfile)

### Frontend (SolidJS) Setup and Development
- `cd frontend && npm install` - Install frontend dependencies
- `cd frontend && npm run dev` - Start frontend dev server (port 3000-3003)
- `cd frontend && npm run build` - Build frontend for production
- Frontend will auto-reload on changes (Vite HMR)

### Multiple Development Instances
When running multiple Claude Code instances or development servers simultaneously:
- Use `PORT=4001 mix phx.server` (or other ports) to avoid main app conflicts
- To disable LiveDebugger (if conflicting): `DISABLE_LIVE_DEBUGGER=true PORT=4001 mix phx.server`
- LiveDebugger port can be configured via `LIVE_DEBUGGER_PORT` env var (defaults to 4008)
- For additional instances: `LIVE_DEBUGGER_PORT=4009 PORT=4001 mix phx.server`
- This prevents "address already in use" errors when multiple devs work on the same codebase

### Database Operations
- `mix ecto.create` - Create database
- `mix ecto.migrate` - Run migrations
- `mix ecto.reset` - Drop, recreate, and migrate database
- `mix ash.setup` - Setup Ash resources and run seeds

### Code Generation
- `mix ash.codegen` - **CRITICAL**: Regenerate TypeScript SDK after Ash changes
  - Run this after: adding/modifying Ash resources, actions, or fields
  - Generates: `frontend/src/sdk/ash_rpc.ts`
  - Required for type safety between backend and frontend

### Testing
- `mix test` - Run test suite (includes `ash.setup --quiet`)

### Code Quality
- `mix credo` - Run code analysis (Credo is configured for dev/test)

## Architecture Overview

### Core Framework Stack

**Backend (Elixir/Phoenix):**
- **Phoenix 1.7.14** as backend API server
- **Ash Framework** for resource modeling and business logic
- **AshAuthentication** with multiple OAuth providers (Google, Twitch) + password auth
- **AshPostgres** for database operations with PostgreSQL
- **AshTypescript** for generating type-safe RPC clients from Ash resources

**Frontend (SolidJS SPA):**
- **SolidJS Start** - Meta-framework with SSR support
- **Tailwind CSS v4** - Styling with CSS-based configuration
- **TypeScript** - Full type safety
- **Vite** - Fast build tooling
- Runs on separate port (default 3000-3003) from backend (4000)

### Architecture Pattern
- **Backend**: Headless API server exposing Ash resources via RPC endpoints
- **Frontend**: Fully independent SPA with its own routing, state management, and SSR
- **Communication**: Type-safe RPC calls via AshTypescript-generated SDK
- **Authentication**: Session-based with cookies, requires `credentials: "include"` for cross-origin

### Authentication Architecture
- **Backend**: Phoenix session-based authentication with cookies
- **Multi-provider OAuth**: Google, GitHub, Twitch via Ueberauth
- **Password authentication** with confirmation emails
- **Session management**: Cookies handled by Phoenix
- **Frontend auth check**: RPC call to `currentUser` endpoint
- **Route protection**: Implemented in SolidJS with auth state management

### Domain Structure
- **Streampai.Accounts** - User management and authentication
- **Streampai.Stream** - Streaming platform integration and events
- Resources: ChatMessage, StreamDonation, Raid, Patreon, StreamEvent, StreamMetric

### Frontend Structure
- **Directory**: `frontend/` (separate from Phoenix)
- **Routing**: File-based routing in `frontend/src/routes/`
- **Components**: Reusable components in `frontend/src/components/`
- **State**: Auth state in `frontend/src/lib/auth.ts`
- **SDK**: Auto-generated RPC client in `frontend/src/sdk/ash_rpc.ts`
- **Styling**: Design system in `frontend/src/styles/design-system.ts`

### Key Frontend Components
- `DashboardLayout` - Shared layout with collapsible sidebar for all dashboard pages
- `Nav` - Navigation component for public pages
- Landing page with sections (Hero, Features, CTA, Footer)
- Dashboard pages: Dashboard, Settings (more to be added)

### Backend Structure (Phoenix LiveView - Legacy)
- **Note**: LiveView pages still exist for admin and legacy features
- **Admin interface** via AshAdmin at `/admin` (still uses LiveView)
- Some widget configuration pages may still use LiveView
- Gradual migration to SolidJS frontend in progress

### Database & Migrations
- Uses both Ecto migrations (`priv/repo/migrations/`) and legacy SQL migrations (`../db/migrations/`)
- Ash resource snapshots in `priv/resource_snapshots/`
- Supports hypertables (TimescaleDB extensions)

### Frontend Development
- **Directory**: `frontend/`
- **Start dev server**: `cd frontend && npm run dev`
- **Build**: `npm run build`
- **Port**: Usually 3000-3003 (auto-assigned if taken)
- **Tailwind CSS v4** with CSS-based theme configuration in `src/app.css`
- **Design system**: Component utilities in `src/styles/design-system.ts`
- **Hot reloading**: Enabled via Vite

### Development Environment
- Docker Compose setup available (`docker-compose.yml`)
- Nix flake configuration for reproducible dev environment
- Justfile for common development tasks
- Hot reloading enabled for development

### API Structure
- Echo API endpoints for benchmarking/testing (`/api/echo/*`)
- High-performance endpoints (`/fast/*`) with minimal middleware
- RESTful authentication routes (`/auth/*`)

### Stream Platform Integration
- Multi-platform support: Twitch, YouTube, Facebook, Kick
- OAuth callback handling at `/streaming/connect/:provider/callback`
- Platform-specific tokens and configurations stored per user

### Key File Locations

**Frontend (SolidJS):**
- Routes: `frontend/src/routes/`
- Components: `frontend/src/components/`
- Auth logic: `frontend/src/lib/auth.ts`
- RPC SDK: `frontend/src/sdk/ash_rpc.ts`
- Design system: `frontend/src/styles/design-system.ts`
- App config: `frontend/app.config.ts`
- Styles: `frontend/src/app.css`

**Backend (Elixir/Phoenix):**
- Ash resources: `lib/streampai/stream/` and `lib/streampai/accounts/`
- RPC controller: `lib/streampai_web/controllers/ash_typescript_rpc_controller.ex`
- Router configuration: `lib/streampai_web/router.ex`
- LiveView pages (legacy): `lib/streampai_web/live/`
- LiveView components (legacy): `lib/streampai_web/components/`

### Environment Notes
- **Backend** runs on port 4000
- **Frontend** runs on port 3000-3003 (auto-assigned)
- Uses environment-based configuration (`config/dev.exs`, `config/prod.exs`)
- Secrets managed via `Streampai.Secrets` module
- Background job processing ready (button server example)
- **SQL Debugging**: Set `DEBUG_SQL=true` to enable SQL query logging in any environment

### Testing Strategy
- Test support files in `test/support/`
- Ash setup runs before tests
- Both unit and integration testing supported
- **Snapshot Testing** with Mneme for regression testing and component validation
  - Run `mix test` for normal testing
  - Run `SNAPSHY_OVERRIDE=true mix test` to update snapshots
  - See `SNAPSHOT_TESTING.md` for detailed guide

#### External API Testing Pattern
For all external API tests, follow this established pattern used in `test/streampai/cloudflare/api_client_test.exs`:

**Structure:**
- Tag with `@moduletag :integration` for periodic execution (1-3 times per day)
- Use unified setup with conditional skipping for credential-dependent tests
- Test real API endpoints, not mocks

**Response Verification Pattern:**
```elixir
# Extract known values into variables
input_name = "test-input-#{:rand.uniform(1000)}"
{:ok, response} = APIClient.create_live_input(input_name)

# Use pattern matching with pinned variables and wildcards
auto_assert %{
  "created" => _,                           # Dynamic timestamps
  "uid" => _,                              # Dynamic IDs  
  "meta" => %{"id" => ^input_name},        # Pin known values
  "recording" => %{                        # Static configuration
    "mode" => "off",
    "requireSignedURLs" => false
  },
  "streamKey" => _,                        # Dynamic secrets
  "url" => "rtmps://expected-url.com"      # Static endpoints
} <- response
```

**Key Principles:**
- **Pin operator (`^`)** for values you control/expect
- **Wildcards (`_`)** for dynamic values (IDs, timestamps, secrets, tokens)
- **Literal values** for static API contract elements (URLs, config defaults)
- **Full structure matching** to catch API contract changes
- **No response sanitization** - match the raw API response structure
- **Mneme snapshots** automatically detect and highlight API changes

**Error Testing:**
```elixir
case APIClient.get_invalid_resource("bad-id") do
  {:error, {:http_error, 404, body}} ->
    auto_assert %{
      "errors" => [%{"code" => 10003, "message" => _}],
      "success" => false
    } <- body
    
  other ->
    flunk("Expected 404 error, got: #{inspect(other)}")
end
```

This pattern ensures robust external API testing while maintaining flexibility for dynamic values and providing clear contract change detection.

### When working with this codebase:

**Frontend (SolidJS):**
- All dashboard pages should use the shared `DashboardLayout` component
- Use the design system from `~/styles/design-system` for consistent styling
- File-based routing: files in `frontend/src/routes/` become routes automatically
- Auth state is managed globally in `~/lib/auth`
- Always use `fetchOptions: { credentials: "include" }` for authenticated RPC calls
- Run `cd frontend && npm run dev` to start the frontend dev server

**Backend (Elixir/Ash):**
- New Ash resources require both resource definition and domain registration
- Run `mix ash.codegen` after changing Ash resources to regenerate TypeScript SDK
- Authentication is handled through Ash - sessions are managed by Phoenix
- Actor must be set in RPC controller for authorization to work
- Write reusable code that follows best practices

**General:**
- Regularly update CLAUDE.md file to keep it up to date with the project
- Backend (port 4000) and Frontend (port 3000-3003) run as separate processes

### Additional notes
- we have ./tasks file that holds tasks that need to be done

## Ash TypeScript Integration

This project uses **AshTypescript** to generate type-safe TypeScript RPC clients from Ash resources. This enables full-stack type safety and eliminates the need for manual API client code.

### Configuration

**Elixir Configuration** (`config/config.exs`):
```elixir
config :ash_typescript,
  output_file: "frontend/src/sdk/ash_rpc.ts",
  run_endpoint: "http://localhost:4000/rpc/run",
  validate_endpoint: "http://localhost:4000/rpc/validate",
  input_field_formatter: :camel_case,
  output_field_formatter: :camel_case
```

### Resource Setup

**1. Add Extension to Resource:**
```elixir
defmodule Streampai.Accounts.User do
  use Ash.Resource,
    extensions: [AshTypescript.Resource]

  typescript do
    type_name "User"
  end
end
```

**2. Expose Actions via Domain RPC:**
```elixir
defmodule Streampai.Accounts do
  use Ash.Domain,
    extensions: [AshTypescript.Rpc]

  typescript_rpc do
    resource User do
      rpc_action :current_user, :current_user
      rpc_action :list_accounts, :list_all
      rpc_action :update_name, :update_name
    end
  end
end
```

### Code Generation

Run code generation to create TypeScript SDK:
```bash
mix ash.codegen
```

This generates `frontend/src/sdk/ash_rpc.ts` with fully typed functions.

### Backend RPC Controller Setup

**Router Pipeline** (`lib/streampai_web/router.ex`):
```elixir
pipeline :rpc do
  plug(:accepts, ["json"])
  plug(:fetch_session)
  plug(SafeLoadFromSession)  # CRITICAL: Load user from session
  plug(ErrorTracker)
end

scope "/rpc", StreampaiWeb do
  pipe_through(:rpc)

  post("/run", AshTypescriptRpcController, :run)
  post("/validate", AshTypescriptRpcController, :validate)
end
```

**RPC Controller** (`lib/streampai_web/controllers/ash_typescript_rpc_controller.ex`):
```elixir
defmodule StreampaiWeb.AshTypescriptRpcController do
  use StreampaiWeb, :controller

  def run(conn, params) do
    # SafeLoadFromSession already loaded the user
    actor = conn.assigns[:current_user]
    conn = Plug.Conn.assign(conn, :actor, actor)

    result = AshTypescript.Rpc.run_action(:streampai, conn, params)
    json(conn, result)
  end

  def validate(conn, params) do
    result = AshTypescript.Rpc.validate_action(:streampai, conn, params)
    json(conn, result)
  end
end
```

### Frontend Usage

**Basic Usage:**
```typescript
import { currentUser, listAccounts } from "~/sdk/ash_rpc";

// Fetch current user with specific fields
const result = await currentUser({
  fields: ["id", "email", "name", "displayAvatar"]
});

if (result.success) {
  console.log(result.data); // Fully typed!
}
```

**CRITICAL: Authentication with Cross-Origin Requests**

When frontend runs on different port (e.g., localhost:3001) than backend (localhost:4000):

```typescript
// WRONG - cookies won't be sent:
const result = await currentUser({ fields: ["id"] });

// CORRECT - include credentials for cross-origin requests:
const result = await currentUser({
  fields: ["id"],
  fetchOptions: { credentials: "include" }
});
```

**With Filtering and Pagination:**
```typescript
const result = await listAccounts({
  fields: ["id", "name", "email"],
  filter: {
    name: { eq: "john" }
  },
  page: {
    limit: 20,
    after: "cursor_here"
  },
  fetchOptions: { credentials: "include" }
});
```

### Authentication Flow

1. **Session-based Auth**: User logs in via Phoenix → session cookie set
2. **RPC Pipeline**: `:rpc` pipeline must include `SafeLoadFromSession` plug
3. **Controller**: Sets `current_user` as actor for Ash authorization
4. **Frontend**: Must pass `credentials: "include"` in `fetchOptions` for cross-origin

**Common Pitfall**: Forgetting `credentials: "include"` means cookies won't be sent, so `current_user` will be nil and actor-dependent actions will fail.

### Best Practices

1. **Always regenerate SDK after Ash changes**: Run `mix ash.codegen` after modifying resources or actions
2. **Use field selection**: Only request needed fields for optimal performance
3. **Handle errors properly**: Check `result.success` before accessing `result.data`
4. **Type safety**: Let TypeScript infer types - don't manually type results
5. **Authentication**: Always use `fetchOptions: { credentials: "include" }` for authenticated requests in cross-origin setups
6. **Actor context**: Ensure RPC controller sets `actor` in `conn.assigns` before calling `AshTypescript.Rpc.run_action`

### Common Issues

**Issue**: "actor is required" error
- **Cause**: Action requires actor but RPC controller didn't set it
- **Fix**: Ensure `SafeLoadFromSession` is in `:rpc` pipeline and controller assigns actor

**Issue**: User always null on frontend
- **Cause**: Cookies not sent due to missing `credentials: "include"`
- **Fix**: Add `fetchOptions: { credentials: "include" }` to RPC calls

**Issue**: TypeScript types out of sync
- **Cause**: Forgot to regenerate after Ash changes
- **Fix**: Run `mix ash.codegen` after any resource/action changes

### Widget Creation Pattern (Legacy LiveView)

**Note**: This describes the legacy widget system using Vue + LiveView. New widgets should be considered for implementation in the SolidJS frontend.

This codebase uses a consistent pattern for creating interactive widgets that can be embedded in OBS for streaming. The pattern consists of 4 main components:

#### 1. Vue Component (`assets/vue/[Widget]Widget.vue`)
- Pure Vue component with TypeScript for displaying widget data
- Handles animations, styling, and real-time data updates
- Receives configuration and events as props
- Self-contained with no external dependencies on LiveView state

Example interface structure:
```typescript
interface WidgetEvent {
  id: string
  type: string
  username: string
  timestamp: Date
  // ... widget-specific fields
}

interface WidgetConfig {
  // Configuration options like animation_type, display_duration, etc.
}
```

#### 2. Utility Module (`lib/streampai_web/utils/fake_[widget].ex`)
- Provides `default_config/0` function for widget configuration defaults
- Generates realistic fake data for preview and testing with `generate_event/0`
- Contains predefined data pools (usernames, messages, etc.) for realistic demos
- Used by both settings preview and standalone widget display

#### 3. Settings LiveView (`lib/streampai_web/live/[widget]_widget_settings_live.ex`)
- Configuration interface with form handling and real-time preview
- Uses `WidgetConfig` resource to persist user settings
- Broadcasts configuration changes via PubSub for real-time updates
- Generates mock events periodically for preview (typically every 7 seconds)
- Provides OBS browser source URL generation

Key functions:
- `mount/3` - Load existing config or create with defaults
- `handle_event("save", ...)` - Save config and broadcast changes
- `handle_info(:generate_event, ...)` - Generate preview events

#### 4. Display LiveView (`lib/streampai_web/components/[widget]_obs_widget_live.ex`)
- Standalone widget for OBS browser source embedding
- Subscribes to configuration updates via PubSub topic
- Transparent background for overlay functionality
- Generates demo events on interval (for development/demo)
- Layout set to `false` for clean embedding

#### Integration Requirements

**Database & Configuration:**
- Add widget type to `WidgetConfig` validation list
- Add helper function in `WidgetConfig.get_default_config/1`
- Upsert configuration with `user_type_unique` identity

**Routing:**
- Settings route: `live "/widgets/[widget]", [Widget]WidgetSettingsLive`
- Display route: `live "/widgets/[widget]/display", Components.[Widget]ObsWidgetLive`

**Dashboard Integration:**
- Add widget link to `widgets_live.ex` dashboard
- Use appropriate icon and category grouping

#### PubSub Communication Pattern
- Topic: `"widget_config:#{widget_type}:#{user_id}"`
- Settings page broadcasts on config save
- Display page subscribes for real-time config updates
- Enables instant preview updates without page refresh

#### Development Notes
- Vue components should be framework-agnostic and reusable
- Utility modules provide consistent fake data for testing
- Always test both settings preview and standalone display
- Ensure transparent backgrounds work correctly in OBS
- Use realistic timing intervals (5-10 seconds) for demo events

This pattern ensures consistency across all widgets while maintaining clean separation of concerns and enabling real-time configuration updates.

### Code Style Preferences
- **Comments**: Only add comments when absolutely necessary for complex business logic or non-obvious code
- **Self-documenting code**: Prefer clear variable names, function names, and code structure over explanatory comments
- **No redundant comments**: Never add comments that simply restate what the code does
- **Remove existing useless comments**: Clean up verbose, obvious, or outdated comments during any code changes
- **Always format code**: Run `mix format` after making any code changes before yielding control
- to memorize "The app name is Streampai not Streampai"
- memorize "When you're using ash remember to always (unless necessary) to pass correct actor to the action"
- memorize, for complex logic prefer Module preparations, changes over inline function version
- memorize "if app PORT is taken, then use another port to launch the app instead of killing currently running app"

### Frontend Design System (SolidJS)
- **Always use the design system** for consistent styling across the frontend
- **Import design utilities**: `import { button, card, text, input } from "~/styles/design-system"`
- **Use design system patterns** instead of hardcoding Tailwind classes
- **Theme colors** are centralized in `frontend/src/app.css` within `@theme { }` block
- **See** `frontend/DESIGN_SYSTEM.md` for full documentation and examples

Examples:
```tsx
// ❌ Don't do this
<button class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
  Save
</button>

// ✅ Do this instead
import { button } from "~/styles/design-system";
<button class={button.primary}>Save</button>

// ✅ Cards
<div class={card.default}>
  <h3 class={text.h3}>Title</h3>
  <p class={text.body}>Content</p>
</div>

// ✅ Form inputs
<input type="email" class={input.text} />
```

**Benefits:**
- Change colors globally by updating `app.css` theme variables
- Consistent styling across all components
- Easier maintenance and updates
- Self-documenting component patterns

## Playwright Testing Integration

### Overview
This project includes Playwright for end-to-end browser testing, accessible through Claude Code's MCP Playwright tools. This enables automated testing of UI functionality, layout issues, and user interactions.

### Test User Credentials
For development and testing purposes, use these credentials to access the dashboard:
- **Email**: `test@test.local` (or value from `DEV_TEST_EMAIL` env var)
- **Password**: `testpassword` (or value from `DEV_TEST_PASSWORD` env var)

These are automatically created by the seeds file (`priv/repo/seeds.exs`) in development environment.

### Starting the Application for Testing
```bash
# Start on default port (if available)
mix phx.server

# Start on alternative port (recommended for testing to avoid conflicts)
DISABLE_LIVE_DEBUGGER=true PORT=4003 mix phx.server
```

### Using Playwright with Claude Code
Claude Code provides MCP Playwright tools for browser automation:

1. **Navigation**: `mcp__playwright__browser_navigate` - Navigate to pages
2. **Interaction**: `mcp__playwright__browser_click`, `mcp__playwright__browser_fill_form` - Interact with elements
3. **Verification**: `mcp__playwright__browser_snapshot`, `mcp__playwright__browser_take_screenshot` - Capture page state
4. **Evaluation**: `mcp__playwright__browser_evaluate` - Run JavaScript in browser context

### Example Testing Workflow
```javascript
// Navigate to application
await page.goto('http://localhost:4003');

// Login with test credentials
await page.getByRole('textbox', { name: 'Email' }).fill('test@test.local');
await page.getByRole('textbox', { name: 'Password' }).fill('testpassword');
await page.getByRole('button', { name: 'Sign in' }).click();

// Test sidebar functionality
await page.locator('#sidebar-toggle').click();

// Verify layout changes
const marginLeft = await page.evaluate(() => {
  const mainContent = document.querySelector('#main-content');
  return window.getComputedStyle(mainContent).marginLeft;
});
```

### Common Use Cases
- **Layout testing**: Verify responsive design and sidebar behavior
- **Form submission**: Test authentication and widget configuration
- **UI interactions**: Validate button clicks, navigation, and state changes
- **Visual regression**: Compare screenshots before/after changes

### Best Practices
- Use specific alternative ports (4001, 4002, 4003) to avoid conflicts
- Disable LiveDebugger when running multiple instances: `DISABLE_LIVE_DEBUGGER=true`
- Take screenshots for visual verification of layout fixes
- Use browser evaluation for DOM inspection and debugging
- Test both mobile and desktop viewport sizes for responsive behavior

This integration enables comprehensive UI testing directly through Claude Code without requiring separate test infrastructure.
- memorize that we're using MNEME for snapshots (not Snapshy), also mneme doesn't prompt with CI=true env variable
- memorize "Put markdown notes in vault dir which is encrypted on github"
- memorize "prefer pattern matching to 'with' statement unless 'with' statement makes code more readable/consise"
- memorize Prefer implicit catch to explicit try-catch
- memorize "Prefer implicit catch to 'with' statement in short functions"
- memorize "When using playwright MCP if you need to log in always let user do it - don't log in automatically unless explicitly asked to do it"