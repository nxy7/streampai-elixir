import { For, Show, createMemo } from "solid-js";
import { Card, Stat, StatGroup } from "~/components/ui";
import { useTranslation } from "~/i18n";

export interface ViewerDataPoint {
	time: Date;
	value: number;
}

interface DailyStreamData {
	date: Date;
	dateKey: string;
	peakViewers: number;
	avgViewers: number;
	streamCount: number;
	totalHours: number;
}

interface ViewerChartProps {
	title: string;
	data: ViewerDataPoint[];
}

export function ViewerChart(props: ViewerChartProps) {
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
				<h3 class="font-medium text-gray-900 text-lg">{props.title}</h3>
				<Show when={hasAnyData()}>
					<div class="flex items-center gap-4 text-gray-500 text-xs">
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
					<div class="flex h-64 items-center justify-center rounded-lg bg-gray-50">
						<div class="text-center">
							<svg
								aria-hidden="true"
								class="mx-auto h-12 w-12 text-gray-400"
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
							<p class="mt-2 font-medium text-gray-900 text-sm">
								{t("analytics.noStreamingData")}
							</p>
							<p class="mt-1 text-gray-500 text-xs">
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
					<div class="absolute top-0 left-0 flex h-full flex-col justify-between pr-2 text-gray-500 text-xs">
						<For each={[4, 3, 2, 1, 0]}>
							{(i) => (
								<span class="pr-2 text-right">
									{Math.floor((maxValue() * i) / 4)}
								</span>
							)}
						</For>
					</div>

					{/* X-axis labels */}
					<div class="absolute right-0 bottom-0 left-12 flex translate-y-5 transform justify-between text-gray-500 text-xs">
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
