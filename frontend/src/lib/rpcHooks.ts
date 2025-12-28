/**
 * RPC Hooks for AshTypescript
 *
 * This module provides lifecycle hooks that run before every RPC request.
 * It handles CSRF protection, authentication credentials, and API URL routing.
 */

import type { ActionConfig } from "~/sdk/ash_rpc";
import { getApiBase } from "./constants";
import { getCsrfHeaders } from "./csrf";

/**
 * Custom fetch wrapper that prepends the API base URL for production.
 * In production, the API is on a subdomain (api.streampai.com).
 */
function createApiFetch(): typeof fetch {
	const apiBase = getApiBase();
	// In development with same-origin, use regular fetch
	if (typeof window !== "undefined" && apiBase === window.location.origin) {
		return fetch;
	}
	// In production or cross-origin, prepend the API base URL
	return (input: RequestInfo | URL, init?: RequestInit) => {
		const url = typeof input === "string" ? `${apiBase}${input}` : input;
		return fetch(url, init);
	};
}

/**
 * Before request hook - runs before every RPC action and validation request.
 * Automatically adds:
 * - CSRF token header (x-csrf-token) for protection against cross-site attacks
 * - credentials: "include" to send session cookies
 * - customFetch to route requests to the correct API server
 */
export function beforeRequest(
	_actionName: string,
	config: ActionConfig,
): ActionConfig {
	const csrfHeaders = getCsrfHeaders();

	return {
		...config,
		headers: {
			...config.headers,
			...csrfHeaders,
		},
		fetchOptions: {
			...config.fetchOptions,
			credentials: "include",
		},
		customFetch: createApiFetch(),
	};
}
