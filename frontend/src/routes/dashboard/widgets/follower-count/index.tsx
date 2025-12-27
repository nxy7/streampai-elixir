import { z } from "zod";
import FollowerCountWidget from "~/components/widgets/FollowerCountWidget";
import { WidgetSettingsPage } from "~/components/WidgetSettingsPage";
import type { FormMeta } from "~/lib/schema-form";

/**
 * Follower Count widget configuration schema.
 */
export const followerCountSchema = z.object({
	label: z.string().default("followers"),
	fontSize: z.number().min(12).max(96).default(32),
	textColor: z.string().default("#ffffff"),
	backgroundColor: z.string().default("#9333ea"),
	showIcon: z.boolean().default(true),
	animateOnChange: z.boolean().default(true),
});

export type FollowerCountConfig = z.infer<typeof followerCountSchema>;

/**
 * Follower Count widget form metadata.
 */
export const followerCountMeta: FormMeta<typeof followerCountSchema.shape> = {
	label: { label: "Label", placeholder: "followers" },
	fontSize: { label: "Font Size", unit: "px" },
	textColor: { label: "Text Color", inputType: "color" },
	backgroundColor: { label: "Background Color", inputType: "color" },
	showIcon: { label: "Show User Icon" },
	animateOnChange: {
		label: "Animate on Change",
		description: "Animate the count when it changes",
	},
};

export default function FollowerCountSettings() {
	return (
		<WidgetSettingsPage
			title="Follower Count Widget Settings"
			description="Configure your follower count widget for OBS"
			widgetType="follower_count_widget"
			widgetUrlPath="follower-count"
			schema={followerCountSchema}
			meta={followerCountMeta}
			PreviewComponent={FollowerCountWidget}
			previewProps={{ count: 5678 }}
		/>
	);
}
