import { Title } from "@solidjs/meta";
import { useParams } from "@solidjs/router";
import { createSignal, onCleanup, onMount } from "solid-js";
import ViewerCountWidget from "~/components/widgets/ViewerCountWidget";
import {
	defaultConfig,
	generateViewerData,
	generateViewerUpdate,
	type ViewerCountConfig,
	type ViewerData,
} from "~/lib/fake/viewer-count";
import { getWidgetConfig } from "~/sdk/ash_rpc";

export default function ViewerCountDisplay() {
	const params = useParams<{ userId: string }>();
	const [config, setConfig] = createSignal<ViewerCountConfig>(defaultConfig());
	const [viewerData, setViewerData] = createSignal<ViewerData>(
		generateViewerData(),
	);

	let configInterval: number | undefined;
	let dataInterval: number | undefined;

	async function loadConfig() {
		const userId = params.userId;
		if (!userId) return;

		const result = await getWidgetConfig({
			input: { userId, type: "viewer_count_widget" },
			fields: ["id", "config"],
			fetchOptions: { credentials: "include" },
		});

		if (result.success && result.data.config) {
			setConfig(result.data.config as ViewerCountConfig);
		} else {
			setConfig(defaultConfig());
		}
	}

	onMount(() => {
		loadConfig();

		configInterval = window.setInterval(() => {
			loadConfig();
		}, 5000);

		dataInterval = window.setInterval(() => {
			const current = viewerData();
			setViewerData(generateViewerUpdate(current));
		}, 3000);
	});

	onCleanup(() => {
		if (configInterval) {
			clearInterval(configInterval);
		}
		if (dataInterval) {
			clearInterval(dataInterval);
		}
	});

	return (
		<>
			<Title>Viewer Count Widget - Streampai</Title>
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
		</>
	);
}
