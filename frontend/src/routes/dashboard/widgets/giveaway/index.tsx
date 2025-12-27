import { createSignal, type JSX } from "solid-js";
import { z } from "zod";
import GiveawayWidget from "~/components/widgets/GiveawayWidget";
import { WidgetSettingsPage } from "~/components/WidgetSettingsPage";
import type { FormMeta } from "~/lib/schema-form";
import { input } from "~/styles/design-system";

/**
 * Giveaway widget configuration schema.
 */
export const giveawaySchema = z.object({
	showTitle: z.boolean().default(true),
	title: z.string().default("Giveaway"),
	showDescription: z.boolean().default(true),
	description: z.string().default("Join now for a chance to win!"),
	activeLabel: z.string().default("Giveaway Active"),
	inactiveLabel: z.string().default("No Active Giveaway"),
	winnerLabel: z.string().default("Winner!"),
	entryMethodText: z.string().default("Type !join to enter"),
	showEntryMethod: z.boolean().default(true),
	showProgressBar: z.boolean().default(true),
	targetParticipants: z.number().min(1).default(100),
	patreonMultiplier: z.number().min(1).max(10).default(2),
	patreonBadgeText: z.string().default("Patreon"),
	winnerAnimation: z
		.enum(["fade", "slide", "bounce", "confetti"])
		.default("confetti"),
	titleColor: z.string().default("#9333ea"),
	textColor: z.string().default("#1f2937"),
	backgroundColor: z.string().default("#ffffff"),
	accentColor: z.string().default("#10b981"),
	fontSize: z.enum(["small", "medium", "large", "extra-large"]).default("medium"),
	showPatreonInfo: z.boolean().default(true),
});

export type GiveawayConfig = z.infer<typeof giveawaySchema>;

/**
 * Giveaway widget form metadata.
 */
export const giveawayMeta: FormMeta<typeof giveawaySchema.shape> = {
	showTitle: { label: "Show Title" },
	title: { label: "Title", placeholder: "Enter giveaway title" },
	showDescription: { label: "Show Description" },
	description: { label: "Description", placeholder: "Enter description" },
	activeLabel: { label: "Active Label" },
	inactiveLabel: { label: "Inactive Label" },
	winnerLabel: { label: "Winner Label" },
	entryMethodText: { label: "Entry Method Text" },
	showEntryMethod: { label: "Show Entry Method" },
	showProgressBar: { label: "Show Progress Bar" },
	targetParticipants: { label: "Target Participants" },
	patreonMultiplier: { label: "Patreon Multiplier", description: "Bonus entries for Patreon supporters" },
	patreonBadgeText: { label: "Patreon Badge Text" },
	winnerAnimation: { label: "Winner Animation" },
	titleColor: { label: "Title Color", inputType: "color" },
	textColor: { label: "Text Color", inputType: "color" },
	backgroundColor: { label: "Background Color", inputType: "color" },
	accentColor: { label: "Accent Color", inputType: "color" },
	fontSize: { label: "Font Size" },
	showPatreonInfo: { label: "Show Patreon Info" },
};

const DEMO_ACTIVE = {
	type: "update" as const,
	participants: 47,
	patreons: 12,
	isActive: true,
};

const DEMO_WINNER = {
	type: "result" as const,
	winner: { username: "StreamLegend42", isPatreon: true },
	totalParticipants: 89,
	patreonParticipants: 15,
};

function GiveawayPreviewWrapper(props: {
	config: GiveawayConfig;
	children: JSX.Element;
}): JSX.Element {
	const [demoMode, setDemoMode] = createSignal<"active" | "winner">("active");

	return (
		<div>
			<div class="mb-4">
				<select
					class={input.select}
					value={demoMode()}
					onChange={(e) => setDemoMode(e.target.value as "active" | "winner")}>
					<option value="active">Active Giveaway</option>
					<option value="winner">Winner Announcement</option>
				</select>
			</div>
			<div class="rounded-lg bg-gray-900 p-8">
				<GiveawayWidget
					config={props.config}
					event={demoMode() === "active" ? DEMO_ACTIVE : DEMO_WINNER}
				/>
			</div>
		</div>
	);
}

export default function GiveawayWidgetSettings() {
	return (
		<WidgetSettingsPage
			title="Giveaway Widget Settings"
			description="Configure your giveaway widget for viewer engagement"
			widgetType="giveaway_widget"
			widgetUrlPath="giveaway"
			schema={giveawaySchema}
			meta={giveawayMeta}
			PreviewComponent={GiveawayWidget}
			previewWrapper={GiveawayPreviewWrapper}
			obsSettings={{ width: 600, height: 400 }}
		/>
	);
}
