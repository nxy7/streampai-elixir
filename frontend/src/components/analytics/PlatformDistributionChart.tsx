import type { ApexOptions } from "apexcharts";
import { SolidApexCharts } from "solid-apexcharts";
import { Show, createMemo } from "solid-js";
import { Card } from "~/design-system";

export interface PlatformData {
	label: string;
	value: number;
}

interface PlatformDistributionChartProps {
	title: string;
	data: PlatformData[];
}

const platformColors: Record<string, string> = {
	Twitch: "#a78bfa",
	Youtube: "#f87171",
	YouTube: "#f87171",
	Facebook: "#60a5fa",
	Kick: "#4ade80",
};

export function PlatformDistributionChart(
	props: PlatformDistributionChartProps,
) {
	const hasData = createMemo(() => props.data.some((d) => d.value > 0));

	const series = createMemo(() => props.data.map((d) => d.value));
	const labels = createMemo(() => props.data.map((d) => d.label));
	const colors = createMemo(() =>
		props.data.map((d) => platformColors[d.label] ?? "#6366f1"),
	);

	const options = createMemo(
		(): ApexOptions => ({
			chart: {
				type: "donut",
				background: "transparent",
				fontFamily: "inherit",
			},
			theme: { mode: "dark" },
			labels: labels(),
			colors: colors(),
			dataLabels: {
				enabled: true,
				style: { fontSize: "13px", fontWeight: 600 },
			},
			plotOptions: {
				pie: {
					donut: {
						size: "55%",
					},
				},
			},
			stroke: { width: 0 },
			legend: {
				position: "bottom",
				labels: { colors: "#9ca3af" },
				markers: { strokeWidth: 0 },
			},
			tooltip: { theme: "dark" },
		}),
	);

	return (
		<Card variant="ghost">
			<h3 class="mb-4 font-medium text-lg text-neutral-900">{props.title}</h3>
			<Show
				fallback={
					<div class="flex h-48 items-center justify-center text-neutral-500 text-sm">
						No platform data available
					</div>
				}
				when={hasData()}>
				<SolidApexCharts
					height={300}
					options={options()}
					series={series()}
					type="donut"
					width="100%"
				/>
			</Show>
		</Card>
	);
}
