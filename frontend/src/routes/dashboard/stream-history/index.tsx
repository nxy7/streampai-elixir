import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";
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
	Alert,
	Badge,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Skeleton,
	Stat,
} from "~/components/ui";
import { getLoginUrl, useCurrentUser } from "~/lib/auth";
import { type SuccessDataFunc, getStreamHistory } from "~/sdk/ash_rpc";

type Platform = "twitch" | "youtube" | "facebook" | "kick" | "all";
type DateRange = "7days" | "30days" | "all";
type SortBy = "recent" | "duration" | "viewers";

// Skeleton for stream history page
function StreamHistorySkeleton() {
	return (
		<div class="mx-auto max-w-7xl space-y-6">
			{/* Filters skeleton */}
			<Card>
				<Skeleton class="mb-4 h-6 w-32" />
				<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
					<For each={[1, 2, 3]}>
						{() => (
							<div>
								<Skeleton class="mb-2 h-4 w-20" />
								<Skeleton class="h-10 w-full rounded-lg" />
							</div>
						)}
					</For>
				</div>
			</Card>

			{/* Stats skeleton */}
			<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
				<For each={[1, 2, 3]}>
					{() => (
						<Card>
							<div class="flex flex-col items-center gap-2">
								<Skeleton class="h-8 w-8 rounded-lg" />
								<Skeleton class="h-8 w-16" />
								<Skeleton class="h-4 w-24" />
							</div>
						</Card>
					)}
				</For>
			</div>

			{/* Stream list skeleton */}
			<Card>
				<CardHeader>
					<Skeleton class="h-6 w-32" />
				</CardHeader>
				<CardContent>
					<div class="-mx-6 divide-y divide-gray-200">
						<For each={[1, 2, 3, 4, 5]}>
							{() => (
								<div class="flex items-center space-x-4 p-6">
									<Skeleton class="aspect-video h-18 w-32 shrink-0 rounded-lg" />
									<div class="min-w-0 flex-1 space-y-2">
										<Skeleton class="h-5 w-3/4" />
										<div class="flex items-center gap-2">
											<Skeleton class="h-5 w-16 rounded-full" />
											<Skeleton class="h-4 w-20" />
											<Skeleton class="h-4 w-16" />
										</div>
									</div>
									<div class="space-y-1 text-right">
										<Skeleton class="h-4 w-24" />
										<Skeleton class="h-3 w-32" />
									</div>
									<Skeleton class="h-5 w-5 shrink-0" />
								</div>
							)}
						</For>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

interface StreamStats {
	totalStreams: number;
	totalTime: string;
	avgViewers: number;
	dateRangeLabel: string;
}

const streamHistoryFields: (
	| "id"
	| "title"
	| "thumbnailUrl"
	| "startedAt"
	| "endedAt"
	| "durationSeconds"
	| "platforms"
	| "averageViewers"
	| "peakViewers"
	| "messagesAmount"
)[] = [
	"id",
	"title",
	"thumbnailUrl",
	"startedAt",
	"endedAt",
	"durationSeconds",
	"platforms",
	"averageViewers",
	"peakViewers",
	"messagesAmount",
];

type _Livestream = SuccessDataFunc<
	typeof getStreamHistory<typeof streamHistoryFields>
>[number];

export default function StreamHistory() {
	const { user, isLoading } = useCurrentUser();

	const [platform, setPlatform] = createSignal<Platform>("all");
	const [dateRange, setDateRange] = createSignal<DateRange>("30days");
	const [sortBy, setSortBy] = createSignal<SortBy>("recent");

	return (
		<>
			<Title>Stream History - Streampai</Title>
			<Show fallback={<StreamHistorySkeleton />} when={!isLoading()}>
				<Show
					fallback={
						<div class="flex min-h-screen items-center justify-center bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900">
							<div class="py-12 text-center">
								<h2 class="mb-4 font-bold text-2xl text-white">
									Not Authenticated
								</h2>
								<p class="mb-6 text-gray-300">
									Please sign in to view stream history.
								</p>
								<a
									class="inline-block rounded-lg bg-linear-to-r from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white transition-all hover:from-purple-600 hover:to-pink-600"
									href={getLoginUrl()}>
									Sign In
								</a>
							</div>
						</div>
					}
					when={user()}>
					<ErrorBoundary
						fallback={(err) => (
							<div class="mx-auto mt-8 max-w-7xl">
								<Alert variant="error">
									Error loading streams: {err.message}
								</Alert>
							</div>
						)}>
						<Suspense fallback={<StreamHistorySkeleton />}>
							<StreamHistoryContent
								dateRange={dateRange}
								platform={platform}
								setDateRange={setDateRange}
								setPlatform={setPlatform}
								setSortBy={setSortBy}
								sortBy={sortBy}
								userId={user()!.id}
							/>
						</Suspense>
					</ErrorBoundary>
				</Show>
			</Show>
		</>
	);
}

function StreamHistoryContent(props: {
	userId: string;
	platform: () => Platform;
	setPlatform: (p: Platform) => void;
	dateRange: () => DateRange;
	setDateRange: (d: DateRange) => void;
	sortBy: () => SortBy;
	setSortBy: (s: SortBy) => void;
}) {
	const [streamsData] = createResource(
		() => props.userId,
		async (userId) => {
			const result = await getStreamHistory({
				input: { userId },
				fields: [...streamHistoryFields],
				fetchOptions: { credentials: "include" },
			});
			if (!result.success) {
				throw new Error(result.errors[0]?.message || "Failed to fetch streams");
			}
			return result.data;
		},
	);

	const streams = () => streamsData() ?? [];
	const isFetching = () => streamsData.loading;

	const filteredAndSortedStreams = createMemo(() => {
		let result = [...streams()];

		if (props.platform() !== "all") {
			result = result.filter((s) =>
				s.platforms?.some((p) => p.toLowerCase() === props.platform()),
			);
		}

		const now = new Date();
		if (props.dateRange() === "7days") {
			const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
			result = result.filter((s) => new Date(s.startedAt) > cutoff);
		} else if (props.dateRange() === "30days") {
			const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
			result = result.filter((s) => new Date(s.startedAt) > cutoff);
		}

		if (props.sortBy() === "recent") {
			result.sort(
				(a, b) =>
					new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
			);
		} else if (props.sortBy() === "duration") {
			result.sort(
				(a, b) => (b.durationSeconds || 0) - (a.durationSeconds || 0),
			);
		} else if (props.sortBy() === "viewers") {
			result.sort((a, b) => (b.peakViewers || 0) - (a.peakViewers || 0));
		}

		return result;
	});

	const stats = createMemo<StreamStats>(() => {
		const streamList = filteredAndSortedStreams();
		const totalSeconds = streamList.reduce(
			(sum, s) => sum + (s.durationSeconds || 0),
			0,
		);
		const totalHours = Math.floor(totalSeconds / 3600);
		const totalMinutes = Math.floor((totalSeconds % 3600) / 60);

		const avgViewers =
			streamList.length > 0
				? Math.round(
						streamList.reduce((sum, s) => sum + (s.averageViewers || 0), 0) /
							streamList.length,
					)
				: 0;

		const dateRangeLabel =
			props.dateRange() === "7days"
				? "7 days"
				: props.dateRange() === "30days"
					? "30 days"
					: "all time";

		return {
			totalStreams: streamList.length,
			totalTime: `${totalHours}h ${totalMinutes}m`,
			avgViewers,
			dateRangeLabel,
		};
	});

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleDateString(undefined, {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	};

	const formatDuration = (seconds: number | undefined) => {
		if (!seconds) return "0m";
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		if (hours > 0) return `${hours}h ${minutes}m`;
		return `${minutes}m`;
	};

	const getPlatformBadgeVariant = (
		platformName: string,
	): "purple" | "error" | "info" | "success" | "neutral" => {
		const variants: Record<
			string,
			"purple" | "error" | "info" | "success" | "neutral"
		> = {
			twitch: "purple",
			youtube: "error",
			facebook: "info",
			kick: "success",
		};
		return variants[platformName.toLowerCase()] || "neutral";
	};

	return (
		<div class="mx-auto max-w-7xl space-y-6">
			{/* Filters */}
			<Card>
				<h3 class="mb-4 font-semibold text-gray-900 text-lg">Filter Streams</h3>
				<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
					<div>
						<label class="block font-medium text-gray-700 text-sm">
							Platform
							<select
								class="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-purple-600"
								onChange={(e) =>
									props.setPlatform(e.currentTarget.value as Platform)
								}
								value={props.platform()}>
								<option value="all">All Platforms</option>
								<option value="twitch">Twitch</option>
								<option value="youtube">YouTube</option>
								<option value="facebook">Facebook</option>
								<option value="kick">Kick</option>
							</select>
						</label>
					</div>
					<div>
						<label class="block font-medium text-gray-700 text-sm">
							Date Range
							<select
								class="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-purple-600"
								onChange={(e) =>
									props.setDateRange(e.currentTarget.value as DateRange)
								}
								value={props.dateRange()}>
								<option value="7days">Last 7 days</option>
								<option value="30days">Last 30 days</option>
								<option value="all">All time</option>
							</select>
						</label>
					</div>
					<div>
						<label class="block font-medium text-gray-700 text-sm">
							Sort By
							<select
								class="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-purple-600"
								onChange={(e) =>
									props.setSortBy(e.currentTarget.value as SortBy)
								}
								value={props.sortBy()}>
								<option value="recent">Most Recent</option>
								<option value="duration">Longest Duration</option>
								<option value="viewers">Most Viewers</option>
							</select>
						</label>
					</div>
				</div>
			</Card>

			{/* Stats Overview - only show when data is loaded */}
			<Show when={!isFetching() && streams().length >= 0}>
				<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
					<Card>
						<Stat
							icon={
								<svg
									aria-hidden="true"
									class="h-8 w-8 text-purple-500"
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
							}
							label={`Streams (${stats().dateRangeLabel})`}
							value={String(stats().totalStreams)}
						/>
					</Card>

					<Card>
						<Stat
							icon={
								<svg
									aria-hidden="true"
									class="h-8 w-8 text-blue-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24">
									<path
										d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
									/>
								</svg>
							}
							label="Total Stream Time"
							value={stats().totalTime}
						/>
					</Card>

					<Card>
						<Stat
							icon={
								<svg
									aria-hidden="true"
									class="h-8 w-8 text-green-500"
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
							}
							label="Avg Viewers"
							value={String(stats().avgViewers)}
						/>
					</Card>
				</div>
			</Show>

			{/* Stream History List */}
			<Card>
				<CardHeader>
					<CardTitle>Recent Streams</CardTitle>
				</CardHeader>
				<CardContent>
					<Show
						fallback={
							<div class="py-12 text-center">
								<svg
									aria-hidden="true"
									class="mx-auto h-12 w-12 text-gray-400"
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
								<h3 class="mt-2 font-medium text-gray-900 text-sm">
									No streams found
								</h3>
								<p class="mt-1 text-gray-500 text-sm">
									No streams match your current filters.
								</p>
							</div>
						}
						when={filteredAndSortedStreams().length > 0}>
						<div class="-mx-6 divide-y divide-gray-200">
							<For each={filteredAndSortedStreams()}>
								{(stream) => (
									<A
										class="block p-6 transition-colors hover:bg-gray-50"
										href={`/dashboard/stream-history/${stream.id}`}>
										<div class="flex items-center space-x-4">
											<Show when={stream.thumbnailUrl}>
												<div class="shrink-0">
													<img
														alt="Stream thumbnail"
														class="aspect-video w-32 rounded-lg object-cover"
														onError={(e) => {
															e.currentTarget.style.display = "none";
														}}
														src={stream.thumbnailUrl ?? ""}
													/>
												</div>
											</Show>
											<div class="min-w-0 flex-1">
												<div class="flex items-start justify-between">
													<div>
														<h4 class="truncate font-medium text-gray-900 text-sm">
															{stream.title || "Untitled Stream"}
														</h4>
														<div class="mt-1 flex flex-wrap items-center gap-1 space-x-2">
															<For each={stream.platforms || []}>
																{(platform) => (
																	<Badge
																		variant={getPlatformBadgeVariant(platform)}>
																		{platform.charAt(0).toUpperCase() +
																			platform.slice(1)}
																	</Badge>
																)}
															</For>
															<span class="text-gray-500 text-xs">
																{formatDate(stream.startedAt)}
															</span>
															<span class="text-gray-500 text-xs">
																{formatDuration(stream.durationSeconds ?? 0)}
															</span>
														</div>
													</div>
													<div class="ml-4 text-right">
														<div class="font-medium text-gray-900 text-sm">
															{stream.peakViewers || 0} peak viewers
														</div>
														<div class="text-gray-500 text-xs">
															{stream.averageViewers || 0} avg •{" "}
															{stream.messagesAmount || 0} messages
														</div>
													</div>
												</div>
											</div>
											<div class="shrink-0">
												<svg
													aria-hidden="true"
													class="h-5 w-5 text-gray-400"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24">
													<path
														d="M9 5l7 7-7 7"
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
													/>
												</svg>
											</div>
										</div>
									</A>
								)}
							</For>
						</div>
					</Show>
				</CardContent>
			</Card>
		</div>
	);
}
