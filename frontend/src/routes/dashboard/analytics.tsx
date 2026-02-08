import { type RouteDefinition, createAsync, query } from "@solidjs/router";
import { For, Show, Suspense, createMemo, createSignal } from "solid-js";
import {
	type PlatformData,
	PlatformDistributionChart,
	type StreamData,
	StreamTable,
	ViewerChart,
	type ViewerDataPoint,
} from "~/components/analytics";
import {
	Card,
	CardContent,
	CardHeader,
	Select,
	Skeleton,
	SkeletonChart,
	SkeletonTableRow,
} from "~/design-system";
import { useTranslation } from "~/i18n";
import { useBreadcrumbs } from "~/lib/BreadcrumbContext";
import { formatDurationShort } from "~/lib/formatters";
import { getStreamHistory } from "~/sdk/ash_rpc";

type Timeframe = "day" | "week" | "month" | "year";

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
		<Suspense fallback={<LoadingState />}>
			<AnalyticsContent />
		</Suspense>
	);
}

function AnalyticsContent() {
	const { t } = useTranslation();

	useBreadcrumbs(() => [
		{ label: t("sidebar.overview"), href: "/dashboard" },
		{ label: t("dashboardNav.analytics") },
	]);

	const [timeframe, setTimeframe] = createSignal<Timeframe>("week");

	const streams = createAsync(() => getStreams());

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

		return (streams() ?? []).filter((stream) => {
			const startDate = new Date(stream.startedAt);
			return startDate >= cutoff && stream.endedAt;
		});
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

	const formatPlatforms = (platforms: string[]): string => {
		if (platforms.length === 0) return "N/A";
		if (platforms.length === 1)
			return platforms[0].charAt(0).toUpperCase() + platforms[0].slice(1);
		return platforms
			.map((p) => p.charAt(0).toUpperCase() + p.slice(1))
			.join(", ");
	};

	const recentStreams = createMemo((): StreamData[] => {
		return filteredStreams()
			.slice(0, 5)
			.map((stream) => ({
				id: stream.id,
				title: stream.title || "Untitled Stream",
				platform: formatPlatforms(stream.platforms || []),
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
					class="bg-surface-inset"
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
				<div class="grid grid-cols-1 gap-6">
					<ViewerChart
						data={viewerData()}
						title={t("analytics.viewerTrends")}
					/>
				</div>

				<div class="grid grid-cols-1 gap-6">
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

function LoadingState() {
	return (
		<div class="space-y-6 overflow-hidden">
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
						<table class="min-w-full divide-y divide-neutral-200">
							<thead class="bg-neutral-50">
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
							<tbody class="divide-y divide-neutral-200 bg-surface">
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
