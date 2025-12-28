import { useParams } from "@solidjs/router";
import { Show, createSignal, onCleanup, onMount } from "solid-js";
import AlertboxWidget from "~/components/widgets/AlertboxWidget";
import { getWidgetConfig } from "~/sdk/ash_rpc";

interface AlertConfig {
	animationType: "slide" | "fade" | "bounce";
	displayDuration: number;
	soundEnabled: boolean;
	soundVolume: number;
	showMessage: boolean;
	showAmount: boolean;
	fontSize: "small" | "medium" | "large";
	alertPosition: "top" | "center" | "bottom";
}

const DEFAULT_CONFIG: AlertConfig = {
	animationType: "fade",
	displayDuration: 5,
	soundEnabled: true,
	soundVolume: 80,
	showMessage: true,
	showAmount: true,
	fontSize: "medium",
	alertPosition: "center",
};

export default function AlertboxWidgetDisplay() {
	const params = useParams<{ userId: string }>();
	const [config, setConfig] = createSignal<AlertConfig | null>(null);

	async function loadConfig() {
		const userId = params.userId;
		if (!userId) return;

		const result = await getWidgetConfig({
			input: { userId, type: "alertbox_widget" },
			fields: ["id", "config"],
			fetchOptions: { credentials: "include" },
		});

		if (result.success && result.data.config) {
			const loadedConfig = result.data.config;
			setConfig({
				animationType:
					loadedConfig.animation_type ?? DEFAULT_CONFIG.animationType,
				displayDuration:
					loadedConfig.display_duration ?? DEFAULT_CONFIG.displayDuration,
				soundEnabled: loadedConfig.sound_enabled ?? DEFAULT_CONFIG.soundEnabled,
				soundVolume: loadedConfig.sound_volume ?? DEFAULT_CONFIG.soundVolume,
				showMessage: loadedConfig.show_message ?? DEFAULT_CONFIG.showMessage,
				showAmount: loadedConfig.show_amount ?? DEFAULT_CONFIG.showAmount,
				fontSize: loadedConfig.font_size ?? DEFAULT_CONFIG.fontSize,
				alertPosition:
					loadedConfig.alert_position ?? DEFAULT_CONFIG.alertPosition,
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
		<div style={{ background: "transparent", width: "100vw", height: "100vh" }}>
			<Show when={config()}>
				{(cfg) => <AlertboxWidget config={cfg()} event={null} />}
			</Show>
		</div>
	);
}
