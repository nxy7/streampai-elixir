import PollWidget from "~/components/widgets/PollWidget";
import { createWidgetRoute } from "~/lib/createWidgetRoute";

interface PollConfig {
	showTitle: boolean;
	showPercentages: boolean;
	showVoteCounts: boolean;
	fontSize: "small" | "medium" | "large" | "extra-large";
	primaryColor: string;
	secondaryColor: string;
	backgroundColor: string;
	textColor: string;
	winnerColor: string;
	animationType: "none" | "smooth" | "bounce";
	highlightWinner: boolean;
	autoHideAfterEnd: boolean;
	hideDelay: number;
}

export default createWidgetRoute<PollConfig>({
	widgetType: "poll_widget",
	containerStyle: { padding: "1rem" },
	defaults: {
		showTitle: true,
		showPercentages: true,
		showVoteCounts: true,
		fontSize: "medium",
		primaryColor: "#9333ea",
		secondaryColor: "#3b82f6",
		backgroundColor: "#ffffff",
		textColor: "#1f2937",
		winnerColor: "#fbbf24",
		animationType: "smooth",
		highlightWinner: true,
		autoHideAfterEnd: false,
		hideDelay: 10,
	},
	render: (config) => (
		<div style={{ "max-width": "600px", width: "100%" }}>
			<PollWidget config={config} />
		</div>
	),
});
