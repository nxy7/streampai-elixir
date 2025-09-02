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
- **Snapshot Testing** with Snapshy for regression testing and component validation
  - Run `mix test` for normal testing
  - Run `SNAPSHY_OVERRIDE=true mix test` to update snapshots
  - See `SNAPSHOT_TESTING.md` for detailed guide

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

### Code Style Preferences
- **Comments**: Only add comments when absolutely necessary for complex business logic or non-obvious code
- **Self-documenting code**: Prefer clear variable names, function names, and code structure over explanatory comments
- **No redundant comments**: Never add comments that simply restate what the code does
- **Remove existing useless comments**: Clean up verbose, obvious, or outdated comments during any code changes
- **Always format code**: Run `mix format` after making any code changes before yielding control
