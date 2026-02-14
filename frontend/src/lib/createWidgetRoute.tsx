import { useParams } from "@solidjs/router";
import { type JSX, Show, createMemo } from "solid-js";
import type { WidgetType } from "~/lib/electric";
import { useWidgetConfig } from "~/lib/useElectric";

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
	widgetType: WidgetType;
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
 * Creates a widget display route component with standardized config loading
 * via Electric real-time sync.
 */
export function createWidgetRoute<T extends object>(
	options: WidgetRouteOptions<T>,
) {
	return function WidgetDisplay() {
		const params = useParams<{ userId: string }>();

		const widgetConfig = useWidgetConfig(
			() => params.userId,
			() => options.widgetType,
		);

		const config = createMemo<T>(() => {
			const raw = widgetConfig.data()?.config as
				| Record<string, unknown>
				| undefined;
			if (!raw) return options.defaults;
			return mapConfig(raw, options.defaults);
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
