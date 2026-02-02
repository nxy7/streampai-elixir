import { createFileRoute } from "@tanstack/solid-router";
import ChatWidget from "~/components/widgets/ChatWidget";
import { createWidgetRoute } from "~/lib/createWidgetRoute";

interface ChatConfig {
	fontSize: "small" | "medium" | "large";
	showTimestamps: boolean;
	showBadges: boolean;
	showPlatform: boolean;
	showEmotes: boolean;
	maxMessages: number;
}

const ChatDisplay = createWidgetRoute<ChatConfig>({
	widgetType: "chat_widget",
	defaults: {
		fontSize: "medium",
		showTimestamps: false,
		showBadges: true,
		showPlatform: true,
		showEmotes: true,
		maxMessages: 25,
	},
	render: (config) => (
		<div style={{ width: "100%", height: "100%" }}>
			<ChatWidget config={config} messages={[]} />
		</div>
	),
});

export const Route = createFileRoute("/w/chat/$userId")({
	component: ChatDisplay,
});
