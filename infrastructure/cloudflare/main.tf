# Cloudflare Infrastructure for Streampai
#
# This Terraform configuration sets up Cloudflare as a reverse proxy and CDN
# for the Streampai application, providing:
# - DNS management with proxy (CDN) enabled
# - SSL/TLS configuration
# - Caching rules for static assets
# - Security settings (DDoS protection, WAF)
#
# Usage:
#   cd infrastructure/cloudflare
#   terraform init
#   terraform plan
#   terraform apply
#
# Required environment variables:
#   CLOUDFLARE_API_TOKEN - API token with Zone:Edit, DNS:Edit permissions
#
# Or set in terraform.tfvars:
#   cloudflare_api_token = "your-token"
#   zone_id = "your-zone-id"
#   origin_server_ip = "your-oracle-cloud-ip"

terraform {
  required_version = ">= 1.0"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }

  # Uncomment to use remote state (recommended for production)
  # backend "s3" {
  #   bucket = "streampai-terraform-state"
  #   key    = "cloudflare/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# =============================================================================
# Variables
# =============================================================================

variable "cloudflare_api_token" {
  description = "Cloudflare API token with Zone:Edit and DNS:Edit permissions"
  type        = string
  sensitive   = true
}

variable "zone_id" {
  description = "Cloudflare Zone ID for streampai.com"
  type        = string
}

variable "domain" {
  description = "Primary domain name"
  type        = string
  default     = "streampai.com"
}

variable "origin_server_ip" {
  description = "IP address of the Oracle Cloud origin server"
  type        = string
}

variable "environment" {
  description = "Environment name (prod, staging)"
  type        = string
  default     = "prod"
}

# =============================================================================
# DNS Records
# =============================================================================

# Root domain A record - proxied through Cloudflare
resource "cloudflare_record" "root" {
  zone_id = var.zone_id
  name    = "@"
  content = var.origin_server_ip
  type    = "A"
  proxied = true
  ttl     = 1 # Auto TTL when proxied
  comment = "Root domain pointing to Oracle Cloud origin"
}

# WWW subdomain CNAME - proxied through Cloudflare
resource "cloudflare_record" "www" {
  zone_id = var.zone_id
  name    = "www"
  content = var.domain
  type    = "CNAME"
  proxied = true
  ttl     = 1
  comment = "WWW redirect to root domain"
}

# API subdomain (optional - if you want api.streampai.com)
# Uncomment if needed
# resource "cloudflare_record" "api" {
#   zone_id = var.zone_id
#   name    = "api"
#   content = var.origin_server_ip
#   type    = "A"
#   proxied = true
#   ttl     = 1
#   comment = "API subdomain"
# }

# =============================================================================
# SSL/TLS Settings
# =============================================================================

resource "cloudflare_zone_settings_override" "settings" {
  zone_id = var.zone_id

  settings {
    # SSL/TLS Mode: strict - requires valid cert on origin
    # Use "full" if origin has self-signed cert
    # Use "flexible" only for testing (not recommended)
    ssl = "strict"

    # Always use HTTPS
    always_use_https = "on"

    # Automatic HTTPS Rewrites - fix mixed content
    automatic_https_rewrites = "on"

    # TLS 1.3 - enable latest TLS version
    min_tls_version = "1.2"
    tls_1_3         = "on"

    # HTTP/2 and HTTP/3
    http2 = "on"
    http3 = "on"

    # Compression
    brotli = "on"

    # Security Headers
    security_header {
      enabled            = true
      include_subdomains = true
      max_age            = 31536000 # 1 year
      nosniff            = true
      preload            = true
    }

    # Browser Cache TTL (default, can be overridden by cache rules)
    browser_cache_ttl = 14400 # 4 hours

    # Development mode - disable for production
    development_mode = "off"

    # Caching level
    cache_level = "aggressive"

    # Minification
    minify {
      css  = "on"
      html = "on"
      js   = "on"
    }

    # Security settings
    security_level = "medium"
    waf            = "on"

    # WebSockets support (important for Phoenix channels/LiveView)
    websockets = "on"

    # Early hints
    early_hints = "on"

    # Rocket Loader - be careful, can break some JS
    rocket_loader = "off"
  }
}

# =============================================================================
# Cache Rules (using Rulesets API - modern approach)
# =============================================================================

