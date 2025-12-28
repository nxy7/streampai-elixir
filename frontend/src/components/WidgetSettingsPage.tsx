/**
 * Generic Widget Settings Page component.
 *
 * This component provides a standardized layout and behavior for all widget
 * settings pages. It handles:
 * - Loading widget config from Electric SQL
 * - Form generation from Zod schema + metadata
 * - Config state management (synced + local overrides)
 * - Saving to backend via RPC
 * - Live preview of the widget
 *
 * @example
 * ```tsx
 * import { z } from "zod";
 * import TimerWidget from "~/components/widgets/TimerWidget";
 * import { WidgetSettingsPage } from "~/components/WidgetSettingsPage";
 * import type { FormMeta } from "~/lib/schema-form";
 *
 * const timerSchema = z.object({
 *   label: z.string().default("TIMER"),
 *   fontSize: z.number().min(24).max(120).default(48),
 *   textColor: z.string().default("#ffffff"),
 *   backgroundColor: z.string().default("#3b82f6"),
 *   countdownMinutes: z.number().min(1).max(120).default(5),
 *   autoStart: z.boolean().default(false),
 * });
 *
 * const timerMeta: FormMeta<typeof timerSchema.shape> = {
 *   label: { label: "Timer Label", placeholder: "Enter label" },
 *   fontSize: { label: "Font Size", unit: "px" },
 *   textColor: { label: "Text Color", inputType: "color" },
 *   backgroundColor: { label: "Background Color", inputType: "color" },
 *   countdownMinutes: { label: "Countdown Duration", unit: "minutes" },
 *   autoStart: { label: "Auto Start on Load", description: "Start automatically when loaded in OBS" },
 * };
 *
 * export default function TimerSettings() {
 *   return (
 *     <WidgetSettingsPage
 *       title="Timer Widget Settings"
 *       description="Configure your countdown timer widget for OBS"
 *       widgetType="timer_widget"
 *       widgetUrlPath="timer"
 *       schema={timerSchema}
 *       meta={timerMeta}
 *       PreviewComponent={TimerWidget}
 *     />
 *   );
 * }
 * ```
 */

import {
	type Component,
	type JSX,
	Show,
	createMemo,
	createSignal,
} from "solid-js";
import type { z } from "zod";
import Button from "~/components/ui/Button";
import Card from "~/components/ui/Card";
import { useCurrentUser } from "~/lib/auth";
import type { WidgetType } from "~/lib/electric";
import { type FormMeta, SchemaForm, getDefaultValues } from "~/lib/schema-form";
import { useWidgetConfig } from "~/lib/useElectric";
import { saveWidgetConfig } from "~/sdk/ash_rpc";
import { text } from "~/styles/design-system";

/**
 * Convert camelCase to snake_case for backend
 */
function toSnakeCase(str: string): string {
	return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Convert snake_case to camelCase for frontend
 */
function toCamelCase(str: string): string {
	return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert object keys from snake_case to camelCase
 */
function keysToFrontend<T extends Record<string, unknown>>(
	obj: Record<string, unknown>,
): T {
	const result: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(obj)) {
		result[toCamelCase(key)] = value;
	}
	return result as T;
}

/**
 * Convert object keys from camelCase to snake_case
 */
function keysToBackend(obj: Record<string, unknown>): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(obj)) {
		result[toSnakeCase(key)] = value;
	}
	return result;
}

export interface WidgetSettingsPageProps<T extends z.ZodRawShape, P = object> {
	/** Page title */
	title: string;
	/** Page description */
	description: string;
	/** Widget type for backend (e.g., "timer_widget") */
	widgetType: WidgetType;
	/** URL path segment for OBS URL (e.g., "timer") */
	widgetUrlPath: string;
	/** Zod schema defining the config structure */
	schema: z.ZodObject<T>;
	/** Optional metadata for form field customization */
	meta?: FormMeta<T>;
	/** Widget component for preview */
	PreviewComponent: Component<{ config: z.infer<z.ZodObject<T>> } & P>;
	/** Additional props to pass to preview component (e.g., count for FollowerCount) */
	previewProps?: P;
	/** Optional custom preview wrapper (for widgets that need demo controls) */
	previewWrapper?: (props: {
		config: z.infer<z.ZodObject<T>>;
		children: JSX.Element;
	}) => JSX.Element;
	/** Optional OBS recommended settings */
	obsSettings?: {
		width?: number;
		height?: number;
		customTips?: string[];
	};
}

