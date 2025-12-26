import { createMemo, createSignal, Show } from "solid-js";
import PlaceholderWidget from "~/components/widgets/PlaceholderWidget";
import { useCurrentUser } from "~/lib/auth";
import { useWidgetConfig } from "~/lib/useElectric";
import { saveWidgetConfig } from "~/sdk/ash_rpc";
import { button, card, input, text } from "~/styles/design-system";

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

interface BackendPlaceholderConfig {
	message?: string;
	font_size?: number;
	text_color?: string;
	background_color?: string;
	border_color?: string;
	border_width?: number;
	padding?: number;
	border_radius?: number;
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

function parseBackendConfig(
	backendConfig: BackendPlaceholderConfig,
): PlaceholderConfig {
	return {
		message: backendConfig.message || DEFAULT_CONFIG.message,
		fontSize: backendConfig.font_size || DEFAULT_CONFIG.fontSize,
		textColor: backendConfig.text_color || DEFAULT_CONFIG.textColor,
		backgroundColor:
			backendConfig.background_color || DEFAULT_CONFIG.backgroundColor,
		borderColor: backendConfig.border_color || DEFAULT_CONFIG.borderColor,
		borderWidth: backendConfig.border_width || DEFAULT_CONFIG.borderWidth,
		padding: backendConfig.padding || DEFAULT_CONFIG.padding,
		borderRadius: backendConfig.border_radius || DEFAULT_CONFIG.borderRadius,
	};
}

export default function PlaceholderSettings() {
	const { user, isLoading } = useCurrentUser();
	const userId = createMemo(() => user()?.id);

	const widgetConfigQuery = useWidgetConfig<BackendPlaceholderConfig>(
		userId,
		() => "placeholder_widget",
	);

	const [saving, setSaving] = createSignal(false);
	const [saveMessage, setSaveMessage] = createSignal<string | null>(null);
	const [localOverrides, setLocalOverrides] = createSignal<
		Partial<PlaceholderConfig>
	>({});

	// Config is synced from Electric, with local overrides applied on top
	const config = createMemo(() => {
		const syncedConfig = widgetConfigQuery.data();
		const baseConfig = syncedConfig?.config
			? parseBackendConfig(syncedConfig.config)
			: DEFAULT_CONFIG;
		return { ...baseConfig, ...localOverrides() };
	});

	const loading = createMemo(() => isLoading());

	async function handleSave() {
		if (!userId()) {
			setSaveMessage("Error: Not logged in");
			return;
		}

		setSaving(true);
		setSaveMessage(null);

		const currentConfig = config();
		const backendConfig = {
			message: currentConfig.message,
			font_size: currentConfig.fontSize,
			text_color: currentConfig.textColor,
			background_color: currentConfig.backgroundColor,
			border_color: currentConfig.borderColor,
			border_width: currentConfig.borderWidth,
			padding: currentConfig.padding,
			border_radius: currentConfig.borderRadius,
		};

		const result = await saveWidgetConfig({
			input: {
				userId: userId() ?? "",
				type: "placeholder_widget",
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

	function updateConfig(
		field: keyof PlaceholderConfig,
		value: string | number,
	) {
		setLocalOverrides((prev) => ({ ...prev, [field]: value }));
	}

	return (
		<div class="space-y-6">
			<div>
				<h1 class={text.h1}>Placeholder Widget Settings</h1>
				<p class={text.muted}>Configure your placeholder widget for OBS</p>
			</div>

			<Show when={!loading()} fallback={<div>Loading...</div>}>
				<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
					<div class={card.default}>
						<h2 class={text.h2}>Configuration</h2>
						<div class="mt-4 space-y-4">
							<div>
								<label class="block font-medium text-gray-700 text-sm">
									Message
									<input
										type="text"
										class={`mt-1 ${input.text}`}
										value={config().message}
										onInput={(e) =>
											updateConfig("message", e.currentTarget.value)
										}
									/>
								</label>
							</div>

							<div>
								<label class="block font-medium text-gray-700 text-sm">
									Font Size (px)
									<input
										type="number"
										class={`mt-1 ${input.text}`}
										value={config().fontSize}
										onInput={(e) =>
											updateConfig(
												"fontSize",
												parseInt(e.currentTarget.value, 10),
											)
										}
										min="8"
										max="72"
									/>
								</label>
							</div>

							<div>
								<label class="block font-medium text-gray-700 text-sm">
									Text Color
									<div class="mt-1 flex gap-2">
										<input
											type="color"
											class="h-10 w-20 cursor-pointer rounded border border-gray-300"
											value={config().textColor}
											onInput={(e) =>
												updateConfig("textColor", e.currentTarget.value)
											}
										/>
										<input
											type="text"
											class={input.text}
											value={config().textColor}
											onInput={(e) =>
												updateConfig("textColor", e.currentTarget.value)
											}
										/>
									</div>
								</label>
							</div>

							<div>
								<label class="block font-medium text-gray-700 text-sm">
									Background Color
									<div class="mt-1 flex gap-2">
										<input
											type="color"
											class="h-10 w-20 cursor-pointer rounded border border-gray-300"
											value={config().backgroundColor}
											onInput={(e) =>
												updateConfig("backgroundColor", e.currentTarget.value)
											}
										/>
										<input
											type="text"
											class={input.text}
											value={config().backgroundColor}
											onInput={(e) =>
												updateConfig("backgroundColor", e.currentTarget.value)
											}
										/>
									</div>
								</label>
							</div>

							<div>
								<label class="block font-medium text-gray-700 text-sm">
									Border Color
									<div class="mt-1 flex gap-2">
										<input
											type="color"
											class="h-10 w-20 cursor-pointer rounded border border-gray-300"
											value={config().borderColor}
											onInput={(e) =>
												updateConfig("borderColor", e.currentTarget.value)
											}
										/>
										<input
											type="text"
											class={input.text}
											value={config().borderColor}
											onInput={(e) =>
												updateConfig("borderColor", e.currentTarget.value)
											}
										/>
									</div>
								</label>
							</div>

							<div>
								<label class="block font-medium text-gray-700 text-sm">
									Border Width (px)
									<input
										type="number"
										class={`mt-1 ${input.text}`}
										value={config().borderWidth}
										onInput={(e) =>
											updateConfig(
												"borderWidth",
												parseInt(e.currentTarget.value, 10),
											)
										}
										min="0"
										max="10"
									/>
								</label>
							</div>

							<div>
								<label class="block font-medium text-gray-700 text-sm">
									Padding (px)
									<input
										type="number"
										class={`mt-1 ${input.text}`}
										value={config().padding}
										onInput={(e) =>
											updateConfig(
												"padding",
												parseInt(e.currentTarget.value, 10),
											)
										}
										min="0"
										max="50"
									/>
								</label>
							</div>

							<div>
								<label class="block font-medium text-gray-700 text-sm">
									Border Radius (px)
									<input
										type="number"
										class={`mt-1 ${input.text}`}
										value={config().borderRadius}
										onInput={(e) =>
											updateConfig(
												"borderRadius",
												parseInt(e.currentTarget.value, 10),
											)
										}
										min="0"
										max="50"
									/>
								</label>
							</div>

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

							<button
								type="button"
								class={button.primary}
								onClick={handleSave}
								disabled={saving()}>
								{saving() ? "Saving..." : "Save Configuration"}
							</button>
						</div>
					</div>

					<div class={card.default}>
						<h2 class={text.h2}>Preview</h2>
						<div class="mt-4 space-y-4">
							<div class="flex min-h-[200px] items-center justify-center rounded-lg bg-gray-900 p-8">
								<PlaceholderWidget config={config()} />
							</div>
							<div class="space-y-2">
								<h3 class={text.h3}>OBS Browser Source URL</h3>
								<p class={text.helper}>
									Add this URL to OBS as a Browser Source:
								</p>
								<div class="break-all rounded bg-gray-100 p-3 font-mono text-sm">
									{window.location.origin}/w/placeholder/{userId()}
								</div>
								<p class={text.helper}>Recommended Browser Source settings:</p>
								<ul class={`${text.helper} ml-4 list-disc`}>
									<li>Width: 800</li>
									<li>Height: 600</li>
									<li>Enable "Shutdown source when not visible"</li>
									<li>Enable "Refresh browser when scene becomes active"</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			</Show>
		</div>
	);
}