# Cache static assets aggressively
resource "cloudflare_ruleset" "cache_rules" {
  zone_id     = var.zone_id
  name        = "Cache Rules"
  description = "Caching rules for Streampai"
  kind        = "zone"
  phase       = "http_request_cache_settings"

  # Rule 1: Cache static assets (CSS, JS, images) for 1 year
  rules {
    action = "set_cache_settings"
    action_parameters {
      cache = true
      edge_ttl {
        mode    = "override_origin"
        default = 31536000 # 1 year
      }
      browser_ttl {
        mode    = "override_origin"
        default = 604800 # 1 week
      }
    }
    expression  = "(http.request.uri.path matches \".*\\\\.(css|js|woff2?|ttf|eot|ico|svg|png|jpg|jpeg|gif|webp|avif)$\")"
    description = "Cache static assets for 1 year at edge, 1 week in browser"
    enabled     = true
  }

  # Rule 2: Cache /_build/* assets (Vite build output) for 1 year
  rules {
    action = "set_cache_settings"
    action_parameters {
      cache = true
      edge_ttl {
        mode    = "override_origin"
        default = 31536000 # 1 year
      }
      browser_ttl {
        mode    = "override_origin"
        default = 31536000 # 1 year (immutable with content hash)
      }
    }
    expression  = "(starts_with(http.request.uri.path, \"/_build/\"))"
    description = "Cache Vite build assets for 1 year (immutable)"
    enabled     = true
  }

  # Rule 3: Bypass cache for API requests
  rules {
    action = "set_cache_settings"
    action_parameters {
      cache = false
    }
    expression  = "(starts_with(http.request.uri.path, \"/api/\")) or (starts_with(http.request.uri.path, \"/graphql\")) or (starts_with(http.request.uri.path, \"/rpc/\"))"
    description = "Bypass cache for API, GraphQL, and RPC endpoints"
    enabled     = true
  }

  # Rule 4: Bypass cache for admin routes
  rules {
    action = "set_cache_settings"
    action_parameters {
      cache = false
    }
    expression  = "(starts_with(http.request.uri.path, \"/admin/\"))"
    description = "Bypass cache for admin routes"
    enabled     = true
  }

  # Rule 5: Bypass cache for auth routes
  rules {
    action = "set_cache_settings"
    action_parameters {
      cache = false
    }
    expression  = "(starts_with(http.request.uri.path, \"/auth/\"))"
    description = "Bypass cache for authentication routes"
    enabled     = true
  }

  # Rule 6: Bypass cache for Electric SQL shapes (real-time sync)
  rules {
    action = "set_cache_settings"
    action_parameters {
      cache = false
    }
    expression  = "(starts_with(http.request.uri.path, \"/shapes/\"))"
    description = "Bypass cache for Electric SQL sync endpoints"
    enabled     = true
  }
}

# =============================================================================
# Transform Rules (URL Rewrites)
# =============================================================================

# WWW to non-WWW redirect
resource "cloudflare_ruleset" "redirect_www" {
  zone_id     = var.zone_id
  name        = "WWW Redirect"
  description = "Redirect www to non-www"
  kind        = "zone"
  phase       = "http_request_dynamic_redirect"

  rules {
    action = "redirect"
    action_parameters {
      from_value {
        status_code = 301
        target_url {
          expression = "concat(\"https://\", \"${var.domain}\", http.request.uri.path)"
        }
        preserve_query_string = true
      }
    }
    expression  = "(http.host eq \"www.${var.domain}\")"
    description = "Redirect www.streampai.com to streampai.com"
    enabled     = true
  }
}

# =============================================================================
# Security Rules
# =============================================================================

# Rate limiting for API endpoints
resource "cloudflare_ruleset" "rate_limiting" {
  zone_id     = var.zone_id
  name        = "Rate Limiting"
  description = "Rate limiting rules for API protection"
  kind        = "zone"
  phase       = "http_ratelimit"

  # Rate limit API endpoints
  rules {
    action = "block"
    action_parameters {
      response {
        status_code  = 429
        content      = "{\"error\": \"Too many requests\"}"
        content_type = "application/json"
      }
    }
    ratelimit {
      characteristics     = ["ip.src", "cf.colo.id"]
      period              = 60
      requests_per_period = 100
      mitigation_timeout  = 60
    }
    expression  = "(starts_with(http.request.uri.path, \"/api/\")) or (starts_with(http.request.uri.path, \"/graphql\"))"
    description = "Rate limit API endpoints: 100 requests per minute per IP"
    enabled     = true
  }

  # Stricter rate limit for auth endpoints
  rules {
    action = "block"
    action_parameters {
      response {
        status_code  = 429
        content      = "{\"error\": \"Too many authentication attempts\"}"
        content_type = "application/json"
      }
    }
    ratelimit {
      characteristics     = ["ip.src"]
      period              = 300
      requests_per_period = 10
      mitigation_timeout  = 600
    }
    expression  = "(starts_with(http.request.uri.path, \"/auth/\"))"
    description = "Rate limit auth endpoints: 10 requests per 5 minutes per IP"
    enabled     = true
  }
}

# WAF Custom Rules
resource "cloudflare_ruleset" "waf_custom" {
  zone_id     = var.zone_id
  name        = "WAF Custom Rules"
  description = "Custom WAF rules for Streampai"
  kind        = "zone"
  phase       = "http_request_firewall_custom"

  # Block known bad user agents
  rules {
    action      = "block"
    expression  = "(http.user_agent contains \"sqlmap\") or (http.user_agent contains \"nikto\") or (http.user_agent contains \"nmap\")"
    description = "Block known malicious scanners"
    enabled     = true
  }

  # Challenge suspicious requests to admin
  rules {
    action      = "managed_challenge"
    expression  = "(starts_with(http.request.uri.path, \"/admin/\")) and (not cf.bot_management.verified_bot)"
    description = "Challenge non-verified bots accessing admin"
    enabled     = true
  }
}

# =============================================================================
# Outputs
# =============================================================================

output "nameservers" {
  description = "Cloudflare nameservers for the zone"
  value       = "Configure your domain registrar to use Cloudflare nameservers"
}

output "domain" {
  description = "Primary domain"
  value       = var.domain
}

output "ssl_mode" {
  description = "SSL/TLS mode"
  value       = "Strict - Origin requires valid SSL certificate"
}

output "cache_rules" {
  description = "Cache configuration summary"
  value = {
    static_assets = "Cached for 1 year at edge, 1 week in browser"
    build_assets  = "Cached for 1 year (immutable)"
    api_routes    = "Not cached (bypass)"
    admin_routes  = "Not cached (bypass)"
    auth_routes   = "Not cached (bypass)"
    shapes        = "Not cached (real-time sync)"
  }
}
