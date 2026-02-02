import type { JSX } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "~/design-system/design-system";
import { useProximityGlow } from "./useProximityGlow";

// Glow circle size
const GLOW_SIZE = 250;

export interface TextHighlightProps
	extends JSX.HTMLAttributes<HTMLSpanElement> {
	/** Glow color for the highlight circle */
	glowColor?: string;
	/** Proximity range in pixels (default: 100) */
	range?: number;
	children: JSX.Element;
}

export default function TextHighlight(props: TextHighlightProps) {
	const [local, rest] = splitProps(props, [
		"glowColor",
		"range",
		"children",
		"class",
	]);

	const { mousePos, glowOpacity, setRef } = useProximityGlow({
		range: local.range ?? 100,
	});

	// Create a composite background with both the gradient and the glow
	const backgroundStyle = () => {
		const x = mousePos()?.x ?? 0;
		const y = mousePos()?.y ?? 0;
		const opacity = glowOpacity();

		// Base gradient
		const baseGradient =
			"linear-gradient(to right, var(--color-primary-light), var(--color-secondary))";

		if (opacity === 0) {
			return baseGradient;
		}

		// Glow overlay - white radial gradient positioned at cursor
		const glowGradient = `radial-gradient(circle ${GLOW_SIZE / 2}px at ${x}px ${y}px, rgba(255, 255, 255, ${0.175 * opacity}), transparent)`;

		// Layer glow on top of base gradient
		return `${glowGradient}, ${baseGradient}`;
	};

	return (
		<span
			class={cn(
				"bg-clip-text text-transparent transition-all duration-150",
				local.class,
			)}
			ref={setRef}
			style={{
				background: backgroundStyle(),
				"-webkit-background-clip": "text",
			}}
			{...rest}>
			{local.children}
		</span>
	);
}
