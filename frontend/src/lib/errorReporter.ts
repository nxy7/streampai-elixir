import { getApiBase } from "./constants";

const REPORT_URL = `${getApiBase()}/api/errors/report`;
const DEBOUNCE_MS = 1000;
const MAX_QUEUE_SIZE = 10;

const recentErrors = new Set<string>();
let queue: Array<Record<string, unknown>> = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function errorKey(message: string, url?: string): string {
	return `${message}::${url ?? ""}`;
}

function enqueue(error: Record<string, unknown>) {
	const key = errorKey(error.message as string, error.url as string);
	if (recentErrors.has(key)) return;
	recentErrors.add(key);

	// Expire dedup key after 30s
	setTimeout(() => recentErrors.delete(key), 30_000);

	queue.push(error);
	if (queue.length >= MAX_QUEUE_SIZE) {
		flush();
	} else if (!flushTimer) {
		flushTimer = setTimeout(flush, DEBOUNCE_MS);
	}
}

function flush() {
	if (flushTimer) {
		clearTimeout(flushTimer);
		flushTimer = null;
	}
	if (queue.length === 0) return;

	const batch = queue;
	queue = [];

	for (const error of batch) {
		try {
			fetch(REPORT_URL, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify(error),
				keepalive: true,
			}).catch(() => {
				// Silently fail - don't cause more errors from error reporting
			});
		} catch {
			// Silently fail
		}
	}
}

export function initErrorReporter() {
	if (typeof window === "undefined") return;

	window.onerror = (message, source, lineno, colno, error) => {
		enqueue({
			message: String(message),
			stack: error?.stack ?? "",
			url: window.location.href,
			source: `${source ?? ""}:${lineno ?? 0}:${colno ?? 0}`,
			timestamp: new Date().toISOString(),
			userAgent: navigator.userAgent,
		});
	};

	window.onunhandledrejection = (event) => {
		const reason = event.reason;
		enqueue({
			message:
				reason instanceof Error
					? reason.message
					: `Unhandled rejection: ${String(reason)}`,
			stack: reason instanceof Error ? (reason.stack ?? "") : "",
			url: window.location.href,
			timestamp: new Date().toISOString(),
			userAgent: navigator.userAgent,
		});
	};
}
