import { createMemo, createSignal, Show } from "solid-js";
import TopDonorsWidget from "~/components/widgets/TopDonorsWidget";
import { useCurrentUser } from "~/lib/auth";
import { useWidgetConfig } from "~/lib/useElectric";
import { saveWidgetConfig } from "~/sdk/ash_rpc";
import { button, card, input, text } from "~/styles/design-system";

interface Donor {
	id: string;
	username: string;
	amount: number;
	currency: string;
}

interface TopDonorsConfig {
	title: string;
	topCount: number;
	fontSize: number;
	showAmounts: boolean;
	showRanking: boolean;
	backgroundColor: string;
	textColor: string;
	highlightColor: string;
}

interface BackendTopDonorsConfig {
	title?: string;
	top_count?: number;
	font_size?: number;
	show_amounts?: boolean;
	show_ranking?: boolean;
	background_color?: string;
	text_color?: string;
	highlight_color?: string;
}

const DEFAULT_CONFIG: TopDonorsConfig = {
	title: "🏆 Top Donors",
	topCount: 10,
	fontSize: 16,
	showAmounts: true,
	showRanking: true,
	backgroundColor: "#1f2937",
	textColor: "#ffffff",
	highlightColor: "#ffd700",
};

function parseBackendConfig(
	backendConfig: BackendTopDonorsConfig,
): TopDonorsConfig {
	return {
		title: backendConfig.title || DEFAULT_CONFIG.title,
		topCount: backendConfig.top_count || DEFAULT_CONFIG.topCount,
		fontSize: backendConfig.font_size || DEFAULT_CONFIG.fontSize,
		showAmounts: backendConfig.show_amounts ?? DEFAULT_CONFIG.showAmounts,
		showRanking: backendConfig.show_ranking ?? DEFAULT_CONFIG.showRanking,
		backgroundColor:
			backendConfig.background_color || DEFAULT_CONFIG.backgroundColor,
		textColor: backendConfig.text_color || DEFAULT_CONFIG.textColor,
		highlightColor:
			backendConfig.highlight_color || DEFAULT_CONFIG.highlightColor,
	};
}

const MOCK_DONORS: Donor[] = [
	{ id: "1", username: "GeneroussUser", amount: 2500.0, currency: "$" },
	{ id: "2", username: "MegaDonor", amount: 1800.0, currency: "$" },
	{ id: "3", username: "TopSupporter", amount: 1200.0, currency: "$" },
	{ id: "4", username: "Contributor", amount: 750.0, currency: "$" },
	{ id: "5", username: "FanSupport", amount: 500.0, currency: "$" },
	{ id: "6", username: "StreamFan", amount: 350.0, currency: "$" },
	{ id: "7", username: "Donor7", amount: 250.0, currency: "$" },
	{ id: "8", username: "Supporter8", amount: 150.0, currency: "$" },
	{ id: "9", username: "User9", amount: 100.0, currency: "$" },
	{ id: "10", username: "Viewer10", amount: 75.0, currency: "$" },
];

