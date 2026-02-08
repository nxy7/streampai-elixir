import { useParams } from "@solidjs/router";
import {
	Show,
	createEffect,
	createMemo,
	createSignal,
	on,
	onCleanup,
	onMount,
} from "solid-js";
import AlertboxWidget from "~/components/widgets/AlertboxWidget";
import { getPlatformMetadata } from "~/lib/eventMetadata";
import { useStreamActor } from "~/lib/useElectric";
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

interface AlertEvent {
	id: string;
	type: "donation" | "follow" | "subscription" | "raid";
	username: string;
	message?: string;
	amount?: number;
	currency?: string;
	timestamp: Date;
	displayTime?: number;
	ttsUrl?: string;
	platform: {
		icon: string;
		color: string;
	};
}

function toSnakeCase(str: string): string {
	return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function mapConfig(
	loaded: Record<string, unknown>,
	defaults: AlertConfig,
): AlertConfig {
	const result: Record<string, unknown> = {};
	const defaultsRecord = defaults as unknown as Record<string, unknown>;
	for (const key of Object.keys(defaultsRecord)) {
		const snakeKey = toSnakeCase(key);
		result[key] = loaded[snakeKey] ?? defaultsRecord[key];
	}
	return result as unknown as AlertConfig;
}

export default function AlertboxDisplay() {
	const params = useParams();
	const [config, setConfig] = createSignal<AlertConfig | null>(null);
	const [visibleEvent, setVisibleEvent] = createSignal<AlertEvent | null>(null);
	const [exiting, setExiting] = createSignal(false);

	// Electric sync for active_alert from CurrentStreamData
	const streamActor = useStreamActor(() => params.userId);

	const activeAlert = createMemo(() => {
		const data = streamActor.data();
		if (!data) return null;
		const alert = data.active_alert;
		if (!alert || typeof alert !== "object") return null;
		return alert as Record<string, unknown>;
	});

	const _alertboxPaused = createMemo(() => {
		const data = streamActor.data();
		if (!data) return false;
		const state = data.alertbox_state;
		return (state as Record<string, unknown>)?.paused === true;
	});

	// Convert active_alert from DB to AlertEvent format
	function toAlertEvent(alert: Record<string, unknown>): AlertEvent | null {
		const startedAt = alert.started_at
			? new Date(alert.started_at as string)
			: new Date();
		const duration = (alert.duration as number) ?? 10000;
		const elapsed = Date.now() - startedAt.getTime();

		// Skip if already expired
		if (elapsed >= duration) return null;

		const platformStr = (alert.platform as string) ?? "unknown";
		const meta = getPlatformMetadata(platformStr);

		return {
			id: alert.id as string,
			type: (alert.type as AlertEvent["type"]) ?? "donation",
			username: (alert.username as string) ?? "Unknown",
			message: alert.message as string | undefined,
			amount: alert.amount as number | undefined,
			currency: alert.currency as string | undefined,
			timestamp: startedAt,
			displayTime: Math.ceil((duration - elapsed) / 1000),
			ttsUrl: alert.tts_url as string | undefined,
			platform: { icon: platformStr, color: meta.color },
		};
	}

	// React to active_alert changes
	createEffect(
		on(activeAlert, (alert, prevAlert) => {
			if (!alert) {
				// Alert cleared — trigger exit animation
				if (visibleEvent()) {
					setExiting(true);
					setTimeout(() => {
						setVisibleEvent(null);
						setExiting(false);
					}, 800);
				}
				return;
			}

			const alertId = alert.id as string;
			const prevId = prevAlert ? (prevAlert.id as string) : null;

			if (alertId !== prevId) {
				// New alert arrived
				const event = toAlertEvent(alert);
				if (event) {
					setExiting(false);
					setVisibleEvent(event);

					// Auto-hide after remaining duration
					const remaining = (event.displayTime ?? 5) * 1000;
					const timer = setTimeout(() => {
						setExiting(true);
						setTimeout(() => {
							setVisibleEvent(null);
							setExiting(false);
						}, 800);
					}, remaining);
					onCleanup(() => clearTimeout(timer));
				}
			}
		}),
	);

	// Load widget config (display settings) via polling
	async function loadConfig() {
		const userId = params.userId;
		if (!userId) return;

		const result = await getWidgetConfig({
			input: { userId, type: "alertbox_widget" },
			fields: ["id", "config"],
			fetchOptions: { credentials: "include" },
		});

		if (result.success && result.data?.config) {
			setConfig(() =>
				mapConfig(
					result.data.config as Record<string, unknown>,
					DEFAULT_CONFIG,
				),
			);
		} else {
			setConfig(() => DEFAULT_CONFIG);
		}
	}

	onMount(() => {
		loadConfig();
		const interval = setInterval(loadConfig, 5000);
		onCleanup(() => clearInterval(interval));
	});

	const displayEvent = createMemo(() => {
		if (exiting()) return visibleEvent(); // Keep showing during exit animation
		return visibleEvent();
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
				{(cfg) => <AlertboxWidget config={cfg()} event={displayEvent()} />}
			</Show>
		</div>
	);
}
