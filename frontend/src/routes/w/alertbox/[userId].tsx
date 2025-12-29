import { useParams } from "@solidjs/router";
import {
	Show,
	createEffect,
	createMemo,
	createSignal,
	onCleanup,
	onMount,
} from "solid-js";
import AlertboxWidget from "~/components/widgets/AlertboxWidget";
import { type AlertEvent, useAlertboxChannel } from "~/lib/socket";
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
	const [displayedEvent, setDisplayedEvent] = createSignal<AlertEvent | null>(
		null,
	);

	// Connect to the alertbox channel for real-time events
	const userId = createMemo(() => params.userId);
	const { currentEvent, clearCurrentEvent } = useAlertboxChannel(userId);

	// Track displayed event ID to prevent re-displaying the same event
	let lastDisplayedEventId: string | null = null;

	// When a new event arrives, display it and set a timer to clear it
	createEffect(() => {
		const event = currentEvent();
		if (event && event.id !== lastDisplayedEventId) {
			lastDisplayedEventId = event.id;
			setDisplayedEvent(event);

			// Clear the event after display duration
			const duration =
				(config()?.displayDuration ?? DEFAULT_CONFIG.displayDuration) * 1000;
			const timer = setTimeout(() => {
				setDisplayedEvent(null);
				clearCurrentEvent();
			}, duration);

			onCleanup(() => clearTimeout(timer));
		}
	});

	async function loadConfig() {
		const uid = params.userId;
		if (!uid) return;

		const result = await getWidgetConfig({
			input: { userId: uid, type: "alertbox_widget" },
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
		// Reload config periodically in case user changes settings
		const interval = setInterval(loadConfig, 30000);
		onCleanup(() => clearInterval(interval));
	});

	// Transform AlertEvent to the format expected by AlertboxWidget
	const widgetEvent = createMemo(() => {
		const event = displayedEvent();
		if (!event) return null;

		return {
			id: event.id,
			type: event.type as "donation" | "follow" | "subscription" | "raid",
			username: event.username,
			message: event.message,
			amount: event.amount,
			currency: event.currency,
			ttsUrl: event.ttsUrl,
			timestamp: new Date(event.timestamp),
			displayTime: config()?.displayDuration ?? DEFAULT_CONFIG.displayDuration,
			platform: event.platform,
		};
	});

	return (
		<div style={{ background: "transparent", width: "100vw", height: "100vh" }}>
			<Show when={config()}>
				{(cfg) => <AlertboxWidget config={cfg()} event={widgetEvent()} />}
			</Show>
		</div>
	);
}
