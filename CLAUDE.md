# CLAUDE.md

Project instructions for Claude Code. Always consult AGENTS.md for framework-specific usage rules before implementing.

## Project Overview

**Streampai** is a live streaming management platform built with:
- **Backend**: Elixir/Phoenix + Ash Framework (port 4000)
- **Frontend**: SolidJS SPA (port 3000+)
- **Database**: PostgreSQL with Electric SQL for real-time sync

## Quick Start

```bash
# Backend
mix setup              # Install deps, create DB, migrate, seed
mix phx.server         # Start server at http://localhost:4000

# Frontend
cd frontend && bun install
bun dev                # Start at http://localhost:3000

# Both must run simultaneously for full functionality
```

## Architecture

### Backend (Elixir)

**Ash Domains** (6 total in `config/config.exs`):
- `Streampai.Accounts` - Users, auth, roles, widget configs, streaming accounts
- `Streampai.Stream` - Livestreams, chat messages, events, viewers, metrics
- `Streampai.Notifications` - User notifications system
- `Streampai.Cloudflare` - Cloudflare Stream integration
- `Streampai.Integrations` - Third-party integrations
- `Streampai.System` - System-level operations

**Key API Endpoints**:
- `/graphql` - GraphQL API with subscriptions (primary query interface)
- `/rpc/run`, `/rpc/validate` - AshTypescript RPC endpoints
- `/shapes/*` - Electric SQL sync endpoints for real-time data
- `/auth/*` - Authentication routes
- `/admin/ash` - Ash Admin dashboard
- `/admin/oban` - Oban job dashboard

**Authentication**:
- Session-based with Phoenix cookies
- OAuth providers: Google, Twitch (+ more configured)
- To login: Go to `http://localhost:3000` (frontend), click Login, then sign in with Google

### Frontend (SolidJS)

**Stack**: SolidJS Start + Tailwind CSS v4 + TypeScript + Vite

**Structure** (`frontend/src/`):
- `routes/` - File-based routing (pages)
- `components/` - Reusable components
- `lib/` - Utilities (auth, electric, urql, hooks)
- `sdk/` - Auto-generated AshTypescript RPC client
- `styles/design-system.ts` - Component styling utilities

**Communication with Backend**:
1. **GraphQL** (via URQL) - Primary for queries and subscriptions
2. **Electric Sync** - Real-time table sync via `/shapes/*` endpoints
3. **AshTypescript RPC** - Type-safe function calls via `/rpc/*`

**Key Libraries**:
- `@urql/solid` + `graphql-ws` - GraphQL client with subscriptions
- `@electric-sql/client` + `@tanstack/solid-db` - Real-time sync
- `gql.tada` - Type-safe GraphQL queries

### File-Based Routing Rules

**IMPORTANT**: SolidJS file-based routing breaks if you have both `route-name.tsx` AND `route-name/` directory.

Solution: Move `route-name.tsx` to `route-name/index.tsx`

Example: If you need `dashboard/widgets.tsx` AND `dashboard/widgets/alertbox.tsx`:
- Move `dashboard/widgets.tsx` → `dashboard/widgets/index.tsx`

## Development Commands

### Backend
```bash
mix phx.server              # Start server
iex -S mix phx.server       # Start with IEx shell
PORT=4001 mix phx.server    # Use different port (avoid conflicts)
mix test                    # Run tests
mix format                  # Format code
mix ash.codegen             # Regenerate TypeScript SDK after Ash changes
```

### Frontend
```bash
cd frontend
bun dev                     # Start dev server
bun run build               # Production build
bun run typecheck           # TypeScript check
bun run storybook           # Start Storybook at http://localhost:6006
```

### Justfile (recommended)
```bash
just start                  # Start Phoenix server
just si                     # Interactive shell with server
just test                   # Run tests (excludes external)
just format                 # Format code
just dev                    # Start full dev environment (Phoenix + Frontend + Caddy)
just worktree name          # Create isolated dev environment
just worktree-setup         # Setup current worktree (run after checkout)
just ports                  # Show port configuration for current worktree
```

## Code Generation

**After modifying Ash resources/actions**, regenerate the TypeScript SDK:
```bash
mix ash.codegen
```

This updates `frontend/src/sdk/ash_rpc.ts` with typed RPC functions.

## Testing

