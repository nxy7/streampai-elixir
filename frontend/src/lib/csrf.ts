/**
 * CSRF Protection Utilities
 *
 * This module provides utilities for CSRF protection in the SPA.
 * It reads the CSRF token from the cookie set by the backend and
 * provides it for inclusion in API requests.
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
		const [name, value] = cookie.trim().split("=");
		if (name === CSRF_COOKIE_NAME) {
			return decodeURIComponent(value);
		}
	}
	return undefined;
}

/**
 * Get headers object with CSRF token included.
 * Use this when making API requests.
 */
export function getCsrfHeaders(): Record<string, string> {
	const token = getCsrfToken();
	if (token) {
		return { [CSRF_HEADER_NAME]: token };
	}
	return {};
}

/**
 * Create a fetch wrapper that automatically includes CSRF token and credentials.
 * This can be used as a drop-in replacement for fetch for protected endpoints.
 */
export function csrfFetch(
	input: RequestInfo | URL,
	init?: RequestInit,
): Promise<Response> {
	const csrfHeaders = getCsrfHeaders();

	const headers = new Headers(init?.headers);
	for (const [key, value] of Object.entries(csrfHeaders)) {
		headers.set(key, value);
	}

	return fetch(input, {
		...init,
		credentials: "include",
		headers,
	});
}

/**
 * Get fetch options with CSRF headers merged in.
 * Useful when you need to customize the request further.
 */
export function withCsrfHeaders(init?: RequestInit): RequestInit {
	const csrfHeaders = getCsrfHeaders();
	const existingHeaders =
		init?.headers instanceof Headers
			? Object.fromEntries(init.headers.entries())
			: (init?.headers ?? {});

	return {
		...init,
		headers: {
			...existingHeaders,
			...csrfHeaders,
		},
	};
}

/**
 * Standard fetch options for authenticated API calls.
 * Use this with SDK functions that accept fetchOptions and headers.
 *
 * Example:
 *   const result = await getCurrentUser({
 *     fields: ["id", "email"],
 *     ...rpcOptions(),
 *   });
 */
export function rpcOptions(): {
	fetchOptions: RequestInit;
	headers: Record<string, string>;
} {
	return {
		fetchOptions: { credentials: "include" },
		headers: getCsrfHeaders(),
	};
}
