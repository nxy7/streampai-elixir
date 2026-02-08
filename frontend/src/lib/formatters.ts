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

/** Extract "YYYY-MM-DD" date key from a Date object. */
export function toDateKey(date: Date): string {
	return date.toISOString().split("T")[0];
}

/** Capitalize first letter of a string. */
export function capitalize(s: string): string {
	return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Format minutes as short duration (e.g. "2h 15m"). */
export function formatMinutes(val: number): string {
	if (val < 60) return `${Math.round(val)}m`;
	const h = Math.floor(val / 60);
	const m = Math.round(val % 60);
	return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Build a daily time series from items, aggregating values per day.
 *
 * @param items - source items to aggregate
 * @param getDate - extract Date from an item
 * @param getValue - extract numeric value from an item
 * @param mode - "sum" adds values, "avg" averages them, "max" takes the max
 * @param days - number of days to cover (ending today)
 */
export function buildDailyTimeSeries<T>(
	items: T[],
	getDate: (item: T) => Date,
	getValue: (item: T) => number,
	mode: "sum" | "avg" | "max",
	days: number,
): { time: Date; value: number }[] {
	const buckets = new Map<string, number[]>();

	for (const item of items) {
		const key = toDateKey(getDate(item));
		if (!buckets.has(key)) buckets.set(key, []);
		buckets.get(key)?.push(getValue(item));
	}

	const now = new Date();
	const result: { time: Date; value: number }[] = [];

	for (let i = days - 1; i >= 0; i--) {
		const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
		const key = toDateKey(d);
		const vals = buckets.get(key);
		let value = 0;
		if (vals && vals.length > 0) {
			if (mode === "sum") value = vals.reduce((a, b) => a + b, 0);
			else if (mode === "avg")
				value = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
			else value = Math.max(...vals);
		}
		result.push({ time: d, value });
	}

	return result;
}
