import {
	type Accessor,
	createEffect,
	createSignal,
	on,
	onCleanup,
} from "solid-js";

interface TypewriterBaseOptions {
	/** Variant of the text transition effect. Default: "typewriter" */
	variant?: "typewriter" | "matrix";
}

interface TypewriterVariantOptions extends TypewriterBaseOptions {
	variant?: "typewriter";
	/** Characters per second for typing. Default: 60 */
	speed?: number;
	/** Characters per second for deleting. Default: 40 */
	deleteSpeed?: number;
	/** Delay in ms before starting to type new text after deleting. Default: 80 */
	pauseMs?: number;
}

interface MatrixVariantOptions extends TypewriterBaseOptions {
	variant: "matrix";
	/** Ms between each scramble tick. Default: 30. Mutually exclusive with `durationMs`. */
	tickMs?: number;
	/** Fixed total animation duration in ms. Overrides `tickMs` — tick interval is computed from text length. */
	durationMs?: number;
	/** Number of random character cycles before a character resolves. Default: 4 */
	scrambleRounds?: number;
	/** Delay in ticks between each character starting to resolve (left-to-right wave). Default: 2 */
	stagger?: number;
	/** Character set to scramble through. Default: digits + symbols */
	chars?: string;
}

export type UseTypewriterOptions =
	| TypewriterVariantOptions
	| MatrixVariantOptions;

/**
 * Reactive text transition effect. Pass an accessor that returns the target text.
 *
 * Variants:
 * - "typewriter" (default): Deletes old text character by character, then types new text.
 * - "matrix": Characters scramble through random values before resolving left-to-right.
 *
 * @example
 * // Typewriter
 * const displayed = useTypewriter(text, { speed: 60 });
 *
 * // Matrix / decryption effect
 * const displayed = useTypewriter(text, { variant: "matrix", scrambleRounds: 4 });
 */
export function useTypewriter(
	text: Accessor<string>,
	options?: UseTypewriterOptions,
): Accessor<string> {
	const variant = options?.variant ?? "typewriter";

	if (variant === "matrix") {
		return useMatrixTransition(text, options as MatrixVariantOptions);
	}
	return useTypewriterTransition(text, options as TypewriterVariantOptions);
}

// ── Typewriter variant ──────────────────────────────────────────────

function useTypewriterTransition(
	text: Accessor<string>,
	options?: TypewriterVariantOptions,
): Accessor<string> {
	const speed = options?.speed ?? 60;
	const deleteSpeed = options?.deleteSpeed ?? 40;
	const pauseMs = options?.pauseMs ?? 80;

	const [displayed, setDisplayed] = createSignal(text());
	let timer: ReturnType<typeof setTimeout> | null = null;

	const clear = () => {
		if (timer !== null) {
			clearTimeout(timer);
			timer = null;
		}
	};

	createEffect(
		on(text, (target) => {
			clear();

			const current = displayed();
			if (current === target) return;

			// Find common prefix length so we only delete/type the diff
			let common = 0;
			while (
				common < current.length &&
				common < target.length &&
				current[common] === target[common]
			) {
				common++;
			}

			let phase: "delete" | "pause" | "type" =
				current.length > common ? "delete" : "type";
			let pos = current.length;

			const step = () => {
				if (phase === "delete") {
					pos--;
					setDisplayed(current.slice(0, pos));
					if (pos <= common) {
						phase = "pause";
						timer = setTimeout(step, pauseMs);
						return;
					}
					timer = setTimeout(step, 1000 / deleteSpeed);
				} else if (phase === "pause") {
					phase = "type";
					pos = common;
					timer = setTimeout(step, 0);
				} else {
					pos++;
					setDisplayed(target.slice(0, pos));
					if (pos >= target.length) return;
					timer = setTimeout(step, 1000 / speed);
				}
			};

			step();
		}),
	);

	onCleanup(clear);
	return displayed;
}

// ── Matrix / scramble variant ───────────────────────────────────────

const DEFAULT_MATRIX_CHARS = "0123456789$%#@&*!?+=";

function useMatrixTransition(
	text: Accessor<string>,
	options?: MatrixVariantOptions,
): Accessor<string> {
	const scrambleRounds = options?.scrambleRounds ?? 4;
	const stagger = options?.stagger ?? 2;
	const chars = options?.chars ?? DEFAULT_MATRIX_CHARS;
	const durationMs = options?.durationMs;
	const baseTickMs = options?.tickMs ?? 30;

	const [displayed, setDisplayed] = createSignal(text());
	let timer: ReturnType<typeof setInterval> | null = null;

	const clear = () => {
		if (timer !== null) {
			clearInterval(timer);
			timer = null;
		}
	};

	const randomChar = () => chars[Math.floor(Math.random() * chars.length)];

	createEffect(
		on(text, (target) => {
			clear();

			const current = displayed();
			if (current === target) return;

			const maxLen = Math.max(current.length, target.length);

			const lastCharTicks = scrambleRounds + (maxLen - 1) * stagger;
			const tickMs =
				durationMs != null
					? Math.max(10, Math.floor(durationMs / lastCharTicks))
					: baseTickMs;

			// For each character position, track how many ticks until it resolves.
			// Characters that are already correct resolve immediately.
			const ticksToResolve: number[] = [];
			for (let i = 0; i < maxLen; i++) {
				const currentChar = i < current.length ? current[i] : "";
				const targetChar = i < target.length ? target[i] : "";
				if (currentChar === targetChar) {
					ticksToResolve.push(0); // Already correct
				} else {
					ticksToResolve.push(scrambleRounds + i * stagger);
				}
			}

			let tick = 0;

			const update = () => {
				tick++;
				let allDone = true;
				const result: string[] = [];

				for (let i = 0; i < target.length; i++) {
					if (tick >= ticksToResolve[i]) {
						// Resolved — show target character
						result.push(target[i]);
					} else {
						allDone = false;
						// Still scrambling — show random char (but keep spaces as spaces)
						if (
							target[i] === " " ||
							(i < current.length && current[i] === " " && target[i] === " ")
						) {
							result.push(" ");
						} else {
							result.push(randomChar());
						}
					}
				}

				setDisplayed(result.join(""));

				if (allDone) {
					clear();
				}
			};

			// Kick off immediately for first scramble frame
			update();
			timer = setInterval(update, tickMs);
		}),
	);

	onCleanup(clear);
	return displayed;
}
