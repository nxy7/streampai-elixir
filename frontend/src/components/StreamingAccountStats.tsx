import { Show, createSignal } from "solid-js";
import Badge, { type BadgeVariant } from "~/components/ui/Badge";
import Card from "~/components/ui/Card";

export interface StreamingAccountData {
	platform:
		| "youtube"
		| "twitch"
		| "facebook"
		| "kick"
		| "tiktok"
		| "trovo"
		| "instagram"
		| "rumble";
	accountName: string;
	accountImage?: string | null;
	sponsorCount: number | null;
	viewsLast30d: number | null;
	followerCount: number | null;
	uniqueViewersLast30d: number | null;
	statsLastRefreshedAt: string | null;
}

interface StreamingAccountStatsProps {
	data: StreamingAccountData;
	onRefresh?: () => Promise<void>;
	onDisconnect?: () => Promise<void>;
}

const platformConfig = {
	youtube: {
		name: "YouTube",
		color: "from-red-600 to-red-700",
		bgColor: "bg-red-50",
		textColor: "text-red-700",
		borderColor: "border-red-200",
		badgeVariant: "error" as BadgeVariant,
	},
	twitch: {
		name: "Twitch",
		color: "from-purple-600 to-purple-700",
		bgColor: "bg-purple-50",
		textColor: "text-purple-700",
		borderColor: "border-purple-200",
		badgeVariant: "purple" as BadgeVariant,
	},
	facebook: {
		name: "Facebook",
		color: "from-blue-600 to-blue-700",
		bgColor: "bg-blue-50",
		textColor: "text-blue-700",
		borderColor: "border-blue-200",
		badgeVariant: "info" as BadgeVariant,
	},
	kick: {
		name: "Kick",
		color: "from-green-600 to-green-700",
		bgColor: "bg-green-50",
		textColor: "text-green-700",
		borderColor: "border-green-200",
		badgeVariant: "success" as BadgeVariant,
	},
	tiktok: {
		name: "TikTok",
		color: "from-gray-800 to-black",
		bgColor: "bg-gray-50",
		textColor: "text-gray-700",
		borderColor: "border-gray-200",
		badgeVariant: "neutral" as BadgeVariant,
	},
	trovo: {
		name: "Trovo",
		color: "from-green-500 to-teal-600",
		bgColor: "bg-teal-50",
		textColor: "text-teal-700",
		borderColor: "border-teal-200",
		badgeVariant: "success" as BadgeVariant,
	},
	instagram: {
		name: "Instagram",
		color: "from-pink-500 to-purple-600",
		bgColor: "bg-pink-50",
		textColor: "text-pink-700",
		borderColor: "border-pink-200",
		badgeVariant: "pink" as BadgeVariant,
	},
	rumble: {
		name: "Rumble",
		color: "from-green-600 to-green-800",
		bgColor: "bg-green-50",
		textColor: "text-green-700",
		borderColor: "border-green-200",
		badgeVariant: "success" as BadgeVariant,
	},
};

function formatNumber(num: number | bigint | null): string {
	if (num === null) return "-";
	const n = typeof num === "bigint" ? Number(num) : num;
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
	return n.toLocaleString();
}

function formatRelativeTime(dateString: string | null): string {
	if (!dateString) return "Never";

	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMins / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffMins < 1) return "Just now";
	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays < 7) return `${diffDays}d ago`;
	return date.toLocaleDateString();
}

