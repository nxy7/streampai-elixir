import { Title } from "@solidjs/meta";
import { useParams } from "@solidjs/router";
import { createSignal, onCleanup, onMount, Show } from "solid-js";
import PlaceholderWidget from "~/components/widgets/PlaceholderWidget";
import { getWidgetConfig } from "~/sdk/ash_rpc";

interface PlaceholderConfig {
	message: string;
	fontSize: number;
	textColor: string;
	backgroundColor: string;
	borderColor: string;
	borderWidth: number;
	padding: number;
	borderRadius: number;
}

const DEFAULT_CONFIG: PlaceholderConfig = {
	message: "Placeholder Widget",
	fontSize: 24,
	textColor: "#ffffff",
	backgroundColor: "#9333ea",
	borderColor: "#ffffff",
	borderWidth: 2,
	padding: 16,
	borderRadius: 8,
};

export default function PlaceholderDisplay() {
	const params = useParams<{ userId: string }>();
	const [config, setConfig] = createSignal<PlaceholderConfig | null>(null);

	async function loadConfig() {
		const userId = params.userId;
		if (!userId) return;

		const result = await getWidgetConfig({
			input: { userId, type: "placeholder_widget" },
			fields: ["id", "config"],
			fetchOptions: { credentials: "include" },
		});

		if (result.success && result.data.config) {
			const loadedConfig = result.data.config;
			setConfig({
				message: loadedConfig.message || DEFAULT_CONFIG.message,
				fontSize: loadedConfig.font_size || DEFAULT_CONFIG.fontSize,
				textColor: loadedConfig.text_color || DEFAULT_CONFIG.textColor,
				backgroundColor:
					loadedConfig.background_color || DEFAULT_CONFIG.backgroundColor,
				borderColor: loadedConfig.border_color || DEFAULT_CONFIG.borderColor,
				borderWidth: loadedConfig.border_width || DEFAULT_CONFIG.borderWidth,
				padding: loadedConfig.padding || DEFAULT_CONFIG.padding,
				borderRadius: loadedConfig.border_radius || DEFAULT_CONFIG.borderRadius,
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
		<>
			<Title>Placeholder Widget - Streampai</Title>
			<div
				style={{
					background: "transparent",
					width: "100vw",
					height: "100vh",
					display: "flex",
					"align-items": "center",
					"justify-content": "center",
				}}
			>
				<Show when={config()}>
					{(cfg) => <PlaceholderWidget config={cfg()} />}
				</Show>
			</div>
		</>
	);
}
