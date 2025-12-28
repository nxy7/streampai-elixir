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

**API Endpoints**: `/rpc/run`, `/rpc/validate`, `/shapes/*`, `/auth/*`, `/admin/ash`, `/admin/oban`

**Auth**: Session-based, OAuth (Google, Twitch). Login at frontend, sign in with Google.

### Frontend

**Stack**: SolidJS Start + Tailwind v4 + TypeScript + Vite

**Structure** (`frontend/src/`): `routes/`, `components/`, `lib/`, `sdk/`, `styles/design-system.ts`

**Backend Communication**: Electric Sync, AshTypescript RPC

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

## Localization (i18n)

**Location**: `frontend/src/i18n/locales/` - one file per language (en.ts, de.ts, pl.ts, es.ts)

**Adding translations**:
1. Add English key to `en.ts` first (source of truth)
2. Add translations to all other locale files
3. Use `t("section.key")` in components via `useTranslation()` hook

**Translation quality guidelines**:
- **Natural language over literal translation** - Aim for how a native speaker would say it, not word-for-word translation
- **Use proper diacritics** - Polish: ą, ć, ę, ł, ń, ó, ś, ź, ż; German: ä, ö, ü, ß; Spanish: á, é, í, ó, ú, ñ, ü
- **Consistent tone** - Use informal "you" (Polish: "Ty", German: "du", Spanish: "tú")
- **Shorter is better** - UI text should be concise; long phrases often indicate overly literal translation
- **Technical terms** - Some English terms are standard (e.g., "streaming", "widget"); don't force translations

**Common Polish translation pitfalls**:
- "Analityka" → Use "Statystyki" (more natural for dashboards)
- "Ciasteczka" → Use "Pliki cookie" (standard term)
- Missing diacritics makes text look unprofessional

**Technical notes**:
- `i18n.flatten()` converts nested objects to dot-notation keys
- Don't use arrays in translations - they become indexed keys and break iteration
- Interpolation uses `{{variable}}` syntax

## Key Locations

**Backend**: `lib/streampai/*/` (resources), `lib/streampai_web/router.ex`

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
```

```elixir
# New Ash resource: create in domain → add to resources block → mix ash.codegen → mix ecto.migrate
```

## Electric SQL Persistence

Data that rarely changes can be persisted to IndexedDB for instant loading on page refresh. This eliminates loading states when users return to the app.

### When to Use Persistence

| Data Type | Persistence | Reason |
|-----------|-------------|--------|
| `user_preferences` | **Yes** | Rarely changes, instant profile data |
| `livestreams` | **Yes** | Low frequency changes, instant stream history |
| `widget_configs` | **Yes** | Rarely changes, instant widget settings |
| `streaming_accounts` | **Yes** | Rarely changes |
| `notifications` | No | Medium frequency, freshness important |
| `stream_events` | No | High frequency, always changing |
| `chat_messages` | No | Very high frequency |

### Usage

```typescript
// Before (no persistence - data lost on refresh)
export function createUserScopedLivestreamsCollection(userId: string) {
  return createCollection(
    electricCollectionOptions<Livestream>({
      id: `livestreams_${userId}`,
      shapeOptions: { url: `${SHAPES_URL}/livestreams/${userId}` },
      getKey: (item) => item.id,
    }),
  );
}

// After (with persistence - instant load from IndexedDB)
export function createUserScopedLivestreamsCollection(userId: string) {
  return createCollection(
    persistedElectricCollection<Livestream>({
      id: `livestreams_${userId}`,
      shapeOptions: { url: `${SHAPES_URL}/livestreams/${userId}` },
      getKey: (item) => item.id,
      persist: true,           // Enable persistence
      userId: () => userId,    // User-scoped storage key
    }),
  );
}
```

### Configuration Options

- `persist: true` - Enable IndexedDB persistence
- `userId: () => string` - Function returning user ID for user-scoped cache isolation
- `maxAge: number | null` - Cache expiration in ms (default: 24h, `null` = never expire)
- `version: number` - Schema version; increment to invalidate cache after schema changes

### Impersonation Support

Persistence is user-scoped via the storage key pattern `electric:{collectionId}:{userId}`. When admins impersonate users, each user's cache is isolated. Clear cache on user switch:

```typescript
import { clearPersistedCache } from "~/lib/electric-cache";

// After impersonation ends or user logs out
await clearPersistedCache(oldUserId);
```

### Debugging

```typescript
import { getCacheStats, clearAllElectricCaches } from "~/lib/electric-cache";

