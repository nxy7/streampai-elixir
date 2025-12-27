import { createSignal, onCleanup, onMount, type JSX } from "solid-js";
import { z } from "zod";
import ViewerCountWidget from "~/components/widgets/ViewerCountWidget";
import { WidgetSettingsPage } from "~/components/WidgetSettingsPage";
import {
	generateViewerData,
	generateViewerUpdate,
	type ViewerData,
} from "~/lib/fake/viewer-count";
import type { FormMeta } from "~/lib/schema-form";

/**
 * Viewer count widget configuration schema.
 * Note: Uses snake_case because the widget component expects it directly.
 */
export const viewerCountSchema = z.object({
	showTotal: z.boolean().default(true),
	showPlatforms: z.boolean().default(true),
	fontSize: z.enum(["small", "medium", "large"]).default("medium"),
	displayStyle: z.enum(["minimal", "detailed", "cards"]).default("detailed"),
	animationEnabled: z.boolean().default(true),
	iconColor: z.string().default("#ef4444"),
	viewerLabel: z.string().default("viewers"),
});

export type ViewerCountConfig = z.infer<typeof viewerCountSchema>;

/**
 * Viewer count widget form metadata.
 */
export const viewerCountMeta: FormMeta<typeof viewerCountSchema.shape> = {
	showTotal: { label: "Show Total Viewer Count" },
	showPlatforms: { label: "Show Platform Breakdown" },
	fontSize: { label: "Font Size" },
	displayStyle: { label: "Display Style" },
	animationEnabled: {
		label: "Enable Smooth Number Animations",
	},
	iconColor: { label: "Icon Color", inputType: "color" },
	viewerLabel: {
		label: "Viewer Label",
		placeholder: "viewers",
		description: "Text displayed next to the viewer count",
	},
};

function ViewerCountPreviewWrapper(props: {
	config: ViewerCountConfig;
	children: JSX.Element;
}): JSX.Element {
	const [currentData, setCurrentData] = createSignal<ViewerData>(
		generateViewerData(),
	);

	let demoInterval: number | undefined;

	onMount(() => {
		demoInterval = window.setInterval(() => {
			const current = currentData();
			setCurrentData(generateViewerUpdate(current));
		}, 3000);
	});

	onCleanup(() => {
		if (demoInterval) {
			clearInterval(demoInterval);
		}
	});

	// Convert camelCase config to snake_case for the widget component
	const snakeCaseConfig = () => ({
		show_total: props.config.showTotal,
		show_platforms: props.config.showPlatforms,
		font_size: props.config.fontSize,
		display_style: props.config.displayStyle,
		animation_enabled: props.config.animationEnabled,
		icon_color: props.config.iconColor,
		viewer_label: props.config.viewerLabel,
	});

	return (
		<div class="relative min-h-64 overflow-hidden rounded border border-gray-200 bg-gray-900 p-4">
			<ViewerCountWidget
				config={snakeCaseConfig()}
				data={currentData()}
				id="preview-viewer-count-widget"
			/>
		</div>
	);
}

export default function ViewerCountSettings() {
	return (
		<WidgetSettingsPage
			title="Viewer Count Widget Settings"
			description="Configure your viewer count widget and OBS browser source URL generation"
			widgetType="viewer_count_widget"
			widgetUrlPath="viewer-count"
			schema={viewerCountSchema}
			meta={viewerCountMeta}
			PreviewComponent={ViewerCountWidget}
			previewWrapper={ViewerCountPreviewWrapper}
			obsSettings={{ width: 800, height: 200 }}
		/>
	);
}
