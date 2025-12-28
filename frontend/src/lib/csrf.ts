/**
 * CSRF Protection Utilities
 *
 * This module provides utilities for CSRF protection in the SPA.
 * It reads the CSRF token from the cookie set by the backend and
 * provides it for inclusion in API requests.
 *
 * Note: For AshTypescript RPC calls, CSRF is handled automatically via
 * the beforeRequest hook in rpcHooks.ts. These utilities are for
 * non-RPC requests like login/registration.
 */

const CSRF_COOKIE_NAME = "_streampai_csrf";
const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Get the CSRF token from the cookie.
 * Returns undefined if no token is set.
 */
export function getCsrfToken(): string | undefined {
	if (typeof document === "undefined") {
		// SSR environment
		return undefined;
	}

	const cookies = document.cookie.split(";");
	for (const cookie of cookies) {
		const [name, ...valueParts] = cookie.trim().split("=");
		if (name === CSRF_COOKIE_NAME) {
			// Join value parts in case the value contains '=' characters
			return decodeURIComponent(valueParts.join("="));
		}
	}
	return undefined;
}

/**
 * Get headers object with CSRF token included.
 * Use this for non-RPC fetch requests (e.g., login, registration).
 */
export function getCsrfHeaders(): Record<string, string> {
	const token = getCsrfToken();
	if (token) {
		return { [CSRF_HEADER_NAME]: token };
	}
	return {};
}
