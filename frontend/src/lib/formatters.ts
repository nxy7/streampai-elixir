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

export function formatAmount(amount: number | undefined, currency?: string): string {
	if (!amount) return "";
	return `${currency || "$"}${amount.toFixed(2)}`;
}

export function getGreeting(): string {
	const hour = new Date().getHours();
	if (hour < 12) return "Good morning";
	if (hour < 18) return "Good afternoon";
	return "Good evening";
}

export function sortByInsertedAt<T extends { inserted_at: string }>(items: T[]): T[] {
	return [...items].sort(
		(a, b) => new Date(b.inserted_at).getTime() - new Date(a.inserted_at).getTime()
	);
}
