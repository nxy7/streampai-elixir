/**
 * Cloudflare Infrastructure for Streampai
 *
 * This CDKTF configuration sets up Cloudflare as a reverse proxy and CDN
 * for the Streampai application, providing:
 * - DNS management with proxy (CDN) enabled
 * - SSL/TLS configuration
 * - Caching rules for static assets
 * - Security settings (DDoS protection, WAF, rate limiting)
 *
 * Usage:
 *   cd cdk
 *   npm install
 *   npm run synth   # Generate Terraform JSON
 *   npm run plan    # Preview changes
 *   npm run deploy  # Apply changes
 */

import { CloudflareProvider } from "@cdktf/provider-cloudflare/lib/provider";
import { Record } from "@cdktf/provider-cloudflare/lib/record";
import { Ruleset } from "@cdktf/provider-cloudflare/lib/ruleset";
import { ZoneSettingsOverride } from "@cdktf/provider-cloudflare/lib/zone-settings-override";
import { App, TerraformOutput, TerraformStack } from "cdktf";
import type { Construct } from "constructs";
import { type CloudflareConfig, getConfig } from "./config";

class StreampaiCloudflareStack extends TerraformStack {
	constructor(scope: Construct, id: string, config: CloudflareConfig) {
		super(scope, id);

		// ==========================================================================
		// Provider
		// ==========================================================================
		new CloudflareProvider(this, "cloudflare", {
			apiToken: config.apiToken,
		});

		// ==========================================================================
		// DNS Records
		// ==========================================================================

		// Root domain A record - proxied through Cloudflare
		new Record(this, "root", {
			zoneId: config.zoneId,
			name: "@",
			content: config.originServerIp,
			type: "A",
			proxied: true,
			ttl: 1, // Auto TTL when proxied
			comment: "Root domain pointing to Oracle Cloud origin",
		});

		// WWW subdomain CNAME - proxied through Cloudflare
		new Record(this, "www", {
			zoneId: config.zoneId,
			name: "www",
			content: config.domain,
			type: "CNAME",
			proxied: true,
			ttl: 1,
			comment: "WWW redirect to root domain",
		});

		// ==========================================================================
		// SSL/TLS Settings
		// ==========================================================================
		new ZoneSettingsOverride(this, "settings", {
			zoneId: config.zoneId,
			settings: {
				// SSL/TLS Mode: strict - requires valid cert on origin
				ssl: "strict",

				// Always use HTTPS
				alwaysUseHttps: "on",

				// Automatic HTTPS Rewrites - fix mixed content
				automaticHttpsRewrites: "on",

				// TLS 1.3 - enable latest TLS version
				minTlsVersion: "1.2",
				tls13: "on",

				// HTTP/2 and HTTP/3
				http2: "on",
				http3: "on",

				// Compression
				brotli: "on",

				// Security Headers (HSTS)
				securityHeader: {
					enabled: true,
					includeSubdomains: true,
					maxAge: 31536000, // 1 year
					nosniff: true,
					preload: true,
				},

				// Browser Cache TTL (default, can be overridden by cache rules)
				browserCacheTtl: 14400, // 4 hours

				// Development mode - disable for production
				developmentMode: "off",

				// Caching level
				cacheLevel: "aggressive",

				// Minification
				minify: {
					css: "on",
					html: "on",
					js: "on",
				},

				// Security settings
				securityLevel: "medium",
				waf: "on",

				// WebSockets support (important for Phoenix channels/LiveView)
				websockets: "on",

				// Early hints
				earlyHints: "on",

				// Rocket Loader - disabled to avoid breaking JS
				rocketLoader: "off",
			},
		});

		// ==========================================================================
		// Cache Rules (using Rulesets API)
		// ==========================================================================
		new Ruleset(this, "cache_rules", {
			zoneId: config.zoneId,
			name: "Cache Rules",
			description: "Caching rules for Streampai",
			kind: "zone",
			phase: "http_request_cache_settings",
			rules: [
				// Rule 1: Cache static assets (CSS, JS, images) for 1 year
				{
					action: "set_cache_settings",
					actionParameters: [
						{
							cache: true,
							edgeTtl: [
								{
									mode: "override_origin",
									default: 31536000, // 1 year
								},
							],
							browserTtl: [
								{
									mode: "override_origin",
									default: 604800, // 1 week
								},
							],
						},
					],
					expression:
						'(http.request.uri.path matches ".*\\\\.(css|js|woff2?|ttf|eot|ico|svg|png|jpg|jpeg|gif|webp|avif)$")',
					description:
						"Cache static assets for 1 year at edge, 1 week in browser",
					enabled: true,
				},
				// Rule 2: Cache /_build/* assets (Vite build output) for 1 year
				{
					action: "set_cache_settings",
					actionParameters: [
						{
							cache: true,
							edgeTtl: [
								{
									mode: "override_origin",
									default: 31536000, // 1 year
								},
							],
							browserTtl: [
								{
									mode: "override_origin",
									default: 31536000, // 1 year (immutable with content hash)
								},
							],
						},
					],
					expression: '(starts_with(http.request.uri.path, "/_build/"))',
					description: "Cache Vite build assets for 1 year (immutable)",
					enabled: true,
				},
				// Rule 3: Bypass cache for API requests
				{
					action: "set_cache_settings",
					actionParameters: [
						{
							cache: false,
						},
					],
					expression:
						'(starts_with(http.request.uri.path, "/api/")) or (starts_with(http.request.uri.path, "/graphql")) or (starts_with(http.request.uri.path, "/rpc/"))',
					description: "Bypass cache for API, GraphQL, and RPC endpoints",
					enabled: true,
				},
				// Rule 4: Bypass cache for admin routes
				{
					action: "set_cache_settings",
					actionParameters: [
						{
							cache: false,
						},
					],
					expression: '(starts_with(http.request.uri.path, "/admin/"))',
					description: "Bypass cache for admin routes",
					enabled: true,
				},
				// Rule 5: Bypass cache for auth routes
				{
					action: "set_cache_settings",
					actionParameters: [
						{
							cache: false,
						},
					],
					expression: '(starts_with(http.request.uri.path, "/auth/"))',
					description: "Bypass cache for authentication routes",
					enabled: true,
				},
				// Rule 6: Bypass cache for Electric SQL shapes (real-time sync)
				{
					action: "set_cache_settings",
					actionParameters: [
						{
							cache: false,
						},
					],
					expression: '(starts_with(http.request.uri.path, "/shapes/"))',
					description: "Bypass cache for Electric SQL sync endpoints",
					enabled: true,
				},
			],
		});

		// ==========================================================================
		// Transform Rules (URL Rewrites)
		// ==========================================================================
		new Ruleset(this, "redirect_www", {
			zoneId: config.zoneId,
			name: "WWW Redirect",
			description: "Redirect www to non-www",
			kind: "zone",
			phase: "http_request_dynamic_redirect",
			rules: [
				{
					action: "redirect",
					actionParameters: [
						{
							fromValue: [
								{
									statusCode: 301,
									targetUrl: [
										{
											expression: `concat("https://", "${config.domain}", http.request.uri.path)`,
										},
									],
									preserveQueryString: true,
								},
							],
						},
					],
					expression: `(http.host eq "www.${config.domain}")`,
					description: `Redirect www.${config.domain} to ${config.domain}`,
					enabled: true,
				},
			],
		});

		// ==========================================================================
		// Rate Limiting Rules
		// ==========================================================================
		new Ruleset(this, "rate_limiting", {
			zoneId: config.zoneId,
			name: "Rate Limiting",
			description: "Rate limiting rules for API protection",
			kind: "zone",
			phase: "http_ratelimit",
			rules: [
				// Rate limit API endpoints: 100 requests per minute per IP
				{
					action: "block",
					actionParameters: [
						{
							response: [
								{
									statusCode: 429,
									content: '{"error": "Too many requests"}',
									contentType: "application/json",
								},
							],
						},
					],
					ratelimit: [
						{
							characteristics: ["ip.src", "cf.colo.id"],
							period: 60,
							requestsPerPeriod: 100,
							mitigationTimeout: 60,
						},
					],
					expression:
						'(starts_with(http.request.uri.path, "/api/")) or (starts_with(http.request.uri.path, "/graphql"))',
					description:
						"Rate limit API endpoints: 100 requests per minute per IP",
					enabled: true,
				},
				// Stricter rate limit for auth endpoints: 10 requests per 5 minutes
				{
					action: "block",
					actionParameters: [
						{
							response: [
								{
									statusCode: 429,
									content: '{"error": "Too many authentication attempts"}',
									contentType: "application/json",
								},
							],
						},
					],
					ratelimit: [
						{
							characteristics: ["ip.src"],
							period: 300,
							requestsPerPeriod: 10,
							mitigationTimeout: 600,
						},
					],
					expression: '(starts_with(http.request.uri.path, "/auth/"))',
					description:
						"Rate limit auth endpoints: 10 requests per 5 minutes per IP",
					enabled: true,
				},
			],
		});

		// ==========================================================================
		// WAF Custom Rules
		// ==========================================================================
		new Ruleset(this, "waf_custom", {
			zoneId: config.zoneId,
			name: "WAF Custom Rules",
			description: "Custom WAF rules for Streampai",
			kind: "zone",
			phase: "http_request_firewall_custom",
			rules: [
				// Block known bad user agents
				{
					action: "block",
					expression:
						'(http.user_agent contains "sqlmap") or (http.user_agent contains "nikto") or (http.user_agent contains "nmap")',
					description: "Block known malicious scanners",
					enabled: true,
				},
				// Challenge suspicious requests to admin
				{
					action: "managed_challenge",
					expression:
						'(starts_with(http.request.uri.path, "/admin/")) and (not cf.bot_management.verified_bot)',
					description: "Challenge non-verified bots accessing admin",
					enabled: true,
				},
			],
		});

		// ==========================================================================
		// Outputs
		// ==========================================================================
		new TerraformOutput(this, "domain", {
			value: config.domain,
			description: "Primary domain",
		});

		new TerraformOutput(this, "ssl_mode", {
			value: "Strict - Origin requires valid SSL certificate",
			description: "SSL/TLS mode",
		});

		new TerraformOutput(this, "cache_summary", {
			value: JSON.stringify({
				static_assets: "Cached for 1 year at edge, 1 week in browser",
				build_assets: "Cached for 1 year (immutable)",
				api_routes: "Not cached (bypass)",
				admin_routes: "Not cached (bypass)",
				auth_routes: "Not cached (bypass)",
				shapes: "Not cached (real-time sync)",
			}),
			description: "Cache configuration summary",
		});
	}
}

// =============================================================================
// Main App
// =============================================================================
const app = new App();
const config = getConfig();

new StreampaiCloudflareStack(app, "streampai-cloudflare", config);

app.synth();
