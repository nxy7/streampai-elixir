import type { ParentProps } from "solid-js";

/**
 * Layout for widget embed routes (/w/*).
 * Transparent background, no app chrome, no providers.
 * The [data-widget-embed] attribute is targeted by CSS to make the body
 * transparent from the first paint (no JS flicker).
 */
export default function WidgetLayout(props: ParentProps) {
	return (
		<div
			data-widget-embed
			style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
			{props.children}
		</div>
	);
}
