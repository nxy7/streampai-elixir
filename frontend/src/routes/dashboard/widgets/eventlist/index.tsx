import { createSignal, onMount, type JSX } from "solid-js";
import { z } from "zod";
import EventListWidget from "~/components/widgets/EventListWidget";
import { WidgetSettingsPage } from "~/components/WidgetSettingsPage";
import type { FormMeta } from "~/lib/schema-form";

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

/**
 * Event list widget configuration schema.
 */
export const eventListSchema = z.object({
	animationType: z.enum(["slide", "fade", "bounce"]).default("fade"),
	maxEvents: z.number().min(1).max(50).default(10),
	showTimestamps: z.boolean().default(false),
	showPlatform: z.boolean().default(false),
	showAmounts: z.boolean().default(true),
	fontSize: z.enum(["small", "medium", "large"]).default("medium"),
	compactMode: z.boolean().default(true),
});

export type EventListConfig = z.infer<typeof eventListSchema>;

/**
 * Event list widget form metadata.
 */
export const eventListMeta: FormMeta<typeof eventListSchema.shape> = {
	animationType: { label: "Animation Type" },
	maxEvents: { label: "Max Events", description: "Maximum number of events to display" },
	showTimestamps: { label: "Show Timestamps" },
	showPlatform: { label: "Show Platform Icons" },
	showAmounts: { label: "Show Donation Amounts" },
	fontSize: { label: "Font Size" },
	compactMode: { label: "Compact Mode", description: "Use condensed layout" },
};

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

// Default event types to display
const DEFAULT_EVENT_TYPES = ["donation", "follow", "subscription", "raid"];

function EventListPreviewWrapper(props: {
	config: EventListConfig;
	children: JSX.Element;
}): JSX.Element {
	const [events, setEvents] = createSignal<StreamEvent[]>(MOCK_EVENTS);

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

	// Add eventTypes to config for the widget (not part of schema-form)
	const fullConfig = () => ({
		...props.config,
		eventTypes: DEFAULT_EVENT_TYPES,
	});

	return (
		<div
			class="overflow-hidden rounded-lg bg-gray-900"
			style={{ height: "500px" }}>
			<EventListWidget config={fullConfig()} events={events()} />
		</div>
	);
}

export default function EventListSettings() {
	return (
		<WidgetSettingsPage
			title="Event List Widget Settings"
			description="Configure your stream events widget for OBS"
			widgetType="eventlist_widget"
			widgetUrlPath="eventlist"
			schema={eventListSchema}
			meta={eventListMeta}
			PreviewComponent={EventListWidget}
			previewWrapper={EventListPreviewWrapper}
			obsSettings={{
				width: 400,
				height: 800,
				customTips: ['Enable "Shutdown source when not visible"'],
			}}
		/>
	);
}
