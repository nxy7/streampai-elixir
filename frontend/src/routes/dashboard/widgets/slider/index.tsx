import { z } from "zod";
import SliderWidget from "~/components/widgets/SliderWidget";
import { WidgetSettingsPage } from "~/components/WidgetSettingsPage";
import type { FormMeta } from "~/lib/schema-form";

/**
 * Slider widget configuration schema.
 * Note: Images are managed separately from the schema-form.
 */
export const sliderSchema = z.object({
	slideDuration: z.number().min(1).max(60).default(5),
	transitionDuration: z.number().min(100).max(3000).default(500),
	transitionType: z
		.enum(["fade", "slide", "slide-up", "zoom", "flip"])
		.default("fade"),
	fitMode: z.enum(["contain", "cover", "fill"]).default("contain"),
	backgroundColor: z.string().default("transparent"),
});

export type SliderConfig = z.infer<typeof sliderSchema>;

/**
 * Slider widget form metadata.
 */
export const sliderMeta: FormMeta<typeof sliderSchema.shape> = {
	slideDuration: {
		label: "Slide Duration",
		unit: "seconds",
		description: "How long each slide is displayed",
	},
	transitionDuration: {
		label: "Transition Duration",
		unit: "ms",
		description: "Speed of the transition animation",
	},
	transitionType: { label: "Transition Type" },
	fitMode: {
		label: "Image Fit Mode",
		description: "How images are scaled to fit the container",
	},
	backgroundColor: {
		label: "Background Color",
		inputType: "color",
		placeholder: "transparent or #000000",
	},
};

const SAMPLE_IMAGES = [
	{
		id: "1",
		url: "https://picsum.photos/800/450?random=1",
		alt: "Sample 1",
		index: 0,
	},
	{
		id: "2",
		url: "https://picsum.photos/800/450?random=2",
		alt: "Sample 2",
		index: 1,
	},
	{
		id: "3",
		url: "https://picsum.photos/800/450?random=3",
		alt: "Sample 3",
		index: 2,
	},
];

export default function SliderSettings() {
	return (
		<WidgetSettingsPage
			title="Slider Widget Settings"
			description="Configure your image slider widget for OBS"
			widgetType="slider_widget"
			widgetUrlPath="slider"
			schema={sliderSchema}
			meta={sliderMeta}
			PreviewComponent={SliderWidget}
			previewProps={{ images: SAMPLE_IMAGES }}
			obsSettings={{
				width: 1920,
				height: 1080,
				customTips: [
					'Enable "Shutdown source when not visible"',
					'Enable "Refresh browser when scene becomes active"',
				],
			}}
		/>
	);
}
