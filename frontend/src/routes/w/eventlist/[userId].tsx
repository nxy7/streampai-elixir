import EventListWidget from "~/components/widgets/EventListWidget";
import { createWidgetRoute } from "~/lib/createWidgetRoute";

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

export default createWidgetRoute<EventListConfig>({
	widgetType: "eventlist_widget",
	defaults: {
		animationType: "fade",
		maxEvents: 10,
		eventTypes: ["donation", "follow", "subscription", "raid"],
		showTimestamps: false,
		showPlatform: false,
		showAmounts: true,
		fontSize: "medium",
		compactMode: true,
	},
	render: (config) => (
		<div style={{ width: "100%", height: "100%" }}>
			<EventListWidget config={config} events={[]} />
		</div>
	),
});
