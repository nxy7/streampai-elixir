import { createMemo, createSignal, Show } from "solid-js";
import DonationGoalWidget from "~/components/widgets/DonationGoalWidget";
import { useCurrentUser } from "~/lib/auth";
import { useWidgetConfig } from "~/lib/useElectric";
import { saveWidgetConfig } from "~/sdk/ash_rpc";
import { button, card, input, text } from "~/styles/design-system";

interface DonationGoalConfig {
	goalAmount: number;
	startingAmount: number;
	currency: string;
	startDate: string;
	endDate: string;
	title: string;
	showPercentage: boolean;
	showAmountRaised: boolean;
	showDaysLeft: boolean;
	theme: "default" | "minimal" | "modern";
	barColor: string;
	backgroundColor: string;
	textColor: string;
	animationEnabled: boolean;
}

interface BackendDonationGoalConfig {
	goal_amount?: number;
	starting_amount?: number;
	currency?: string;
	start_date?: string;
	end_date?: string;
	title?: string;
	show_percentage?: boolean;
	show_amount_raised?: boolean;
	show_days_left?: boolean;
	theme?: string;
	bar_color?: string;
	background_color?: string;
	text_color?: string;
	animation_enabled?: boolean;
}

const DEFAULT_CONFIG: DonationGoalConfig = {
	goalAmount: 1000,
	startingAmount: 0,
	currency: "$",
	startDate: new Date().toISOString().split("T")[0],
	endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
		.toISOString()
		.split("T")[0],
	title: "Donation Goal",
	showPercentage: true,
	showAmountRaised: true,
	showDaysLeft: true,
	theme: "default",
	barColor: "#10b981",
	backgroundColor: "#e5e7eb",
	textColor: "#1f2937",
	animationEnabled: true,
};

function parseBackendConfig(
	backendConfig: BackendDonationGoalConfig,
): DonationGoalConfig {
	return {
		goalAmount: backendConfig.goal_amount ?? DEFAULT_CONFIG.goalAmount,
		startingAmount:
			backendConfig.starting_amount ?? DEFAULT_CONFIG.startingAmount,
		currency: backendConfig.currency ?? DEFAULT_CONFIG.currency,
		startDate: backendConfig.start_date ?? DEFAULT_CONFIG.startDate,
		endDate: backendConfig.end_date ?? DEFAULT_CONFIG.endDate,
		title: backendConfig.title ?? DEFAULT_CONFIG.title,
		showPercentage:
			backendConfig.show_percentage ?? DEFAULT_CONFIG.showPercentage,
		showAmountRaised:
			backendConfig.show_amount_raised ?? DEFAULT_CONFIG.showAmountRaised,
		showDaysLeft: backendConfig.show_days_left ?? DEFAULT_CONFIG.showDaysLeft,
		theme:
			(backendConfig.theme as DonationGoalConfig["theme"]) ??
			DEFAULT_CONFIG.theme,
		barColor: backendConfig.bar_color ?? DEFAULT_CONFIG.barColor,
		backgroundColor:
			backendConfig.background_color ?? DEFAULT_CONFIG.backgroundColor,
		textColor: backendConfig.text_color ?? DEFAULT_CONFIG.textColor,
		animationEnabled:
			backendConfig.animation_enabled ?? DEFAULT_CONFIG.animationEnabled,
	};
}

