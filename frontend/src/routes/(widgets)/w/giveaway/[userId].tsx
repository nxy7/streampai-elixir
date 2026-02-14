import GiveawayWidget from "~/components/widgets/GiveawayWidget";
import { createWidgetRoute } from "~/lib/createWidgetRoute";

interface GiveawayConfig {
	showTitle: boolean;
	title: string;
	showDescription: boolean;
	description: string;
	activeLabel: string;
	inactiveLabel: string;
	winnerLabel: string;
	entryMethodText: string;
	showEntryMethod: boolean;
	showProgressBar: boolean;
	targetParticipants: number;
	patreonMultiplier: number;
	patreonBadgeText: string;
	winnerAnimation: "fade" | "slide" | "bounce" | "confetti";
	titleColor: string;
	textColor: string;
	backgroundColor: string;
	accentColor: string;
	fontSize: "small" | "medium" | "large" | "extra-large";
	showPatreonInfo: boolean;
}

export default createWidgetRoute<GiveawayConfig>({
	widgetType: "giveaway_widget",
	containerStyle: { padding: "1rem" },
	defaults: {
		showTitle: true,
		title: "🎉 Giveaway",
		showDescription: true,
		description: "Join now for a chance to win!",
		activeLabel: "Giveaway Active",
		inactiveLabel: "No Active Giveaway",
		winnerLabel: "Winner!",
		entryMethodText: "Type !join to enter",
		showEntryMethod: true,
		showProgressBar: true,
		targetParticipants: 100,
		patreonMultiplier: 2,
		patreonBadgeText: "Patreon",
		winnerAnimation: "confetti",
		titleColor: "#9333ea",
		textColor: "#1f2937",
		backgroundColor: "#ffffff",
		accentColor: "#10b981",
		fontSize: "medium",
		showPatreonInfo: true,
	},
	render: (config) => (
		<div style={{ "max-width": "500px", width: "100%" }}>
			<GiveawayWidget config={config} />
		</div>
	),
});
