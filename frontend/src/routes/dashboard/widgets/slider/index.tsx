import { createMemo, createSignal, For, Show } from "solid-js";
import SliderWidget from "~/components/widgets/SliderWidget";
import { useCurrentUser } from "~/lib/auth";
import { useWidgetConfig } from "~/lib/useElectric";
import { saveWidgetConfig } from "~/sdk/ash_rpc";
import { button, card, input, text } from "~/styles/design-system";

interface SliderImage {
	id: string;
	url: string;
	alt?: string;
	index: number;
}

interface SliderConfig {
	slideDuration: number;
	transitionDuration: number;
	transitionType: "fade" | "slide" | "slide-up" | "zoom" | "flip";
	fitMode: "contain" | "cover" | "fill";
	backgroundColor: string;
	images?: SliderImage[];
}

interface BackendSliderConfig {
	slide_duration?: number;
	transition_duration?: number;
	transition_type?: string;
	fit_mode?: string;
	background_color?: string;
	images?: SliderImage[];
}

const SAMPLE_IMAGES: SliderImage[] = [
	{
		id: "1",
		url: "https://picsum.photos/800/450?random=1",
		alt: "Sample 1",
		index: 0,
	},
	{
		id: "2",
		url: "https://picsum.photos/800/450?random=2",
		alt: "Sample 2",
		index: 1,
	},
	{
		id: "3",
		url: "https://picsum.photos/800/450?random=3",
		alt: "Sample 3",
		index: 2,
	},
];

const DEFAULT_CONFIG: SliderConfig = {
	slideDuration: 5,
	transitionDuration: 500,
	transitionType: "fade",
	fitMode: "contain",
	backgroundColor: "transparent",
	images: SAMPLE_IMAGES,
};

function parseBackendConfig(backendConfig: BackendSliderConfig): SliderConfig {
	return {
		slideDuration: backendConfig.slide_duration || DEFAULT_CONFIG.slideDuration,
		transitionDuration:
			backendConfig.transition_duration || DEFAULT_CONFIG.transitionDuration,
		transitionType:
			(backendConfig.transition_type as SliderConfig["transitionType"]) ||
			DEFAULT_CONFIG.transitionType,
		fitMode:
			(backendConfig.fit_mode as SliderConfig["fitMode"]) ||
			DEFAULT_CONFIG.fitMode,
		backgroundColor:
			backendConfig.background_color || DEFAULT_CONFIG.backgroundColor,
		images: backendConfig.images || DEFAULT_CONFIG.images,
	};
}

