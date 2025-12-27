import { z } from "zod";
import PlaceholderWidget from "~/components/widgets/PlaceholderWidget";
import { WidgetSettingsPage } from "~/components/WidgetSettingsPage";
import type { FormMeta } from "~/lib/schema-form";

/**
 * Placeholder widget configuration schema.
 */
export const placeholderSchema = z.object({
	message: z.string().default("Placeholder Widget"),
	fontSize: z.number().min(8).max(72).default(24),
	textColor: z.string().default("#ffffff"),
	backgroundColor: z.string().default("#9333ea"),
	borderColor: z.string().default("#ffffff"),
	borderWidth: z.number().min(0).max(10).default(2),
	padding: z.number().min(0).max(50).default(16),
	borderRadius: z.number().min(0).max(50).default(8),
});

export type PlaceholderConfig = z.infer<typeof placeholderSchema>;

/**
 * Placeholder widget form metadata.
 */
export const placeholderMeta: FormMeta<typeof placeholderSchema.shape> = {
	message: { label: "Message", placeholder: "Enter placeholder text" },
	fontSize: { label: "Font Size", unit: "px" },
	textColor: { label: "Text Color", inputType: "color" },
	backgroundColor: { label: "Background Color", inputType: "color" },
	borderColor: { label: "Border Color", inputType: "color" },
	borderWidth: { label: "Border Width", unit: "px" },
	padding: { label: "Padding", unit: "px" },
	borderRadius: { label: "Border Radius", unit: "px" },
};

export default function PlaceholderSettings() {
	return (
		<WidgetSettingsPage
			title="Placeholder Widget Settings"
			description="Configure your placeholder widget for OBS"
			widgetType="placeholder_widget"
			widgetUrlPath="placeholder"
			schema={placeholderSchema}
			meta={placeholderMeta}
			PreviewComponent={PlaceholderWidget}
		/>
	);
}
