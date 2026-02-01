import { For, createMemo } from "solid-js";
import { Card, ProgressBar } from "~/design-system";

export interface PlatformData {
	label: string;
	value: number;
}

interface PlatformDistributionChartProps {
	title: string;
	data: PlatformData[];
}

export function PlatformDistributionChart(
	props: PlatformDistributionChartProps,
) {
	const maxValue = createMemo(() => {
		return Math.max(...props.data.map((d) => d.value), 100);
	});

	return (
		<Card>
			<h3 class="mb-4 font-medium text-lg text-neutral-900">{props.title}</h3>
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
