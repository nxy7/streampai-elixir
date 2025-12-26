import { createMemo, createSignal, Show } from "solid-js";
import FollowerCountWidget from "~/components/widgets/FollowerCountWidget";
import { useCurrentUser } from "~/lib/auth";
import { useWidgetConfig } from "~/lib/useElectric";
import { saveWidgetConfig } from "~/sdk/ash_rpc";
import { button, card, input, text } from "~/styles/design-system";

interface FollowerCountConfig {
	label: string;
	fontSize: number;
	textColor: string;
	backgroundColor: string;
	showIcon: boolean;
	animateOnChange: boolean;
}

interface BackendFollowerCountConfig {
	label?: string;
	font_size?: number;
	text_color?: string;
	background_color?: string;
	show_icon?: boolean;
	animate_on_change?: boolean;
}

const DEFAULT_CONFIG: FollowerCountConfig = {
	label: "followers",
	fontSize: 32,
	textColor: "#ffffff",
	backgroundColor: "#9333ea",
	showIcon: true,
	animateOnChange: true,
};

function parseBackendConfig(
	backendConfig: BackendFollowerCountConfig,
): FollowerCountConfig {
	return {
		label: backendConfig.label || DEFAULT_CONFIG.label,
		fontSize: backendConfig.font_size || DEFAULT_CONFIG.fontSize,
		textColor: backendConfig.text_color || DEFAULT_CONFIG.textColor,
		backgroundColor:
			backendConfig.background_color || DEFAULT_CONFIG.backgroundColor,
		showIcon: backendConfig.show_icon ?? DEFAULT_CONFIG.showIcon,
		animateOnChange:
			backendConfig.animate_on_change ?? DEFAULT_CONFIG.animateOnChange,
	};
}

export default function FollowerCountSettings() {
	const { user, isLoading } = useCurrentUser();
	const userId = createMemo(() => user()?.id);

	const widgetConfigQuery = useWidgetConfig<BackendFollowerCountConfig>(
		userId,
		() => "follower_count_widget",
	);

	const [saving, setSaving] = createSignal(false);
	const [saveMessage, setSaveMessage] = createSignal<string | null>(null);
	const [localOverrides, setLocalOverrides] = createSignal<
		Partial<FollowerCountConfig>
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
			show_icon: currentConfig.showIcon,
			animate_on_change: currentConfig.animateOnChange,
		};

		const result = await saveWidgetConfig({
			input: {
				userId: userId() ?? "",
				type: "follower_count_widget",
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
		field: keyof FollowerCountConfig,
		value: string | number | boolean,
	) {
		setLocalOverrides((prev) => ({ ...prev, [field]: value }));
	}

	return (
		<div class="space-y-6">
			<div>
				<h1 class={text.h1}>Follower Count Widget Settings</h1>
				<p class={text.muted}>Configure your follower count widget for OBS</p>
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
										placeholder="followers"
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
										min="12"
										max="96"
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
								<label class="flex cursor-pointer items-center gap-2">
									<input
										type="checkbox"
										checked={config().showIcon}
										onChange={(e) =>
											updateConfig("showIcon", e.currentTarget.checked)
										}
										class="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
									/>
									<span class="font-medium text-gray-700 text-sm">
										Show User Icon
									</span>
								</label>
							</div>

							<div>
								<label class="flex cursor-pointer items-center gap-2">
									<input
										type="checkbox"
										checked={config().animateOnChange}
										onChange={(e) =>
											updateConfig("animateOnChange", e.currentTarget.checked)
										}
										class="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
									/>
									<span class="font-medium text-gray-700 text-sm">
										Animate on Change
									</span>
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
								<FollowerCountWidget config={config()} count={5678} />
							</div>
							<div class="space-y-2">
								<h3 class={text.h3}>OBS Browser Source URL</h3>
								<p class={text.helper}>
									Add this URL to OBS as a Browser Source:
								</p>
								<div class="break-all rounded bg-gray-100 p-3 font-mono text-sm">
									{window.location.origin}/w/follower-count/{userId()}
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