export default function DonationGoalWidgetSettings() {
	const { user, isLoading } = useCurrentUser();
	const userId = createMemo(() => user()?.id);

	const widgetConfigQuery = useWidgetConfig<BackendDonationGoalConfig>(
		userId,
		() => "donation_goal_widget",
	);

	const [saving, setSaving] = createSignal(false);
	const [saveMessage, setSaveMessage] = createSignal<string | null>(null);
	const [localOverrides, setLocalOverrides] = createSignal<
		Partial<DonationGoalConfig>
	>({});
	const [demoAmount, setDemoAmount] = createSignal(350);

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
			goal_amount: currentConfig.goalAmount,
			starting_amount: currentConfig.startingAmount,
			currency: currentConfig.currency,
			start_date: currentConfig.startDate,
			end_date: currentConfig.endDate,
			title: currentConfig.title,
			show_percentage: currentConfig.showPercentage,
			show_amount_raised: currentConfig.showAmountRaised,
			show_days_left: currentConfig.showDaysLeft,
			theme: currentConfig.theme,
			bar_color: currentConfig.barColor,
			background_color: currentConfig.backgroundColor,
			text_color: currentConfig.textColor,
			animation_enabled: currentConfig.animationEnabled,
		};

		const result = await saveWidgetConfig({
			input: {
				userId: userId() ?? "",
				type: "donation_goal_widget",
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

	function updateConfig<K extends keyof DonationGoalConfig>(
		field: K,
		value: DonationGoalConfig[K],
	) {
		setLocalOverrides((prev) => ({ ...prev, [field]: value }));
	}

	return (
		<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			<div class="mb-8">
				<h1 class={text.h1}>Donation Goal Widget Settings</h1>
				<p class={`${text.body} mt-2`}>
					Track progress toward your donation goals with animated progress bars.
				</p>
			</div>
			<Show when={!loading()} fallback={<div>Loading...</div>}>
				<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
					<div class={card.default}>
						<h2 class={`${text.h2} mb-6`}>Configuration</h2>
						<div class="space-y-6">
							<div>
								<label class="mb-2 block">
									<span class={text.label}>Title</span>
									<input
										type="text"
										class={`${input.text} mt-1`}
										value={config().title}
										onInput={(e) => updateConfig("title", e.target.value)}
									/>
								</label>
							</div>
							<div class="grid grid-cols-2 gap-4">
								<label class="block">
									<span class={text.label}>Goal Amount</span>
									<input
										type="number"
										class={`${input.text} mt-1`}
										value={config().goalAmount}
										onInput={(e) =>
											updateConfig(
												"goalAmount",
												parseFloat(e.target.value) || 1000,
											)
										}
									/>
								</label>
								<label class="block">
									<span class={text.label}>Currency</span>
									<input
										type="text"
										class={`${input.text} mt-1`}
										value={config().currency}
										onInput={(e) => updateConfig("currency", e.target.value)}
									/>
								</label>
							</div>
							<div>
								<label class="mb-2 block">
									<span class={text.label}>Theme</span>
									<select
										class={`${input.select} mt-1`}
										value={config().theme}
										onChange={(e) =>
											updateConfig(
												"theme",
												e.target.value as "default" | "minimal" | "modern",
											)
										}
									>
										<option value="default">Default</option>
										<option value="minimal">Minimal</option>
										<option value="modern">Modern</option>
									</select>
								</label>
							</div>
							<div class="space-y-3">
								<label class="flex items-center">
									<input
										type="checkbox"
										checked={config().showPercentage}
										onChange={(e) =>
											updateConfig("showPercentage", e.target.checked)
										}
										class="mr-2"
									/>
									<span>Show Percentage</span>
								</label>
								<label class="flex items-center">
									<input
										type="checkbox"
										checked={config().showAmountRaised}
										onChange={(e) =>
											updateConfig("showAmountRaised", e.target.checked)
										}
										class="mr-2"
									/>
									<span>Show Amount Raised</span>
								</label>
								<label class="flex items-center">
									<input
										type="checkbox"
										checked={config().showDaysLeft}
										onChange={(e) =>
											updateConfig("showDaysLeft", e.target.checked)
										}
										class="mr-2"
									/>
									<span>Show Days Left</span>
								</label>
								<label class="flex items-center">
									<input
										type="checkbox"
										checked={config().animationEnabled}
										onChange={(e) =>
											updateConfig("animationEnabled", e.target.checked)
										}
										class="mr-2"
									/>
									<span>Enable Animations</span>
								</label>
							</div>
							<div class="space-y-3">
								<label class="block">
									<span class={text.label}>Progress Bar Color</span>
									<input
										type="color"
										class={`${input.text} mt-1`}
										value={config().barColor}
										onInput={(e) => updateConfig("barColor", e.target.value)}
									/>
								</label>
								<label class="block">
									<span class={text.label}>Background Color</span>
									<input
										type="color"
										class={`${input.text} mt-1`}
										value={config().backgroundColor}
										onInput={(e) =>
											updateConfig("backgroundColor", e.target.value)
										}
									/>
								</label>
								<label class="block">
									<span class={text.label}>Text Color</span>
									<input
										type="color"
										class={`${input.text} mt-1`}
										value={config().textColor}
										onInput={(e) => updateConfig("textColor", e.target.value)}
									/>
								</label>
							</div>
							<div class="border-gray-200 border-t pt-4">
								<button
									type="button"
									class={button.primary}
									onClick={handleSave}
									disabled={saving()}
								>
									{saving() ? "Saving..." : "Save Configuration"}
								</button>
								<Show when={saveMessage()}>
									<p class="mt-2 text-green-600 text-sm">{saveMessage()}</p>
								</Show>
							</div>
						</div>
					</div>
					<div class="space-y-6">
						<div class={card.default}>
							<h2 class={`${text.h2} mb-4`}>Preview</h2>
							<div class="mb-4">
								<label class="mb-2 block">
									<span class={text.label}>
										Test Progress: {demoAmount()}/{config().goalAmount}
									</span>
									<input
										type="range"
										class="w-full"
										min="0"
										max={config().goalAmount}
										value={demoAmount()}
										onInput={(e) => setDemoAmount(parseInt(e.target.value, 10))}
									/>
								</label>
							</div>
							<div
								class="rounded-lg bg-gray-900 p-8"
								style={{ height: "300px" }}
							>
								<DonationGoalWidget
									config={config()}
									currentAmount={demoAmount()}
								/>
							</div>
						</div>
						<div class={card.default}>
							<h2 class={`${text.h3} mb-3`}>OBS Browser Source</h2>
							<div class="rounded border border-gray-300 bg-gray-100 p-3">
								<code class="break-all text-sm">
									{window.location.origin}/w/donation-goal/{userId()}
								</code>
							</div>
						</div>
					</div>
				</div>
			</Show>
		</div>
	);
}
