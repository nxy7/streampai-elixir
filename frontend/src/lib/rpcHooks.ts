/**
 * RPC Hooks for AshTypescript
 *
 * This module provides lifecycle hooks that run before every RPC request.
 * It handles CSRF protection, authentication credentials, API URL routing,
 * and global error detection (e.g. 502 service unavailable).
 */

import type { ActionConfig } from "~/sdk/ash_rpc";
import { getApiBase } from "./constants";
import { getCsrfHeaders } from "./csrf";

/**
 * Global service availability signal.
 * Components can subscribe via `onServiceError` to show alerts.
 */
type ServiceErrorListener = (status: number) => void;
const listeners = new Set<ServiceErrorListener>();

export function onServiceError(listener: ServiceErrorListener): () => void {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

function notifyServiceError(status: number) {
	for (const listener of listeners) {
		listener(status);
	}
}

/**
 * Custom fetch wrapper that prepends the API base URL for production
 * and detects server errors (502, 503) to trigger global alerts.
 */
function createApiFetch(): typeof fetch {
	const apiBase = getApiBase();
	const baseFetch =
		typeof window !== "undefined" && apiBase === window.location.origin
			? fetch
			: (input: RequestInfo | URL, init?: RequestInit) => {
					const url = typeof input === "string" ? `${apiBase}${input}` : input;
					return fetch(url, init);
				};

	return async (input: RequestInfo | URL, init?: RequestInit) => {
		const response = await baseFetch(input, init);
		if (response.status === 502 || response.status === 503) {
			notifyServiceError(response.status);
		}
		return response;
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
