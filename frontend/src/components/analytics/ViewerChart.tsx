import type { ApexOptions } from "apexcharts";
import { SolidApexCharts } from "solid-apexcharts";
import { For, Show, createMemo } from "solid-js";
import { Card, Stat, StatGroup } from "~/design-system";
import { useTranslation } from "~/i18n";
import { toDateKey } from "~/lib/formatters";
import { useTypewriter } from "~/lib/useTypewriter";

export interface ViewerDataPoint {
	time: Date;
	value: number;
}

interface ChartSeries {
	name: string;
	data: number[];
}

export interface ChartStat {
	id?: string;
	label: string;
	value: string;
	highlight?: boolean;
}

interface ViewerChartProps {
	title: string;
	data: ViewerDataPoint[];
	series?: ChartSeries[];
	stats?: ChartStat[];
	chartType?: "area" | "bar" | "heatmap";
	activeStat?: string;
	onStatClick?: (id: string) => void;
	yaxisFormatter?: (val: number) => string;
}

function MatrixStat(props: {
	label: string;
	value: string;
	highlight?: boolean;
}) {
	const animatedValue = useTypewriter(() => props.value, {
		variant: "matrix",
		durationMs: 350,
		scrambleRounds: 2,
		stagger: 1,
	});
	return (
		<Stat
			highlight={props.highlight}
			label={props.label}
			value={animatedValue()}
		/>
	);
}

