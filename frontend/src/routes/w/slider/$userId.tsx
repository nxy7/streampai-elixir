import { createFileRoute } from "@tanstack/solid-router";
import SliderWidget from "~/components/widgets/SliderWidget";
import { createWidgetRoute } from "~/lib/createWidgetRoute";

interface SliderConfig {
	slideDuration: number;
	transitionDuration: number;
	transitionType: "fade" | "slide" | "slide-up" | "zoom" | "flip";
	fitMode: "contain" | "cover" | "fill";
	backgroundColor: string;
	images: { id: string; url: string; alt?: string; index: number }[];
}

const SliderDisplay = createWidgetRoute<SliderConfig>({
	widgetType: "slider_widget",
	defaults: {
		slideDuration: 5,
		transitionDuration: 500,
		transitionType: "fade",
		fitMode: "contain",
		backgroundColor: "transparent",
		images: [],
	},
	render: (config) => (
		<div style={{ width: "100%", height: "100%" }}>
			<SliderWidget config={config} />
		</div>
	),
});

export const Route = createFileRoute("/w/slider/$userId")({
	component: SliderDisplay,
});
