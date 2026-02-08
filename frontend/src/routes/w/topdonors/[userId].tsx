import TopDonorsWidget from "~/components/widgets/TopDonorsWidget";
import { createWidgetRoute } from "~/lib/createWidgetRoute";

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

export default createWidgetRoute<TopDonorsConfig>({
	widgetType: "top_donors_widget",
	defaults: {
		title: "🏆 Top Donors",
		topCount: 10,
		fontSize: 16,
		showAmounts: true,
		showRanking: true,
		backgroundColor: "#1f2937",
		textColor: "#ffffff",
		highlightColor: "#ffd700",
	},
	render: (config) => (
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				"align-items": "center",
				"justify-content": "center",
			}}>
			<TopDonorsWidget config={config} donors={[]} />
		</div>
	),
});
