/**
 * RPC Hooks for AshTypescript
 *
 * This module provides lifecycle hooks that run before every RPC request.
 * It handles CSRF protection and authentication credentials automatically.
 */

import type { ActionConfig } from "~/sdk/ash_rpc";
import { getCsrfHeaders } from "./csrf";

/**
 * Before request hook - runs before every RPC action and validation request.
 * Automatically adds:
 * - CSRF token header (x-csrf-token) for protection against cross-site attacks
 * - credentials: "include" to send session cookies
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
	};
}
