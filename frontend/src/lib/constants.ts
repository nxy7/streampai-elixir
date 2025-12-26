// Base URL for the application (Caddy proxy or direct Phoenix)
// When using Caddy: https://localhost:8000
// When direct: http://localhost:4000
export const BASE_URL =
	import.meta.env.VITE_BASE_URL || "http://localhost:4000";

// All backend API routes are prefixed with /api
export const API_URL = `${BASE_URL}/api`;

// Keep BACKEND_URL as alias for backwards compatibility
export const BACKEND_URL = API_URL;
