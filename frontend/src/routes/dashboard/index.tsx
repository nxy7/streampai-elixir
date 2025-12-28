import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";
import { For, Show, createMemo, createSignal } from "solid-js";
import EventIcon from "~/components/EventIcon";
import {
	Skeleton,
	SkeletonListItem,
	SkeletonMetricCard,
	SkeletonStat,
	SkeletonStreamCard,
} from "~/components/ui";
import Badge from "~/components/ui/Badge";
import Card from "~/components/ui/Card";
import { useTranslation } from "~/i18n";
import { getLoginUrl, useCurrentUser } from "~/lib/auth";
import { getEventBgColor } from "~/lib/eventMetadata";
import { formatTimeAgo, getGreeting, sortByInsertedAt } from "~/lib/formatters";
import {
	useDashboardStats,
	useRecentUserChatMessages,
	useRecentUserLivestreams,
	useRecentUserStreamEvents,
	useUserPreferencesForUser,
	useUserStreamEvents,
} from "~/lib/useElectric";
import { text } from "~/styles/design-system";

function getStreamStatusBadgeVariant(
	status: string,
): "success" | "neutral" | "warning" {
	switch (status) {
		case "live":
			return "success";
		case "ended":
			return "neutral";
		default:
			return "warning";
	}
}

// Skeleton for Quick Stats grid
function QuickStatsSkeleton() {
	return (
		<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
			<For each={[1, 2, 3, 4]}>
				{() => (
					<Card padding="sm">
						<SkeletonStat showIcon />
					</Card>
				)}
			</For>
		</div>
	);
}

// Skeleton for Recent Chat section
function RecentChatSkeleton() {
	return (
		<Card padding="none">
			<div class="flex items-center justify-between border-gray-200 border-b px-6 py-4">
				<Skeleton class="h-5 w-28" />
				<Skeleton class="h-4 w-16" />
			</div>
			<div class="divide-y divide-gray-100">
				<For each={[1, 2, 3, 4, 5]}>
					{() => (
						<div class="px-6 py-3">
							<SkeletonListItem lines={2} showAvatar />
						</div>
					)}
				</For>
			</div>
		</Card>
	);
}

// Skeleton for Recent Events section
function RecentEventsSkeleton() {
	return (
		<Card padding="none">
			<div class="flex items-center justify-between border-gray-200 border-b px-6 py-4">
				<Skeleton class="h-5 w-32" />
				<Skeleton class="h-4 w-16" />
			</div>
			<div class="divide-y divide-gray-100">
				<For each={[1, 2, 3, 4, 5]}>
					{() => (
						<div class="px-6 py-3">
							<SkeletonListItem lines={2} showAvatar />
						</div>
					)}
				</For>
			</div>
		</Card>
	);
}

// Skeleton for Activity Feed
function ActivityFeedSkeleton() {
	return (
		<Card padding="none">
			<div class="border-gray-100 border-b px-4 py-3">
				<div class="mb-3 flex items-center justify-between">
					<Skeleton class="h-5 w-28" />
					<Skeleton class="h-4 w-16" />
				</div>
				<div class="flex flex-wrap gap-1">
					<For each={[1, 2, 3, 4, 5]}>
						{() => <Skeleton class="h-7 w-20 rounded-full" />}
					</For>
				</div>
			</div>
			<div class="divide-y divide-gray-50">
				<For each={[1, 2, 3, 4, 5]}>
					{() => (
						<div class="flex items-center gap-3 px-4 py-2.5">
							<Skeleton circle class="h-8 w-8 shrink-0" />
							<div class="min-w-0 flex-1 space-y-1.5">
								<div class="flex items-center gap-2">
									<Skeleton class="h-4 w-16" />
									<Skeleton class="h-3 w-12" />
								</div>
								<Skeleton class="h-3 w-24" />
							</div>
						</div>
					)}
				</For>
			</div>
		</Card>
	);
}

// Skeleton for Recent Streams section
function RecentStreamsSkeleton() {
	return (
		<Card padding="none">
			<div class="flex items-center justify-between border-gray-200 border-b px-6 py-4">
				<Skeleton class="h-5 w-32" />
				<Skeleton class="h-4 w-16" />
			</div>
			<div class="divide-y divide-gray-100">
				<For each={[1, 2, 3]}>{() => <SkeletonStreamCard />}</For>
			</div>
		</Card>
	);
}

