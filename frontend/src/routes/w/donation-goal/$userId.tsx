import { createFileRoute } from "@tanstack/solid-router";
import DonationGoalWidget from "~/components/widgets/DonationGoalWidget";
import { createWidgetRoute } from "~/lib/createWidgetRoute";

interface DonationGoalConfig {
	goalAmount: number;
	startingAmount: number;
	currency: string;
	startDate: string;
	endDate: string;
	title: string;
	showPercentage: boolean;
	showAmountRaised: boolean;
	showDaysLeft: boolean;
	theme: "default" | "minimal" | "modern";
	barColor: string;
	backgroundColor: string;
	textColor: string;
	animationEnabled: boolean;
}

const DonationGoalDisplay = createWidgetRoute<DonationGoalConfig>({
	widgetType: "donation_goal_widget",
	containerStyle: { padding: "1rem" },
	defaults: {
		goalAmount: 1000,
		startingAmount: 0,
		currency: "$",
		startDate: new Date().toISOString().split("T")[0],
		endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
			.toISOString()
			.split("T")[0],
		title: "Donation Goal",
		showPercentage: true,
		showAmountRaised: true,
		showDaysLeft: true,
		theme: "default",
		barColor: "#10b981",
		backgroundColor: "#e5e7eb",
		textColor: "#1f2937",
		animationEnabled: true,
	},
	render: (config) => (
		<div style={{ "max-width": "600px", width: "100%" }}>
			<DonationGoalWidget
				config={config}
				currentAmount={config.startingAmount ?? 0}
			/>
		</div>
	),
});

export const Route = createFileRoute("/w/donation-goal/$userId")({
	component: DonationGoalDisplay,
});
