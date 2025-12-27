/**
 * Configuration for Streampai Cloudflare infrastructure
 *
 * Environment variables:
 *   CLOUDFLARE_API_TOKEN - API token with Zone:Edit, DNS:Edit permissions
 *   CLOUDFLARE_ZONE_ID   - Zone ID for streampai.com
 *   ORIGIN_SERVER_IP     - Oracle Cloud server IP
 *   DOMAIN               - Domain name (default: streampai.com)
 *   ENVIRONMENT          - Environment name (default: prod)
 */

export interface CloudflareConfig {
	/** Cloudflare API token */
	apiToken: string;
	/** Zone ID for the domain */
	zoneId: string;
	/** Primary domain name */
	domain: string;
	/** Origin server IP address */
	originServerIp: string;
	/** Environment (prod, staging) */
	environment: string;
}

function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(`Required environment variable ${name} is not set`);
	}
	return value;
}

export function getConfig(): CloudflareConfig {
	return {
		apiToken: requireEnv("CLOUDFLARE_API_TOKEN"),
		zoneId: requireEnv("CLOUDFLARE_ZONE_ID"),
		originServerIp: requireEnv("ORIGIN_SERVER_IP"),
		domain: process.env.DOMAIN || "streampai.com",
		environment: process.env.ENVIRONMENT || "prod",
	};
}
