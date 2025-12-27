# CLAUDE.md

Project instructions for Claude Code. Consult AGENTS.md for framework-specific usage rules.

## Overview

**Streampai**: Live streaming management platform
- **Backend**: Elixir/Phoenix + Ash Framework (port 4000)
- **Frontend**: SolidJS SPA (port 3000+)
- **Database**: PostgreSQL + Electric SQL (real-time sync)

## Quick Start

```bash
# Backend
mix setup && mix phx.server  # http://localhost:4000

# Frontend
cd frontend && bun install && bun dev  # http://localhost:3000
```

## Architecture

### Backend

**Ash Domains** (`config/config.exs`): `Accounts`, `Stream`, `Notifications`, `Cloudflare`, `Integrations`, `System`

**API Endpoints**: `/graphql`, `/rpc/run`, `/rpc/validate`, `/shapes/*`, `/auth/*`, `/admin/ash`, `/admin/oban`

**Auth**: Session-based, OAuth (Google, Twitch). Login at frontend, sign in with Google.

### Frontend

**Stack**: SolidJS Start + Tailwind v4 + TypeScript + Vite

**Structure** (`frontend/src/`): `routes/`, `components/`, `lib/`, `sdk/`, `styles/design-system.ts`

**Backend Communication**: GraphQL (URQL), Electric Sync, AshTypescript RPC

**Routing Rule**: Can't have both `route-name.tsx` AND `route-name/` directory. Use `route-name/index.tsx` instead.

## Commands

```bash
# Backend
mix phx.server              # Start | iex -S mix phx.server (with shell)
mix test                    # Run tests | mix test path:42 (single)
mix format                  # Format | mix ash.codegen (regen SDK)

# Frontend (cd frontend)
bun dev | bun run build | bun run typecheck | bun run storybook

# Justfile (recommended)
just dev                    # Full environment (Phoenix + Frontend + Caddy)
just si                     # Interactive shell with server
just worktree-setup         # Setup worktree (run in existing worktree)
just ports                  # Show port configuration
just cleanup-slots          # Clean orphaned Electric replication slots
```

## Testing

- **Framework**: ExUnit + Mneme (snapshots)
- **Update snapshots**: `CI=true mix test`
- **Tags**: `:integration`, `:external` excluded by default

## Code Style

**General**: Prefer pattern matching over `with` for short functions. Run `mix format`.

**Ash**: Pass `actor:` to actions. Prefer Module preparations/changes. Encapsulate logic in actions.

**Frontend**: Use `~/styles/design-system` utilities. Always `credentials: "include"` for auth calls.

## Key Locations

**Backend**: `lib/streampai/*/` (resources), `lib/streampai_web/router.ex`, `lib/streampai_web/graphql/`

**Frontend**: `frontend/src/routes/`, `frontend/src/components/`, `frontend/src/lib/`, `frontend/src/sdk/ash_rpc.ts`

## Worktree Setup

For isolated development with unique ports/databases:

```bash
just worktree my-branch     # Create new (from main repo)
just worktree-setup         # Setup existing (run in worktree)
```

**Port ranges**: Phoenix 4100-4999, Frontend 3100-3999, Caddy 8100-8999

**Requirements**: Main repo at `~/streampai-elixir`, PostgreSQL (postgres:postgres), Caddy, direnv

**Troubleshooting**:
- Port conflict → Run `just worktree-setup` again
- Electric slot conflict → `just cleanup-slots`

## Patterns

```tsx
// Auth check
const user = useCurrentUser(); // returns User | null

// Electric sync
const { data } = useElectric("notifications", { userId: user()?.id });

// GraphQL
const MyQuery = graphql(`query GetData { ... }`);
const [result] = createQuery({ query: MyQuery });
```

```elixir
# New Ash resource: create in domain → add to resources block → mix ash.codegen → mix ecto.migrate
```

## Notes

- App name: "Streampai" (not "StreamPai")
- Don't kill running apps; use different ports
- Playwright testing: Use HTTPS + Caddy port (e.g., `https://localhost:8000`)
