import { type Accessor, createSignal, onCleanup, onMount } from "solid-js";

export interface UseParallaxOptions {
	/** Parallax speed multiplier. 0 = no movement, 0.5 = half scroll speed. Default: 0.3 */
	speed?: number;
	/** Axis of movement. Default: "y" */
	axis?: "x" | "y" | "both";
	/** Disable parallax when prefers-reduced-motion is active. Default: true */
	respectReducedMotion?: boolean;
}

export interface UseParallaxResult {
	/** Current Y offset in pixels (reactive). */
	y: Accessor<number>;
	/** Current X offset in pixels (reactive). */
	x: Accessor<number>;
	/** Ref callback — attach to the element whose viewport position is tracked. */
	setRef: (el: HTMLElement | undefined) => void;
	/** Reactive style object that sets background-position. */
	backgroundStyle: Accessor<Record<string, string>>;
	/** Reactive style object that sets transform with GPU acceleration. */
	transformStyle: Accessor<Record<string, string>>;
}

/**
 * Tracks scroll position relative to an element and returns reactive offsets
 * for creating parallax depth effects.
 *
 * @example
 * // Background parallax (dotted pattern, texture, etc.)
 * const { backgroundStyle, setRef } = useParallax({ speed: 0.15 });
 * <section ref={setRef} style={{ ...backgroundStyle(), "background-image": "..." }} />
 *
 * @example
 * // Transform parallax (floating elements, blobs)
 * const { transformStyle, setRef } = useParallax({ speed: 0.08 });
 * <div ref={setRef} style={transformStyle()} />
 */
export function useParallax(options?: UseParallaxOptions): UseParallaxResult {
	const speed = options?.speed ?? 0.3;
	const axis = options?.axis ?? "y";
	const respectReducedMotion = options?.respectReducedMotion ?? true;

	const [offsetX, setOffsetX] = createSignal(0);
	const [offsetY, setOffsetY] = createSignal(0);
	let elementRef: HTMLElement | undefined;
	let rafId: number | null = null;
	let ticking = false;

	const setRef = (el: HTMLElement | undefined) => {
		elementRef = el;
	};

	onMount(() => {
		if (respectReducedMotion) {
			const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
			if (mql.matches) return;
		}

		const update = () => {
			ticking = false;
			if (!elementRef) return;

			const rect = elementRef.getBoundingClientRect();
			const viewportHeight = window.innerHeight;

			// Offset is 0 when element center aligns with viewport center.
			// Positive when element is below center, negative when above.
			const elementCenterY = rect.top + rect.height / 2;
			const distY = elementCenterY - viewportHeight / 2;

			if (axis === "y" || axis === "both") {
				setOffsetY(Math.round(distY * speed * 100) / 100);
			}

			if (axis === "x" || axis === "both") {
				const viewportWidth = window.innerWidth;
				const elementCenterX = rect.left + rect.width / 2;
				const distX = elementCenterX - viewportWidth / 2;
				setOffsetX(Math.round(distX * speed * 100) / 100);
			}
		};

		const onScroll = () => {
			if (!ticking) {
				rafId = requestAnimationFrame(update);
				ticking = true;
			}
		};

		// Initial calculation so the position is correct before first scroll.
		update();

		window.addEventListener("scroll", onScroll, { passive: true });

		onCleanup(() => {
			window.removeEventListener("scroll", onScroll);
			if (rafId !== null) {
				cancelAnimationFrame(rafId);
			}
		});
	});

	const backgroundStyle: Accessor<Record<string, string>> = () => {
		const x = axis === "y" ? 0 : offsetX();
		const y = axis === "x" ? 0 : offsetY();
		return { "background-position": `${x}px ${y}px` };
	};

	const transformStyle: Accessor<Record<string, string>> = () => {
		const x = axis === "y" ? 0 : offsetX();
		const y = axis === "x" ? 0 : offsetY();
		return {
			transform: `translate3d(${x}px, ${y}px, 0)`,
			"will-change": "transform",
		};
	};

	return {
		x: offsetX,
		y: offsetY,
		setRef,
		backgroundStyle,
		transformStyle,
	};
}
