import {
	type Accessor,
	createEffect,
	createSignal,
	on,
	onCleanup,
} from "solid-js";

type EasingFn = (t: number) => number;

const easings: Record<string, EasingFn> = {
	linear: (t) => t,
	easeOut: (t) => 1 - (1 - t) ** 3,
	easeInOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
};

interface UseTweenOptions {
	/** Duration in ms. Default: 400 */
	duration?: number;
	/** Easing function name. Default: "easeOut" */
	easing?: "linear" | "easeOut" | "easeInOut";
	/** Number of decimal places. Default: 2 */
	decimals?: number;
}

/**
 * Smoothly interpolates between numeric values.
 * Returns an accessor with the current tweened number.
 *
 * @example
 * const price = useTween(() => yearly() ? 239.99 : 24.99, { duration: 500 });
 * // <span>${price().toFixed(2)}</span>
 */
export function useTween(
	value: Accessor<number>,
	options?: UseTweenOptions,
): Accessor<number> {
	const duration = options?.duration ?? 400;
	const easing = easings[options?.easing ?? "easeOut"];
	const decimals = options?.decimals ?? 2;
	const factor = 10 ** decimals;

	const [current, setCurrent] = createSignal(value());
	let raf: number | null = null;

	const cancel = () => {
		if (raf !== null) {
			cancelAnimationFrame(raf);
			raf = null;
		}
	};

	createEffect(
		on(value, (target) => {
			cancel();

			const from = current();
			if (from === target) return;

			const start = performance.now();

			const tick = (now: number) => {
				const elapsed = now - start;
				const progress = Math.min(elapsed / duration, 1);
				const easedProgress = easing(progress);
				const raw = from + (target - from) * easedProgress;
				// Round to avoid floating point noise
				setCurrent(Math.round(raw * factor) / factor);

				if (progress < 1) {
					raf = requestAnimationFrame(tick);
				}
			};

			raf = requestAnimationFrame(tick);
		}),
	);

	onCleanup(cancel);
	return current;
}