// Feature 1: Stream Health Monitor Component
function StreamHealthMonitor() {
	const { t } = useTranslation();
	// Simulated stream health data - in production this would come from actual stream metrics
	const [connectionQuality] = createSignal<
		"excellent" | "good" | "fair" | "poor"
	>("excellent");
	const [bitrate] = createSignal(6000);
	const [droppedFrames] = createSignal(0);
	const [uptime] = createSignal("2h 34m");

	const qualityColor = () => {
		switch (connectionQuality()) {
			case "excellent":
				return "text-green-500";
			case "good":
				return "text-blue-500";
			case "fair":
				return "text-yellow-500";
			case "poor":
				return "text-red-500";
		}
	};

	const qualityBg = () => {
		switch (connectionQuality()) {
			case "excellent":
				return "bg-green-500";
			case "good":
				return "bg-blue-500";
			case "fair":
				return "bg-yellow-500";
			case "poor":
				return "bg-red-500";
		}
	};

	const qualityBgLight = () => {
		switch (connectionQuality()) {
			case "excellent":
				return "bg-green-500/10";
			case "good":
				return "bg-blue-500/10";
			case "fair":
				return "bg-yellow-500/10";
			case "poor":
				return "bg-red-500/10";
		}
	};

	const qualityLabel = () => {
		switch (connectionQuality()) {
			case "excellent":
				return t("dashboard.excellent");
			case "good":
				return t("dashboard.good");
			case "fair":
				return t("dashboard.fair");
			case "poor":
				return t("dashboard.poor");
		}
	};

	return (
		<Card data-testid="stream-health-monitor" padding="sm">
			<div class="mb-4 flex items-center justify-between">
				<h3 class="flex items-center gap-2 font-semibold text-gray-900">
					<svg
						aria-hidden="true"
						class="h-5 w-5 text-purple-600"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24">
						<path
							d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
						/>
					</svg>
					{t("dashboard.streamHealth")}
				</h3>
				<div
					class={`flex items-center gap-1.5 rounded-full px-2 py-1 ${qualityBgLight()}`}>
					<div class={`h-2 w-2 rounded-full ${qualityBg()} animate-pulse`} />
					<span class={`font-medium text-xs capitalize ${qualityColor()}`}>
						{qualityLabel()}
					</span>
				</div>
			</div>
			<div class="grid grid-cols-3 gap-3">
				<div class="rounded-lg bg-gray-50 p-2 text-center">
					<p class="font-bold text-gray-900 text-lg">{bitrate()} kbps</p>
					<p class="text-gray-500 text-xs">{t("dashboard.bitrate")}</p>
				</div>
				<div class="rounded-lg bg-gray-50 p-2 text-center">
					<p class="font-bold text-gray-900 text-lg">{droppedFrames()}</p>
					<p class="text-gray-500 text-xs">{t("dashboard.dropped")}</p>
				</div>
				<div class="rounded-lg bg-gray-50 p-2 text-center">
					<p class="font-bold text-gray-900 text-lg">{uptime()}</p>
					<p class="text-gray-500 text-xs">{t("dashboard.uptime")}</p>
				</div>
			</div>
		</Card>
	);
}

