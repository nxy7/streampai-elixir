# CLAUDE.md
ALWAYS SEE backend/AGENTS.md with USAGE RULES BEFORE IMPLEMENTING ANYTHING.
After implementing changes make sure the app compliles.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Setup and Development
- `mix setup` - Install dependencies, setup database, build assets (complete setup)
- `mix phx.server` - Start Phoenix development server at http://localhost:4000
- `iex -S mix phx.server` - Start server with interactive Elixir shell
- `just elixir-start` - Alternative way to start server (uses Justfile)

### Database Operations
- `mix ecto.create` - Create database
- `mix ecto.migrate` - Run migrations
- `mix ecto.reset` - Drop, recreate, and migrate database
- `mix ash.setup` - Setup Ash resources and run seeds

### Asset Building
- `mix assets.build` - Build CSS/JS assets for development
- `mix assets.deploy` - Build minified assets for production

### Testing
- `mix test` - Run test suite (includes `ash.setup --quiet`)

### Code Quality
- `mix credo` - Run code analysis (Credo is configured for dev/test)

## Architecture Overview

### Core Framework Stack
- **Phoenix 1.7.14** with LiveView for real-time web interface
- **Ash Framework** for resource modeling and business logic
- **AshAuthentication** with multiple OAuth providers (Google, Twitch) + password auth
- **AshPostgres** for database operations with PostgreSQL
- **LiveSvelte** integration for Svelte components within LiveView

### Authentication Architecture
- Multi-provider OAuth: Google, GitHub, Twitch via Ueberauth
- Password authentication with confirmation emails
- JWT tokens managed by AshAuthentication
- Route protection via `ash_authentication_live_session`
- User sessions handled through `StreampaiWeb.LiveUserAuth`

### Domain Structure
- **Streampai.Accounts** - User management and authentication
- **Streampai.Stream** - Streaming platform integration and events
- Resources: ChatMessage, StreamDonation, Raid, Patreon, StreamEvent, StreamMetric

### Web Interface Architecture
- **Landing page** (`LandingLive`) - Unauthenticated homepage
- **Dashboard system** with shared layout component (`DashboardLayout`)
- Dashboard pages: Stream, Analytics, Chat History, Widgets, Settings
- **Admin interface** via AshAdmin at `/admin`

### Key Components
- `DashboardLayout` - Shared layout with collapsible sidebar for all dashboard pages
- `SubscriptionWidget` - Complete subscription management with plan comparison and billing
- Authentication components with custom overrides (`AuthOverrides`)

### Database & Migrations
- Uses both Ecto migrations (`priv/repo/migrations/`) and legacy SQL migrations (`../db/migrations/`)
- Ash resource snapshots in `priv/resource_snapshots/`
- Supports hypertables (TimescaleDB extensions)

### Asset Pipeline
- **Tailwind CSS** for styling with custom config
- **esbuild** for JavaScript bundling
- **Svelte components** integrated via LiveSvelte
- Assets in `/assets` with build scripts for dev/production

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
- LiveView pages: `lib/streampai_web/live/`
- Shared components: `lib/streampai_web/components/`
- Ash resources: `lib/streampai/stream/` and `lib/streampai/accounts/`
- Authentication logic: `lib/streampai_web/live_user_auth.ex`
- Router configuration: `lib/streampai_web/router.ex`

### Environment Notes
- Development runs on port 4000
- Uses environment-based configuration (`config/dev.exs`, `config/prod.exs`)
- Secrets managed via `Streampai.Secrets` module
- Background job processing ready (button server example)

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
- All dashboard pages should use the shared `DashboardLayout` component to avoid code duplication
- New Ash resources require both resource definition and domain registration
- LiveView pages need `layout: false` when using custom layouts
- Authentication is handled through Ash - use existing patterns for protected routes
- Asset changes require running `mix assets.build` to see updates
- Write reusable code that follows best practises
- Regularly update CLAUDE.md file to keep it up to date wit the project

### Additional notes
- we have ./tasks file that holds tasks that need to be done

### Widget Creation Pattern

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