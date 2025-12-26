import { createMemo, createSignal, onMount, Show } from "solid-js";
import EventListWidget from "~/components/widgets/EventListWidget";
import { useCurrentUser } from "~/lib/auth";
import { useWidgetConfig } from "~/lib/useElectric";
import { saveWidgetConfig } from "~/sdk/ash_rpc";
import { button, card, input, text } from "~/styles/design-system";

interface StreamEvent {
	id: string;
	type: "donation" | "follow" | "subscription" | "raid" | "chat_message";
	username: string;
	message?: string;
	amount?: number;
	currency?: string;
	timestamp: Date;
	platform: { icon: string; color: string };
}

interface EventListConfig {
	animationType: "slide" | "fade" | "bounce";
	maxEvents: number;
	eventTypes: string[];
	showTimestamps: boolean;
	showPlatform: boolean;
	showAmounts: boolean;
	fontSize: "small" | "medium" | "large";
	compactMode: boolean;
}

interface BackendEventListConfig {
	animation_type?: string;
	max_events?: number;
	event_types?: string[];
	show_timestamps?: boolean;
	show_platform?: boolean;
	show_amounts?: boolean;
	font_size?: string;
	compact_mode?: boolean;
}

const DEFAULT_CONFIG: EventListConfig = {
	animationType: "fade",
	maxEvents: 10,
	eventTypes: ["donation", "follow", "subscription", "raid"],
	showTimestamps: false,
	showPlatform: false,
	showAmounts: true,
	fontSize: "medium",
	compactMode: true,
};

function parseBackendConfig(
	backendConfig: BackendEventListConfig,
): EventListConfig {
	return {
		animationType:
			(backendConfig.animation_type as EventListConfig["animationType"]) ||
			DEFAULT_CONFIG.animationType,
		maxEvents: backendConfig.max_events || DEFAULT_CONFIG.maxEvents,
		eventTypes: backendConfig.event_types || DEFAULT_CONFIG.eventTypes,
		showTimestamps:
			backendConfig.show_timestamps ?? DEFAULT_CONFIG.showTimestamps,
		showPlatform: backendConfig.show_platform ?? DEFAULT_CONFIG.showPlatform,
		showAmounts: backendConfig.show_amounts ?? DEFAULT_CONFIG.showAmounts,
		fontSize:
			(backendConfig.font_size as EventListConfig["fontSize"]) ||
			DEFAULT_CONFIG.fontSize,
		compactMode: backendConfig.compact_mode ?? DEFAULT_CONFIG.compactMode,
	};
}

const MOCK_EVENTS: StreamEvent[] = [
	{
		id: "1",
		type: "donation",
		username: "GenerousViewer",
		message: "Love the stream! Keep it up!",
		amount: 25.0,
		currency: "$",
		timestamp: new Date(),
		platform: { icon: "twitch", color: "bg-purple-500" },
	},
	{
		id: "2",
		type: "follow",
		username: "NewFollower42",
		message: "Just followed!",
		timestamp: new Date(),
		platform: { icon: "youtube", color: "bg-red-500" },
	},
	{
		id: "3",
		type: "subscription",
		username: "SubHype",
		message: "Happy to support!",
		timestamp: new Date(),
		platform: { icon: "twitch", color: "bg-purple-500" },
	},
];