export function ViewerChart(props: ViewerChartProps) {
	const { t } = useTranslation();
	const titleText = useTypewriter(() => props.title, {
		variant: "matrix",
		durationMs: 450,
		scrambleRounds: 3,
		stagger: 1,
	});

	const type = () => props.chartType ?? "area";
	const isBar = () => type() === "bar";
	const isHeatmap = () => type() === "heatmap";

	// Aggregate hourly data into daily categories for area/bar charts
	const dailyCategories = createMemo(() => {
		if (type() === "heatmap") return [];
		const dayMap = new Map<string, Date>();
		for (const point of props.data) {
			const key = toDateKey(point.time);
			if (!dayMap.has(key)) dayMap.set(key, point.time);
		}
		const sorted = Array.from(dayMap.entries()).sort(([a], [b]) =>
			a.localeCompare(b),
		);
		return sorted.map(([, d]) =>
			d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
		);
	});

	// Aggregate hourly data into daily peak/avg for the dual-series fallback
	const dailyAggregated = createMemo(() => {
		if (props.series) return null; // parent provides series, skip aggregation
		const dayMap = new Map<string, number[]>();
		for (const point of props.data) {
			const key = toDateKey(point.time);
			if (point.value > 0) {
				if (!dayMap.has(key)) dayMap.set(key, []);
				dayMap.get(key)?.push(point.value);
			}
		}
		const _sorted = Array.from(dayMap.keys()).sort();
		// Include all days from dailyCategories for alignment
		const allDays = new Map<string, Date>();
		for (const point of props.data) {
			const key = toDateKey(point.time);
			if (!allDays.has(key)) allDays.set(key, point.time);
		}
		const sortedDays = Array.from(allDays.keys()).sort();
		return {
			peak: sortedDays.map((key) => {
				const vals = dayMap.get(key);
				return vals ? Math.max(...vals) : 0;
			}),
			avg: sortedDays.map((key) => {
				const vals = dayMap.get(key);
				return vals
					? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
					: 0;
			}),
		};
	});

	// Use provided series or fall back to default peak/avg viewer series
	const chartSeries = createMemo<ChartSeries[]>(() => {
		if (props.series) return props.series;
		const agg = dailyAggregated();
		if (!agg) return [];
		return [
			{ name: t("analytics.peakViewers"), data: agg.peak },
			{ name: t("analytics.avgViewers"), data: agg.avg },
		];
	});

	const hasAnyData = createMemo(() => {
		if (props.chartType === "heatmap")
			return props.data.some((d) => d.value > 0);
		return chartSeries().some((s) => s.data.some((v) => v > 0));
	});

	const chartStats = createMemo(() => props.stats ?? []);

	// Heatmap: aligned date grid for series + tooltip lookups
	const heatmapGrid = createMemo(() => {
		const data = props.data;
		if (!isHeatmap() || data.length === 0) return null;

		const valueByDate = new Map<string, number>();
		for (const d of data) {
			valueByDate.set(toDateKey(d.time), d.value);
		}

		const first = data[0].time;
		const last = data[data.length - 1].time;

		// Align start to Monday
		const startDay = first.getDay();
		const startOffset = startDay === 0 ? 6 : startDay - 1;
		const alignedStart = new Date(first);
		alignedStart.setDate(alignedStart.getDate() - startOffset);

		// Align end to Sunday
		const endDay = last.getDay();
		const endOffset = endDay === 0 ? 0 : 7 - endDay;
		const alignedEnd = new Date(last);
		alignedEnd.setDate(alignedEnd.getDate() + endOffset);

		const allDates: Date[] = [];
		const cur = new Date(alignedStart);
		while (cur <= alignedEnd) {
			allDates.push(new Date(cur));
			cur.setDate(cur.getDate() + 1);
		}

		const weekColumns: string[] = [];
		for (let i = 0; i < allDates.length; i += 7) {
			weekColumns.push(
				allDates[i].toLocaleDateString(undefined, {
					month: "short",
					day: "numeric",
				}),
			);
		}

		const today = new Date();
		today.setHours(23, 59, 59, 999);

		return { allDates, weekColumns, valueByDate, today };
	});

	// Heatmap series: 7 rows (Mon-Sun) x N columns (weeks)
	const heatmapSeries = createMemo(() => {
		const grid = heatmapGrid();
		if (!grid) return undefined;

		const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

		return dayNames
			.map((name, dayIdx) => ({
				name,
				data: grid.weekColumns.map((weekLabel, weekIdx) => {
					const date = grid.allDates[weekIdx * 7 + dayIdx];
					if (!date) return { x: weekLabel, y: -1 };
					// Future dates (padding for Sunday alignment) are invisible
					if (date > grid.today) return { x: weekLabel, y: -1 };
					const key = toDateKey(date);
					const val = grid.valueByDate.get(key);
					// Past/present dates with no data show as "no streams" (gray), not transparent
					return { x: weekLabel, y: val ?? 0 };
				}),
			}))
			.reverse();
	});

	const options = createMemo((): ApexOptions => {
		const fmt = props.yaxisFormatter;

		if (isHeatmap()) {
			return {
				chart: {
					type: "heatmap",
					toolbar: { show: false },
					background: "transparent",
					fontFamily: "inherit",
				},
				theme: { mode: "dark" },
				dataLabels: { enabled: false },
				stroke: { width: 3, colors: ["#1e293b"] },
				plotOptions: {
					heatmap: {
						radius: 4,
						enableShades: false,
						colorScale: {
							ranges: [
								{ from: -1, to: -1, color: "transparent", name: "" },
								{
									from: 0,
									to: 0,
									color: "#374151",
									name: t("analytics.noStreams"),
								},
								{ from: 1, to: 1, color: "#6366f1", name: "1" },
								{ from: 2, to: 3, color: "#818cf8", name: "2-3" },
								{ from: 4, to: 100, color: "#a5b4fc", name: "4+" },
							],
						},
					},
				},
				xaxis: {
					labels: {
						style: { colors: "#9ca3af", fontSize: "11px" },
						hideOverlappingLabels: true,
					},
					tickAmount: 4,
					axisBorder: { show: false },
					axisTicks: { show: false },
					position: "top",
					tooltip: { enabled: false },
					crosshairs: { show: false },
				},
				yaxis: {
					labels: {
						style: { colors: "#6b7280", fontSize: "11px" },
					},
				},
				grid: { show: false },
				tooltip: {
					theme: "dark",
					custom: ({
						seriesIndex,
						dataPointIndex,
					}: {
						seriesIndex: number;
						dataPointIndex: number;
					}) => {
						const grid = heatmapGrid();
						if (!grid) return "";
						// Series are reversed (0=Sun, 6=Mon), so real dayIdx = 6 - seriesIndex
						const dayIdx = 6 - seriesIndex;
						const date = grid.allDates[dataPointIndex * 7 + dayIdx];
						if (!date) return "";
						const val = grid.valueByDate.get(toDateKey(date));
						const dateStr = date.toLocaleDateString(undefined, {
							weekday: "short",
							month: "short",
							day: "numeric",
						});
						const label =
							val && val > 0
								? `${val} ${val === 1 ? "stream" : "streams"}`
								: t("analytics.noStreams");
						return `<div class="apexcharts-tooltip-text" style="padding: 6px 10px">${dateStr}: <b>${label}</b></div>`;
					},
				},
				legend: { show: false },
			};
		}

		return {
			chart: {
				type: type(),
				toolbar: { show: false },
				background: "transparent",
				fontFamily: "inherit",
			},
			theme: { mode: "dark" },
			colors: ["#6366f1", "#a5b4fc"],
			dataLabels: { enabled: false },
			stroke: isBar() ? { width: 0 } : { curve: "smooth", width: 2 },
			fill: isBar()
				? { opacity: 0.85 }
				: {
						type: "gradient",
						gradient: { opacityFrom: 0.4, opacityTo: 0.05 },
					},
			plotOptions: isBar()
				? { bar: { borderRadius: 4, columnWidth: "60%" } }
				: {},
			markers: isBar() ? { size: 0 } : { size: 4, hover: { size: 6 } },
			xaxis: {
				categories: dailyCategories(),
				labels: {
					style: { colors: "#9ca3af", fontSize: "12px" },
				},
				axisBorder: { show: false },
				axisTicks: { show: false },
			},
			yaxis: {
				labels: {
					style: { colors: "#9ca3af", fontSize: "12px" },
					...(fmt ? { formatter: fmt } : {}),
				},
			},
			grid: {
				borderColor: "#374151",
				strokeDashArray: 4,
				xaxis: { lines: { show: false } },
			},
			tooltip: {
				theme: "dark",
				...(fmt ? { y: { formatter: fmt } } : {}),
			},
			legend: {
				labels: { colors: "#9ca3af" },
				position: "top",
				horizontalAlign: "right",
				markers: { strokeWidth: 0 },
			},
		};
	});

	return (
		<Card>
			<h3 class="mb-4 font-medium text-lg text-neutral-900">{titleText()}</h3>

			<div class="flex flex-col-reverse gap-4">
				<StatGroup columns={chartStats().length as 2 | 3 | 4}>
					<For each={chartStats()}>
						{(stat) => {
							const clickable = () => !!stat.id && !!props.onStatClick;
							const active = () =>
								stat.id != null && stat.id === props.activeStat;
							return (
								<Show
									fallback={
										<div class="rounded-lg px-2 py-1">
											<MatrixStat
												highlight={stat.highlight}
												label={stat.label}
												value={stat.value}
											/>
										</div>
									}
									when={clickable()}>
									<button
										class={`w-full rounded-lg px-2 py-1 text-left transition-colors ${
											active()
												? "bg-indigo-500/10 ring-1 ring-indigo-500/30"
												: "hover:bg-neutral-100"
										}`}
										onClick={() =>
											stat.id
												? props.onStatClick?.(stat.id)
												: console.error("s")
										}
										type="button">
										<MatrixStat
											highlight={stat.highlight || active()}
											label={stat.label}
											value={stat.value}
										/>
									</button>
								</Show>
							);
						}}
					</For>
				</StatGroup>

				<div class="h-[280px] overflow-hidden">
					<Show
						fallback={
							<div class="flex h-[280px] items-center justify-center rounded-lg bg-neutral-50">
								<div class="text-center">
									<svg
										aria-hidden="true"
										class="mx-auto h-12 w-12 text-neutral-400"
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
									<p class="mt-2 font-medium text-neutral-900 text-sm">
										{t("analytics.noStreamingData")}
									</p>
									<p class="mt-1 text-neutral-500 text-xs">
										{t("analytics.streamToSee")}
									</p>
								</div>
							</div>
						}
						when={hasAnyData()}>
						<Show keyed when={type()}>
							{(chartType) => (
								<SolidApexCharts
									height={280}
									options={options()}
									series={heatmapSeries() ?? chartSeries()}
									type={chartType}
									width="100%"
								/>
							)}
						</Show>
					</Show>
				</div>
			</div>
		</Card>
	);
}