export function WidgetSettingsPage<T extends z.ZodRawShape, P = object>(
	props: WidgetSettingsPageProps<T, P>,
): JSX.Element {
	type Config = z.infer<z.ZodObject<T>>;

	const { user, isLoading: userIsLoading } = useCurrentUser();
	const userId = createMemo(() => user()?.id);

	// Fetch synced config from Electric SQL
	const widgetConfigQuery = useWidgetConfig<Record<string, unknown>>(
		userId,
		() => props.widgetType,
	);

	// State for saving
	const [saving, setSaving] = createSignal(false);
	const [saveMessage, setSaveMessage] = createSignal<string | null>(null);

	// Local overrides for unsaved changes
	const [localOverrides, setLocalOverrides] = createSignal<Partial<Config>>({});

	// Get defaults from schema
	const defaultConfig = createMemo(() => getDefaultValues(props.schema));

	// Compute final config: defaults <- synced <- local overrides
	const config = createMemo((): Config => {
		const synced = widgetConfigQuery.data();
		const syncedConfig = synced?.config
			? keysToFrontend<Config>(synced.config)
			: {};

		return {
			...defaultConfig(),
			...syncedConfig,
			...localOverrides(),
		} as Config;
	});

	// Ready when user is loaded
	// We always have valid defaults from the schema, so we can show the form immediately
	// Electric data (from cache or sync) will fill in saved values reactively
	const ready = createMemo(() => !userIsLoading() && !!userId());

	// Handle field changes
	function handleChange<K extends keyof Config>(field: K, value: Config[K]) {
		setLocalOverrides((prev) => ({ ...prev, [field]: value }));
	}

	// Save config to backend
	async function handleSave() {
		if (!userId()) {
			setSaveMessage("Error: Not logged in");
			return;
		}

		setSaving(true);
		setSaveMessage(null);

		// Convert to snake_case for backend
		const backendConfig = keysToBackend(config() as Record<string, unknown>);

		const result = await saveWidgetConfig({
			input: {
				userId: userId() ?? "",
				type: props.widgetType,
				config: backendConfig,
			},
			fields: ["id", "config"],
			fetchOptions: { credentials: "include" },
		});

		setSaving(false);

		if (!result.success) {
			setSaveMessage(`Error: ${result.errors[0]?.message || "Failed to save"}`);
		} else {
			setSaveMessage("Configuration saved successfully!");
			setLocalOverrides({});
			setTimeout(() => setSaveMessage(null), 3000);
		}
	}

	// Default OBS settings
	const obsWidth = () => props.obsSettings?.width ?? 800;
	const obsHeight = () => props.obsSettings?.height ?? 600;

	return (
		<div class="space-y-6">
			<div>
				<h1 class={text.h1}>{props.title}</h1>
				<p class={text.muted}>{props.description}</p>
			</div>

			<Show fallback={<div>Loading...</div>} when={ready()}>
				<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
					{/* Configuration Form */}
					<Card>
						<h2 class={text.h2}>Configuration</h2>
						<div class="mt-4 space-y-4">
							<SchemaForm
								meta={props.meta}
								onChange={handleChange}
								schema={props.schema}
								values={config()}
							/>

							<Show when={saveMessage()}>
								<div
									class={
										saveMessage()?.startsWith("Error")
											? "rounded-lg border border-red-200 bg-red-50 p-3 text-red-700"
											: "rounded-lg border border-green-200 bg-green-50 p-3 text-green-700"
									}>
									{saveMessage()}
								</div>
							</Show>

							<Button disabled={saving()} onClick={handleSave} type="button">
								{saving() ? "Saving..." : "Save Configuration"}
							</Button>
						</div>
					</Card>

					{/* Preview */}
					<Card>
						<h2 class={text.h2}>Preview</h2>
						<div class="mt-4 space-y-4">
							{props.previewWrapper ? (
								props.previewWrapper({
									config: config(),
									children: (
										<div class="flex min-h-[200px] items-center justify-center rounded-lg bg-gray-900 p-8">
											<props.PreviewComponent
												config={config()}
												{...(props.previewProps as P)}
											/>
										</div>
									),
								})
							) : (
								<div class="flex min-h-[200px] items-center justify-center rounded-lg bg-gray-900 p-8">
									<props.PreviewComponent
										config={config()}
										{...(props.previewProps as P)}
									/>
								</div>
							)}

							<div class="space-y-2">
								<h3 class={text.h3}>OBS Browser Source URL</h3>
								<p class={text.helper}>
									Add this URL to OBS as a Browser Source:
								</p>
								<div class="break-all rounded bg-gray-100 p-3 font-mono text-sm">
									{window.location.origin}/w/{props.widgetUrlPath}/{userId()}
								</div>
								<p class={text.helper}>Recommended Browser Source settings:</p>
								<ul class={`${text.helper} ml-4 list-disc`}>
									<li>Width: {obsWidth()}</li>
									<li>Height: {obsHeight()}</li>
									<li>Enable "Shutdown source when not visible"</li>
									<li>Enable "Refresh browser when scene becomes active"</li>
									{props.obsSettings?.customTips?.map((tip) => (
										<li>{tip}</li>
									))}
								</ul>
							</div>
						</div>
					</Card>
				</div>
			</Show>
		</div>
	);
}
