import { Title } from "@solidjs/meta";
import { useParams } from "@solidjs/router";
import { createSignal, onCleanup, onMount, Show } from "solid-js";
import TimerWidget from "~/components/widgets/TimerWidget";
import { getWidgetConfig } from "~/sdk/ash_rpc";

interface TimerConfig {
	label: string;
	fontSize: number;
	textColor: string;
	backgroundColor: string;
	countdownMinutes: number;
	autoStart: boolean;
}

const DEFAULT_CONFIG: TimerConfig = {
	label: "TIMER",
	fontSize: 48,
	textColor: "#ffffff",
	backgroundColor: "#3b82f6",
	countdownMinutes: 5,
	autoStart: false,
};

export default function TimerDisplay() {
	const params = useParams<{ userId: string }>();
	const [config, setConfig] = createSignal<TimerConfig | null>(null);

	async function loadConfig() {
		const userId = params.userId;
		if (!userId) return;

		const result = await getWidgetConfig({
			input: { userId, type: "timer_widget" },
			fields: ["id", "config"],
			fetchOptions: { credentials: "include" },
		});

		if (result.success && result.data.config) {
			const loadedConfig = result.data.config;
			setConfig({
				label: loadedConfig.label || DEFAULT_CONFIG.label,
				fontSize: loadedConfig.font_size || DEFAULT_CONFIG.fontSize,
				textColor: loadedConfig.text_color || DEFAULT_CONFIG.textColor,
				backgroundColor:
					loadedConfig.background_color || DEFAULT_CONFIG.backgroundColor,
				countdownMinutes:
					loadedConfig.countdown_minutes || DEFAULT_CONFIG.countdownMinutes,
				autoStart: loadedConfig.auto_start ?? DEFAULT_CONFIG.autoStart,
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
			<Title>Timer Widget - Streampai</Title>
			<div
				style={{
					background: "transparent",
					width: "100vw",
					height: "100vh",
					display: "flex",
					"align-items": "center",
					"justify-content": "center",
				}}>
				<Show when={config()}>{(cfg) => <TimerWidget config={cfg()} />}</Show>
			</div>
		</>
	);
}