export default function EventListSettings() {
	const { user, isLoading } = useCurrentUser();
	const userId = createMemo(() => user()?.id);

	const widgetConfigQuery = useWidgetConfig<BackendEventListConfig>(
		userId,
		() => "eventlist_widget",
	);

	const [events, setEvents] = createSignal<StreamEvent[]>(MOCK_EVENTS);
	const [saving, setSaving] = createSignal(false);
	const [saveMessage, setSaveMessage] = createSignal<string | null>(null);
	const [localOverrides, setLocalOverrides] = createSignal<
		Partial<EventListConfig>
	>({});

	const config = createMemo(() => {
		const syncedConfig = widgetConfigQuery.data();
		const baseConfig = syncedConfig?.config
			? parseBackendConfig(syncedConfig.config)
			: DEFAULT_CONFIG;
		return { ...baseConfig, ...localOverrides() };
	});

	const loading = createMemo(() => isLoading());

	onMount(() => {
		const interval = setInterval(() => {
			const eventTypes: ("donation" | "follow" | "subscription" | "raid")[] = [
				"donation",
				"follow",
				"subscription",
				"raid",
			];
			const newEvent: StreamEvent = {
				id: `evt_${Date.now()}`,
				type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
				username: [
					`User${Math.floor(Math.random() * 100)}`,
					`Viewer${Math.floor(Math.random() * 100)}`,
				][Math.floor(Math.random() * 2)],
				message: ["Amazing stream!", "Love the content!", "Keep it up!"][
					Math.floor(Math.random() * 3)
				],
				amount:
					Math.random() > 0.7 ? Math.floor(Math.random() * 50) + 5 : undefined,
				currency: "$",
				timestamp: new Date(),
				platform: {
					icon: ["twitch", "youtube"][Math.floor(Math.random() * 2)],
					color: ["bg-purple-500", "bg-red-500"][Math.floor(Math.random() * 2)],
				},
			};
			setEvents((prev) => [newEvent, ...prev].slice(0, 15));
		}, 4000);

		return () => clearInterval(interval);
	});

	async function handleSave() {
		if (!userId()) {
			setSaveMessage("Error: Not logged in");
			return;
		}

		setSaving(true);
		setSaveMessage(null);

		const currentConfig = config();
		const backendConfig = {
			animation_type: currentConfig.animationType,
			max_events: currentConfig.maxEvents,
			event_types: currentConfig.eventTypes,
			show_timestamps: currentConfig.showTimestamps,
			show_platform: currentConfig.showPlatform,
			show_amounts: currentConfig.showAmounts,
			font_size: currentConfig.fontSize,
			compact_mode: currentConfig.compactMode,
		};

		const result = await saveWidgetConfig({
			input: {
				userId: userId() ?? "",
				type: "eventlist_widget",
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

	function updateConfig<K extends keyof EventListConfig>(
		field: K,
		value: EventListConfig[K],
	) {
		setLocalOverrides((prev) => ({ ...prev, [field]: value }));
	}

	function toggleEventType(type: string) {
		const types = config().eventTypes;
		const updated = types.includes(type)
			? types.filter((t) => t !== type)
			: [...types, type];
		updateConfig("eventTypes", updated);
	}

	return (
		<div class="space-y-6">
			<div>
				<h1 class={text.h1}>Event List Widget Settings</h1>
				<p class={text.muted}>Configure your stream events widget for OBS</p>
			</div>

			<Show when={!loading()} fallback={<div>Loading...</div>}>
				<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
					<div class={card.default}>
						<h2 class={text.h2}>Configuration</h2>
						<div class="mt-4 space-y-4">
							<div>
								<label class="block font-medium text-gray-700 text-sm">
									Animation Type
									<select
										class={`mt-1 ${input.select}`}
										value={config().animationType}
										onChange={(e) =>
											updateConfig(
												"animationType",
												e.currentTarget
													.value as EventListConfig["animationType"],
											)
										}
									>
										<option value="fade">Fade</option>
										<option value="slide">Slide</option>
										<option value="bounce">Bounce</option>
									</select>
								</label>
							</div>

							<div>
								<label class="block font-medium text-gray-700 text-sm">
									Max Events
									<input
										type="number"
										class={`mt-1 ${input.text}`}
										value={config().maxEvents}
										onInput={(e) =>
											updateConfig(
												"maxEvents",
												parseInt(e.currentTarget.value, 10),
											)
										}
										min="1"
										max="50"
									/>
								</label>
							</div>

							<div>
								<label class="block font-medium text-gray-700 text-sm">
									Font Size
									<select
										class={`mt-1 ${input.select}`}
										value={config().fontSize}
										onChange={(e) =>
											updateConfig(
												"fontSize",
												e.currentTarget.value as EventListConfig["fontSize"],
											)
										}
									>
										<option value="small">Small</option>
										<option value="medium">Medium</option>
										<option value="large">Large</option>
									</select>
								</label>
							</div>

							<div>
								<p class="mb-2 block font-medium text-gray-700 text-sm">
									Event Types
								</p>
								<div class="space-y-2">
									{["donation", "follow", "subscription", "raid"].map(
										(type) => (
											<div class="flex items-center gap-2">
												<input
													type="checkbox"
													id={`event-${type}`}
													checked={config().eventTypes.includes(type)}
													onChange={() => toggleEventType(type)}
													class="rounded"
												/>
												<label
													for={`event-${type}`}
													class="font-medium text-gray-700 text-sm capitalize"
												>
													{type}
												</label>
											</div>
										),
									)}
								</div>
							</div>

							<div class="flex items-center gap-2">
								<input
									type="checkbox"
									id="showTimestamps"
									checked={config().showTimestamps}
									onChange={(e) =>
										updateConfig("showTimestamps", e.currentTarget.checked)
									}
									class="rounded"
								/>
								<label
									for="showTimestamps"
									class="font-medium text-gray-700 text-sm"
								>
									Show Timestamps
								</label>
							</div>

							<div class="flex items-center gap-2">
								<input
									type="checkbox"
									id="showPlatform"
									checked={config().showPlatform}
									onChange={(e) =>
										updateConfig("showPlatform", e.currentTarget.checked)
									}
									class="rounded"
								/>
								<label
									for="showPlatform"
									class="font-medium text-gray-700 text-sm"
								>
									Show Platform
								</label>
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
									id="compactMode"
									checked={config().compactMode}
									onChange={(e) =>
										updateConfig("compactMode", e.currentTarget.checked)
									}
									class="rounded"
								/>
								<label
									for="compactMode"
									class="font-medium text-gray-700 text-sm"
								>
									Compact Mode
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
								class="overflow-hidden rounded-lg bg-gray-900"
								style={{ height: "500px" }}
							>
								<EventListWidget config={config()} events={events()} />
							</div>
							<div class="space-y-2">
								<h3 class={text.h3}>OBS Browser Source URL</h3>
								<p class={text.helper}>
									Add this URL to OBS as a Browser Source:
								</p>
								<div class="break-all rounded bg-gray-100 p-3 font-mono text-sm">
									{window.location.origin}/w/eventlist/{userId()}
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
