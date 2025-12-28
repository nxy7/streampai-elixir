/**
 * Cloudflare Infrastructure for Streampai
 *
 * This CDKTF configuration sets up Cloudflare for the Streampai application:
 * - Cloudflare Pages for frontend SPA hosting
 * - Basic zone settings (SSL, HTTPS, compression)
 *
 * Note: Advanced features like custom rulesets (WAF, rate limiting, cache rules)
 * require Cloudflare Pro/Business plans and appropriate API token permissions.
 * These can be configured manually in the Cloudflare dashboard if needed.
 *
 * Usage:
 *   cd cdk
 *   npm install
 *   npm run synth   # Generate Terraform JSON
 *   npm run plan    # Preview changes
 *   npm run deploy  # Apply changes
 */

import { PagesDomain } from "@cdktf/provider-cloudflare/lib/pages-domain";
import { PagesProject } from "@cdktf/provider-cloudflare/lib/pages-project";
import { CloudflareProvider } from "@cdktf/provider-cloudflare/lib/provider";
import { Record } from "@cdktf/provider-cloudflare/lib/record";
import { ZoneSettingsOverride } from "@cdktf/provider-cloudflare/lib/zone-settings-override";
import {
	App,
	CloudBackend,
	NamedCloudWorkspace,
	TerraformOutput,
	TerraformStack,
} from "cdktf";
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

		// Root domain CNAME to Pages (using CNAME flattening)
		// Cloudflare automatically flattens root CNAME to A records
		new Record(this, "root_cname", {
			zoneId: config.zoneId,
			name: "@",
			type: "CNAME",
			content: "streampai.pages.dev",
			proxied: true,
			ttl: 1,
		});

		// www redirect (CNAME to root)
		new Record(this, "www_cname", {
			zoneId: config.zoneId,
			name: "www",
			type: "CNAME",
			content: config.domain,
			proxied: true,
			ttl: 1,
		});

		// ==========================================================================
		// Cloudflare Pages (Frontend SPA)
		// ==========================================================================

		// Create Pages project for the SolidJS frontend
		// Deployments are handled via GitHub Actions using wrangler
		const pagesProject = new PagesProject(this, "frontend", {
			accountId: config.accountId,
			name: "streampai",
			productionBranch: "master",
		});

		// Custom domain for Pages (root domain serves the SPA)
		new PagesDomain(this, "pages_domain", {
			accountId: config.accountId,
			projectName: pagesProject.name,
			domain: config.domain,
		});

		// ==========================================================================
		// SSL/TLS Settings
		// ==========================================================================
		// Note: Only settings available on your Cloudflare plan are included.
		// http2 is read-only and managed by Cloudflare automatically.
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

				// Security settings
				securityLevel: "medium",

				// WebSockets support (important for Phoenix channels/LiveView)
				websockets: "on",

				// Rocket Loader - disabled to avoid breaking JS
				rocketLoader: "off",
			},
		});

		// ==========================================================================
		// Architecture (Free Plan Compatible)
		// ==========================================================================
		// Since Origin Rules with Host Header override require Pro plan,
		// we use a simpler subdomain-based approach:
		//
		// - streampai.com → Cloudflare Pages (frontend SPA)
		// - api.streampai.com → Oracle backend (Phoenix API)
		//
		// The frontend SPA makes API calls to api.streampai.com
		// This requires updating the frontend API base URL config.

		// API subdomain pointing to backend
		new Record(this, "api_a_record", {
			zoneId: config.zoneId,
			name: "api",
			type: "A",
			content: config.originServerIp,
			proxied: true,
			ttl: 1,
		});

		// ==========================================================================
		// Advanced Features (require Pro/Business plan or specific permissions)
		// ==========================================================================
		// The following features can be configured manually in Cloudflare dashboard:
		//
		// 1. Rate Limiting:
		//    - API endpoints: 100 req/min per IP
		//    - Auth endpoints: 10 req/5min per IP
		//
		// 2. WAF Custom Rules:
		//    - Block malicious scanners (sqlmap, nikto, nmap)
		//    - Challenge bots accessing /admin/*

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

		new TerraformOutput(this, "pages_project", {
			value: pagesProject.name,
			description: "Cloudflare Pages project name",
		});

		new TerraformOutput(this, "pages_url", {
			value: `https://${pagesProject.name}.pages.dev`,
			description: "Cloudflare Pages default URL",
		});
	}
}

// =============================================================================
// Main App
// =============================================================================
const app = new App();
const config = getConfig();

const stack = new StreampaiCloudflareStack(app, "streampai-cloudflare", config);

// Terraform Cloud backend for state management and locking
new CloudBackend(stack, {
	organization: "Streampai",
	workspaces: new NamedCloudWorkspace("streampai-prod"),
});

app.synth();
