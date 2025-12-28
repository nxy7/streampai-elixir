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
		// Note: DNS records are managed manually or already exist.
		// If you need to manage them via Terraform, import them first:
		//   terraform import cloudflare_record.root <zone_id>/<record_id>
		// You can find record IDs in Cloudflare dashboard or via API.

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

		// Custom domain for Pages (serves frontend at root domain)
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
		// Advanced Features (require Pro/Business plan or specific permissions)
		// ==========================================================================
		// The following features can be configured manually in Cloudflare dashboard:
		//
		// 1. Cache Rules (Page Rules or Cache Rules in dashboard):
		//    - Cache static assets (*.css, *.js, images) for 1 year
		//    - Bypass cache for /api/*, /rpc/*, /admin/*, /auth/*, /shapes/*
		//
		// 2. Rate Limiting:
		//    - API endpoints: 100 req/min per IP
		//    - Auth endpoints: 10 req/5min per IP
		//
		// 3. WAF Custom Rules:
		//    - Block malicious scanners (sqlmap, nikto, nmap)
		//    - Challenge bots accessing /admin/*
		//
		// 4. Redirect Rules:
		//    - Redirect www.streampai.com to streampai.com

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
