import type { JSX } from "solid-js";
import { getEventSvgPath } from "~/lib/eventMetadata";

interface EventIconProps {
	type: string;
	class?: string;
}

/**
 * Renders an SVG icon for the given event type.
 * Uses centralized SVG paths from eventMetadata.
 */
export default function EventIcon(props: EventIconProps): JSX.Element {
	return (
		<svg
			aria-hidden="true"
			class={props.class || "h-4 w-4"}
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d={getEventSvgPath(props.type)}
			/>
		</svg>
	);
}