export default function SliderSettings() {
	const { user, isLoading } = useCurrentUser();
	const userId = createMemo(() => user()?.id);

	const widgetConfigQuery = useWidgetConfig<BackendSliderConfig>(
		userId,
		() => "slider_widget",
	);

	const [saving, setSaving] = createSignal(false);
	const [saveMessage, setSaveMessage] = createSignal<string | null>(null);
	const [localOverrides, setLocalOverrides] = createSignal<
		Partial<SliderConfig>
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
			slide_duration: currentConfig.slideDuration,
			transition_duration: currentConfig.transitionDuration,
			transition_type: currentConfig.transitionType,
			fit_mode: currentConfig.fitMode,
			background_color: currentConfig.backgroundColor,
			images: currentConfig.images || [],
		};

		const result = await saveWidgetConfig({
			input: {
				userId: userId() ?? "",
				type: "slider_widget",
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

	function updateConfig<K extends keyof SliderConfig>(
		field: K,
		value: SliderConfig[K],
	) {
		setLocalOverrides((prev) => ({ ...prev, [field]: value }));
	}

	function addImageUrl(url: string) {
		const images = config().images || [];
		const newImage: SliderImage = {
			id: `img_${Date.now()}`,
			url,
			alt: `Image ${images.length + 1}`,
			index: images.length,
		};
		updateConfig("images", [...images, newImage]);
	}

	function removeImage(id: string) {
		const images = config().images || [];
		const filtered = images.filter((img) => img.id !== id);
		const reindexed = filtered.map((img, index) => ({ ...img, index }));
		updateConfig("images", reindexed);
	}

	return (
		<div class="space-y-6">
			<div>
				<h1 class={text.h1}>Slider Widget Settings</h1>
				<p class={text.muted}>Configure your image slider widget for OBS</p>
			</div>

			<Show when={!loading()} fallback={<div>Loading...</div>}>
				<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
					<div class={card.default}>
						<h2 class={text.h2}>Configuration</h2>
						<div class="mt-4 space-y-4">
							<div>
								<label class="block font-medium text-gray-700 text-sm">
									Slide Duration (seconds)
									<input
										type="number"
										class={`mt-1 ${input.text}`}
										value={config().slideDuration}
										onInput={(e) =>
											updateConfig(
												"slideDuration",
												parseInt(e.currentTarget.value, 10),
											)
										}
										min="1"
										max="60"
									/>
								</label>
								<p class={text.helper}>How long each slide is displayed</p>
							</div>

							<div>
								<label class="block font-medium text-gray-700 text-sm">
									Transition Duration (ms)
									<input
										type="number"
										class={`mt-1 ${input.text}`}
										value={config().transitionDuration}
										onInput={(e) =>
											updateConfig(
												"transitionDuration",
												parseInt(e.currentTarget.value, 10),
											)
										}
										min="100"
										max="3000"
										step="100"
									/>
								</label>
								<p class={text.helper}>Speed of the transition animation</p>
							</div>

							<div>
								<label class="block font-medium text-gray-700 text-sm">
									Transition Type
									<select
										class={`mt-1 ${input.select}`}
										value={config().transitionType}
										onChange={(e) =>
											updateConfig(
												"transitionType",
												e.currentTarget.value as SliderConfig["transitionType"],
											)
										}
									>
										<option value="fade">Fade</option>
										<option value="slide">Slide Left</option>
										<option value="slide-up">Slide Up</option>
										<option value="zoom">Zoom</option>
										<option value="flip">Flip</option>
									</select>
								</label>
							</div>

							<div>
								<label class="block font-medium text-gray-700 text-sm">
									Image Fit Mode
									<select
										class={`mt-1 ${input.select}`}
										value={config().fitMode}
										onChange={(e) =>
											updateConfig(
												"fitMode",
												e.currentTarget.value as SliderConfig["fitMode"],
											)
										}
									>
										<option value="contain">Fit (Contain)</option>
										<option value="cover">Fill (Cover)</option>
										<option value="fill">Stretch (Fill)</option>
									</select>
								</label>
								<p class={text.helper}>
									How images are scaled to fit the container
								</p>
							</div>

							<div>
								<label class="block font-medium text-gray-700 text-sm">
									Background Color
									<div class="mt-1 flex gap-2">
										<input
											type="color"
											class="h-10 w-20 cursor-pointer rounded border border-gray-300"
											value={
												config().backgroundColor === "transparent"
													? "#000000"
													: config().backgroundColor
											}
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
											placeholder="transparent or #000000"
										/>
									</div>
								</label>
							</div>

							<div>
								<p class="mb-1 block font-medium text-gray-700 text-sm">
									Images ({config().images?.length || 0})
								</p>
								<div class="space-y-2">
									<For each={config().images || []}>
										{(image) => (
											<div class="flex items-center gap-2 rounded bg-gray-50 p-2">
												<img
													src={image.url}
													alt={image.alt}
													class="h-16 w-16 rounded object-cover"
												/>
												<div class="min-w-0 flex-1">
													<p class="truncate font-medium text-sm">
														{image.alt}
													</p>
													<p class="truncate text-gray-500 text-xs">
														{image.url}
													</p>
												</div>
												<button
													type="button"
													class={button.danger}
													onClick={() => removeImage(image.id)}
												>
													Remove
												</button>
											</div>
										)}
									</For>
								</div>
								<div class="mt-2">
									<input
										type="text"
										class={input.text}
										placeholder="Enter image URL and press Enter"
										onKeyDown={(e) => {
											if (e.key === "Enter" && e.currentTarget.value.trim()) {
												addImageUrl(e.currentTarget.value.trim());
												e.currentTarget.value = "";
											}
										}}
									/>
									<p class={text.helper}>
										Press Enter to add an image URL. Max 20 images.
									</p>
								</div>
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
								class="overflow-hidden rounded-lg bg-gray-900"
								style={{ height: "400px" }}
							>
								<SliderWidget config={config()} />
							</div>
							<div class="space-y-2">
								<h3 class={text.h3}>OBS Browser Source URL</h3>
								<p class={text.helper}>
									Add this URL to OBS as a Browser Source:
								</p>
								<div class="break-all rounded bg-gray-100 p-3 font-mono text-sm">
									{window.location.origin}/w/slider/{userId()}
								</div>
								<p class={text.helper}>Recommended Browser Source settings:</p>
								<ul class={`${text.helper} ml-4 list-disc`}>
									<li>Width: 1920</li>
									<li>Height: 1080</li>
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
