import { type RouteDefinition, createAsync, query } from "@solidjs/router";
import { For, Show, Suspense, createMemo } from "solid-js";
import {
	AnalyticsSkeleton,
	type ChartStat,
	type PlatformData,
	PlatformDistributionChart,
	type StreamData,
	StreamTable,
	ViewerChart,
	type ViewerDataPoint,
} from "~/components/analytics";
import { Select } from "~/design-system";
import { useTranslation } from "~/i18n";
import { useAuthenticatedUser } from "~/lib/auth";
import { useBreadcrumbs } from "~/lib/BreadcrumbContext";
import {
	buildDailyTimeSeries,
	capitalize,
	formatDurationShort,
	formatMinutes,
	toDateKey,
} from "~/lib/formatters";
import { useUserStreamEvents } from "~/lib/useElectric";
import { createLocalStorageSignal } from "~/lib/useLocalStorage";
import { getStreamHistory } from "~/sdk/ash_rpc";

type Timeframe = "day" | "week" | "month" | "year";
type Metric = "viewers" | "streams" | "activity" | "income";
type StreamsSubMetric = "daysStreamed" | "totalDuration" | "avgDuration";
type ViewersSubMetric = "combined" | "peak" | "avg";
type ActivitySubMetric = "total" | "avgPerStream" | "peak";
type IncomeSubMetric = "total" | "avgPerStream" | "peak";

const TIMEFRAME_DAYS: Record<Timeframe, number> = {
	day: 1,
	week: 7,
	month: 30,
	year: 365,
};

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

const getStreams = query(async () => {
	const result = await getStreamHistory({
		input: {},
		fields: [...analyticsFields],
		fetchOptions: { credentials: "include" },
	});

	if (!result.success) {
		throw new Error("Failed to load streams");
	}
	return result.data;
}, "analytics-streams");

export const route = {
	preload() {
		getStreams();
	},
} satisfies RouteDefinition;

export default function Analytics() {
	return (
		<Suspense fallback={<AnalyticsSkeleton />}>
			<AnalyticsContent />
		</Suspense>
	);
}

