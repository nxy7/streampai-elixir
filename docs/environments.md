# Streampai Environment Documentation

This document describes the development and production environments for Streampai.

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        DEVELOPMENT                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Browser ──HTTPS──► Caddy (port 8000)                            │
│                        │                                          │
│            ┌───────────┼───────────┐                             │
│            │           │           │                              │
│            ▼           ▼           ▼                              │
│      /api/*       /_build/*    /* (other)                        │
│         │             │           │                               │
│         ▼             ▼           ▼                               │
│     Phoenix       Vite HMR    Frontend                           │
│    (port 4000)   (ports 3001-3003) (port 3000)                   │
│         │                                                         │
│         ▼                                                         │
│    PostgreSQL + Electric SQL                                      │
│    (port 5432)                                                    │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                        PRODUCTION                                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Browser ──HTTPS──► Cloudflare                                   │
│                        │                                          │
│            ┌───────────┴───────────┐                             │
│            │                       │                              │
│            ▼                       ▼                              │
│    streampai.com           api.streampai.com                     │
│            │                       │                              │
│            ▼                       ▼                              │
│   Cloudflare Pages          Oracle Cloud                         │
│   (SolidJS SPA)             (Phoenix API)                        │
│                                    │                              │
│                              Docker (port 80→4000)               │
│                                    │                              │
│                              PostgreSQL                           │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## Development Environment

### Why Caddy?

The development environment uses Caddy as a local reverse proxy for several critical reasons:

1. **HTTP/2 Support**: Electric SQL uses multiplexing which requires HTTP/2. Standard development servers don't support this, causing sync issues.

2. **HTTPS for Secure Cookies**: Authentication requires secure cookies (`SameSite=None; Secure`), which only work over HTTPS.

3. **Unified Entry Point**: Single `https://localhost:8000` endpoint serves both frontend and API, matching production behavior.

4. **HMR Support**: Caddy properly proxies Vite's Hot Module Replacement WebSocket connections across multiple ports.

### Services

| Service             | Port      | Description                            |
| ------------------- | --------- | -------------------------------------- |
| Caddy               | 8000      | HTTPS reverse proxy (entry point)      |
| Phoenix             | 4000      | Elixir backend API                     |
| Frontend            | 3000      | SolidJS dev server                     |
| HMR Client          | 3001      | Vite HMR (client router)               |
| HMR Server          | 3002      | Vite HMR (server router)               |
| HMR Server Function | 3003      | Vite HMR (server function router)      |
| PostgreSQL          | 5432      | TimescaleDB (PostgreSQL + time-series) |
| PgWeb               | 8082      | Database admin UI                      |
| MinIO               | 9000/9001 | S3-compatible storage                  |

### Starting Development

```bash
# First-time setup
caddy trust           # Install local CA certificates
just dev              # Start all services
```

The `just dev` command manages:

- PostgreSQL (docker compose, started in background)
- Phoenix backend (interactive `iex` session in foreground)
- Frontend dev server (background)
- Caddy reverse proxy (background)

### Worktree Isolation

For parallel development, worktrees get isolated port ranges:

| Service    | Main Repo | Worktree Range |
| ---------- | --------- | -------------- |
| Phoenix    | 4000      | 4100-4999      |
| Frontend   | 3000      | 3100-3999      |
| Caddy      | 8000      | 8100-8999      |
| PostgreSQL | 5432      | 5433-5999      |

Setup: `just worktree-setup` (run inside the worktree)

### Caddyfile Configuration

Simplified example (see actual `Caddyfile` for full config including admin routes and compression):

```caddyfile
localhost:{$CADDY_PORT:8000} {
    # Backend API routes
    handle /api/* {
        reverse_proxy localhost:{$PORT:4000}
    }

    # Vite HMR WebSockets
    handle /_build/_hmr/client {
        reverse_proxy localhost:{$FRONTEND_HMR_CLIENT_PORT:3001}
    }

    # Frontend (default)
    handle {
        reverse_proxy localhost:{$FRONTEND_PORT:3000}
    }
}
```

## Production Environment

### Domain Setup

Production uses a two-domain architecture:

| Domain              | Purpose      | Hosted On                       |
| ------------------- | ------------ | ------------------------------- |
| `streampai.com`     | Frontend SPA | Cloudflare Pages                |
| `api.streampai.com` | Phoenix API  | Oracle Cloud + Cloudflare proxy |

This architecture works with Cloudflare's free plan (no Origin Rules required).

### Cloudflare Configuration

Managed via CDKTF in `cdk/`:

- **DNS**: Root domain CNAME to Pages, `api` A record to Oracle Cloud
- **SSL/TLS**: Strict mode (requires valid cert on origin)
- **Security**: HSTS enabled, TLS 1.2+, Brotli compression
- **WebSockets**: Enabled for potential Phoenix Channels/LiveView

### Docker Deployment

```yaml
# docker-compose.prod.yml
services:
  streampai:
    image: ghcr.io/nxy7/streampai-elixir:latest
    ports:
      - "80:4000" # Cloudflare connects to port 80
    environment:
      PHX_HOST: "streampai.com"
      PORT: "4000" # Internal Phoenix port
```

**Port Flow**:

1. Browser → Cloudflare (HTTPS, port 443)
2. Cloudflare terminates SSL → Origin (HTTP, port 80)
3. Docker maps port 80 → Phoenix (port 4000)

### Session/Cookie Configuration

Production requires cross-subdomain cookie sharing:

```elixir
# config/runtime.exs (production)
session_options: [
  same_site: "None",    # Allow cross-origin
  secure: true,         # HTTPS only
  domain: ".streampai.com"  # Share across subdomains
]
```

### Deployment Pipeline

```
Push to master
     │
     ├──► Test Backend (Elixir)
     │         │
     ├──► Test Frontend (Bun)
     │         │
     │         ▼
     │    Deploy Frontend ──► Cloudflare Pages
     │
     ▼
Build Docker Image ──► GitHub Container Registry
     │
     ▼
Deploy to Oracle Cloud (via SSH)
     │
     ▼
docker compose up (pulls new image)
```

## Environment Variables

### Development (`.env`)

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres

# Ports (auto-configured for worktrees)
PORT=4000
FRONTEND_PORT=3000
CADDY_PORT=8000

# OAuth (callbacks use localhost)
GOOGLE_REDIRECT_URI=http://localhost:4000/auth/user/google/callback

# Storage (MinIO)
S3_HOST=localhost
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
```

### Production (GitHub Secrets)

```bash
# Required
SECRET_KEY_BASE          # Phoenix secret
DATABASE_URL             # PostgreSQL connection
PHX_HOST=streampai.com   # Public hostname

# OAuth
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI      # https://api.streampai.com/...

# Storage (Cloudflare R2)
S3_HOST                  # R2 endpoint
S3_ACCESS_KEY_ID
S3_SECRET_ACCESS_KEY
S3_BUCKET
S3_PUBLIC_URL

# Cloudflare
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

## Troubleshooting

### Development

**"Electric SQL not syncing"**

- Ensure you're accessing via Caddy (`https://localhost:8000`), not direct ports
- HTTP/2 is required for Electric's multiplexing

**"Cookies not being set"**

- Access via HTTPS (Caddy), not HTTP
- Check browser dev tools for cookie warnings

**"Port already in use"**

- Run `just kill-ports` to free dev ports
- Or use `just worktree-setup` to get new random ports

**"Electric slot conflict"**

- Run `just cleanup-slots` to drop orphaned replication slots

### Production

**"OAuth callback fails"**

- Verify redirect URIs in Google/Twitch console match `api.streampai.com`
- Check CORS headers in Phoenix endpoint

**"Cookies not shared between domains"**

- Verify `domain: ".streampai.com"` in session config
- Check `SameSite=None; Secure` attributes

**"502 Bad Gateway from Cloudflare"**

- Check Phoenix is running: `docker compose logs streampai`
- Verify port 80 is exposed and mapped to 4000
- Check Oracle Cloud security list allows port 80

## Files Reference

| File                                    | Purpose                           |
| --------------------------------------- | --------------------------------- |
| `Caddyfile`                             | Local HTTPS reverse proxy config  |
| `docker-compose.yml`                    | Local PostgreSQL, MinIO, PgWeb    |
| `docker-compose.prod.yml`               | Production deployment             |
| `Dockerfile`                            | Phoenix release build             |
| `cdk/`                                  | Cloudflare infrastructure (CDKTF) |
| `.github/workflows/test_and_deploy.yml` | CI/CD pipeline                    |