export default function TopDonorsSettings() {
	const { user, isLoading } = useCurrentUser();
	const userId = createMemo(() => user()?.id);

	const widgetConfigQuery = useWidgetConfig<BackendTopDonorsConfig>(
		userId,
		() => "top_donors_widget",
	);

	const [donors] = createSignal<Donor[]>(MOCK_DONORS);
	const [saving, setSaving] = createSignal(false);
	const [saveMessage, setSaveMessage] = createSignal<string | null>(null);
	const [localOverrides, setLocalOverrides] = createSignal<
		Partial<TopDonorsConfig>
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
			title: currentConfig.title,
			top_count: currentConfig.topCount,
			font_size: currentConfig.fontSize,
			show_amounts: currentConfig.showAmounts,
			show_ranking: currentConfig.showRanking,
			background_color: currentConfig.backgroundColor,
			text_color: currentConfig.textColor,
			highlight_color: currentConfig.highlightColor,
		};

		const result = await saveWidgetConfig({
			input: {
				userId: userId() ?? "",
				type: "top_donors_widget",
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

	function updateConfig<K extends keyof TopDonorsConfig>(
		field: K,
		value: TopDonorsConfig[K],
	) {
		setLocalOverrides((prev) => ({ ...prev, [field]: value }));
	}

	return (
		<div class="space-y-6">
			<div>
				<h1 class={text.h1}>Top Donors Widget Settings</h1>
				<p class={text.muted}>
					Configure your top donors leaderboard widget for OBS
				</p>
			</div>

			<Show when={!loading()} fallback={<div>Loading...</div>}>
				<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
					<div class={card.default}>
						<h2 class={text.h2}>Configuration</h2>
						<div class="mt-4 space-y-4">
							<div>
								<label class="block font-medium text-gray-700 text-sm">
									Widget Title
									<input
										type="text"
										class={`mt-1 ${input.text}`}
										value={config().title}
										onInput={(e) =>
											updateConfig("title", e.currentTarget.value)
										}
									/>
								</label>
							</div>

							<div>
								<label class="block font-medium text-gray-700 text-sm">
									Top Count
									<select
										class={`mt-1 ${input.select}`}
										value={config().topCount}
										onChange={(e) =>
											updateConfig(
												"topCount",
												parseInt(e.currentTarget.value, 10),
											)
										}
									>
										<option value="3">Top 3</option>
										<option value="5">Top 5</option>
										<option value="10">Top 10</option>
										<option value="15">Top 15</option>
										<option value="20">Top 20</option>
									</select>
								</label>
								<p class={text.helper}>Number of top donors to display</p>
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
										min="10"
										max="32"
									/>
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
									Highlight Color
									<div class="mt-1 flex gap-2">
										<input
											type="color"
											class="h-10 w-20 cursor-pointer rounded border border-gray-300"
											value={config().highlightColor}
											onInput={(e) =>
												updateConfig("highlightColor", e.currentTarget.value)
											}
										/>
										<input
											type="text"
											class={input.text}
											value={config().highlightColor}
											onInput={(e) =>
												updateConfig("highlightColor", e.currentTarget.value)
											}
										/>
									</div>
								</label>
								<p class={text.helper}>Used for podium positions (top 3)</p>
							</div>

							<div class="flex items-center gap-2">
								<input
									type="checkbox"
									id="showAmounts"
									checked={config().showAmounts}
									onChange={(e) =>
										updateConfig("showAmounts", e.currentTarget.checked)
									}
									class="rounded"
								/>
								<label
									for="showAmounts"
									class="font-medium text-gray-700 text-sm"
								>
									Show Donation Amounts
								</label>
							</div>

							<div class="flex items-center gap-2">
								<input
									type="checkbox"
									id="showRanking"
									checked={config().showRanking}
									onChange={(e) =>
										updateConfig("showRanking", e.currentTarget.checked)
									}
									class="rounded"
								/>
								<label
									for="showRanking"
									class="font-medium text-gray-700 text-sm"
								>
									Show Ranking Numbers
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
							<div
								class="flex items-center justify-center rounded-lg bg-gray-900"
								style={{ height: "600px" }}
							>
								<TopDonorsWidget config={config()} donors={donors()} />
							</div>
							<div class="space-y-2">
								<h3 class={text.h3}>OBS Browser Source URL</h3>
								<p class={text.helper}>
									Add this URL to OBS as a Browser Source:
								</p>
								<div class="break-all rounded bg-gray-100 p-3 font-mono text-sm">
									{window.location.origin}/w/topdonors/{userId()}
								</div>
								<p class={text.helper}>Recommended Browser Source settings:</p>
								<ul class={`${text.helper} ml-4 list-disc`}>
									<li>Width: 400</li>
									<li>Height: 800</li>
									<li>Enable "Shutdown source when not visible"</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			</Show>
		</div>
	);
}
