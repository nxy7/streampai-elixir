import { Title } from "@solidjs/meta";
import { A, useParams } from "@solidjs/router";
import {
	ErrorBoundary,
	For,
	Show,
	Suspense,
	createMemo,
	createResource,
	createSignal,
} from "solid-js";
import {
	Badge,
	Button,
	Card,
	Skeleton,
	SkeletonListItem,
} from "~/design-system";
import { useTranslation } from "~/i18n";
import { getLoginUrl, useCurrentUser } from "~/lib/auth";
import { useBreadcrumbs } from "~/lib/BreadcrumbContext";
import { formatDuration } from "~/lib/formatters";
import {
	type SuccessDataFunc,
	getLivestream,
	getLivestreamChat,
	getLivestreamEvents,
} from "~/sdk/ash_rpc";

// Field selections for RPC calls
const livestreamFields: (
	| "id"
	| "title"
	| "description"
	| "startedAt"
	| "endedAt"
	| "category"
	| "subcategory"
	| "language"
	| "tags"
	| "thumbnailUrl"
	| "averageViewers"
	| "peakViewers"
	| "messagesAmount"
	| "durationSeconds"
	| "platforms"
)[] = [
	"id",
	"title",
	"description",
	"startedAt",
	"endedAt",
	"category",
	"subcategory",
	"language",
	"tags",
	"thumbnailUrl",
	"averageViewers",
	"peakViewers",
	"messagesAmount",
	"durationSeconds",
	"platforms",
];

const chatMessageFields = [
	"id",
	"type",
	{
		data: [
			{
				chatMessage: [
					"message",
					"username",
					"senderChannelId",
					"isModerator",
					"isPatreon",
					"isSentByStreamer",
					"deliveryStatus",
				],
			},
		],
	},
	"platform",
	"insertedAt",
	"viewerId",
];

const streamEventFields = [
	"id",
	"type",
	{
		data: [
			{
				donation: [
					"donorName",
					"amount",
					"currency",
					"message",
					"platformDonationId",
					"username",
					"channelId",
					"amountMicros",
					"amountCents",
					"comment",
					"metadata",
				],
				follow: ["username", "displayName"],
				subscription: [
					"username",
					"tier",
					"months",
					"message",
					"channelId",
					"metadata",
				],
				raid: ["raiderName", "viewerCount", "message"],
				platformStarted: ["platform"],
				platformStopped: ["platform"],
			},
		],
	},
	"authorId",
	"platform",
	"insertedAt",
];

type Livestream = SuccessDataFunc<
	typeof getLivestream<typeof livestreamFields>
>;

interface ChatMessageEvent {
	id: string;
	type: string;
	data: {
		chatMessage?: {
			message?: string;
			username?: string;
			senderChannelId?: string | null;
			isModerator?: boolean | null;
			isPatreon?: boolean | null;
			isSentByStreamer?: boolean | null;
			deliveryStatus?: Record<string, unknown> | null;
		};
	};
	platform: string | null;
	insertedAt: string;
	viewerId: string | null;
}

interface StreamActivityEvent {
	id: string;
	type: string;
	data: {
		donation?: {
			donorName?: string;
			amount?: number;
			currency?: string;
			message?: string;
			username?: string;
		};
		follow?: { username?: string; displayName?: string };
		subscription?: {
			username?: string;
			tier?: string;
			months?: number;
			message?: string;
		};
		raid?: { raiderName?: string; viewerCount?: number; message?: string };
		platformStarted?: { platform?: string };
		platformStopped?: { platform?: string };
	};
	authorId: string;
	platform: string | null;
	insertedAt: string;
}

// Helper functions for formatting

