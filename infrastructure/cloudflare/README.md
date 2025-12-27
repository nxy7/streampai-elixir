# Cloudflare Infrastructure for Streampai

This directory contains Terraform configuration for managing Cloudflare as a reverse proxy and CDN for Streampai.

## Architecture

```
User Request → Cloudflare (CDN/Proxy/WAF)
    ├── Static assets (cached at edge)
    │   └── /_build/* (Vite build output - 1 year cache)
    │   └── *.css, *.js, images (1 year edge, 1 week browser)
    │
    ├── API endpoints (not cached, proxied to origin)
    │   └── /api/*
    │   └── /graphql
    │   └── /rpc/*
    │   └── /shapes/* (Electric SQL sync)
    │
    ├── Admin routes (not cached, challenge bots)
    │   └── /admin/*
    │
    └── Auth routes (not cached, rate limited)
        └── /auth/*
                ↓
        Oracle Cloud (Phoenix Server)
```

## Features

- **DNS Management**: Proxied A/CNAME records for CDN and DDoS protection
- **SSL/TLS**: Full (Strict) mode with TLS 1.2+ and HTTP/3
- **Caching**: Smart cache rules for static assets, bypass for dynamic content
- **Security**:
  - WAF enabled with custom rules
  - Rate limiting for API (100/min) and auth (10/5min) endpoints
  - Bot challenge for admin routes
- **Performance**: Brotli compression, HTTP/2, early hints
- **WebSockets**: Enabled for Phoenix Channels and LiveView

## Prerequisites

1. **Cloudflare Account** with your domain added
2. **Terraform** >= 1.0 installed
3. **Cloudflare API Token** with permissions:
   - Zone:Edit
   - DNS:Edit
   - Cache Purge:Purge
   - Firewall Services:Edit

## Setup

### 1. Create Cloudflare API Token

1. Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use "Edit zone DNS" template or create custom with:
   - Zone > Zone > Edit
   - Zone > DNS > Edit
   - Zone > Zone Settings > Edit
   - Zone > Firewall Services > Edit
4. Restrict to your zone (streampai.com)

### 2. Get Zone ID

1. Go to Cloudflare Dashboard
2. Select your domain (streampai.com)
3. Copy "Zone ID" from the right sidebar

### 3. Configure Variables

```bash
cd infrastructure/cloudflare
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:
```hcl
cloudflare_api_token = "your-token"
zone_id = "your-zone-id"
origin_server_ip = "your-oracle-cloud-ip"
domain = "streampai.com"
environment = "prod"
```

### 4. Initialize and Apply

```bash
# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Apply changes
terraform apply
```

## GitHub Actions Integration

The configuration is automatically applied on push to master/main when files in `infrastructure/cloudflare/` change.

### Required GitHub Secrets

Add these to your repository secrets:

| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | API token (from step 1) |
| `CLOUDFLARE_ZONE_ID` | Zone ID (from step 2) |
| `ORACLE_IP` | Oracle Cloud server IP (already exists) |

### Manual Deployment

Use the workflow dispatch to manually run:
- **plan**: Preview changes
- **apply**: Apply changes
- **destroy**: Remove all resources (use with caution!)

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

For Full (Strict) SSL mode, your origin (Oracle Cloud) needs a valid SSL certificate. Options:

1. **Cloudflare Origin CA** (recommended):
   - Free certificate from Cloudflare
   - Only trusted by Cloudflare (perfect for proxied traffic)
   - Generate at: Dashboard → SSL/TLS → Origin Server

2. **Let's Encrypt**:
   - Free, trusted by all browsers
   - Requires port 80 access for ACME challenge
   - Or use DNS challenge with Cloudflare API

3. **Self-signed** (not recommended):
   - Use "Full" mode instead of "Full (Strict)"

## Troubleshooting

### WebSocket Connection Issues

WebSockets are enabled in the configuration. If Phoenix Channels or LiveView don't work:
1. Check that your Phoenix endpoint is configured for WebSocket
2. Verify the `/socket/websocket` path is not being cached
3. Check Cloudflare → Network → WebSockets is "On"

### Mixed Content Warnings

The `automatic_https_rewrites` setting is enabled. If you still see warnings:
1. Check your Phoenix configuration returns HTTPS URLs
2. Ensure `PHX_HOST` is set correctly in production

### Cache Issues

To purge cache:
```bash
# Via API
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

Or use Cloudflare Dashboard → Caching → Configuration → Purge Everything

## Extending Configuration

### Add Staging Environment

Create `staging.tf`:
```hcl
resource "cloudflare_record" "staging" {
  zone_id = var.zone_id
  name    = "staging"
  content = var.staging_server_ip
  type    = "A"
  proxied = true
}
```

### Add Custom Worker

For advanced routing, add a Cloudflare Worker:
```hcl
resource "cloudflare_worker_script" "router" {
  account_id = var.account_id
  name       = "streampai-router"
  content    = file("${path.module}/workers/router.js")
}
```

## Resources

- [Cloudflare Terraform Provider](https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs)
- [Cloudflare API Documentation](https://developers.cloudflare.com/api)
- [Phoenix Deployment Guide](https://hexdocs.pm/phoenix/deployment.html)
