const MINUTE_MS = 60000;
const HOUR_MS = 3600000;
const DAY_MS = 86400000;

export function formatTimeAgo(dateStr: string): string {
	const date = new Date(dateStr);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / MINUTE_MS);
	const diffHours = Math.floor(diffMs / HOUR_MS);
	const diffDays = Math.floor(diffMs / DAY_MS);

	if (diffMins < 1) return "just now";
	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays < 7) return `${diffDays}d ago`;
	return date.toLocaleDateString();
}

export function formatTimestamp(timestamp: Date | string): string {
	const ts = timestamp instanceof Date ? timestamp : new Date(timestamp);
	return ts.toLocaleTimeString("en-US", {
		hour12: false,
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function formatAmount(
	amount: number | undefined,
	currency?: string,
): string {
	if (!amount) return "";
	const num = typeof amount === "string" ? Number.parseFloat(amount) : amount;
	if (Number.isNaN(num)) return "";
	return `${currency || "$"}${num.toFixed(2)}`;
}

/**
 * Format seconds as HH:MM:SS (for live stream timers).
 */
export function formatDuration(seconds: number): string {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = seconds % 60;
	return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

/**
 * Format seconds as human-readable short duration (e.g. "2h 15m").
 */
export function formatDurationShort(seconds: number | undefined): string {
	if (!seconds) return "0m";
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	if (hours > 0) return `${hours}h ${minutes}m`;
	return `${minutes}m`;
}

export function getGreetingKey(): string {
	const hour = new Date().getHours();
	if (hour < 12) return "dashboard.greetingMorning";
	if (hour < 18) return "dashboard.greetingAfternoon";
	return "dashboard.greetingEvening";
}

export function sortByInsertedAt<T extends { inserted_at: string }>(
	items: T[],
): T[] {
	return [...items].sort(
		(a, b) =>
			new Date(b.inserted_at).getTime() - new Date(a.inserted_at).getTime(),
	);
}
