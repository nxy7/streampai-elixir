import { createMemo, createSignal, onCleanup, onMount, Show } from "solid-js";
import ViewerCountWidget from "~/components/widgets/ViewerCountWidget";
import { useCurrentUser } from "~/lib/auth";
import {
	defaultConfig,
	generateViewerData,
	generateViewerUpdate,
	type ViewerCountConfig,
	type ViewerData,
} from "~/lib/fake/viewer-count";
import { useWidgetConfig } from "~/lib/useElectric";
import { saveWidgetConfig } from "~/sdk/ash_rpc";
import {
	button,
	card,
	input as designInput,
	text,
} from "~/styles/design-system";

export default function ViewerCountSettings() {
	const { user, isLoading } = useCurrentUser();
	const userId = createMemo(() => user()?.id);

	const widgetConfigQuery = useWidgetConfig<ViewerCountConfig>(
		userId,
		() => "viewer_count_widget",
	);

	const [currentData, setCurrentData] = createSignal<ViewerData>(
		generateViewerData(),
	);
	const [saving, setSaving] = createSignal(false);
	const [saveMessage, setSaveMessage] = createSignal<string | null>(null);
	const [localOverrides, setLocalOverrides] = createSignal<
		Partial<ViewerCountConfig>
	>({});

	const config = createMemo(() => {
		const syncedConfig = widgetConfigQuery.data();
		const baseConfig = syncedConfig?.config || defaultConfig();
		return { ...baseConfig, ...localOverrides() };
	});

	const loading = createMemo(() => isLoading());

	let demoInterval: number | undefined;

	onMount(() => {
		demoInterval = window.setInterval(() => {
			const current = currentData();
			setCurrentData(generateViewerUpdate(current));
		}, 3000);
	});

	onCleanup(() => {
		if (demoInterval) {
			clearInterval(demoInterval);
		}
	});

	async function handleSave() {
		if (!userId()) {
			setSaveMessage("Error: Not logged in");
			return;
		}

		setSaving(true);
		setSaveMessage(null);

		const result = await saveWidgetConfig({
			input: {
				userId: userId() ?? "",
				type: "viewer_count_widget",
				config: config(),
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

	function updateConfig(updates: Partial<ViewerCountConfig>) {
		setLocalOverrides((prev) => ({ ...prev, ...updates }));
	}

	function copyUrlToClipboard() {
		const url = `${window.location.origin}/w/viewer-count/${userId()}`;
		navigator.clipboard.writeText(url);
		alert("URL copied to clipboard!");
	}

	return (
		<div class="mx-auto max-w-4xl space-y-6">
			<div>
				<h1 class={text.h1}>Viewer Count Widget</h1>
				<p class={text.muted}>
					Configure your viewer count widget and OBS browser source URL
					generation
				</p>
			</div>

			<Show when={!loading()} fallback={<div>Loading...</div>}>
				<div class={card.default}>
					<h2 class={text.h2}>Live Preview</h2>
					<p class={text.muted}>
						Preview updates every 3 seconds with mock data
					</p>
					<div class="relative mt-4 min-h-64 overflow-hidden rounded border border-gray-200 bg-gray-900 p-4">
						<ViewerCountWidget
							config={config()}
							data={currentData()}
							id="preview-viewer-count-widget"
						/>
					</div>

					<div class="mt-4 space-y-2">
						<h3 class={text.h3}>OBS Browser Source URL</h3>
						<div class="flex gap-2">
							<input
								type="text"
								readonly
								class={designInput.text}
								value={`${window.location.origin}/w/viewer-count/${userId() || "USER_ID"}`}
							/>
							<button
								type="button"
								class={button.secondary}
								onClick={copyUrlToClipboard}
								disabled={!userId()}>
								Copy URL
							</button>
						</div>
						<p class={text.helper}>Recommended settings: 800x200 pixels</p>
					</div>
				</div>

				<div class={card.default}>
					<h2 class={text.h2}>Configuration Options</h2>

					<div class="mt-6 space-y-6">
						<div>
							<h3 class={text.h3}>Display Options</h3>
							<div class="mt-4 space-y-4">
								<label class="flex cursor-pointer items-center gap-2">
									<input
										type="checkbox"
										checked={config().show_total}
										onChange={(e) =>
											updateConfig({ show_total: e.currentTarget.checked })
										}
										class="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
									/>
									<span class="font-medium text-gray-700 text-sm">
										Show total viewer count
									</span>
								</label>

								<label class="flex cursor-pointer items-center gap-2">
									<input
										type="checkbox"
										checked={config().show_platforms}
										onChange={(e) =>
											updateConfig({
												show_platforms: e.currentTarget.checked,
											})
										}
										class="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
									/>
									<span class="font-medium text-gray-700 text-sm">
										Show platform breakdown
									</span>
								</label>

								<label class="flex cursor-pointer items-center gap-2">
									<input
										type="checkbox"
										checked={config().animation_enabled}
										onChange={(e) =>
											updateConfig({
												animation_enabled: e.currentTarget.checked,
											})
										}
										class="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
									/>
									<span class="font-medium text-gray-700 text-sm">
										Enable smooth number animations
									</span>
								</label>

								<div>
									<label class="block font-medium text-gray-700 text-sm">
										Viewer label
										<input
											type="text"
											class={`mt-1 ${designInput.text}`}
											value={config().viewer_label}
											onInput={(e) =>
												updateConfig({ viewer_label: e.currentTarget.value })
											}
											placeholder="viewers"
										/>
									</label>
									<p class={text.helper}>
										Text displayed next to the viewer count
									</p>
								</div>
							</div>
						</div>

						<div>
							<h3 class={text.h3}>Appearance</h3>
							<div class="mt-4 space-y-4">
								<div>
									<label class="block font-medium text-gray-700 text-sm">
										Display style
										<select
											class={`mt-1 ${designInput.text}`}
											value={config().display_style}
											onChange={(e) =>
												updateConfig({
													display_style: e.currentTarget.value as
														| "minimal"
														| "detailed"
														| "cards",
												})
											}>
											<option value="minimal">Minimal (total only)</option>
											<option value="detailed">Detailed (list view)</option>
											<option value="cards">Cards (grid view)</option>
										</select>
									</label>
								</div>

								<div>
									<label class="block font-medium text-gray-700 text-sm">
										Font size
										<select
											class={`mt-1 ${designInput.text}`}
											value={config().font_size}
											onChange={(e) =>
												updateConfig({
													font_size: e.currentTarget.value as
														| "small"
														| "medium"
														| "large",
												})
											}>
											<option value="small">Small</option>
											<option value="medium">Medium</option>
											<option value="large">Large</option>
										</select>
									</label>
								</div>

								<div>
									<label class="block font-medium text-gray-700 text-sm">
										Icon Color
										<div class="mt-1 flex gap-2">
											<input
												type="color"
												class="h-10 w-20 cursor-pointer rounded border border-gray-300"
												value={config().icon_color}
												onInput={(e) =>
													updateConfig({ icon_color: e.currentTarget.value })
												}
											/>
											<input
												type="text"
												class={designInput.text}
												value={config().icon_color}
												onInput={(e) =>
													updateConfig({ icon_color: e.currentTarget.value })
												}
											/>
										</div>
									</label>
								</div>
							</div>
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
					<h2 class={text.h2}>Usage Instructions</h2>
					<div class="mt-4 space-y-4">
						<ol class="list-inside list-decimal space-y-2 text-gray-700">
							<li>Copy the OBS Browser Source URL above</li>
							<li>In OBS, add a new "Browser" source</li>
							<li>Paste the URL into the URL field</li>
							<li>Set Width to 800 and Height to 200</li>
							<li>Click OK to add the widget to your scene</li>
						</ol>
						<p class={text.helper}>
							Viewer counts update automatically based on your stream platforms
						</p>
					</div>
				</div>
			</Show>
		</div>
	);
}
