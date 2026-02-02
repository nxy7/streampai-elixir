import { createSignal, onCleanup, onMount } from "solid-js";

export interface ProximityGlowOptions {
	/** Proximity detection range in pixels (default: 100) */
	range?: number;
}

export interface ProximityGlowResult {
	/** Current mouse position relative to element, or null if not tracking */
	mousePos: () => { x: number; y: number } | null;
	/** Current glow opacity (0-1) based on cursor proximity */
	glowOpacity: () => number;
	/** Ref callback to attach to the element */
	setRef: (el: HTMLElement | undefined) => void;
}

const DEFAULT_RANGE = 100;

/**
 * Hook for proximity-based glow effects.
 * Tracks cursor position relative to an element and calculates opacity based on distance.
 */
export function useProximityGlow(
	options: ProximityGlowOptions = {},
): ProximityGlowResult {
	const range = options.range ?? DEFAULT_RANGE;

	const [mousePos, setMousePos] = createSignal<{ x: number; y: number } | null>(
		null,
	);
	const [glowOpacity, setGlowOpacity] = createSignal(0);
	let elementRef: HTMLElement | undefined;

	const handleGlobalMouseMove = (e: MouseEvent) => {
		if (!elementRef) return;

		const rect = elementRef.getBoundingClientRect();

		// Calculate distance from cursor to element edge
		const distX = Math.max(rect.left - e.clientX, 0, e.clientX - rect.right);
		const distY = Math.max(rect.top - e.clientY, 0, e.clientY - rect.bottom);
		const distance = Math.sqrt(distX * distX + distY * distY);

		// Check if cursor is inside the element
		const isInside =
			e.clientX >= rect.left &&
			e.clientX <= rect.right &&
			e.clientY >= rect.top &&
			e.clientY <= rect.bottom;

		if (isInside) {
			setGlowOpacity(1);
			setMousePos({
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
			});
		} else if (distance < range) {
			const opacity = 1 - distance / range;
			setGlowOpacity(opacity);

			const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
			const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
			setMousePos({ x, y });
		} else {
			// Just fade out, keep position - prevents spinning back
			setGlowOpacity(0);
		}
	};

	onMount(() => {
		document.addEventListener("mousemove", handleGlobalMouseMove);
	});

	onCleanup(() => {
		document.removeEventListener("mousemove", handleGlobalMouseMove);
	});

	const setRef = (el: HTMLElement | undefined) => {
		elementRef = el;
	};

	return {
		mousePos,
		glowOpacity,
		setRef,
	};
}
