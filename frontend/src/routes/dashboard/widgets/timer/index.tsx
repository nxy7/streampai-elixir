import { createMemo, createSignal, Show } from "solid-js";
import TimerWidget from "~/components/widgets/TimerWidget";
import { useCurrentUser } from "~/lib/auth";
import { useWidgetConfig } from "~/lib/useElectric";
import { saveWidgetConfig } from "~/sdk/ash_rpc";
import { button, card, input, text } from "~/styles/design-system";

interface TimerConfig {
	label: string;
	fontSize: number;
	textColor: string;
	backgroundColor: string;
	countdownMinutes: number;
	autoStart: boolean;
}

interface BackendTimerConfig {
	label?: string;
	font_size?: number;
	text_color?: string;
	background_color?: string;
	countdown_minutes?: number;
	auto_start?: boolean;
}

const DEFAULT_CONFIG: TimerConfig = {
	label: "TIMER",
	fontSize: 48,
	textColor: "#ffffff",
	backgroundColor: "#3b82f6",
	countdownMinutes: 5,
	autoStart: false,
};

function parseBackendConfig(backendConfig: BackendTimerConfig): TimerConfig {
	return {
		label: backendConfig.label || DEFAULT_CONFIG.label,
		fontSize: backendConfig.font_size || DEFAULT_CONFIG.fontSize,
		textColor: backendConfig.text_color || DEFAULT_CONFIG.textColor,
		backgroundColor:
			backendConfig.background_color || DEFAULT_CONFIG.backgroundColor,
		countdownMinutes:
			backendConfig.countdown_minutes || DEFAULT_CONFIG.countdownMinutes,
		autoStart: backendConfig.auto_start ?? DEFAULT_CONFIG.autoStart,
	};
}

export default function TimerSettings() {
	const { user, isLoading } = useCurrentUser();
	const userId = createMemo(() => user()?.id);

	const widgetConfigQuery = useWidgetConfig<BackendTimerConfig>(
		userId,
		() => "timer_widget",
	);

	const [saving, setSaving] = createSignal(false);
	const [saveMessage, setSaveMessage] = createSignal<string | null>(null);
	const [localOverrides, setLocalOverrides] = createSignal<
		Partial<TimerConfig>
	>({});

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
			label: currentConfig.label,
			font_size: currentConfig.fontSize,
			text_color: currentConfig.textColor,
			background_color: currentConfig.backgroundColor,
			countdown_minutes: currentConfig.countdownMinutes,
			auto_start: currentConfig.autoStart,
		};

		const result = await saveWidgetConfig({
			input: {
				userId: userId() ?? "",
				type: "timer_widget",
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
		field: keyof TimerConfig,
		value: string | number | boolean,
	) {
		setLocalOverrides((prev) => ({ ...prev, [field]: value }));
	}

	return (
		<div class="space-y-6">
			<div>
				<h1 class={text.h1}>Timer Widget Settings</h1>
				<p class={text.muted}>Configure your countdown timer widget for OBS</p>
			</div>

			<Show when={!loading()} fallback={<div>Loading...</div>}>
				<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
					<div class={card.default}>
						<h2 class={text.h2}>Configuration</h2>
						<div class="mt-4 space-y-4">
							<div>
								<label class="block font-medium text-gray-700 text-sm">
									Label
									<input
										type="text"
										class={`mt-1 ${input.text}`}
										value={config().label}
										onInput={(e) =>
											updateConfig("label", e.currentTarget.value)
										}
										placeholder="TIMER"
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
										min="24"
										max="120"
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
									Countdown Duration (minutes)
									<input
										type="number"
										class={`mt-1 ${input.text}`}
										value={config().countdownMinutes}
										onInput={(e) =>
											updateConfig(
												"countdownMinutes",
												parseInt(e.currentTarget.value, 10),
											)
										}
										min="1"
										max="120"
									/>
								</label>
							</div>

							<div>
								<label class="flex cursor-pointer items-center gap-2">
									<input
										type="checkbox"
										checked={config().autoStart}
										onChange={(e) =>
											updateConfig("autoStart", e.currentTarget.checked)
										}
										class="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
									/>
									<span class="font-medium text-gray-700 text-sm">
										Auto Start on Load
									</span>
								</label>
							</div>

							<Show when={saveMessage()}>
								<div
									class={
										saveMessage()?.startsWith("Error")
											? "rounded-lg border border-red-200 bg-red-50 p-3 text-red-700"
											: "rounded-lg border border-green-200 bg-green-50 p-3 text-green-700"
									}
								>
									{saveMessage()}
								</div>
							</Show>

							<button
								type="button"
								class={button.primary}
								onClick={handleSave}
								disabled={saving()}
							>
								{saving() ? "Saving..." : "Save Configuration"}
							</button>
						</div>
					</div>

					<div class={card.default}>
						<h2 class={text.h2}>Preview</h2>
						<div class="mt-4 space-y-4">
							<div class="flex min-h-[200px] items-center justify-center rounded-lg bg-gray-900 p-8">
								<TimerWidget config={config()} />
							</div>
							<div class="space-y-2">
								<h3 class={text.h3}>OBS Browser Source URL</h3>
								<p class={text.helper}>
									Add this URL to OBS as a Browser Source:
								</p>
								<div class="break-all rounded bg-gray-100 p-3 font-mono text-sm">
									{window.location.origin}/w/timer/{userId()}
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