const formatDate = (dateString: string) => {
	const date = new Date(dateString);
	return date.toLocaleDateString("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
};

const formatTimelineTime = (stream: Livestream, position: number) => {
	const progress = position / 100;
	const seconds = Math.floor((stream.durationSeconds || 0) * progress);
	return formatDuration(seconds);
};

const getPlatformBadgeVariant = (
	platform: string,
): "info" | "error" | "success" | "warning" | "neutral" => {
	const variants: Record<
		string,
		"info" | "error" | "success" | "warning" | "neutral"
	> = {
		twitch: "info",
		youtube: "error",
		facebook: "info",
		kick: "success",
	};
	return variants[platform.toLowerCase()] || "neutral";
};

const platformName = (platform: string) => {
	const names: Record<string, string> = {
		twitch: "Twitch",
		youtube: "YouTube",
		facebook: "Facebook",
		kick: "Kick",
	};
	return names[platform.toLowerCase()] || platform;
};

const platformInitial = (platform: string) => {
	const initials: Record<string, string> = {
		twitch: "T",
		youtube: "Y",
		facebook: "F",
		kick: "K",
	};
	return initials[platform.toLowerCase()] || platform[0]?.toUpperCase();
};

const formatCategoryLabel = (category?: string | null) => {
	if (!category) return null;
	return category
		.split("_")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
};

const languageName = (code?: string | null) => {
	if (!code) return null;
	const names: Record<string, string> = {
		en: "English",
		es: "Spanish",
		fr: "French",
		de: "German",
		it: "Italian",
		pt: "Portuguese",
		ru: "Russian",
		ja: "Japanese",
		ko: "Korean",
		zh: "Chinese",
		ar: "Arabic",
		hi: "Hindi",
		pl: "Polish",
		nl: "Dutch",
		tr: "Turkish",
	};
	return names[code] || code;
};

// Skeleton for stream detail page
function StreamDetailSkeleton() {
	return (
		<div class="mx-auto max-w-7xl">
			{/* Stream Header skeleton */}
			<Card class="mb-6">
				<div class="flex items-start space-x-4">
					<Skeleton class="aspect-video w-48 shrink-0 rounded-lg" />
					<div class="flex-1 space-y-3">
						<Skeleton class="h-8 w-3/4" />
						<div class="flex items-center gap-2">
							<Skeleton class="h-6 w-16 rounded" />
							<Skeleton class="h-4 w-32" />
							<Skeleton class="h-4 w-24" />
							<Skeleton class="h-4 w-28" />
						</div>
						<div class="flex items-center gap-2">
							<Skeleton class="h-6 w-20 rounded-md" />
							<Skeleton class="h-6 w-16 rounded-md" />
							<Skeleton class="h-6 w-14 rounded-md" />
						</div>
					</div>
					<Skeleton class="h-10 w-32 shrink-0 rounded-md" />
				</div>
			</Card>

			<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
				{/* Main Content skeleton */}
				<div class="space-y-6 lg:col-span-2">
					{/* Chart skeleton */}
					<Card>
						<Skeleton class="mb-4 h-6 w-48" />
						<Skeleton class="h-64 w-full rounded-lg" />
					</Card>

					{/* Player skeleton */}
					<Card>
						<Skeleton class="mb-4 h-6 w-36" />
						<Skeleton class="aspect-video w-full rounded-lg" />
					</Card>

					{/* Timeline skeleton */}
					<Card>
						<Skeleton class="mb-4 h-6 w-36" />
						<Skeleton class="mb-6 h-3 w-full rounded-full" />
						<Skeleton class="h-2 w-full rounded-lg" />
						<div class="mt-4 flex items-center space-x-4">
							<For each={[1, 2, 3, 4]}>
								{() => (
									<div class="flex items-center">
										<Skeleton class="mr-1 h-3 w-3 rounded-full" />
										<Skeleton class="h-3 w-16" />
									</div>
								)}
							</For>
						</div>
					</Card>
				</div>

				{/* Sidebar skeleton */}
				<div class="space-y-6">
					{/* Insights skeleton */}
					<Card>
						<Skeleton class="mb-4 h-6 w-32" />
						<div class="space-y-4">
							<Skeleton class="h-24 w-full rounded-lg" />
							<Skeleton class="h-24 w-full rounded-lg" />
						</div>
					</Card>

					{/* Chat skeleton */}
					<Card class="p-0">
						<div class="border-neutral-200 border-b px-6 py-4">
							<Skeleton class="h-6 w-28" />
							<Skeleton class="mt-1 h-3 w-40" />
						</div>
						<div class="h-96 overflow-y-auto p-3">
							<div class="space-y-3">
								<For each={[1, 2, 3, 4, 5, 6, 7, 8]}>
									{() => (
										<SkeletonListItem avatarSize="sm" lines={2} showAvatar />
									)}
								</For>
							</div>
						</div>
					</Card>
				</div>
			</div>
		</div>
	);
}

interface StreamInsights {
	peakMoment: {
		time: string;
		timelinePosition: number;
		viewers: number;
		description: string;
	};
	mostActiveChat: {
		startTime?: string;
		messageCount: number;
		timelinePosition: number;
		description?: string;
	};
	totalEvents: number;
	chatActivity: {
		totalMessages: number;
		messagesPerMinute: number;
		activityLevel: string;
	};
}

export default function StreamHistoryDetail() {
	const params = useParams();
	const { user, isLoading } = useCurrentUser();

	return (
		<>
			<Title>Stream Details - Streampai</Title>
			<Show fallback={<StreamDetailSkeleton />} when={!isLoading()}>
				<Show
					fallback={
						<div class="flex min-h-screen items-center justify-center bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900">
							<div class="py-12 text-center">
								<h2 class="mb-4 font-bold text-2xl text-white">
									Not Authenticated
								</h2>
								<p class="mb-6 text-neutral-300">
									Please sign in to view stream details.
								</p>
								<A href={getLoginUrl()}>
									<Button size="lg" variant="gradient">
										Sign In
									</Button>
								</A>
							</div>
						</div>
					}
					when={user()}>
					<ErrorBoundary
						fallback={(err) => (
							<div class="mx-auto mt-8 max-w-7xl">
								<div class="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
									Error loading stream: {err.message}
									<br />
									<A
										class="mt-2 inline-block text-red-600 underline hover:text-red-800"
										href="/dashboard/stream-history">
										← Back to History
									</A>
								</div>
							</div>
						)}>
						<Suspense fallback={<StreamDetailSkeleton />}>
							<StreamDetailContent streamId={params.id ?? ""} />
						</Suspense>
					</ErrorBoundary>
				</Show>
			</Show>
		</>
	);
}

function StreamDetailContent(props: { streamId: string }) {
	const { t } = useTranslation();

	// Fetch livestream data
	const [livestreamData] = createResource(
		() => props.streamId,
		async (streamId) => {
			const result = await getLivestream({
				getBy: { id: streamId },
				fields: [...livestreamFields],
				fetchOptions: { credentials: "include" },
			});
			if (!result.success) {
				throw new Error(result.errors[0]?.message || "Failed to fetch stream");
			}
			return result.data;
		},
	);

	// Fetch chat messages
	const [chatData] = createResource(
		() => props.streamId,
		async (livestreamId) => {
			const result = await getLivestreamChat({
				input: { livestreamId },
				// biome-ignore lint/suspicious/noExplicitAny: field type mismatch with generated SDK
				fields: chatMessageFields as any,
				fetchOptions: { credentials: "include" },
			});
			if (!result.success) {
				console.error("Failed to fetch chat messages:", result.errors);
				return [] as ChatMessageEvent[];
			}
			return result.data as unknown as ChatMessageEvent[];
		},
	);

	// Fetch stream events
	const [eventsData] = createResource(
		() => props.streamId,
		async (livestreamId) => {
			const result = await getLivestreamEvents({
				input: { livestreamId },
				// biome-ignore lint/suspicious/noExplicitAny: field type mismatch with generated SDK
				fields: streamEventFields as any,
				fetchOptions: { credentials: "include" },
			});
			if (!result.success) {
				console.error("Failed to fetch stream events:", result.errors);
				return [] as StreamActivityEvent[];
			}
			return result.data as unknown as StreamActivityEvent[];
		},
	);

	const stream = () => livestreamData();
	const chatMessages = () => chatData() ?? [];
	const events = () => eventsData() ?? [];
	const [currentTimelinePosition, setCurrentTimelinePosition] = createSignal(0);

	// Register breadcrumbs via context
	useBreadcrumbs(() => [
		{
			label: t("dashboardNav.streamHistory"),
			href: "/dashboard/stream-history",
		},
		{ label: stream()?.title ?? t("common.loading") },
	]);

	// Generate insights
	const insights = createMemo<StreamInsights>(() => {
		const streamData = stream();
		const messages = chatMessages();
		const streamEvents = events();

		if (!streamData) {
			return {
				peakMoment: {
					time: new Date().toISOString(),
					timelinePosition: 0,
					viewers: 0,
					description: "Viewer data not yet available",
				},
				mostActiveChat: {
					messageCount: 0,
					timelinePosition: 0,
				},
				totalEvents: 0,
				chatActivity: {
					totalMessages: 0,
					messagesPerMinute: 0,
					activityLevel: "Low",
				},
			};
		}

		const chatDensity =
			streamData.durationSeconds && streamData.durationSeconds > 0
				? messages.length / (streamData.durationSeconds / 60)
				: 0;

		const activityLevel =
			chatDensity > 5
				? "Very High"
				: chatDensity > 2
					? "High"
					: chatDensity > 1
						? "Medium"
						: "Low";

		// Find peak viewer moment
		const peakMoment = {
			time: streamData.startedAt,
			timelinePosition: 0,
			viewers: streamData.peakViewers || 0,
			description: "Peak viewers reached",
		};

		// Find most active chat period (simplified - would need actual time-based analysis)
		const mostActiveChat = {
			messageCount: messages.length,
			timelinePosition: 0,
			description: messages.length > 0 ? "Most active chat period" : undefined,
		};

		return {
			peakMoment,
			mostActiveChat,
			totalEvents: streamEvents.length,
			chatActivity: {
				totalMessages: messages.length,
				messagesPerMinute: Math.round(chatDensity * 10) / 10,
				activityLevel,
			},
		};
	});

	// Filter chat messages up to current timeline position
	const filteredChatMessages = createMemo(() => {
		const streamData = stream();
		const messages = chatMessages();
		const position = currentTimelinePosition();

		if (!streamData || position === 0) {
			return messages.slice(0, 50);
		}

		const progress = position / 100;
		const targetSeconds = (streamData.durationSeconds || 0) * progress;
		const targetTime = new Date(
			new Date(streamData.startedAt).getTime() + targetSeconds * 1000,
		);

		const filtered = messages.filter((msg) => {
			return new Date(msg.insertedAt) <= targetTime;
		});

		return filtered.slice(-50);
	});

	// Generate viewer chart points (simplified - would need actual metric data)
	const viewerChartPoints = createMemo(() => {
		const streamData = stream();
		if (!streamData || !streamData.peakViewers) return "";

		// Generate sample points for visualization
		const points: string[] = [];
		const chartWidth = 760;
		const chartHeight = 250;
		const xOffset = 40;
		const numPoints = 20;

		for (let i = 0; i <= numPoints; i++) {
			const x = xOffset + (i / numPoints) * chartWidth;
			// Simple curve that peaks in the middle
			const normalized = Math.sin((i / numPoints) * Math.PI);
			const y = chartHeight - normalized * chartHeight;
			points.push(`${x},${y}`);
		}

		return points.join(" ");
	});

	return (
		<div class="mx-auto max-w-7xl space-y-6">
			{/* Stream Header */}
			<Card>
				<div class="flex items-start space-x-4">
					<Show when={stream()?.thumbnailUrl}>
						<img
							alt="Stream thumbnail"
							class="aspect-video w-48 rounded-lg object-cover"
							onError={(e) => {
								(e.target as HTMLImageElement).style.display = "none";
							}}
							src={stream()?.thumbnailUrl ?? ""}
						/>
					</Show>
					<div class="flex-1">
						<h1 class="mb-2 font-bold text-2xl text-neutral-900">
							{stream()?.title}
						</h1>
						<div class="flex flex-wrap items-center gap-y-2 space-x-2 text-neutral-600 text-sm">
							<For each={stream()?.platforms || []}>
								{(platform) => (
									<Badge variant={getPlatformBadgeVariant(platform)}>
										{platformName(platform)}
									</Badge>
								)}
							</For>
							<span>{formatDate(stream()?.startedAt || "")}</span>
							<span>
								Duration: {formatDuration(stream()?.durationSeconds || 0)}
							</span>
							<span>Peak: {stream()?.peakViewers || 0} viewers</span>
						</div>

						{/* Category, Subcategory, Language, Tags */}
						<div class="mt-3 flex flex-wrap items-center gap-y-2 space-x-2">
							<Show when={stream()?.category}>
								<Badge class="rounded-md" variant="info">
									<svg
										aria-hidden="true"
										class="mr-1 h-3 w-3"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24">
										<path
											d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
										/>
									</svg>
									{formatCategoryLabel(stream()?.category)}
								</Badge>
							</Show>

							<Show when={stream()?.subcategory}>
								<Badge class="rounded-md" variant="info">
									{formatCategoryLabel(stream()?.subcategory)}
								</Badge>
							</Show>

							<Show when={stream()?.language}>
								<Badge class="rounded-md" variant="info">
									<svg
										aria-hidden="true"
										class="mr-1 h-3 w-3"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24">
										<path
											d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
										/>
									</svg>
									{languageName(stream()?.language)}
								</Badge>
							</Show>

							<For each={stream()?.tags || []}>
								{(tag) => (
									<Badge class="rounded-md" variant="neutral">
										#{tag}
									</Badge>
								)}
							</For>
						</div>
					</div>
				</div>
			</Card>

			<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
				{/* Main Content */}
				<div class="space-y-6 lg:col-span-2">
					{/* Viewer Chart */}
					<Card>
						<h3 class="mb-4 font-medium text-lg text-neutral-900">
							Viewer Count Over Time
						</h3>
						<Show
							fallback={
								<div class="relative flex h-64 items-center justify-center rounded-lg bg-neutral-50">
									<div class="text-center text-neutral-400">
										<svg
											aria-hidden="true"
											class="mx-auto mb-4 h-16 w-16"
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
										<p class="font-medium text-lg">
											Viewer Data Not Yet Available
										</p>
										<p class="text-sm">
											Viewer tracking will be available soon
										</p>
									</div>
								</div>
							}
							when={stream()?.peakViewers && (stream()?.peakViewers ?? 0) > 0}>
							<div class="relative h-64">
								<svg
									aria-hidden="true"
									class="h-full w-full"
									preserveAspectRatio="none"
									viewBox="0 0 800 250">
									{/* Grid lines */}
									<g class="grid-lines" stroke="#e5e7eb" stroke-width="1">
										<For each={[0, 1, 2, 3, 4]}>
											{(i) => <line x1="40" x2="800" y1={50 * i} y2={50 * i} />}
										</For>
									</g>
									{/* Data line */}
									<polyline
										fill="none"
										points={viewerChartPoints()}
										stroke="rgb(var(--color-primary))"
										stroke-width="2"
									/>
									{/* Y-axis labels */}
									<g class="y-axis-labels" fill="#6b7280" font-size="12">
										<For each={[0, 1, 2, 3, 4]}>
											{(i) => (
												<text text-anchor="start" x="5" y={250 - 50 * i}>
													{Math.round(((stream()?.peakViewers || 0) * i) / 4)}
												</text>
											)}
										</For>
									</g>
								</svg>
								{/* X-axis time labels */}
								<div class="mt-2 flex justify-between px-10 text-neutral-500 text-xs">
									<span>0:00</span>
									<span>
										{formatDuration(
											Math.floor((stream()?.durationSeconds || 0) / 2),
										)}
									</span>
									<span>{formatDuration(stream()?.durationSeconds || 0)}</span>
								</div>
							</div>
						</Show>
					</Card>

					{/* Stream Playback Placeholder */}
					<Card>
						<h3 class="mb-4 font-medium text-lg text-neutral-900">
							Stream Playback
						</h3>
						<div class="flex aspect-video items-center justify-center rounded-lg bg-neutral-900">
							<div class="text-center text-neutral-400">
								<svg
									aria-hidden="true"
									class="mx-auto mb-4 h-16 w-16"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24">
									<path
										d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M6 6v6a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2H8a2 2 0 00-2 2z"
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
									/>
								</svg>
								<p class="font-medium text-lg">Stream Playback</p>
								<p class="text-sm">Video playback will be available here</p>
							</div>
						</div>
					</Card>

					{/* Timeline with Events */}
					<Card>
						<h3 class="mb-4 font-medium text-lg text-neutral-900">
							Stream Timeline
						</h3>
						<div class="relative">
							{/* Timeline bar */}
							<div class="relative mb-6 h-3 rounded-full bg-neutral-200">
								<div
									class="absolute h-full rounded-full bg-primary"
									style={{
										width: `${currentTimelinePosition()}%`,
									}}
								/>
							</div>

							{/* Timeline controls */}
							<div class="flex items-center space-x-4">
								<input
									class="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-neutral-200"
									max="100"
									min="0"
									onInput={(e) =>
										setCurrentTimelinePosition(
											parseInt(e.currentTarget.value, 10),
										)
									}
									type="range"
									value={currentTimelinePosition()}
								/>
								<span class="min-w-15 font-medium text-neutral-600 text-sm">
									<Show fallback="0:00" when={stream()}>
										{(s) => formatTimelineTime(s(), currentTimelinePosition())}
									</Show>
								</span>
							</div>

							{/* Event legend */}
							<div class="mt-4 flex items-center space-x-4 text-xs">
								<div class="flex items-center">
									<div class="mr-1 h-3 w-3 rounded-full bg-green-500" />
									Donations
								</div>
								<div class="flex items-center">
									<div class="mr-1 h-3 w-3 rounded-full bg-blue-500" />
									Follows
								</div>
								<div class="flex items-center">
									<div class="mr-1 h-3 w-3 rounded-full bg-primary-light" />
									Subscriptions
								</div>
								<div class="flex items-center">
									<div class="mr-1 h-3 w-3 rounded-full bg-orange-500" />
									Raids
								</div>
							</div>
						</div>
					</Card>
				</div>

				{/* Sidebar */}
				<div class="space-y-6">
					{/* Stream Insights */}
					<Card>
						<h3 class="mb-4 font-medium text-lg text-neutral-900">
							Stream Insights
						</h3>

						<div class="space-y-4">
							<div class="rounded-lg bg-primary-50 p-4">
								<h4 class="mb-2 font-medium text-primary-900">Peak Moment</h4>
								<p class="text-primary-hover text-sm">
									{insights().peakMoment.description} at{" "}
									<button
										class="font-medium text-primary-800 underline hover:text-primary-900"
										onClick={() =>
											setCurrentTimelinePosition(
												insights().peakMoment.timelinePosition,
											)
										}
										type="button">
										<Show fallback="0:00" when={stream()}>
											{formatTimelineTime(
												stream() as NonNullable<ReturnType<typeof stream>>,
												insights().peakMoment.timelinePosition,
											)}
										</Show>
									</button>
								</p>
								<p class="mt-1 text-primary text-xs">
									{insights().peakMoment.viewers} concurrent viewers
								</p>
							</div>

							<div class="rounded-lg bg-blue-50 p-4">
								<h4 class="mb-2 font-medium text-blue-900">Chat Activity</h4>
								<p class="text-blue-700 text-sm">
									{insights().chatActivity.activityLevel} activity level
								</p>
								<p class="mt-1 text-blue-600 text-xs">
									{insights().chatActivity.messagesPerMinute} messages/min
									average
								</p>
								<Show when={insights().mostActiveChat.messageCount > 0}>
									<p class="mt-2 text-blue-600 text-xs">
										{insights().chatActivity.totalMessages} total messages
									</p>
								</Show>
							</div>
						</div>
					</Card>

					{/* Stream Chat */}
					<Card class="p-0">
						<div class="border-neutral-200 border-b px-6 py-4">
							<h3 class="font-medium text-lg text-neutral-900">Chat Replay</h3>
							<p class="mt-1 text-neutral-500 text-xs">
								Showing messages up to{" "}
								<Show fallback="0:00" when={stream()}>
									{(s) => formatTimelineTime(s(), currentTimelinePosition())}
								</Show>
							</p>
						</div>

						<div class="h-96 overflow-y-auto">
							<div class="divide-y divide-neutral-100">
								<For each={filteredChatMessages()}>
									{(message) => (
										<div class="p-3">
											<div class="flex items-start space-x-2">
												<div class="shrink-0">
													<div
														class={`flex h-6 w-6 items-center justify-center rounded-full ${
															message.data.chatMessage?.isPatreon
																? "bg-primary-100"
																: "bg-neutral-100"
														}`}>
														<span
															class={`font-medium text-xs ${
																message.data.chatMessage?.isPatreon
																	? "text-primary"
																	: "text-neutral-600"
															}`}>
															{message.data.chatMessage?.username?.charAt(0) ||
																"?"}
														</span>
													</div>
												</div>
												<div class="min-w-0 flex-1">
													<div class="flex items-center space-x-1">
														<span
															class={`font-medium text-xs ${
																message.data.chatMessage?.isModerator
																	? "text-green-600"
																	: "text-neutral-900"
															}`}>
															{message.data.chatMessage?.username}
														</span>
														<Show when={message.platform}>
															<Badge
																variant={getPlatformBadgeVariant(
																	message.platform ?? "",
																)}>
																{platformInitial(message.platform ?? "")}
															</Badge>
														</Show>
														<Show when={message.data.chatMessage?.isModerator}>
															<Badge variant="success">MOD</Badge>
														</Show>
														<Show when={message.data.chatMessage?.isPatreon}>
															<Badge variant="info">SUB</Badge>
														</Show>
													</div>
													<p class="mt-0.5 text-neutral-600 text-xs">
														{message.data.chatMessage?.message}
													</p>
												</div>
											</div>
										</div>
									)}
								</For>
							</div>
						</div>
					</Card>
				</div>
			</div>
		</div>
	);
}
