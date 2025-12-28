import { createSignal } from "solid-js";
import Card from "~/components/ui/Card";
import { useTranslation } from "~/i18n";

export default function StreamHealthMonitor() {
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
