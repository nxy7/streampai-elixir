// Base URL for the application (Caddy proxy or direct Phoenix)
// When using Caddy: https://localhost:8000
// When direct: http://localhost:4000
export const BASE_URL =
	import.meta.env.VITE_BASE_URL || "http://localhost:4000";

// Relative API URL - use this for auth redirects so they work through any proxy
// This ensures OAuth flows work correctly when accessing via Caddy (https://localhost:8000)
export const API_PATH = "/api";

// All backend API routes are prefixed with /api
export const API_URL = `${BASE_URL}${API_PATH}`;

// Maps display platform names to OAuth provider names
const platformToProvider: Record<string, string> = {
	youtube: "google",
	// Other platforms use their name as the provider
};

// API route helpers
export const apiRoutes = {
	streaming: {
		connect: (platform: string) => {
			const normalized = platform.toLowerCase();
			const provider = platformToProvider[normalized] ?? normalized;
			return `${API_PATH}/streaming/connect/${provider}`;
		},
	},
};
