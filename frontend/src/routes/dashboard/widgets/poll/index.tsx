import { createSignal, type JSX } from "solid-js";
import { z } from "zod";
import PollWidget from "~/components/widgets/PollWidget";
import { WidgetSettingsPage } from "~/components/WidgetSettingsPage";
import type { FormMeta } from "~/lib/schema-form";
import { input, text } from "~/styles/design-system";

/**
 * Poll widget configuration schema.
 */
export const pollSchema = z.object({
	showTitle: z.boolean().default(true),
	showPercentages: z.boolean().default(true),
	showVoteCounts: z.boolean().default(true),
	fontSize: z.enum(["small", "medium", "large", "extra-large"]).default("medium"),
	primaryColor: z.string().default("#9333ea"),
	secondaryColor: z.string().default("#3b82f6"),
	backgroundColor: z.string().default("#ffffff"),
	textColor: z.string().default("#1f2937"),
	winnerColor: z.string().default("#fbbf24"),
	animationType: z.enum(["none", "smooth", "bounce"]).default("smooth"),
	highlightWinner: z.boolean().default(true),
	autoHideAfterEnd: z.boolean().default(false),
	hideDelay: z.number().min(1).max(60).default(10),
});

export type PollConfig = z.infer<typeof pollSchema>;

/**
 * Poll widget form metadata.
 */
export const pollMeta: FormMeta<typeof pollSchema.shape> = {
	showTitle: { label: "Show Poll Title" },
	showPercentages: { label: "Show Percentages" },
	showVoteCounts: { label: "Show Vote Counts" },
	fontSize: { label: "Font Size" },
	primaryColor: { label: "Primary Color (Progress Bars)", inputType: "color" },
	secondaryColor: { label: "Secondary Color", inputType: "color" },
	backgroundColor: { label: "Background Color", inputType: "color" },
	textColor: { label: "Text Color", inputType: "color" },
	winnerColor: { label: "Winner Color (Highlight)", inputType: "color" },
	animationType: { label: "Animation Type" },
	highlightWinner: { label: "Highlight Leading Option" },
	autoHideAfterEnd: { label: "Auto Hide After End" },
	hideDelay: { label: "Hide Delay", unit: "seconds" },
};

const DEMO_POLL_ACTIVE = {
	id: "demo-1",
	title: "Which game should we play next?",
	status: "active" as const,
	options: [
		{ id: "1", text: "League of Legends", votes: 145 },
		{ id: "2", text: "Valorant", votes: 203 },
		{ id: "3", text: "Minecraft", votes: 89 },
		{ id: "4", text: "Among Us", votes: 56 },
	],
	totalVotes: 493,
	createdAt: new Date(),
	endsAt: new Date(Date.now() + 5 * 60 * 1000),
};

const DEMO_POLL_ENDED = {
	id: "demo-2",
	title: "Which game should we play next?",
	status: "ended" as const,
	options: [
		{ id: "1", text: "League of Legends", votes: 145 },
		{ id: "2", text: "Valorant", votes: 203 },
		{ id: "3", text: "Minecraft", votes: 89 },
		{ id: "4", text: "Among Us", votes: 56 },
	],
	totalVotes: 493,
	createdAt: new Date(),
};

function PollPreviewWrapper(props: {
	config: PollConfig;
	children: JSX.Element;
}): JSX.Element {
	const [demoMode, setDemoMode] = createSignal<"active" | "ended">("active");

	return (
		<div>
			<div class="mb-4">
				<label class="mb-2 block">
					<span class={text.label}>Preview Mode</span>
					<select
						class={`${input.select} mt-1`}
						value={demoMode()}
						onChange={(e) => setDemoMode(e.target.value as "active" | "ended")}>
						<option value="active">Active Poll</option>
						<option value="ended">Ended Poll (Results)</option>
					</select>
				</label>
			</div>
			<div class="rounded-lg bg-gray-900 p-8">
				<PollWidget
					config={props.config}
					pollStatus={demoMode() === "active" ? DEMO_POLL_ACTIVE : DEMO_POLL_ENDED}
				/>
			</div>
		</div>
	);
}

export default function PollWidgetSettings() {
	return (
		<WidgetSettingsPage
			title="Poll Widget Settings"
			description="Configure your interactive poll widget for live voting on stream"
			widgetType="poll_widget"
			widgetUrlPath="poll"
			schema={pollSchema}
			meta={pollMeta}
			PreviewComponent={PollWidget}
			previewWrapper={PollPreviewWrapper}
			obsSettings={{ width: 600, height: 400 }}
		/>
	);
}
