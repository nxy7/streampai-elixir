import { createSignal, type JSX } from "solid-js";
import { z } from "zod";
import AlertboxWidget from "~/components/widgets/AlertboxWidget";
import { WidgetSettingsPage } from "~/components/WidgetSettingsPage";
import type { FormMeta } from "~/lib/schema-form";
import { button } from "~/styles/design-system";

/**
 * Alertbox widget configuration schema.
 */
export const alertboxSchema = z.object({
	animationType: z.enum(["slide", "fade", "bounce"]).default("fade"),
	displayDuration: z.number().min(1).max(30).default(5),
	soundEnabled: z.boolean().default(true),
	soundVolume: z.number().min(0).max(100).default(80),
	showMessage: z.boolean().default(true),
	showAmount: z.boolean().default(true),
	fontSize: z.enum(["small", "medium", "large"]).default("medium"),
	alertPosition: z.enum(["top", "center", "bottom"]).default("center"),
});

export type AlertboxConfig = z.infer<typeof alertboxSchema>;

/**
 * Alertbox widget form metadata.
 */
export const alertboxMeta: FormMeta<typeof alertboxSchema.shape> = {
	animationType: { label: "Animation Type" },
	displayDuration: { label: "Display Duration", unit: "seconds" },
	soundEnabled: { label: "Sound Enabled", description: "Play sound on alerts" },
	soundVolume: { label: "Sound Volume", unit: "%" },
	showMessage: {
		label: "Show Message",
		description: "Display message text on alerts",
	},
	showAmount: {
		label: "Show Amount",
		description: "Show amount for donations/raids",
	},
	fontSize: { label: "Font Size" },
	alertPosition: { label: "Alert Position" },
};

const DEMO_EVENTS = [
	{
		id: "1",
		type: "donation" as const,
		username: "GenerosusDono",
		amount: 25,
		currency: "$",
		message: "Keep up the great streams!",
		timestamp: new Date(),
		platform: { icon: "twitch", color: "#9146ff" },
	},
	{
		id: "2",
		type: "follow" as const,
		username: "NewFan123",
		timestamp: new Date(),
		platform: { icon: "youtube", color: "#ff0000" },
	},
	{
		id: "3",
		type: "subscription" as const,
		username: "LoyalViewer42",
		timestamp: new Date(),
		platform: { icon: "twitch", color: "#9146ff" },
	},
	{
		id: "4",
		type: "raid" as const,
		username: "FriendlyStreamer",
		amount: 50,
		timestamp: new Date(),
		platform: { icon: "twitch", color: "#9146ff" },
	},
];

function AlertboxPreviewWrapper(props: {
	config: AlertboxConfig;
	children: JSX.Element;
}): JSX.Element {
	const [demoIndex, setDemoIndex] = createSignal(0);

	function cycleDemoEvent() {
		setDemoIndex((demoIndex() + 1) % DEMO_EVENTS.length);
	}

	return (
		<div>
			<button type="button" class={`${button.secondary} mb-4`} onClick={cycleDemoEvent}>
				Show Next Alert Type
			</button>
			<div class="rounded-lg bg-gray-900 p-8" style={{ height: "400px" }}>
				<AlertboxWidget config={props.config} event={DEMO_EVENTS[demoIndex()]} />
			</div>
		</div>
	);
}

export default function AlertboxWidgetSettings() {
	return (
		<WidgetSettingsPage
			title="Alertbox Widget Settings"
			description="Configure alert notifications for donations, follows, subscriptions, and raids"
			widgetType="alertbox_widget"
			widgetUrlPath="alertbox"
			schema={alertboxSchema}
			meta={alertboxMeta}
			PreviewComponent={AlertboxWidget}
			previewWrapper={AlertboxPreviewWrapper}
			obsSettings={{ width: 800, height: 600 }}
		/>
	);
}
