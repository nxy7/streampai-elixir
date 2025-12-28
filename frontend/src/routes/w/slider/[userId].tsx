import { useParams } from "@solidjs/router";
import { Show, createSignal, onCleanup, onMount } from "solid-js";
import SliderWidget from "~/components/widgets/SliderWidget";
import { rpcOptions } from "~/lib/csrf";
import { getWidgetConfig } from "~/sdk/ash_rpc";

interface SliderImage {
	id: string;
	url: string;
	alt?: string;
	index: number;
}

interface SliderConfig {
	slideDuration: number;
	transitionDuration: number;
	transitionType: "fade" | "slide" | "slide-up" | "zoom" | "flip";
	fitMode: "contain" | "cover" | "fill";
	backgroundColor: string;
	images?: SliderImage[];
}

const DEFAULT_CONFIG: SliderConfig = {
	slideDuration: 5,
	transitionDuration: 500,
	transitionType: "fade",
	fitMode: "contain",
	backgroundColor: "transparent",
	images: [],
};

export default function SliderDisplay() {
	const params = useParams<{ userId: string }>();
	const [config, setConfig] = createSignal<SliderConfig | null>(null);

	async function loadConfig() {
		const userId = params.userId;
		if (!userId) return;

		const result = await getWidgetConfig({
			input: { userId, type: "slider_widget" },
			fields: ["id", "config"],
			...rpcOptions(),
		});

		if (result.success && result.data.config) {
			const loadedConfig = result.data.config;
			setConfig({
				slideDuration:
					loadedConfig.slide_duration || DEFAULT_CONFIG.slideDuration,
				transitionDuration:
					loadedConfig.transition_duration || DEFAULT_CONFIG.transitionDuration,
				transitionType:
					loadedConfig.transition_type || DEFAULT_CONFIG.transitionType,
				fitMode: loadedConfig.fit_mode || DEFAULT_CONFIG.fitMode,
				backgroundColor:
					loadedConfig.background_color || DEFAULT_CONFIG.backgroundColor,
				images: loadedConfig.images || DEFAULT_CONFIG.images,
			});
		} else {
			setConfig(DEFAULT_CONFIG);
		}
	}

	onMount(() => {
		loadConfig();

		const interval = setInterval(loadConfig, 5000);
		onCleanup(() => clearInterval(interval));
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
			<Show when={config()}>
				{(cfg) => (
					<div style={{ width: "100%", height: "100%" }}>
						<SliderWidget config={cfg()} />
					</div>
				)}
			</Show>
		</div>
	);
}
