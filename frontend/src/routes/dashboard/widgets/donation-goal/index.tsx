import { createSignal, type JSX } from "solid-js";
import { z } from "zod";
import DonationGoalWidget from "~/components/widgets/DonationGoalWidget";
import { WidgetSettingsPage } from "~/components/WidgetSettingsPage";
import type { FormMeta } from "~/lib/schema-form";
import { text } from "~/styles/design-system";

/**
 * Donation goal widget configuration schema.
 */
export const donationGoalSchema = z.object({
	goalAmount: z.number().min(1).default(1000),
	startingAmount: z.number().min(0).default(0),
	currency: z.string().default("$"),
	startDate: z
		.string()
		.default(() => new Date().toISOString().split("T")[0]),
	endDate: z
		.string()
		.default(
			() =>
				new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
					.toISOString()
					.split("T")[0],
		),
	title: z.string().default("Donation Goal"),
	showPercentage: z.boolean().default(true),
	showAmountRaised: z.boolean().default(true),
	showDaysLeft: z.boolean().default(true),
	theme: z.enum(["default", "minimal", "modern"]).default("default"),
	barColor: z.string().default("#10b981"),
	backgroundColor: z.string().default("#e5e7eb"),
	textColor: z.string().default("#1f2937"),
	animationEnabled: z.boolean().default(true),
});

export type DonationGoalConfig = z.infer<typeof donationGoalSchema>;

/**
 * Donation goal widget form metadata.
 */
export const donationGoalMeta: FormMeta<typeof donationGoalSchema.shape> = {
	goalAmount: { label: "Goal Amount" },
	startingAmount: { label: "Starting Amount" },
	currency: { label: "Currency Symbol" },
	startDate: { label: "Start Date" },
	endDate: { label: "End Date" },
	title: { label: "Title", placeholder: "Enter widget title" },
	showPercentage: { label: "Show Percentage" },
	showAmountRaised: { label: "Show Amount Raised" },
	showDaysLeft: { label: "Show Days Left" },
	theme: { label: "Theme" },
	barColor: { label: "Progress Bar Color", inputType: "color" },
	backgroundColor: { label: "Background Color", inputType: "color" },
	textColor: { label: "Text Color", inputType: "color" },
	animationEnabled: {
		label: "Enable Animations",
		description: "Smooth progress bar animations",
	},
};

function DonationGoalPreviewWrapper(props: {
	config: DonationGoalConfig;
	children: JSX.Element;
}): JSX.Element {
	const [demoAmount, setDemoAmount] = createSignal(350);

	return (
		<div>
			<div class="mb-4">
				<label class="mb-2 block">
					<span class={text.label}>
						Test Progress: {demoAmount()}/{props.config.goalAmount}
					</span>
					<input
						type="range"
						class="w-full"
						min="0"
						max={props.config.goalAmount}
						value={demoAmount()}
						onInput={(e) => setDemoAmount(Number.parseInt(e.target.value, 10))}
					/>
				</label>
			</div>
			<div class="rounded-lg bg-gray-900 p-8" style={{ height: "300px" }}>
				<DonationGoalWidget config={props.config} currentAmount={demoAmount()} />
			</div>
		</div>
	);
}

export default function DonationGoalWidgetSettings() {
	return (
		<WidgetSettingsPage
			title="Donation Goal Widget Settings"
			description="Track progress toward your donation goals with animated progress bars"
			widgetType="donation_goal_widget"
			widgetUrlPath="donation-goal"
			schema={donationGoalSchema}
			meta={donationGoalMeta}
			PreviewComponent={DonationGoalWidget}
			previewWrapper={DonationGoalPreviewWrapper}
			obsSettings={{ width: 800, height: 200 }}
		/>
	);
}