// View cache statistics in browser console
const stats = await getCacheStats();
console.table(stats.collectionDetails);
// Shows: name, itemCount, userId, version, lastUpdated, size

// Nuclear option - clear everything
await clearAllElectricCaches();
```

### Key Files

- `frontend/src/lib/persisted-electric.ts` - Main wrapper function
- `frontend/src/lib/idb-persister.ts` - IndexedDB persistence layer
- `frontend/src/lib/electric-cache.ts` - Cache management utilities
- `frontend/src/lib/electric.ts` - Collection definitions

## Notes

- App name is "Streampai" (not "StreamPai")
- If a port is taken, use another port instead of killing the running app
- **Playwright testing**: Always use HTTPS and the Caddy port (e.g., `https://localhost:8000`), not the direct frontend port. Caddy proxies both frontend and backend, which is required for auth flows to work correctly.

## Playwright Testing with Google Login

Test credentials are stored in `.env`:
- `TEST_GOOGLE_EMAIL` - Google test account email
- `TEST_GOOGLE_PASSWORD` - Google test account password

**Important**: Google blocks automated logins in headless browsers with "This browser or app may not be secure" error. For testing OAuth flows:
1. Use headed mode (`headless: false`) or let the user log in manually
2. After Google auth, fix the port in the URL if needed (Google redirects to port 8000, but worktrees use different Caddy ports like 8681)

To manually test in Playwright:
1. Navigate to login page and click "Continue with Google"
2. Complete Google sign-in manually in the browser window
3. After redirect back to app, update the port in URL if using a worktree

### OAuth Callbacks in Worktrees

OAuth callbacks always redirect to port 8000 (configured in Ueberauth). When testing in a worktree:

1. The callback URL will be `https://localhost:8000/api/streaming/connect/{provider}/callback?code=...&state=...`
2. If port 8000 isn't running, the page will fail to load
3. Simply change the port in the URL to your worktree's Caddy port (e.g., `8681`) and press Enter
4. The OAuth flow will complete successfully - the code and state parameters remain valid

## AI-Driven Development Guidelines

Guidelines for AI agents (Claude Code, Cursor, etc.) to minimize conflicts and maintain consistency.

### Formatting (Critical for Merge Conflicts)

**Always run `just format` after changes** - this formats both backend and frontend atomically:
```bash
just format  # Runs: mix format && cd frontend && bun format && bun lint --write --unsafe
```

Individual formatters can cause conflicts if run separately. The unified command ensures consistent ordering.

**Pre-commit hooks**: Install lefthook for automatic formatting:
```bash
brew install lefthook && lefthook install
```

### Generated Files (Do Not Edit)

These files are auto-generated and changes will be overwritten:

| File | Generated By | Trigger |
|------|--------------|---------|
| `frontend/src/sdk/ash_rpc.ts` | `mix ash.codegen` | Ash resource changes |
| `priv/repo/migrations/*` | `mix ash.codegen` | New Ash resources |

**Workflow for Ash resource changes**:
```bash
# 1. Modify Ash resource in lib/streampai/*/
# 2. Regenerate SDK and migrations
mix ash.codegen <descriptive_name>
# 3. Run migrations
mix ecto.migrate
# 4. Format everything
just format
```

### Localization (Multi-File Atomicity)

When adding UI text, **update all 4 locale files atomically**:
1. Add to `en.ts` first (source of truth)
2. Add translations to `de.ts`, `pl.ts`, `es.ts`
3. Run `cd frontend && bun test` to validate keys match

Missing keys in any language will cause runtime errors. A test validates key consistency:
```bash
cd frontend && bun test src/i18n/locales/locales.test.ts
```

### Database Migrations

**Prefer `mix ash.codegen`** over manual migration creation:
- It handles both migration and TypeScript SDK generation
- Manual migrations may conflict with Ash-generated ones
- Migration names include timestamps - coordinate if multiple agents work on schema

### Route Structure

SolidJS Start routing rule - never have both:
- `routes/foo.tsx` AND `routes/foo/index.tsx`

Pick one pattern. If you need nested routes, use the directory structure.

### Testing

Before committing:
```bash
# Backend
mix test --max-failures 3

# Frontend
cd frontend && bun test

# Full format check
just format
```

### Parallel Agent Coordination

When multiple AI agents work on the same codebase:
1. **Claim files explicitly** - mention which files you're modifying
2. **Format after every change** - prevents formatting-only conflicts
3. **Pull before push** - check for others' changes
4. **Small, focused PRs** - easier to merge than large changes
