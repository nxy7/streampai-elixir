import { useParams } from "@solidjs/router";
import { createMemo, createSignal, onCleanup, onMount } from "solid-js";
import ViewerCountWidget from "~/components/widgets/ViewerCountWidget";
import {
	type ViewerCountConfig,
	type ViewerData,
	defaultConfig,
	generateViewerData,
	generateViewerUpdate,
} from "~/lib/fake/viewer-count";
import { useWidgetConfig } from "~/lib/useElectric";

export default function ViewerCountDisplay() {
	const params = useParams<{ userId: string }>();

	const widgetConfig = useWidgetConfig(
		() => params.userId,
		() => "viewer_count_widget",
	);

	const config = createMemo<ViewerCountConfig>(() => {
		const raw = widgetConfig.data()?.config as ViewerCountConfig | undefined;
		if (!raw) return defaultConfig();
		return raw;
	});

	const [viewerData, setViewerData] = createSignal<ViewerData>(
		generateViewerData(),
	);

	onMount(() => {
		const dataInterval = window.setInterval(() => {
			const current = viewerData();
			setViewerData(generateViewerUpdate(current));
		}, 3000);

		onCleanup(() => clearInterval(dataInterval));
	});

	return (
		<div
			style={{
				background: "transparent",
				width: "100vw",
				height: "100vh",
				display: "flex",
				"align-items": "center",
				"justify-content": "center",
			}}>
			<ViewerCountWidget config={config()} data={viewerData()} />
		</div>
	);
}