function QuickActionsPanel(props: { onTestAlert: () => void }) {
	const { t } = useTranslation();
	const [isExpanded, setIsExpanded] = createSignal(false);

	return (
		<div class="fixed right-6 bottom-6 z-50" data-testid="quick-actions-panel">
			<Show when={isExpanded()}>
				<div class="absolute right-0 bottom-16 min-w-[200px] animate-fade-in rounded-xl border border-gray-200 bg-white p-3 shadow-xl">
					<div class="space-y-2">
						<button
							class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-gray-700 transition-colors hover:bg-purple-50 hover:text-purple-700"
							onClick={props.onTestAlert}
							type="button">
							<svg
								aria-hidden="true"
								class="h-5 w-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
								/>
							</svg>
							<span class="font-medium text-sm">
								{t("dashboard.testAlert")}
							</span>
						</button>
						<A
							class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-gray-700 transition-colors hover:bg-purple-50 hover:text-purple-700"
							href="/dashboard/widgets">
							<svg
								aria-hidden="true"
								class="h-5 w-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z"
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
								/>
							</svg>
							<span class="font-medium text-sm">{t("dashboard.widgets")}</span>
						</A>
						<A
							class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-gray-700 transition-colors hover:bg-green-50 hover:text-green-700"
							href="/dashboard/stream">
							<svg
								aria-hidden="true"
								class="h-5 w-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
								/>
							</svg>
							<span class="font-medium text-sm">{t("dashboard.goLive")}</span>
						</A>
						<A
							class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-gray-700 transition-colors hover:bg-gray-100"
							href="/dashboard/settings">
							<svg
								aria-hidden="true"
								class="h-5 w-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
								/>
								<path
									d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
								/>
							</svg>
							<span class="font-medium text-sm">
								{t("dashboardNav.settings")}
							</span>
						</A>
					</div>
				</div>
			</Show>
			<button
				class={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 ${
					isExpanded()
						? "rotate-45 bg-gray-700"
						: "bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
				}`}
				onClick={() => setIsExpanded(!isExpanded())}
				type="button">
				<svg
					aria-hidden="true"
					class="h-6 w-6 text-white"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24">
					<path
						d="M12 4v16m8-8H4"
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
					/>
				</svg>
			</button>
		</div>
	);
}

function ViewerEngagementScore(props: {
	chatMessages: number;
	follows: number;
	donations: number;
	totalDonationAmount: number;
}) {
	const { t } = useTranslation();
	const engagementScore = createMemo(() => {
		// Calculate engagement score based on various metrics
		// Weighted formula: chat activity (30%), follows (30%), donations count (20%), donation value (20%)
		const chatScore = Math.min(props.chatMessages / 100, 1) * 30;
		const followScore = Math.min(props.follows / 50, 1) * 30;
		const donationCountScore = Math.min(props.donations / 20, 1) * 20;
		const donationValueScore =
			Math.min(props.totalDonationAmount / 500, 1) * 20;
		return Math.round(
			chatScore + followScore + donationCountScore + donationValueScore,
		);
	});

	const scoreColor = () => {
		const score = engagementScore();
		if (score >= 80) return "text-green-600";
		if (score >= 60) return "text-blue-600";
		if (score >= 40) return "text-yellow-600";
		return "text-gray-600";
	};

	const scoreGradient = () => {
		const score = engagementScore();
		if (score >= 80) return "from-green-500 to-emerald-500";
		if (score >= 60) return "from-blue-500 to-cyan-500";
		if (score >= 40) return "from-yellow-500 to-orange-500";
		return "from-gray-400 to-gray-500";
	};

	const scoreLabel = () => {
		const score = engagementScore();
		if (score >= 80) return t("dashboard.excellent");
		if (score >= 60) return t("dashboard.good");
		if (score >= 40) return t("dashboard.growing");
		return t("dashboard.building");
	};

	return (
		<Card data-testid="engagement-score" padding="sm">
			<div class="mb-3 flex items-center justify-between">
				<h3 class="flex items-center gap-2 font-semibold text-gray-900">
					<svg
						aria-hidden="true"
						class="h-5 w-5 text-purple-600"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24">
						<path
							d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
						/>
					</svg>
					{t("dashboard.engagementScore")}
				</h3>
				<span
					class={`rounded-full bg-gray-100 px-2 py-1 font-medium text-xs ${scoreColor()}`}>
					{scoreLabel()}
				</span>
			</div>
			<div class="flex items-center gap-4">
				<div
					class={`relative h-16 w-16 rounded-full bg-linear-to-r ${scoreGradient()} p-1`}>
					<div class="flex h-full w-full items-center justify-center rounded-full bg-white">
						<span class={`font-bold text-xl ${scoreColor()}`}>
							{engagementScore()}
						</span>
					</div>
				</div>
				<div class="flex-1">
					<div class="h-2 overflow-hidden rounded-full bg-gray-200">
						<div
							class={`h-full bg-linear-to-r ${scoreGradient()} transition-all duration-500`}
							style={{ width: `${engagementScore()}%` }}
						/>
					</div>
					<div class="mt-2 flex justify-between text-gray-500 text-xs">
						<span>0</span>
						<span>50</span>
						<span>100</span>
					</div>
				</div>
			</div>
		</Card>
	);
}

function StreamGoalsTracker(props: {
	currentFollowers: number;
	currentDonations: number;
	currentMessages: number;
}) {
	const { t } = useTranslation();
	// Example goals - in production these would be configurable
	const goals = createMemo(() => [
		{
			id: "followers",
			label: t("dashboard.dailyFollowers"),
			current: Math.min(props.currentFollowers, 100),
			target: 100,
			icon: "heart",
			color: "pink",
		},
		{
			id: "donations",
			label: t("dashboard.donationGoal"),
			current: Math.min(props.currentDonations, 500),
			target: 500,
			icon: "dollar",
			color: "green",
			prefix: "$",
		},
		{
			id: "chat",
			label: t("dashboard.chatActivity"),
			current: Math.min(props.currentMessages, 1000),
			target: 1000,
			icon: "chat",
			color: "blue",
		},
	]);

	const getColorClasses = (color: string) => {
		switch (color) {
			case "pink":
				return {
					bg: "bg-pink-500",
					light: "bg-pink-100",
					text: "text-pink-600",
				};
			case "green":
				return {
					bg: "bg-green-500",
					light: "bg-green-100",
					text: "text-green-600",
				};
			case "blue":
				return {
					bg: "bg-blue-500",
					light: "bg-blue-100",
					text: "text-blue-600",
				};
			default:
				return {
					bg: "bg-gray-500",
					light: "bg-gray-100",
					text: "text-gray-600",
				};
		}
	};

	return (
		<Card data-testid="stream-goals" padding="none">
			<div class="border-gray-100 border-b px-4 py-3">
				<h3 class="flex items-center gap-2 font-semibold text-gray-900">
					<svg
						aria-hidden="true"
						class="h-5 w-5 text-purple-600"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24">
						<path
							d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
						/>
					</svg>
					{t("dashboard.streamGoals")}
				</h3>
			</div>
			<div class="space-y-4 p-4">
				<For each={goals()}>
					{(goal) => {
						const colors = getColorClasses(goal.color);
						const percentage = Math.round((goal.current / goal.target) * 100);
						return (
							<div class="space-y-2">
								<div class="flex items-center justify-between">
									<span class="font-medium text-gray-700 text-sm">
										{goal.label}
									</span>
									<span class={`font-bold text-sm ${colors.text}`}>
										{goal.prefix || ""}
										{goal.current} / {goal.prefix || ""}
										{goal.target}
									</span>
								</div>
								<div class={`h-2 overflow-hidden rounded-full ${colors.light}`}>
									<div
										class={`h-full rounded-full ${colors.bg} transition-all duration-500`}
										style={{ width: `${Math.min(percentage, 100)}%` }}
									/>
								</div>
								<Show when={percentage >= 100}>
									<div class="flex items-center gap-1 text-green-600 text-xs">
										<svg
											aria-hidden="true"
											class="h-4 w-4"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24">
											<path
												d="M5 13l4 4L19 7"
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
											/>
										</svg>
										{t("dashboard.goalReached")}
									</div>
								</Show>
							</div>
						);
					}}
				</For>
			</div>
		</Card>
	);
}

type EventFilter = "all" | "donation" | "follow" | "subscription" | "raid";

function ActivityFeed(props: {
	events: Array<{
		id: string;
		type: string;
		data: Record<string, unknown>;
		inserted_at: string;
	}>;
}) {
	const { t } = useTranslation();
	const [filter, setFilter] = createSignal<EventFilter>("all");

	const filteredEvents = createMemo(() => {
		const f = filter();
		if (f === "all") return props.events.slice(0, 10);
		return props.events.filter((e) => e.type === f).slice(0, 10);
	});

	const filterButtons = createMemo<{ value: EventFilter; label: string }[]>(
		() => [
			{ value: "all", label: t("dashboard.all") },
			{ value: "donation", label: t("dashboard.donationsFilter") },
			{ value: "follow", label: t("dashboard.follows") },
			{ value: "subscription", label: t("dashboard.subs") },
			{ value: "raid", label: t("dashboard.raids") },
		],
	);

	return (
		<Card data-testid="activity-feed" padding="none">
			<div class="border-gray-100 border-b px-4 py-3">
				<div class="mb-3 flex items-center justify-between">
					<h3 class="flex items-center gap-2 font-semibold text-gray-900">
						<svg
							aria-hidden="true"
							class="h-5 w-5 text-purple-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								d="M13 10V3L4 14h7v7l9-11h-7z"
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
							/>
						</svg>
						{t("dashboard.activityFeed")}
					</h3>
					<span class="text-gray-500 text-xs">
						{filteredEvents().length} {t("dashboard.events")}
					</span>
				</div>
				<div class="flex flex-wrap gap-1">
					<For each={filterButtons()}>
						{(btn) => (
							<button
								class={`rounded-full px-2.5 py-1 font-medium text-xs transition-colors ${
									filter() === btn.value
										? "bg-purple-600 text-white"
										: "bg-gray-100 text-gray-600 hover:bg-gray-200"
								}`}
								data-testid={`filter-${btn.value}`}
								onClick={() => setFilter(btn.value)}
								type="button">
								{btn.label}
							</button>
						)}
					</For>
				</div>
			</div>
			<div class="max-h-[300px] overflow-y-auto">
				<Show
					fallback={
						<div class="px-4 py-8 text-center">
							<svg
								aria-hidden="true"
								class="mx-auto mb-2 h-10 w-10 text-gray-300"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									d="M13 10V3L4 14h7v7l9-11h-7z"
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
								/>
							</svg>
							<p class="text-gray-500 text-sm">
								{t("dashboard.noEvents")} {filter() === "all" ? "" : filter()}
							</p>
						</div>
					}
					when={filteredEvents().length > 0}>
					<div class="divide-y divide-gray-50">
						<For each={filteredEvents()}>
							{(event) => (
								<div class="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50">
									<div
										class={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${getEventBgColor(event.type)}`}>
										<EventIcon type={event.type} />
									</div>
									<div class="min-w-0 flex-1">
										<div class="flex items-center gap-2">
											<span class="font-medium text-gray-900 text-sm capitalize">
												{event.type}
											</span>
											<span class="text-gray-400 text-xs">
												{formatTimeAgo(event.inserted_at)}
											</span>
										</div>
										<p class="truncate text-gray-500 text-xs">
											{(event.data?.username as string) ||
												t("dashboard.anonymous")}
											<Show
												when={event.type === "donation" && event.data?.amount}>
												{" - "}${Number(event.data?.amount).toFixed(2)}
											</Show>
										</p>
									</div>
								</div>
							)}
						</For>
					</div>
				</Show>
			</div>
		</Card>
	);
}

