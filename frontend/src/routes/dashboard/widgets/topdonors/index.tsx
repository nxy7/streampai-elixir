import { z } from "zod";
import TopDonorsWidget from "~/components/widgets/TopDonorsWidget";
import { WidgetSettingsPage } from "~/components/WidgetSettingsPage";
import type { FormMeta } from "~/lib/schema-form";

interface Donor {
	id: string;
	username: string;
	amount: number;
	currency: string;
}

/**
 * Top donors widget configuration schema.
 */
export const topDonorsSchema = z.object({
	title: z.string().default("Top Donors"),
	topCount: z.number().min(3).max(20).default(10),
	fontSize: z.number().min(10).max(32).default(16),
	showAmounts: z.boolean().default(true),
	showRanking: z.boolean().default(true),
	backgroundColor: z.string().default("#1f2937"),
	textColor: z.string().default("#ffffff"),
	highlightColor: z.string().default("#ffd700"),
});

export type TopDonorsConfig = z.infer<typeof topDonorsSchema>;

/**
 * Top donors widget form metadata.
 */
export const topDonorsMeta: FormMeta<typeof topDonorsSchema.shape> = {
	title: { label: "Widget Title", placeholder: "Enter widget title" },
	topCount: { label: "Top Count", description: "Number of top donors to display" },
	fontSize: { label: "Font Size", unit: "px" },
	showAmounts: { label: "Show Donation Amounts" },
	showRanking: { label: "Show Ranking Numbers" },
	backgroundColor: { label: "Background Color", inputType: "color" },
	textColor: { label: "Text Color", inputType: "color" },
	highlightColor: { label: "Highlight Color", inputType: "color", description: "Used for podium positions (top 3)" },
};

const MOCK_DONORS: Donor[] = [
	{ id: "1", username: "GeneroussUser", amount: 2500.0, currency: "$" },
	{ id: "2", username: "MegaDonor", amount: 1800.0, currency: "$" },
	{ id: "3", username: "TopSupporter", amount: 1200.0, currency: "$" },
	{ id: "4", username: "Contributor", amount: 750.0, currency: "$" },
	{ id: "5", username: "FanSupport", amount: 500.0, currency: "$" },
	{ id: "6", username: "StreamFan", amount: 350.0, currency: "$" },
	{ id: "7", username: "Donor7", amount: 250.0, currency: "$" },
	{ id: "8", username: "Supporter8", amount: 150.0, currency: "$" },
	{ id: "9", username: "User9", amount: 100.0, currency: "$" },
	{ id: "10", username: "Viewer10", amount: 75.0, currency: "$" },
];

export default function TopDonorsSettings() {
	return (
		<WidgetSettingsPage
			title="Top Donors Widget Settings"
			description="Configure your top donors leaderboard widget for OBS"
			widgetType="top_donors_widget"
			widgetUrlPath="topdonors"
			schema={topDonorsSchema}
			meta={topDonorsMeta}
			PreviewComponent={TopDonorsWidget}
			previewProps={{ donors: MOCK_DONORS }}
			obsSettings={{
				width: 400,
				height: 800,
				customTips: ['Enable "Shutdown source when not visible"'],
			}}
		/>
	);
}
