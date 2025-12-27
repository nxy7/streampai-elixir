import { z } from "zod";
import TimerWidget from "~/components/widgets/TimerWidget";
import { WidgetSettingsPage } from "~/components/WidgetSettingsPage";
import type { FormMeta } from "~/lib/schema-form";

/**
 * Timer widget configuration schema.
 * Plain Zod - could be auto-generated from Ash.
 */
export const timerSchema = z.object({
	label: z.string().default("TIMER"),
	fontSize: z.number().min(24).max(120).default(48),
	textColor: z.string().default("#ffffff"),
	backgroundColor: z.string().default("#3b82f6"),
	countdownMinutes: z.number().min(1).max(120).default(5),
	autoStart: z.boolean().default(false),
});

export type TimerConfig = z.infer<typeof timerSchema>;

/**
 * Timer widget form metadata.
 * UI hints for form generation.
 */
export const timerMeta: FormMeta<typeof timerSchema.shape> = {
	label: { label: "Timer Label", placeholder: "Enter label text" },
	fontSize: { label: "Font Size", unit: "px" },
	textColor: { label: "Text Color", inputType: "color" },
	backgroundColor: { label: "Background Color", inputType: "color" },
	countdownMinutes: { label: "Countdown Duration", unit: "minutes" },
	autoStart: {
		label: "Auto Start on Load",
		description: "Automatically start the timer when the widget loads in OBS",
	},
};

export default function TimerSettings() {
	return (
		<WidgetSettingsPage
			title="Timer Widget Settings"
			description="Configure your countdown timer widget for OBS"
			widgetType="timer_widget"
			widgetUrlPath="timer"
			schema={timerSchema}
			meta={timerMeta}
			PreviewComponent={TimerWidget}
		/>
	);
}
