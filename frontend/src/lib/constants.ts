// In production, API is on a separate subdomain (api.streampai.com)
// In development, it's on localhost:4000 or via Caddy proxy
const isProduction =
	typeof window !== "undefined" && window.location.hostname === "streampai.com";

// Base URL for the backend server
// Production: https://api.streampai.com
// Development: localhost:4000 or from env var
export const BASE_URL = isProduction
	? "https://api.streampai.com"
	: import.meta.env.VITE_BASE_URL || "http://localhost:4000";

// API path prefix - backend routes are under /api
export const API_PATH = "/api";

// Full API URL with path prefix
export const API_URL = `${BASE_URL}${API_PATH}`;

// Helper to get the API base URL for fetch calls
// In production: https://api.streampai.com
// In development: window.location.origin (for Caddy proxy) or BASE_URL
export function getApiBase(): string {
	if (isProduction) {
		return "https://api.streampai.com";
	}
	if (typeof window !== "undefined") {
		return window.location.origin;
	}
	return BASE_URL;
}

// Maps display platform names to OAuth provider names
const platformToProvider: Record<string, string> = {
	youtube: "google",
	// Other platforms use their name as the provider
};

// API route helpers - returns absolute URLs for use in href attributes
export const apiRoutes = {
	streaming: {
		connect: (platform: string) => {
			const normalized = platform.toLowerCase();
			const provider = platformToProvider[normalized] ?? normalized;
			return `${getApiBase()}${API_PATH}/streaming/connect/${provider}`;
		},
	},
};