- **Framework**: ExUnit with Mneme for snapshot testing
- **Run tests**: `mix test` (auto-runs `ash.setup --quiet`)
- **Update snapshots**: `CI=true mix test` (Mneme won't prompt)
- **Single test**: `mix test path/to/test.exs:42`
- **Exclude slow tests**: Tests tagged with `:integration`, `:external` excluded by default

## Code Style

### General
- Prefer pattern matching over `with` statements for short functions
- Prefer implicit catch to explicit try-catch
- Only add comments for complex/non-obvious logic
- Run `mix format` after changes

### Ash Framework
- Always pass `actor:` to actions unless unnecessary
- Prefer Module preparations/changes over inline functions
- Encapsulate business logic in Ash actions, not controllers/LiveViews

### Frontend
- Use design system utilities from `~/styles/design-system`:
  ```tsx
  import { button, card, text, input } from "~/styles/design-system";
  <button class={button.primary}>Save</button>
  ```
- Always use `credentials: "include"` for authenticated RPC/fetch calls

## Key File Locations

### Backend
- Ash resources: `lib/streampai/accounts/`, `lib/streampai/stream/`, etc.
- Router: `lib/streampai_web/router.ex`
- RPC controller: `lib/streampai_web/controllers/ash_typescript_rpc_controller.ex`
- GraphQL schema: `lib/streampai_web/graphql/`

### Frontend
- Routes/pages: `frontend/src/routes/`
- Components: `frontend/src/components/`
- Auth state: `frontend/src/lib/auth.ts`
- Electric sync: `frontend/src/lib/electric.ts`
- GraphQL client: `frontend/src/lib/urql.ts`
- RPC SDK: `frontend/src/sdk/ash_rpc.ts`
- Design system: `frontend/src/styles/design-system.ts`

## Environment & Ports

- Backend default: port 4000
- Frontend default: port 3000 (auto-increments if taken)
- Use `PORT=4001` for additional backend instances
- Use `DISABLE_LIVE_DEBUGGER=true` to avoid port conflicts

## Worktree Setup (Isolated Development)

Git worktrees allow running multiple branches simultaneously with isolated databases and ports. This is essential for parallel development with tools like vibe-kanban.

### Creating a New Worktree (from main repo)

```bash
just worktree my-feature-branch
```

This creates a worktree at `../my-feature-branch` and automatically:
- Creates a new git branch `my-feature-branch`
- Generates unique ports based on the branch name hash
- Creates an isolated database `streampai_my_feature_branch_dev`
- Copies deps and build artifacts from main repo for faster setup
- Configures `.env` with worktree-specific settings
- Runs full setup (deps, migrations, seeds, compile)

### Setting Up an Existing Worktree

If you already have a worktree checked out (e.g., created by vibe-kanban), run:

```bash
just worktree-setup
```

This is the **single command** needed to set up any worktree environment. It:
1. Generates deterministic ports from the directory name
2. Creates an isolated PostgreSQL database
3. Copies `.env` and build artifacts from `~/streampai-elixir`
4. Appends worktree-specific config (DATABASE_URL, PORT, etc.)
5. Installs dependencies and runs migrations
6. Starts Claude Code with permissions skipped

### Port Allocation

Ports are randomly assigned from available ports in these ranges:
- **Phoenix**: 4100-4999
- **Frontend**: 3100-3999
- **Caddy**: 8100-8999

Check your worktree's ports with:
```bash
just ports
```

### Starting Development

After setup, start the full dev environment:
```bash
just dev    # Starts Phoenix + Frontend + Caddy with HTTPS
```

Or just the backend:
```bash
just si     # Interactive Elixir shell with Phoenix server
```

### Worktree Requirements

- Main repo must exist at `~/streampai-elixir` with `.env` configured
- PostgreSQL running locally (user: postgres, password: postgres)
- Caddy installed (`brew install caddy && caddy trust`)

### Example: Vibe-Kanban Workflow

When vibe-kanban creates a worktree, it should run:
```bash
cd /path/to/worktree/streampai-elixir
just worktree-setup
```

This single command handles all environment setup without affecting other worktrees or the main branch.

**Vibe-kanban auto-detection**: The setup script automatically detects vibe-kanban worktrees (where the parent directory matches the pattern `XXXX-branch-name`) and uses the parent directory name for unique port/database generation.

## Common Patterns

### Adding a New Ash Resource
1. Create resource in appropriate domain (e.g., `lib/streampai/stream/`)
2. Add to domain's `resources` block
3. Run `mix ash.codegen` to generate migrations and SDK
4. Run `mix ecto.migrate`

### Frontend Auth Check
```tsx
import { useCurrentUser } from "~/lib/auth";

const user = useCurrentUser();
// user() returns User | null
```

### Electric Sync Usage
```tsx
import { useElectric } from "~/lib/useElectric";

const { data } = useElectric("notifications", { userId: user()?.id });
```

### GraphQL Query
```tsx
import { createQuery } from "@urql/solid";
import { graphql } from "gql.tada";

const MyQuery = graphql(`query GetData { ... }`);
const [result] = createQuery({ query: MyQuery });
```

## Storybook

Widget components have Storybook stories for visual testing and documentation.

**Location**: `frontend/src/components/widgets/*.stories.tsx`

**Available Widget Stories** (12 total):
- Alertbox, Chat, DonationGoal, EventList, FollowerCount, Giveaway
- Placeholder, Poll, Slider, Timer, TopDonors, ViewerCount

**Run Storybook**:
```bash
cd frontend && bun run storybook
```
Opens at http://localhost:6006

**Creating New Stories**:
```tsx
// ComponentName.stories.tsx
import type { Meta, StoryObj } from "storybook-solidjs-vite";
import MyWidget from "./MyWidget";

const meta = {
  title: "Widgets/MyWidget",
  component: MyWidget,
  tags: ["autodocs"],
} satisfies Meta<typeof MyWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { config: {...}, data: {...} },
};
```

## Notes

- App name is "Streampai" (not "StreamPai")
- If a port is taken, use another port instead of killing the running app
- When using Playwright MCP for testing, let the user log in manually unless explicitly asked to automate it