export default function StreamingAccountStats(
	props: StreamingAccountStatsProps,
) {
	const [isRefreshing, setIsRefreshing] = createSignal(false);
	const [isDisconnecting, setIsDisconnecting] = createSignal(false);

	const config = () => platformConfig[props.data.platform];

	const handleRefresh = async () => {
		if (!props.onRefresh) return;
		setIsRefreshing(true);
		try {
			await props.onRefresh();
		} finally {
			setIsRefreshing(false);
		}
	};

	const handleDisconnect = async () => {
		if (!props.onDisconnect) return;
		if (!confirm(`Disconnect your ${config().name} account?`)) return;
		setIsDisconnecting(true);
		try {
			await props.onDisconnect();
		} finally {
			setIsDisconnecting(false);
		}
	};

	return (
		<div
			class={`rounded-lg border ${config().borderColor} ${config().bgColor} p-4`}>
			<div class="flex items-start justify-between">
				<div class="flex items-center space-x-3">
					<div
						class={`h-12 w-12 bg-linear-to-r ${config().color} flex items-center justify-center rounded-lg`}>
						<Show
							fallback={
								<span class="font-bold text-lg text-white">
									{config().name[0]}
								</span>
							}
							when={props.data.accountImage}>
							{(image) => (
								<img
									alt={config().name}
									class="h-12 w-12 rounded-lg object-cover"
									src={image()}
								/>
							)}
						</Show>
					</div>
					<div>
						<div class="flex items-center gap-2">
							<span class="font-semibold text-gray-900">
								{props.data.accountName}
							</span>
							<Badge size="sm" variant={config().badgeVariant}>
								{config().name}
							</Badge>
						</div>
						<div class="text-gray-500 text-sm">Connected</div>
					</div>
				</div>

				<div class="flex items-center gap-2">
					<button
						aria-label="Refresh stats"
						class={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm transition-colors ${
							isRefreshing()
								? "cursor-not-allowed bg-gray-100 text-gray-400"
								: `${config().bgColor} ${config().textColor} hover:bg-opacity-80`
						}`}
						disabled={isRefreshing()}
						onClick={handleRefresh}
						type="button">
						<svg
							aria-hidden="true"
							class={`h-4 w-4 ${isRefreshing() ? "animate-spin" : ""}`}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
							/>
						</svg>
						<span class="hidden sm:inline">
							{isRefreshing() ? "Refreshing..." : "Refresh"}
						</span>
					</button>
					<button
						aria-label="Disconnect account"
						class={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm transition-colors ${
							isDisconnecting()
								? "cursor-not-allowed bg-gray-100 text-gray-400"
								: "bg-red-50 text-red-600 hover:bg-red-100"
						}`}
						disabled={isDisconnecting()}
						onClick={handleDisconnect}
						type="button">
						<svg
							aria-hidden="true"
							class="h-4 w-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								d="M6 18L18 6M6 6l12 12"
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
							/>
						</svg>
						<span class="hidden sm:inline">
							{isDisconnecting() ? "..." : "Disconnect"}
						</span>
					</button>
				</div>
			</div>

			<div class="mt-4 grid grid-cols-3 gap-3">
				<Card class="rounded-lg" padding="sm">
					<div class="text-gray-500 text-xs uppercase">Views (30d)</div>
					<div class="mt-1 font-bold text-gray-900 text-xl">
						{formatNumber(props.data.viewsLast30d)}
					</div>
				</Card>
				<Card class="rounded-lg" padding="sm">
					<div class="text-gray-500 text-xs uppercase">Sponsors</div>
					<div class="mt-1 font-bold text-gray-900 text-xl">
						{formatNumber(props.data.sponsorCount)}
					</div>
				</Card>
				<Card class="rounded-lg" padding="sm">
					<div class="text-gray-500 text-xs uppercase">Followers</div>
					<div class="mt-1 font-bold text-gray-900 text-xl">
						{formatNumber(props.data.followerCount)}
					</div>
				</Card>
			</div>

			<div class="mt-3 flex items-center justify-between text-gray-500 text-xs">
				<span>
					Last updated: {formatRelativeTime(props.data.statsLastRefreshedAt)}
				</span>
				<Show when={props.data.statsLastRefreshedAt}>
					{(timestamp) => (
						<span class="text-gray-400">
							{new Date(timestamp()).toLocaleString()}
						</span>
					)}
				</Show>
			</div>
		</div>
	);
}