function AnalyticsContent() {
	const { t } = useTranslation();
	const { user } = useAuthenticatedUser();

	useBreadcrumbs(() => [
		{ label: t("sidebar.overview"), href: "/dashboard" },
		{ label: t("dashboardNav.analytics") },
	]);

	const [timeframe, setTimeframe] = createLocalStorageSignal<Timeframe>(
		"analytics-timeframe",
		"week",
	);
	const [metric, setMetric] = createLocalStorageSignal<Metric>(
		"analytics-metric",
		"viewers",
	);
	const [streamsSubMetric, setStreamsSubMetric] =
		createLocalStorageSignal<StreamsSubMetric>(
			"analytics-streams-sub",
			"daysStreamed",
		);
	const [viewersSubMetric, setViewersSubMetric] =
		createLocalStorageSignal<ViewersSubMetric>(
			"analytics-viewers-sub",
			"combined",
		);
	const [activitySubMetric, setActivitySubMetric] =
		createLocalStorageSignal<ActivitySubMetric>(
			"analytics-activity-sub",
			"total",
		);
	const [incomeSubMetric, setIncomeSubMetric] =
		createLocalStorageSignal<IncomeSubMetric>("analytics-income-sub", "total");

	const streams = createAsync(() => getStreams());
	const eventsQuery = useUserStreamEvents(() => user()?.id);

	const days = () => TIMEFRAME_DAYS[timeframe()];

	const filteredStreams = createMemo(() => {
		const cutoff = new Date(Date.now() - days() * 24 * 60 * 60 * 1000);
		return (streams() ?? []).filter((stream) => {
			const startDate = new Date(stream.startedAt);
			return startDate >= cutoff && stream.endedAt;
		});
	});

	// Hourly viewer data for the "combined" dual-series area chart
	const viewerData = createMemo((): ViewerDataPoint[] => {
		const d = days();
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
		for (let i = 0; i < d * 24; i++) {
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

	// --- Daily aggregation memos using buildDailyTimeSeries ---

	const getStreamDate = (s: { startedAt: string }) => new Date(s.startedAt);

	const _streamsPerDay = createMemo(() =>
		buildDailyTimeSeries(
			filteredStreams(),
			getStreamDate,
			() => 1,
			"sum",
			days(),
		),
	);

	const totalDurationPerDay = createMemo(() =>
		buildDailyTimeSeries(
			filteredStreams(),
			getStreamDate,
			(s) => Math.round((s.durationSeconds || 0) / 60),
			"sum",
			days(),
		),
	);

	const avgDurationPerDay = createMemo(() =>
		buildDailyTimeSeries(
			filteredStreams(),
			getStreamDate,
			(s) => Math.round((s.durationSeconds || 0) / 60),
			"avg",
			days(),
		),
	);

	const peakViewersPerDay = createMemo(() =>
		buildDailyTimeSeries(
			filteredStreams(),
			getStreamDate,
			(s) => s.peakViewers || 0,
			"max",
			days(),
		),
	);

	const avgViewersPerDay = createMemo(() =>
		buildDailyTimeSeries(
			filteredStreams(),
			getStreamDate,
			(s) => s.averageViewers || 0,
			"avg",
			days(),
		),
	);

	const activityPerDay = createMemo(() =>
		buildDailyTimeSeries(
			filteredStreams(),
			getStreamDate,
			(s) => s.messagesAmount || 0,
			"sum",
			days(),
		),
	);

	const activityAvgPerStreamPerDay = createMemo(() =>
		buildDailyTimeSeries(
			filteredStreams(),
			getStreamDate,
			(s) => s.messagesAmount || 0,
			"avg",
			days(),
		),
	);

	// Fixed 120-day heatmap data (independent of timeframe filter)
	const streamsPerDayHeatmap = createMemo((): ViewerDataPoint[] => {
		const cutoff = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000);
		const completed = (streams() ?? []).filter(
			(s) => s.endedAt && new Date(s.startedAt) >= cutoff,
		);
		return buildDailyTimeSeries(completed, getStreamDate, () => 1, "sum", 120);
	});

	const filteredDonationEvents = createMemo(() => {
		const cutoff = new Date(Date.now() - days() * 24 * 60 * 60 * 1000);
		return (eventsQuery.data() ?? []).filter(
			(e) => e.type === "donation" && new Date(e.inserted_at) >= cutoff,
		);
	});

	const incomePerDay = createMemo(() =>
		buildDailyTimeSeries(
			filteredDonationEvents(),
			(e) => new Date(e.inserted_at),
			(e) => Number(e.data?.amount) || 0,
			"sum",
			days(),
		),
	);

	// --- Platform breakdown ---

	const platformBreakdown = createMemo((): PlatformData[] => {
		const platformViewers = new Map<string, number>();

		filteredStreams().forEach((stream) => {
			(stream.platforms || []).forEach((platform) => {
				const key = platform.toLowerCase();
				platformViewers.set(
					key,
					(platformViewers.get(key) || 0) + (stream.averageViewers || 0),
				);
			});
		});

		const total = Array.from(platformViewers.values()).reduce(
			(a, b) => a + b,
			0,
		);

		return ["twitch", "youtube", "facebook", "kick"]
			.map((platform) => ({
				label: capitalize(platform),
				value:
					total > 0 ? ((platformViewers.get(platform) || 0) / total) * 100 : 0,
			}))
			.sort((a, b) => b.value - a.value);
	});

	// --- Recent streams table ---

	const recentStreams = createMemo((): StreamData[] => {
		return filteredStreams()
			.slice(0, 5)
			.map((stream) => ({
				id: stream.id,
				title: stream.title || "Untitled Stream",
				platform: (stream.platforms || []).map(capitalize).join(", ") || "N/A",
				startTime: new Date(stream.startedAt),
				duration: formatDurationShort(stream.durationSeconds || 0),
				viewers: {
					peak: stream.peakViewers || 0,
					average: stream.averageViewers || 0,
				},
				engagement: {
					chatMessages: stream.messagesAmount || 0,
				},
			}));
	});

	// --- Consolidated chart config ---

	const chartConfig = createMemo(() => {
		const s = filteredStreams();
		const m = metric();

		if (m === "viewers") {
			const sub = viewersSubMetric();
			const daysWithViewers = s.filter(
				(st) => (st.peakViewers || 0) > 0,
			).length;
			const overallPeak =
				s.length > 0 ? Math.max(...s.map((st) => st.peakViewers || 0)) : 0;
			const overallAvg =
				s.length > 0
					? Math.round(
							s.reduce((sum, st) => sum + (st.averageViewers || 0), 0) /
								s.length,
						)
					: 0;

			const stats: ChartStat[] = [
				{
					id: "combined",
					label: t("analytics.viewerTrends"),
					value: String(daysWithViewers),
				},
				{
					id: "peak",
					label: t("analytics.peakViewers"),
					value: String(overallPeak),
				},
				{
					id: "avg",
					label: t("analytics.avgViewers"),
					value: String(overallAvg),
				},
			];

			if (sub === "peak") {
				return {
					title: t("analytics.peakViewers"),
					data: peakViewersPerDay(),
					series: [
						{
							name: t("analytics.peakViewers"),
							data: peakViewersPerDay().map((d) => d.value),
						},
					],
					chartType: "area" as const,
					yaxisFormatter: undefined,
					stats,
				};
			}
			if (sub === "avg") {
				return {
					title: t("analytics.avgViewers"),
					data: avgViewersPerDay(),
					series: [
						{
							name: t("analytics.avgViewers"),
							data: avgViewersPerDay().map((d) => d.value),
						},
					],
					chartType: "area" as const,
					yaxisFormatter: undefined,
					stats,
				};
			}
			// combined: dual series handled by ViewerChart default
			return {
				title: t("analytics.viewerTrends"),
				data: viewerData(),
				series: undefined,
				chartType: "area" as const,
				yaxisFormatter: undefined,
				stats,
			};
		}

		if (m === "streams") {
			const sub = streamsSubMetric();
			const uniqueDays = new Set(
				s.map((st) => toDateKey(new Date(st.startedAt))),
			).size;
			const totalDur = formatDurationShort(
				s.reduce((sum, st) => sum + (st.durationSeconds || 0), 0),
			);
			const avgDur = formatDurationShort(
				s.length > 0
					? Math.round(
							s.reduce((sum, st) => sum + (st.durationSeconds || 0), 0) /
								s.length,
						)
					: 0,
			);

			const stats: ChartStat[] = [
				{
					id: "daysStreamed",
					label: t("analytics.daysStreamed"),
					value: String(uniqueDays),
				},
				{
					id: "totalDuration",
					label: t("analytics.totalDuration"),
					value: totalDur,
				},
				{
					id: "avgDuration",
					label: t("analytics.avgStreamDuration"),
					value: avgDur,
				},
			];

			if (sub === "totalDuration") {
				return {
					title: t("analytics.totalDuration"),
					data: totalDurationPerDay(),
					series: [
						{
							name: t("analytics.totalDuration"),
							data: totalDurationPerDay().map((d) => d.value),
						},
					],
					chartType: "bar" as const,
					yaxisFormatter: formatMinutes,
					stats,
				};
			}
			if (sub === "avgDuration") {
				return {
					title: t("analytics.avgStreamDuration"),
					data: avgDurationPerDay(),
					series: [
						{
							name: t("analytics.avgStreamDuration"),
							data: avgDurationPerDay().map((d) => d.value),
						},
					],
					chartType: "bar" as const,
					yaxisFormatter: formatMinutes,
					stats,
				};
			}
			// daysStreamed: heatmap
			return {
				title: t("analytics.daysStreamed"),
				data: streamsPerDayHeatmap(),
				series: [
					{
						name: t("analytics.daysStreamed"),
						data: streamsPerDayHeatmap().map((d) => d.value),
					},
				],
				chartType: "heatmap" as const,
				yaxisFormatter: undefined,
				stats,
			};
		}

		if (m === "activity") {
			const sub = activitySubMetric();
			const totalVal = s.reduce((sum, st) => sum + (st.messagesAmount || 0), 0);
			const peakDay =
				activityPerDay().length > 0
					? Math.max(...activityPerDay().map((d) => d.value))
					: 0;

			const stats: ChartStat[] = [
				{
					id: "total",
					label: t("analytics.totalActivity"),
					value: String(totalVal),
				},
				{
					id: "avgPerStream",
					label: t("analytics.avgActivityPerStream"),
					value: String(s.length > 0 ? Math.round(totalVal / s.length) : 0),
				},
				{
					id: "peak",
					label: t("analytics.peakActivity"),
					value: String(peakDay),
				},
			];

			if (sub === "avgPerStream") {
				return {
					title: t("analytics.avgActivityPerStream"),
					data: activityAvgPerStreamPerDay(),
					series: [
						{
							name: t("analytics.avgActivityPerStream"),
							data: activityAvgPerStreamPerDay().map((d) => d.value),
						},
					],
					chartType: "area" as const,
					yaxisFormatter: undefined,
					stats,
				};
			}
			// "total" and "peak" both show the total activity per day chart
			const data = activityPerDay();
			return {
				title:
					sub === "peak"
						? t("analytics.peakActivity")
						: t("analytics.totalActivity"),
				data,
				series: [
					{
						name: t("analytics.totalActivity"),
						data: data.map((d) => d.value),
					},
				],
				chartType: "area" as const,
				yaxisFormatter: undefined,
				stats,
			};
		}

		// income
		const sub = incomeSubMetric();
		const donations = filteredDonationEvents();
		const totalIncomeVal = donations.reduce(
			(sum, e) => sum + (Number(e.data?.amount) || 0),
			0,
		);
		const peakIncomeDay =
			incomePerDay().length > 0
				? Math.max(...incomePerDay().map((d) => d.value))
				: 0;
		const fmtDollar = (val: number) => `$${val.toFixed(2)}`;
		const fmtDollarAxis = (val: number) => `$${val.toFixed(0)}`;

		const stats: ChartStat[] = [
			{
				id: "total",
				label: t("analytics.totalIncome"),
				value: fmtDollar(totalIncomeVal),
			},
			{
				id: "avgPerStream",
				label: t("analytics.avgIncomePerStream"),
				value: fmtDollar(s.length > 0 ? totalIncomeVal / s.length : 0),
			},
			{
				id: "peak",
				label: t("analytics.peakIncome"),
				value: fmtDollar(peakIncomeDay),
			},
		];

		const data = incomePerDay();
		const titleKey =
			sub === "avgPerStream"
				? t("analytics.avgIncomePerStream")
				: sub === "peak"
					? t("analytics.peakIncome")
					: t("analytics.totalIncome");

		return {
			title: titleKey,
			data,
			series: [{ name: titleKey, data: data.map((d) => d.value) }],
			chartType: "area" as const,
			yaxisFormatter: fmtDollarAxis,
			stats,
		};
	});

	// --- Metric interaction ---

	const handleStatClick = (id: string) => {
		switch (metric()) {
			case "viewers":
				setViewersSubMetric(id as ViewersSubMetric);
				break;
			case "streams":
				setStreamsSubMetric(id as StreamsSubMetric);
				break;
			case "activity":
				setActivitySubMetric(id as ActivitySubMetric);
				break;
			case "income":
				setIncomeSubMetric(id as IncomeSubMetric);
				break;
		}
	};

	const activeSubMetric = createMemo(() => {
		switch (metric()) {
			case "viewers":
				return viewersSubMetric();
			case "streams":
				return streamsSubMetric();
			case "activity":
				return activitySubMetric();
			case "income":
				return incomeSubMetric();
		}
	});

	const metrics: { value: Metric; label: () => string }[] = [
		{ value: "viewers", label: () => t("analytics.metricViewers") },
		{ value: "streams", label: () => t("analytics.metricStreams") },
		{ value: "activity", label: () => t("analytics.metricActivity") },
		{ value: "income", label: () => t("analytics.metricIncome") },
	];

	return (
		<div class="space-y-6">
			<div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h1 class="font-bold text-2xl text-neutral-900">
						{t("analytics.title")}
					</h1>
					<p class="mt-1 text-neutral-500 text-sm">{t("analytics.subtitle")}</p>
				</div>

				<Select
					onChange={(value) => setTimeframe(value as Timeframe)}
					options={[
						{ value: "day", label: t("analytics.last24Hours") },
						{ value: "week", label: t("analytics.last7Days") },
						{ value: "month", label: t("analytics.last30Days") },
						{ value: "year", label: t("analytics.lastYear") },
					]}
					value={timeframe()}
					wrapperClass="w-auto"
				/>
			</div>

			<Show when={streams()}>
				<div class="flex flex-wrap gap-2">
					<For each={metrics}>
						{(m) => (
							<button
								class={`rounded-full px-4 py-1.5 font-medium text-sm transition-colors ${
									metric() === m.value
										? "bg-primary text-white"
										: "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
								}`}
								onClick={() => setMetric(m.value)}
								type="button">
								{m.label()}
							</button>
						)}
					</For>
				</div>

				<div class="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
					<ViewerChart
						activeStat={activeSubMetric()}
						chartType={chartConfig().chartType}
						data={chartConfig().data}
						onStatClick={handleStatClick}
						series={chartConfig().series}
						stats={chartConfig().stats}
						title={chartConfig().title}
						yaxisFormatter={chartConfig().yaxisFormatter}
					/>
					<PlatformDistributionChart
						data={platformBreakdown()}
						title={t("analytics.platformDistribution")}
					/>
				</div>

				<StreamTable streams={recentStreams()} />
			</Show>
		</div>
	);
}
