import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";
import {
	For,
	Show,
	createEffect,
	createMemo,
	createSignal,
	onCleanup,
} from "solid-js";
import {
	Alert,
	Badge,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	ProgressBar,
	Skeleton,
	SkeletonChart,
	SkeletonTableRow,
	Stat,
	StatGroup,
} from "~/components/ui";
import { useTranslation } from "~/i18n";
import { getLoginUrl, useCurrentUser } from "~/lib/auth";
import { type SuccessDataFunc, getStreamHistory } from "~/sdk/ash_rpc";

type Timeframe = "day" | "week" | "month" | "year";

// Skeleton for analytics page loading state
function AnalyticsSkeleton() {
	return (
		<div class="space-y-6">
			{/* Header skeleton */}
			<div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<Skeleton class="mb-2 h-8 w-48" />
					<Skeleton class="h-4 w-72" />
				</div>
				<Skeleton class="h-10 w-40 rounded-md" />
			</div>

			{/* Charts skeleton */}
			<Card>
				<SkeletonChart />
			</Card>

			<Card>
				<div class="space-y-4">
					<Skeleton class="h-5 w-40" />
					<For each={[1, 2, 3, 4]}>
						{() => (
							<div class="space-y-2">
								<div class="flex items-center justify-between">
									<Skeleton class="h-4 w-20" />
									<Skeleton class="h-4 w-12" />
								</div>
								<Skeleton class="h-2 w-full rounded-full" />
							</div>
						)}
					</For>
				</div>
			</Card>

			{/* Table skeleton */}
			<Card>
				<CardHeader>
					<Skeleton class="h-6 w-32" />
				</CardHeader>
				<CardContent>
					<div class="-mx-6 overflow-x-auto">
						<table class="min-w-full divide-y divide-[var(--theme-border)]">
							<thead class="bg-theme-tertiary">
								<tr>
									<For each={[1, 2, 3, 4, 5, 6]}>
										{() => (
											<th class="px-6 py-3">
												<Skeleton class="h-4 w-20" />
											</th>
										)}
									</For>
								</tr>
							</thead>
							<tbody class="divide-y divide-[var(--theme-border)] bg-theme-surface">
								<For each={[1, 2, 3, 4, 5]}>
									{() => <SkeletonTableRow columns={6} />}
								</For>
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

interface ViewerDataPoint {
	time: Date;
	value: number;
}

interface PlatformData {
	label: string;
	value: number;
}

interface StreamData {
	id: string;
	title: string;
	platform: string;
	startTime: Date;
	duration: string;
	viewers: {
		peak: number;
		average: number;
	};
	engagement: {
		chatMessages: number;
	};
}

const analyticsFields: (
	| "id"
	| "title"
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
	"startedAt",
	"endedAt",
	"durationSeconds",
	"platforms",
	"averageViewers",
	"peakViewers",
	"messagesAmount",
];

type Livestream = SuccessDataFunc<
	typeof getStreamHistory<typeof analyticsFields>
>[number];

export default function Analytics() {
	const { t } = useTranslation();
	const { user, isLoading } = useCurrentUser();

	const [timeframe, setTimeframe] = createSignal<Timeframe>("week");
	const [streams, setStreams] = createSignal<Livestream[]>([]);
	const [isLoadingStreams, setIsLoadingStreams] = createSignal(false);
	const [error, setError] = createSignal<string | null>(null);

	const loadStreams = async () => {
		const currentUser = user();
		if (!currentUser?.id) return;

		setIsLoadingStreams(true);
		setError(null);

		try {
			const result = await getStreamHistory({
				input: { userId: currentUser.id },
				fields: [...analyticsFields],
				fetchOptions: { credentials: "include" },
			});

			if (!result.success) {
				setError(t("analytics.failedToLoad"));
				console.error("RPC error:", result.errors);
			} else {
				setStreams(result.data);
			}
		} catch (err) {
			setError(t("analytics.failedToLoad"));
			console.error("Error loading streams:", err);
		} finally {
			setIsLoadingStreams(false);
		}
	};

	createEffect(() => {
		if (user()?.id) {
			loadStreams();

			const updateInterval = setInterval(() => {
				loadStreams();
			}, 5000);

			onCleanup(() => {
				clearInterval(updateInterval);
			});
		}
	});

	const daysForTimeframe = (tf: Timeframe): number => {
		switch (tf) {
			case "day":
				return 1;
			case "week":
				return 7;
			case "month":
				return 30;
			case "year":
				return 365;
			default:
				return 7;
		}
	};

	const filteredStreams = createMemo(() => {
		const days = daysForTimeframe(timeframe());
		const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

		return streams().filter((stream) => {
			const startDate = new Date(stream.startedAt);
			return startDate >= cutoff && stream.endedAt;
		});
	});

	const _avgViewers = createMemo(() => {
		const streamList = filteredStreams();
		if (streamList.length === 0) return 0;

		const total = streamList.reduce(
			(sum, s) => sum + (s.averageViewers || 0),
			0,
		);
		return Math.round(total / streamList.length);
	});

	const viewerData = createMemo((): ViewerDataPoint[] => {
		const days = daysForTimeframe(timeframe());
		const now = new Date();
		const currentHour = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate(),
			now.getHours(),
			0,
			0,
			0,
		);

		const dataByHour = new Map<number, number[]>();

		filteredStreams().forEach((stream) => {
			const startDate = new Date(stream.startedAt);
			const _endDate = stream.endedAt ? new Date(stream.endedAt) : now;
			const durationHours = Math.max(
				1,
				Math.floor((stream.durationSeconds || 0) / 3600),
			);

			for (let i = 0; i < durationHours; i++) {
				const hour = new Date(startDate.getTime() + i * 3600000);
				const hourKey = Math.floor(hour.getTime() / 3600000) * 3600000;

				if (!dataByHour.has(hourKey)) {
					dataByHour.set(hourKey, []);
				}
				dataByHour.get(hourKey)?.push(stream.averageViewers || 0);
			}
		});

		const points: ViewerDataPoint[] = [];
		for (let i = 0; i < days * 24; i++) {
			const hour = new Date(currentHour.getTime() - i * 3600000);
			const hourKey = Math.floor(hour.getTime() / 3600000) * 3600000;
			const values = dataByHour.get(hourKey) || [];
			const avgValue =
				values.length > 0
					? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
					: 0;

			points.unshift({ time: hour, value: avgValue });
		}

		return points;
	});

	const platformBreakdown = createMemo((): PlatformData[] => {
		const platformCounts = new Map<string, number>();
		const platformViewers = new Map<string, number>();

		filteredStreams().forEach((stream) => {
			(stream.platforms || []).forEach((platform) => {
				const platformKey = platform.toLowerCase();
				platformCounts.set(
					platformKey,
					(platformCounts.get(platformKey) || 0) + 1,
				);
				platformViewers.set(
					platformKey,
					(platformViewers.get(platformKey) || 0) +
						(stream.averageViewers || 0),
				);
			});
		});

		const total = Array.from(platformViewers.values()).reduce(
			(a, b) => a + b,
			0,
		);

		const platforms: PlatformData[] = [];
		["twitch", "youtube", "facebook", "kick"].forEach((platform) => {
			const viewers = platformViewers.get(platform) || 0;
			const percentage = total > 0 ? (viewers / total) * 100 : 0;
			platforms.push({
				label: platform.charAt(0).toUpperCase() + platform.slice(1),
				value: percentage,
			});
		});

		return platforms.sort((a, b) => b.value - a.value);
	});

	const recentStreams = createMemo((): StreamData[] => {
		return filteredStreams()
			.slice(0, 5)
			.map((stream) => ({
				id: stream.id,
				title: stream.title || "Untitled Stream",
				platform: formatPlatforms(stream.platforms || []),
				startTime: new Date(stream.startedAt),
				duration: formatDuration(stream.durationSeconds || 0),
				viewers: {
					peak: stream.peakViewers || 0,
					average: stream.averageViewers || 0,
				},
				engagement: {
					chatMessages: stream.messagesAmount || 0,
				},
			}));
	});

	const formatPlatforms = (platforms: string[]): string => {
		if (platforms.length === 0) return "N/A";
		if (platforms.length === 1)
			return platforms[0].charAt(0).toUpperCase() + platforms[0].slice(1);
		return platforms
			.map((p) => p.charAt(0).toUpperCase() + p.slice(1))
			.join(", ");
	};

	const formatDuration = (seconds: number): string => {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		if (hours > 0) return `${hours}h ${minutes}m`;
		return `${minutes}m`;
	};

	const _formatNumber = (num: number): string => {
		return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	};

	const _formatChartDate = (date: Date): string => {
		return date.toLocaleDateString(undefined, {
			month: "short",
			day: "numeric",
		});
	};

	const _getPlatformBadgeClass = (platformName: string): string => {
		const lower = platformName.toLowerCase();
		if (lower.includes("twitch")) return "bg-purple-100 text-purple-800";
		if (lower.includes("youtube")) return "bg-red-100 text-red-800";
		if (lower.includes("facebook")) return "bg-blue-100 text-blue-800";
		if (lower.includes("kick")) return "bg-green-100 text-green-800";
		return "bg-gray-100 text-gray-800";
	};

	return (
		<>
			<Title>Analytics - Streampai</Title>
			<Show fallback={<AnalyticsSkeleton />} when={!isLoading()}>
				<Show
					fallback={
						<div class="flex min-h-screen items-center justify-center bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900">
							<div class="py-12 text-center">
								<h2 class="mb-4 font-bold text-2xl text-white">
									{t("dashboard.notAuthenticated")}
								</h2>
								<p class="mb-6 text-gray-300">{t("analytics.signInToView")}</p>
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
						<div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
							<div>
								<h1 class="font-bold text-2xl text-theme-primary">
									{t("analytics.title")}
								</h1>
								<p class="mt-1 text-theme-tertiary text-sm">
									{t("analytics.subtitle")}
								</p>
							</div>

							<select
								class="rounded-md border-theme bg-theme-surface text-theme-primary px-4 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-purple-600"
								onChange={(e) =>
									setTimeframe(e.currentTarget.value as Timeframe)
								}
								value={timeframe()}>
								<option value="day">{t("analytics.last24Hours")}</option>
								<option value="week">{t("analytics.last7Days")}</option>
								<option value="month">{t("analytics.last30Days")}</option>
								<option value="year">{t("analytics.lastYear")}</option>
							</select>
						</div>

						<Show when={error()}>
							<Alert variant="error">{error()}</Alert>
						</Show>

						<Show
							fallback={
								<>
									<Card>
										<SkeletonChart />
									</Card>
									<Card>
										<div class="space-y-4">
											<Skeleton class="h-5 w-40" />
											<For each={[1, 2, 3, 4]}>
												{() => (
													<div class="space-y-2">
														<div class="flex items-center justify-between">
															<Skeleton class="h-4 w-20" />
															<Skeleton class="h-4 w-12" />
														</div>
														<Skeleton class="h-2 w-full rounded-full" />
													</div>
												)}
											</For>
										</div>
									</Card>
									<Card>
										<CardHeader>
											<Skeleton class="h-6 w-32" />
										</CardHeader>
										<CardContent>
											<div class="-mx-6 overflow-x-auto">
												<table class="min-w-full divide-y divide-[var(--theme-border)]">
													<thead class="bg-theme-tertiary">
														<tr>
															<For each={[1, 2, 3, 4, 5, 6]}>
																{() => (
																	<th class="px-6 py-3">
																		<Skeleton class="h-4 w-20" />
																	</th>
																)}
															</For>
														</tr>
													</thead>
													<tbody class="divide-y divide-[var(--theme-border)] bg-theme-surface">
														<For each={[1, 2, 3, 4, 5]}>
															{() => <SkeletonTableRow columns={6} />}
														</For>
													</tbody>
												</table>
											</div>
										</CardContent>
									</Card>
								</>
							}
							when={!isLoadingStreams()}>
							<div class="grid grid-cols-1 gap-6">
								<LineChart
									data={viewerData()}
									title={t("analytics.viewerTrends")}
								/>
							</div>

							<div class="grid grid-cols-1 gap-6">
								<BarChart
									data={platformBreakdown()}
									title={t("analytics.platformDistribution")}
								/>
							</div>

							<StreamTable streams={recentStreams()} />
						</Show>
					</div>
				</Show>
			</Show>
		</>
	);
}

interface LineChartProps {
	title: string;
	data: ViewerDataPoint[];
}

interface DailyStreamData {
	date: Date;
	dateKey: string;
	peakViewers: number;
	avgViewers: number;
	streamCount: number;
	totalHours: number;
}

function LineChart(props: LineChartProps) {
	const { t } = useTranslation();
	// Aggregate hourly data into daily summaries
	const dailyData = createMemo((): DailyStreamData[] => {
		const dailyMap = new Map<
			string,
			{
				date: Date;
				values: number[];
				hours: number;
			}
		>();

		props.data.forEach((point) => {
			const dateKey = point.time.toISOString().split("T")[0];
			if (!dailyMap.has(dateKey)) {
				dailyMap.set(dateKey, {
					date: new Date(
						point.time.getFullYear(),
						point.time.getMonth(),
						point.time.getDate(),
					),
					values: [],
					hours: 0,
				});
			}
			if (point.value > 0) {
				dailyMap.get(dateKey)?.values.push(point.value);
				const entry = dailyMap.get(dateKey);
				if (entry) entry.hours++;
			}
		});

		const result: DailyStreamData[] = [];
		dailyMap.forEach((data, dateKey) => {
			const values = data.values;
			result.push({
				date: data.date,
				dateKey,
				peakViewers: values.length > 0 ? Math.max(...values) : 0,
				avgViewers:
					values.length > 0
						? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
						: 0,
				streamCount: values.length > 0 ? 1 : 0, // Simplified - actual count would need stream boundaries
				totalHours: data.hours,
			});
		});

		return result.sort((a, b) => a.date.getTime() - b.date.getTime());
	});

	const daysWithData = createMemo(() =>
		dailyData().filter((d) => d.peakViewers > 0),
	);
	const hasAnyData = createMemo(() => daysWithData().length > 0);

	const maxValue = createMemo(() => {
		const rawMax = Math.max(...dailyData().map((d) => d.peakViewers), 100);
		const roundingFactor = rawMax < 500 ? 10 : 100;
		return Math.ceil(rawMax / roundingFactor) * roundingFactor;
	});

	const formatChartDate = (date: Date): string => {
		return date.toLocaleDateString(undefined, {
			month: "short",
			day: "numeric",
		});
	};

	const labelIndices = createMemo(() => {
		const len = dailyData().length;
		if (len <= 5) return dailyData().map((_, i) => i);
		return [
			0,
			Math.floor(len / 4),
			Math.floor(len / 2),
			Math.floor((3 * len) / 4),
			len - 1,
		];
	});

	const chartColors = {
		primary: "rgb(99, 102, 241)",
		primaryLight: "rgb(165, 180, 252)",
		primaryDark: "rgb(79, 70, 229)",
		gridLine: "#e5e7eb",
		baseline: "#d1d5db",
	};

	return (
		<Card>
			<div class="mb-4 flex items-center justify-between">
				<h3 class="font-medium text-theme-primary text-lg">{props.title}</h3>
				<Show when={hasAnyData()}>
					<div class="flex items-center gap-4 text-theme-tertiary text-xs">
						<div class="flex items-center gap-1">
							<div class="h-3 w-3 rounded-full bg-indigo-500" />
							<span>{t("analytics.peakViewers")}</span>
						</div>
						<div class="flex items-center gap-1">
							<div class="h-3 w-3 rounded-full bg-indigo-300" />
							<span>{t("analytics.avgViewers")}</span>
						</div>
					</div>
				</Show>
			</div>

			<Show
				fallback={
					<div class="flex h-64 items-center justify-center rounded-lg bg-theme-tertiary">
						<div class="text-center">
							<svg
								aria-hidden="true"
								class="mx-auto h-12 w-12 text-theme-muted"
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
							<p class="mt-2 font-medium text-theme-primary text-sm">
								{t("analytics.noStreamingData")}
							</p>
							<p class="mt-1 text-theme-tertiary text-xs">
								{t("analytics.streamToSee")}
							</p>
						</div>
					</div>
				}
				when={hasAnyData()}>
				<div class="relative h-64 pl-12">
					<svg
						aria-hidden="true"
						class="h-full w-full"
						preserveAspectRatio="none"
						viewBox="0 0 800 300">
						{/* Grid lines */}
						<For each={[0, 1, 2, 3, 4]}>
							{(i) => {
								const y = i * 60 + 10;
								return (
									<line
										stroke={chartColors.gridLine}
										stroke-width="1"
										x1="0"
										x2="800"
										y1={y}
										y2={y}
									/>
								);
							}}
						</For>

						{/* Baseline */}
						<line
							stroke={chartColors.baseline}
							stroke-width="1"
							x1="0"
							x2="800"
							y1="290"
							y2="290"
						/>

						{/* Bars for each day */}
						<For each={dailyData()}>
							{(day, i) => {
								const barWidth = Math.max(
									8,
									Math.min(40, 780 / dailyData().length - 4),
								);
								const x =
									(i() / Math.max(dailyData().length - 1, 1)) *
									(800 - barWidth);
								const peakHeight = (day.peakViewers / maxValue()) * 280;
								const avgHeight = (day.avgViewers / maxValue()) * 280;

								return (
									<Show when={day.peakViewers > 0}>
										<g>
											{/* Peak viewers bar (background) */}
											<rect
												fill={chartColors.primary}
												height={peakHeight}
												opacity="0.9"
												rx="2"
												width={barWidth}
												x={x}
												y={290 - peakHeight}
											/>
											{/* Average viewers bar (overlay) */}
											<rect
												fill={chartColors.primaryLight}
												height={avgHeight}
												rx="2"
												width={barWidth}
												x={x}
												y={290 - avgHeight}
											/>
											{/* Peak dot on top */}
											<circle
												cx={x + barWidth / 2}
												cy={290 - peakHeight}
												fill={chartColors.primaryDark}
												r="4"
												stroke="white"
												stroke-width="2"
											/>
										</g>
									</Show>
								);
							}}
						</For>
					</svg>

					{/* Y-axis labels */}
					<div class="absolute top-0 left-0 flex h-full flex-col justify-between pr-2 text-theme-tertiary text-xs">
						<For each={[4, 3, 2, 1, 0]}>
							{(i) => (
								<span class="pr-2 text-right">
									{Math.floor((maxValue() * i) / 4)}
								</span>
							)}
						</For>
					</div>

					{/* X-axis labels */}
					<div class="absolute right-0 bottom-0 left-12 flex translate-y-5 transform justify-between text-theme-tertiary text-xs">
						<For each={labelIndices()}>
							{(idx) => (
								<span>
									{dailyData()[idx]
										? formatChartDate(dailyData()[idx].date)
										: ""}
								</span>
							)}
						</For>
					</div>
				</div>

				{/* Summary stats below chart */}
				<div class="mt-8">
					<StatGroup columns={3}>
						<Stat
							label={t("analytics.daysStreamed")}
							value={String(daysWithData().length)}
						/>
						<Stat
							highlight
							label={t("analytics.peakViewers")}
							value={String(
								hasAnyData()
									? Math.max(...daysWithData().map((d) => d.peakViewers))
									: 0,
							)}
						/>
						<Stat
							label={t("analytics.avgViewers")}
							value={String(
								hasAnyData()
									? Math.round(
											daysWithData().reduce((sum, d) => sum + d.avgViewers, 0) /
												daysWithData().length,
										)
									: 0,
							)}
						/>
					</StatGroup>
				</div>
			</Show>
		</Card>
	);
}

interface BarChartProps {
	title: string;
	data: PlatformData[];
}

function BarChart(props: BarChartProps) {
	const maxValue = createMemo(() => {
		return Math.max(...props.data.map((d) => d.value), 100);
	});

	return (
		<Card>
			<h3 class="mb-4 font-medium text-theme-primary text-lg">{props.title}</h3>
			<div class="space-y-3">
				<For each={props.data}>
					{(item) => (
						<ProgressBar
							label={item.label}
							max={maxValue()}
							showValue
							value={item.value}
						/>
					)}
				</For>
			</div>
		</Card>
	);
}

interface StreamTableProps {
	streams: StreamData[];
}

function StreamTable(props: StreamTableProps) {
	const { t } = useTranslation();
	const formatNumber = (num: number): string => {
		return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	};

	const formatDate = (date: Date): string => {
		return date.toLocaleDateString(undefined, {
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "numeric",
			minute: "2-digit",
		});
	};

	const getPlatformBadgeVariant = (
		platformName: string,
	): "purple" | "error" | "info" | "success" | "neutral" => {
		const lower = platformName.toLowerCase();
		if (lower.includes("twitch")) return "purple";
		if (lower.includes("youtube")) return "error";
		if (lower.includes("facebook")) return "info";
		if (lower.includes("kick")) return "success";
		return "neutral";
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("analytics.recentStreams")}</CardTitle>
			</CardHeader>
			<CardContent>
				<Show
					fallback={
						<div class="py-12 text-center">
							<svg
								aria-hidden="true"
								class="mx-auto h-12 w-12 text-theme-muted"
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
							<h3 class="mt-2 font-medium text-theme-primary text-sm">
								{t("analytics.noStreamsYet")}
							</h3>
							<p class="mt-1 text-theme-tertiary text-sm">
								{t("analytics.startStreaming")}
							</p>
						</div>
					}
					when={props.streams.length > 0}>
					<div class="-mx-6 overflow-x-auto">
						<table class="min-w-full divide-y divide-[var(--theme-border)]">
							<thead class="bg-theme-tertiary">
								<tr>
									<th class="px-6 py-3 text-left font-medium text-theme-secondary text-xs tracking-wider">
										{t("analytics.stream")}
									</th>
									<th class="px-6 py-3 text-left font-medium text-theme-secondary text-xs tracking-wider">
										{t("analytics.platform")}
									</th>
									<th class="px-6 py-3 text-left font-medium text-theme-secondary text-xs tracking-wider">
										{t("analytics.duration")}
									</th>
									<th class="px-6 py-3 text-left font-medium text-theme-secondary text-xs tracking-wider">
										{t("analytics.peakViewers")}
									</th>
									<th class="px-6 py-3 text-left font-medium text-theme-secondary text-xs tracking-wider">
										{t("analytics.avgViewers")}
									</th>
									<th class="px-6 py-3 text-left font-medium text-theme-secondary text-xs tracking-wider">
										{t("analytics.chatMessages")}
									</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-[var(--theme-border)] bg-theme-surface">
								<For each={props.streams}>
									{(stream) => (
										<tr class="hover:bg-theme-hover">
											<td class="whitespace-nowrap px-6 py-4">
												<A
													class="block hover:text-purple-600"
													href={`/dashboard/stream-history/${stream.id}`}>
													<div class="font-medium text-theme-primary text-sm">
														{stream.title}
													</div>
													<div class="text-theme-tertiary text-xs">
														{formatDate(stream.startTime)}
													</div>
												</A>
											</td>
											<td class="whitespace-nowrap px-6 py-4">
												<Badge
													variant={getPlatformBadgeVariant(stream.platform)}>
													{stream.platform}
												</Badge>
											</td>
											<td class="whitespace-nowrap px-6 py-4 text-theme-primary text-sm">
												{stream.duration}
											</td>
											<td class="whitespace-nowrap px-6 py-4 text-theme-primary text-sm">
												{formatNumber(stream.viewers.peak)}
											</td>
											<td class="whitespace-nowrap px-6 py-4 text-theme-primary text-sm">
												{formatNumber(stream.viewers.average)}
											</td>
											<td class="whitespace-nowrap px-6 py-4 text-theme-primary text-sm">
												{formatNumber(stream.engagement.chatMessages)}
											</td>
										</tr>
									)}
								</For>
							</tbody>
						</table>
					</div>
				</Show>
			</CardContent>
		</Card>
	);
}