export default function Dashboard() {
	const { t } = useTranslation();
	const { user, isLoading } = useCurrentUser();
	const prefs = useUserPreferencesForUser(() => user()?.id);
	const greeting = getGreeting();

	// User-scoped data
	const recentMessages = useRecentUserChatMessages(() => user()?.id, 5);
	const recentEvents = useRecentUserStreamEvents(() => user()?.id, 5);
	const recentStreams = useRecentUserLivestreams(() => user()?.id, 3);
	const stats = useDashboardStats(() => user()?.id);

	const allEventsQuery = useUserStreamEvents(() => user()?.id);
	const allEvents = createMemo(() => sortByInsertedAt(allEventsQuery.data()));

	// Alert test handler
	const [showTestAlert, setShowTestAlert] = createSignal(false);
	const handleTestAlert = () => {
		setShowTestAlert(true);
		setTimeout(() => setShowTestAlert(false), 3000);
	};

	return (
		<>
			<Title>Dashboard - Streampai</Title>
			<Show
				fallback={
					<div class="space-y-6">
						{/* Header skeleton */}
						<div class="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
							<Skeleton class="mb-2 h-9 w-64" />
							<Skeleton class="h-5 w-48" />
						</div>

						{/* Quick Stats skeleton */}
						<QuickStatsSkeleton />

						{/* Metric cards skeleton */}
						<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
							<SkeletonMetricCard rows={3} />
							<SkeletonMetricCard rows={1} />
							<SkeletonMetricCard rows={3} />
						</div>

						{/* Main content grid skeleton */}
						<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
							<RecentChatSkeleton />
							<RecentEventsSkeleton />
						</div>

						{/* Activity feed skeleton */}
						<ActivityFeedSkeleton />

						{/* Recent streams skeleton */}
						<RecentStreamsSkeleton />
					</div>
				}
				when={!isLoading()}>
				<Show
					fallback={
						<div class="flex min-h-screen items-center justify-center bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900">
							<div class="py-12 text-center">
								<h2 class="mb-4 font-bold text-2xl text-white">
									{t("dashboard.notAuthenticated")}
								</h2>
								<p class="mb-6 text-gray-300">
									{t("dashboard.signInToAccess")}
								</p>
								<a
									class="inline-block rounded-lg bg-linear-to-r from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white transition-all hover:from-purple-600 hover:to-pink-600"
									href={getLoginUrl()}>
									{t("nav.signIn")}
								</a>
							</div>
						</div>
					}
					when={user()}>
					<div class="space-y-6">
						{/* Header with greeting */}
						<div class="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
							<div>
								<h1 class="mb-2 font-bold text-3xl text-gray-900">
									{greeting}, {prefs.data()?.name || user()?.name || "Streamer"}
									!
								</h1>
								<p class="text-gray-600">{t("dashboard.welcomeMessage")}</p>
							</div>
						</div>

						{/* Quick Stats */}
						<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
							<Card class="p-4" padding="sm">
								<div class="flex items-center gap-3">
									<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
										<svg
											aria-hidden="true"
											class="h-5 w-5 text-blue-600"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24">
											<path
												d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
											/>
										</svg>
									</div>
									<div>
										<p class="font-bold text-2xl text-gray-900">
											{stats.totalMessages()}
										</p>
										<p class="text-gray-500 text-sm">
											{t("dashboard.messages")}
										</p>
									</div>
								</div>
							</Card>

							<Card class="p-4" padding="sm">
								<div class="flex items-center gap-3">
									<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
										<svg
											aria-hidden="true"
											class="h-5 w-5 text-purple-600"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24">
											<path
												d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
											/>
											<path
												d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
											/>
										</svg>
									</div>
									<div>
										<p class="font-bold text-2xl text-gray-900">
											{stats.uniqueViewers()}
										</p>
										<p class="text-gray-500 text-sm">
											{t("dashboard.viewers")}
										</p>
									</div>
								</div>
							</Card>

							<Card class="p-4" padding="sm">
								<div class="flex items-center gap-3">
									<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-100">
										<svg
											aria-hidden="true"
											class="h-5 w-5 text-pink-600"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24">
											<path
												d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
											/>
										</svg>
									</div>
									<div>
										<p class="font-bold text-2xl text-gray-900">
											{stats.followCount()}
										</p>
										<p class="text-gray-500 text-sm">
											{t("dashboard.followers")}
										</p>
									</div>
								</div>
							</Card>

							<Card class="p-4" padding="sm">
								<div class="flex items-center gap-3">
									<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
										<svg
											aria-hidden="true"
											class="h-5 w-5 text-green-600"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24">
											<path
												d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
											/>
										</svg>
									</div>
									<div>
										<p class="font-bold text-2xl text-gray-900">
											${stats.totalDonations().toFixed(2)}
										</p>
										<p class="text-gray-500 text-sm">
											{t("dashboard.donations")}
										</p>
									</div>
								</div>
							</Card>
						</div>

						{/* New Features Row: Stream Health, Engagement Score, Goals */}
						<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
							<StreamHealthMonitor />
							<ViewerEngagementScore
								chatMessages={stats.totalMessages()}
								donations={stats.donationCount()}
								follows={stats.followCount()}
								totalDonationAmount={stats.totalDonations()}
							/>
							<StreamGoalsTracker
								currentDonations={stats.totalDonations()}
								currentFollowers={stats.followCount()}
								currentMessages={stats.totalMessages()}
							/>
						</div>

						{/* Main Content Grid */}
						<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
							{/* Recent Chat Messages */}
							<Card padding="none">
								<div class="flex items-center justify-between border-gray-200 border-b px-6 py-4">
									<h3 class={text.h3}>{t("dashboard.recentChat")}</h3>
									<A
										class="text-purple-600 text-sm hover:text-purple-700"
										href="/dashboard/chat-history">
										{t("dashboard.viewAll")}
									</A>
								</div>
								<div class="divide-y divide-gray-100">
									<Show
										fallback={
											<div class="px-6 py-8 text-center">
												<svg
													aria-hidden="true"
													class="mx-auto mb-3 h-12 w-12 text-gray-300"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24">
													<path
														d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
													/>
												</svg>
												<p class="text-gray-500 text-sm">
													{t("dashboard.noChatMessages")}
												</p>
												<p class="mt-1 text-gray-400 text-xs">
													{t("dashboard.messagesWillAppear")}
												</p>
											</div>
										}
										when={recentMessages().length > 0}>
										<For each={recentMessages()}>
											{(msg) => (
												<div class="px-6 py-3 hover:bg-gray-50">
													<div class="flex items-start gap-3">
														<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100">
															<span class="font-medium text-purple-600 text-sm">
																{msg.sender_username[0].toUpperCase()}
															</span>
														</div>
														<div class="min-w-0 flex-1">
															<div class="flex items-center gap-2">
																<span class="font-medium text-gray-900 text-sm">
																	{msg.sender_username}
																</span>
																<Show when={msg.sender_is_moderator}>
																	<Badge variant="info">Mod</Badge>
																</Show>
																<span class="text-gray-400 text-xs">
																	{formatTimeAgo(msg.inserted_at)}
																</span>
															</div>
															<p class="truncate text-gray-600 text-sm">
																{msg.message}
															</p>
														</div>
													</div>
												</div>
											)}
										</For>
									</Show>
								</div>
							</Card>

							{/* Recent Events */}
							<Card padding="none">
								<div class="flex items-center justify-between border-gray-200 border-b px-6 py-4">
									<h3 class={text.h3}>{t("dashboard.recentEvents")}</h3>
									<A
										class="text-purple-600 text-sm hover:text-purple-700"
										href="/dashboard/stream-history">
										{t("dashboard.viewAll")}
									</A>
								</div>
								<div class="divide-y divide-gray-100">
									<Show
										fallback={
											<div class="px-6 py-8 text-center">
												<svg
													aria-hidden="true"
													class="mx-auto mb-3 h-12 w-12 text-gray-300"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24">
													<path
														d="M13 10V3L4 14h7v7l9-11h-7z"
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
													/>
												</svg>
												<p class="text-gray-500 text-sm">
													{t("dashboard.noEventsYet")}
												</p>
												<p class="mt-1 text-gray-400 text-xs">
													{t("dashboard.eventsWillAppear")}
												</p>
											</div>
										}
										when={recentEvents().length > 0}>
										<For each={recentEvents()}>
											{(event) => (
												<div class="px-6 py-3 hover:bg-gray-50">
													<div class="flex items-center gap-3">
														<div
															class={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${getEventBgColor(event.type)}`}>
															<EventIcon type={event.type} />
														</div>
														<div class="min-w-0 flex-1">
															<div class="flex items-center gap-2">
																<span class="font-medium text-gray-900 text-sm capitalize">
																	{event.type}
																</span>
																<span class="text-gray-400 text-xs">
																	{formatTimeAgo(event.inserted_at)}
																</span>
															</div>
															<p class="truncate text-gray-600 text-sm">
																<Show
																	fallback={t("dashboard.anonymous")}
																	when={event.data?.username}>
																	{event.data?.username as string}
																</Show>
																<Show
																	when={
																		event.type === "donation" &&
																		event.data?.amount
																	}>
																	{" - "}$
																	{Number(event.data?.amount).toFixed(2)}
																</Show>
															</p>
														</div>
													</div>
												</div>
											)}
										</For>
									</Show>
								</div>
							</Card>
						</div>

						{/* Activity Feed with Filters */}
						<ActivityFeed events={allEvents()} />

						{/* Recent Streams */}
						<Card padding="none">
							<div class="flex items-center justify-between border-gray-200 border-b px-6 py-4">
								<h3 class={text.h3}>{t("dashboard.recentStreams")}</h3>
								<A
									class="text-purple-600 text-sm hover:text-purple-700"
									href="/dashboard/stream-history">
									{t("dashboard.viewAll")}
								</A>
							</div>
							<Show
								fallback={
									<div class="px-6 py-8 text-center">
										<svg
											aria-hidden="true"
											class="mx-auto mb-3 h-12 w-12 text-gray-300"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24">
											<path
												d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
											/>
										</svg>
										<p class="text-gray-500 text-sm">
											{t("dashboard.noStreamsYet")}
										</p>
										<p class="mt-1 text-gray-400 text-xs">
											{t("dashboard.streamsWillAppear")}
										</p>
									</div>
								}
								when={recentStreams().length > 0}>
								<div class="divide-y divide-gray-100">
									<For each={recentStreams()}>
										{(stream) => (
											<A
												class="block px-6 py-4 hover:bg-gray-50"
												href={`/dashboard/stream-history/${stream.id}`}>
												<div class="flex items-center justify-between">
													<div class="flex items-center gap-4">
														<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
															<svg
																aria-hidden="true"
																class="h-6 w-6 text-purple-600"
																fill="none"
																stroke="currentColor"
																viewBox="0 0 24 24">
																<path
																	d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
																	stroke-linecap="round"
																	stroke-linejoin="round"
																	stroke-width="2"
																/>
															</svg>
														</div>
														<div>
															<h4 class="font-medium text-gray-900">
																{stream.title || t("dashboard.untitledStream")}
															</h4>
															<p class="text-gray-500 text-sm">
																{stream.started_at
																	? new Date(
																			stream.started_at,
																		).toLocaleDateString()
																	: t("dashboard.notStarted")}
															</p>
														</div>
													</div>
													<Badge
														variant={getStreamStatusBadgeVariant(
															stream.status,
														)}>
														{stream.status}
													</Badge>
												</div>
											</A>
										)}
									</For>
								</div>
							</Show>
						</Card>

						{/* Quick Actions */}
						<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
							<A
								class="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-purple-200 hover:shadow-md"
								href="/dashboard/widgets">
								<div class="flex items-center gap-4">
									<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-r from-indigo-500 to-purple-500 transition-transform group-hover:scale-105">
										<svg
											aria-hidden="true"
											class="h-6 w-6 text-white"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24">
											<path
												d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
											/>
										</svg>
									</div>
									<div>
										<h3 class="font-semibold text-gray-900">
											{t("dashboard.widgets")}
										</h3>
										<p class="text-gray-500 text-sm">
											{t("dashboard.customizeOverlays")}
										</p>
									</div>
								</div>
							</A>

							<A
								class="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-purple-200 hover:shadow-md"
								href="/dashboard/analytics">
								<div class="flex items-center gap-4">
									<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-r from-green-500 to-emerald-500 transition-transform group-hover:scale-105">
										<svg
											aria-hidden="true"
											class="h-6 w-6 text-white"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24">
											<path
												d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
											/>
										</svg>
									</div>
									<div>
										<h3 class="font-semibold text-gray-900">
											{t("dashboardNav.analytics")}
										</h3>
										<p class="text-gray-500 text-sm">
											{t("dashboard.viewStats")}
										</p>
									</div>
								</div>
							</A>

							<A
								class="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-purple-200 hover:shadow-md"
								href="/dashboard/settings">
								<div class="flex items-center gap-4">
									<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-r from-pink-500 to-rose-500 transition-transform group-hover:scale-105">
										<svg
											aria-hidden="true"
											class="h-6 w-6 text-white"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24">
											<path
												d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
											/>
											<path
												d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
											/>
										</svg>
									</div>
									<div>
										<h3 class="font-semibold text-gray-900">
											{t("dashboardNav.settings")}
										</h3>
										<p class="text-gray-500 text-sm">
											{t("dashboard.configureAccount")}
										</p>
									</div>
								</div>
							</A>
						</div>
					</div>

					{/* Quick Actions Floating Panel */}
					<QuickActionsPanel onTestAlert={handleTestAlert} />

					{/* Test Alert Notification */}
					<Show when={showTestAlert()}>
						<div
							class="fixed top-4 right-4 z-50 animate-slide-in rounded-xl bg-linear-to-r from-purple-600 to-pink-600 px-6 py-4 text-white shadow-2xl"
							data-testid="test-alert">
							<div class="flex items-center gap-3">
								<div class="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
									<svg
										aria-hidden="true"
										class="h-6 w-6"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24">
										<path
											d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
										/>
									</svg>
								</div>
								<div>
									<p class="font-bold">{t("dashboard.testAlertTitle")}</p>
									<p class="text-sm opacity-90">
										{t("dashboard.alertsWorking")}
									</p>
								</div>
							</div>
						</div>
					</Show>
				</Show>
			</Show>
		</>
	);
}
