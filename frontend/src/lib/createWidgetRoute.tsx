import { useParams } from "@tanstack/solid-router";
import { type JSX, Show, createSignal, onCleanup, onMount } from "solid-js";
import { getWidgetConfig } from "~/sdk/ash_rpc";

/**
 * Converts a camelCase string to snake_case.
 */
function toSnakeCase(str: string): string {
	return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Maps a loaded config (snake_case keys) to a typed config (camelCase keys)
 * using the defaults object as the schema source.
 */
function mapConfig<T extends object>(
	loaded: Record<string, unknown>,
	defaults: T,
): T {
	const result = {} as Record<string, unknown>;
	for (const key of Object.keys(defaults as Record<string, unknown>)) {
		const snakeKey = toSnakeCase(key);
		result[key] =
			loaded[snakeKey] ?? (defaults as Record<string, unknown>)[key];
	}
	return result as T;
}

interface WidgetRouteOptions<T extends object> {
	/** The widget type string for the API call, e.g. "timer_widget" */
	widgetType: string;
	/** Title for the page, e.g. "Timer Widget" */
	title?: string;
	/** Default config values */
	defaults: T;
	/** Render function that receives the resolved config */
	render: (config: T) => JSX.Element;
	/** Container style overrides (merged with defaults) */
	containerStyle?: JSX.CSSProperties;
}

/**
 * Creates a widget display route component with standardized config loading,
 * polling, and rendering boilerplate.
 */
export function createWidgetRoute<T extends object>(
	options: WidgetRouteOptions<T>,
) {
	return function WidgetDisplay() {
		const params = useParams({ strict: false });
		const [config, setConfig] = createSignal<T | null>(null);

		async function loadConfig() {
			const userId = params().userId;
			if (!userId) return;

			const result = await getWidgetConfig({
				input: { userId, type: options.widgetType },
				fields: ["id", "config"],
				fetchOptions: { credentials: "include" },
			});

			if (result.success && result.data.config) {
				setConfig(() =>
					mapConfig(
						result.data.config as Record<string, unknown>,
						options.defaults,
					),
				);
			} else {
				setConfig(() => options.defaults);
			}
		}

		onMount(() => {
			loadConfig();
			const interval = setInterval(loadConfig, 5000);
			onCleanup(() => clearInterval(interval));
		});

		const containerStyle: JSX.CSSProperties = {
			background: "transparent",
			width: "100vw",
			height: "100vh",
			display: "flex",
			"align-items": "center",
			"justify-content": "center",
			...options.containerStyle,
		};

		return (
			<div style={containerStyle}>
				<Show when={config()}>{(cfg) => options.render(cfg())}</Show>
			</div>
		);
	};
}
