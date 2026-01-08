import { Show, createEffect, createSignal, onCleanup } from "solid-js";
import Card from "~/design-system/Card";
import { useTranslation } from "~/i18n";
import { useCurrentUser } from "~/lib/auth";
import { formatDurationShort } from "~/lib/formatters";
import { useStreamActor } from "~/lib/useElectric";

type Quality = "excellent" | "good" | "fair" | "poor" | "offline";

export default function StreamHealthMonitor() {
	const { t } = useTranslation();
	const { user } = useCurrentUser();
	const streamActor = useStreamActor(() => user()?.id);

	const isLive = () => streamActor.streamStatus() === "streaming";

	const connectionQuality = (): Quality => {
		if (!isLive()) return "offline";
		const platforms = streamActor.platformStatuses();
		const hasError = Object.values(platforms).some((p) => p.status === "error");
		if (hasError) return "poor";
		return "excellent";
	};

	const totalViewers = () => {
		const platforms = streamActor.platformStatuses();
		return Object.values(platforms).reduce(
			(sum, p) => sum + (p.viewer_count ?? 0),
			0,
		);
	};

	const [uptime, setUptime] = createSignal(0);

	createEffect(() => {
		const startedAt = streamActor.data()?.stream_data?.started_at as
			| string
			| undefined;
		if (isLive() && startedAt) {
			const startTime = new Date(startedAt).getTime();
			const update = () =>
				setUptime(Math.floor((Date.now() - startTime) / 1000));
			update();
			const interval = setInterval(update, 1000);
			onCleanup(() => clearInterval(interval));
		} else {
			setUptime(0);
		}
	});

	const qualityColor = () => {
		const q = connectionQuality();
		if (q === "offline") return "text-gray-400";
		if (q === "excellent") return "text-green-500";
		if (q === "good") return "text-blue-500";
		if (q === "fair") return "text-yellow-500";
		return "text-red-500";
	};

	const qualityBg = () => {
		const q = connectionQuality();
		if (q === "offline") return "bg-gray-400";
		if (q === "excellent") return "bg-green-500";
		if (q === "good") return "bg-blue-500";
		if (q === "fair") return "bg-yellow-500";
		return "bg-red-500";
	};

	const qualityBgLight = () => {
		const q = connectionQuality();
		if (q === "offline") return "bg-gray-100";
		if (q === "excellent") return "bg-green-500/10";
		if (q === "good") return "bg-blue-500/10";
		if (q === "fair") return "bg-yellow-500/10";
		return "bg-red-500/10";
	};

	const qualityLabel = () => {
		const q = connectionQuality();
		if (q === "offline") return t("dashboard.offline");
		if (q === "excellent") return t("dashboard.excellent");
		if (q === "good") return t("dashboard.good");
		if (q === "fair") return t("dashboard.fair");
		return t("dashboard.poor");
	};

	return (
		<Card
			class="flex h-full flex-col justify-between"
			data-testid="stream-health-monitor"
			padding="sm">
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
					<Show when={isLive()}>
						<div class={`h-2 w-2 rounded-full ${qualityBg()} animate-pulse`} />
					</Show>
					<Show when={!isLive()}>
						<div class={`h-2 w-2 rounded-full ${qualityBg()}`} />
					</Show>
					<span class={`font-medium text-xs capitalize ${qualityColor()}`}>
						{qualityLabel()}
					</span>
				</div>
			</div>
			<div class="grid grid-cols-3 gap-3">
				<div class="rounded-lg bg-gray-50 p-2 text-center">
					<p class="font-bold text-gray-900 text-lg">
						{isLive() ? totalViewers() : "—"}
					</p>
					<p class="text-gray-500 text-xs">{t("dashboard.viewers")}</p>
				</div>
				<div class="rounded-lg bg-gray-50 p-2 text-center">
					<p class="font-bold text-gray-900 text-lg">
						{isLive() ? formatDurationShort(uptime()) : "—"}
					</p>
					<p class="text-gray-500 text-xs">{t("dashboard.uptime")}</p>
				</div>
				<div class="rounded-lg bg-gray-50 p-2 text-center">
					<p class="font-bold text-gray-900 text-lg">{isLive() ? "—" : "—"}</p>
					<p class="text-gray-500 text-xs">{t("dashboard.bitrate")}</p>
				</div>
			</div>
			<Show when={!isLive()}>
				<p class="mt-3 text-center text-gray-400 text-xs">
					{t("dashboard.streamHealthHint")}
				</p>
			</Show>
		</Card>
	);
}
