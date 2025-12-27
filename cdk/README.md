# Cloudflare Infrastructure for Streampai (CDKTF)

This directory contains CDK for Terraform (CDKTF) configuration in TypeScript for managing Cloudflare as a reverse proxy and CDN for Streampai.

## Architecture

```
User Request → Cloudflare (CDN/Proxy/WAF)
    ├── Static assets (cached at edge for 1 year)
    │   └── /_build/* (Vite output - immutable)
    │   └── *.css, *.js, images
    │
    ├── Dynamic endpoints (not cached, proxied to origin)
    │   └── /api/*, /graphql, /rpc/*, /shapes/*
    │
    └── Protected routes (rate limited, WAF protected)
        └── /auth/*, /admin/*
                ↓
        Oracle Cloud (Phoenix Server on port 80)
```

## Features

- **DNS Management**: Proxied A/CNAME records for CDN and DDoS protection
- **SSL/TLS**: Strict mode with TLS 1.2+ and HTTP/3
- **Caching**: Smart cache rules for static assets, bypass for dynamic content
- **Security**:
  - WAF enabled with custom rules
  - Rate limiting for API (100/min) and auth (10/5min) endpoints
  - Bot challenge for admin routes
- **Performance**: Brotli compression, HTTP/2, early hints
- **WebSockets**: Enabled for Phoenix Channels and LiveView

## Prerequisites

1. **Node.js** >= 18
2. **Terraform** >= 1.0 (CDKTF synthesizes to Terraform)
3. **Cloudflare API Token** with permissions:
   - Zone:Edit
   - DNS:Edit
   - Cache Purge:Purge
   - Firewall Services:Edit

## Setup

### 1. Install Dependencies

```bash
cd cdk
npm install
```

### 2. Create Cloudflare API Token

1. Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use "Edit zone DNS" template or create custom with:
   - Zone > Zone > Edit
   - Zone > DNS > Edit
   - Zone > Zone Settings > Edit
   - Zone > Firewall Services > Edit
4. Restrict to your zone (streampai.com)

### 3. Get Zone ID

1. Go to Cloudflare Dashboard
2. Select your domain (streampai.com)
3. Copy "Zone ID" from the right sidebar

### 4. Set Environment Variables

```bash
export CLOUDFLARE_API_TOKEN="your-token"
export CLOUDFLARE_ZONE_ID="your-zone-id"
export ORIGIN_SERVER_IP="your-oracle-cloud-ip"
export DOMAIN="streampai.com"
export ENVIRONMENT="prod"
```

### 5. Deploy

```bash
# Preview changes
npm run plan

# Apply changes
npm run deploy

# Destroy (use with caution!)
npm run destroy
```

## Project Structure

```
cdk/
├── src/
│   ├── main.ts      # Main stack definition
│   └── config.ts    # Configuration and environment variables
├── cdktf.json       # CDKTF configuration
├── package.json     # Dependencies and scripts
├── tsconfig.json    # TypeScript configuration
└── README.md        # This file
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript |
| `npm run synth` | Synthesize Terraform JSON |
| `npm run plan` | Preview infrastructure changes |
| `npm run deploy` | Apply infrastructure changes |
| `npm run destroy` | Destroy all resources |
| `npm run diff` | Show differences |

## GitHub Actions Integration

The configuration is automatically applied on push to master/main when files in `cdk/` change.

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | API token with Zone:Edit, DNS:Edit permissions |
| `CLOUDFLARE_ZONE_ID` | Zone ID from Cloudflare Dashboard |
| `ORACLE_IP` | Oracle Cloud server IP (already exists) |

## Configuration Details

### Cache Rules

| Path Pattern | Edge TTL | Browser TTL | Notes |
|--------------|----------|-------------|-------|
| `/_build/*` | 1 year | 1 year | Vite build output (immutable) |
| `*.css, *.js, images` | 1 year | 1 week | Static assets |
| `/api/*`, `/graphql` | bypass | bypass | API endpoints |
| `/admin/*` | bypass | bypass | Admin routes |
| `/auth/*` | bypass | bypass | Auth routes |
| `/shapes/*` | bypass | bypass | Electric SQL sync |

### Rate Limiting

| Endpoint | Limit | Period | Timeout |
|----------|-------|--------|---------|
| `/api/*`, `/graphql` | 100 requests | 1 minute | 1 minute |
| `/auth/*` | 10 requests | 5 minutes | 10 minutes |

### SSL/TLS

- Mode: Strict (Full Strict)
- Minimum TLS: 1.2
- TLS 1.3: Enabled
- HSTS: Enabled (1 year, includeSubDomains, preload)
- Always HTTPS: Enabled

## Origin Server Requirements

For Strict SSL mode, your origin (Oracle Cloud) needs a valid SSL certificate. Options:

1. **Cloudflare Origin CA** (recommended):
   - Free certificate from Cloudflare
   - Only trusted by Cloudflare (perfect for proxied traffic)
   - Generate at: Dashboard → SSL/TLS → Origin Server

2. **Let's Encrypt**:
   - Free, trusted by all browsers
   - Requires port 80 access for ACME challenge

## Why CDKTF over Raw Terraform?

- **TypeScript**: Use familiar language with full IDE support
- **Type Safety**: Catch errors at compile time
- **Reusability**: Create abstractions and share code
- **Testing**: Write unit tests for infrastructure
- **Same Backend**: Uses Terraform under the hood, full provider ecosystem

## Troubleshooting

### "Required environment variable X is not set"

Make sure all required environment variables are exported:
```bash
export CLOUDFLARE_API_TOKEN="..."
export CLOUDFLARE_ZONE_ID="..."
export ORIGIN_SERVER_IP="..."
```

### CDKTF synth fails

Run `npm run build` first to compile TypeScript, then `npm run synth`.

### WebSocket Connection Issues

WebSockets are enabled in the configuration. If Phoenix Channels or LiveView don't work:
1. Check that your Phoenix endpoint is configured for WebSocket
2. Verify the `/socket/websocket` path is not being cached

## Resources

- [CDKTF Documentation](https://developer.hashicorp.com/terraform/cdktf)
- [Cloudflare CDKTF Provider](https://www.npmjs.com/package/@cdktf/provider-cloudflare)
- [Cloudflare API Documentation](https://developers.cloudflare.com/api)
- [Phoenix Deployment Guide](https://hexdocs.pm/phoenix/deployment.html)
