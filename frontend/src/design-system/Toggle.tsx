import type { JSX } from "solid-js";

export type ToggleSize = "sm" | "md" | "lg";

export interface ToggleProps {
	/** Whether the toggle is checked/on */
	checked: boolean;
	/** Callback when toggle state changes */
	onChange: () => void;
	/** Whether the toggle is disabled */
	disabled?: boolean;
	/** Size variant */
	size?: ToggleSize;
	/** Additional class names for the container */
	class?: string;
	/** Accessible label for the toggle */
	"aria-label"?: string;
}

const sizeStyles: Record<
	ToggleSize,
	{ container: string; knob: string; knobOn: string; knobOff: string }
> = {
	sm: {
		// container: h-5 (20px), w-9 (36px); knob: 16px
		// off: left 2px; on: left 36-16-2=18px
		container: "h-5 w-9",
		knob: "h-4 w-4",
		knobOff: "left-0.5",
		knobOn: "left-[18px]",
	},
	md: {
		// container: h-6 (24px), w-11 (44px); knob: 20px
		// off: left 2px; on: left 44-20-2=22px
		container: "h-6 w-11",
		knob: "h-5 w-5",
		knobOff: "left-0.5",
		knobOn: "left-[22px]",
	},
	lg: {
		// container: h-7 (28px), w-12 (48px); knob: 24px
		// off: left 2px; on: left 48-24-2=22px
		container: "h-7 w-12",
		knob: "h-6 w-6",
		knobOff: "left-0.5",
		knobOn: "left-[22px]",
	},
};

/**
 * Toggle switch component for boolean on/off states.
 *
 * @example
 * ```tsx
 * <Toggle checked={enabled()} onChange={() => setEnabled(!enabled())} />
 * ```
 */
export default function Toggle(props: ToggleProps): JSX.Element {
	const size = () => props.size ?? "md";
	const styles = () => sizeStyles[size()];

	return (
		<button
			aria-checked={props.checked}
			aria-label={props["aria-label"]}
			class={`group relative shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${styles().container} ${props.class ?? ""}`}
			classList={{
				"bg-primary": props.checked,
				"bg-neutral-300 dark:bg-neutral-600": !props.checked,
				"cursor-not-allowed opacity-50": props.disabled,
			}}
			disabled={props.disabled}
			onClick={props.onChange}
			role="switch"
			type="button">
			<span
				class={`absolute top-1/2 -translate-y-1/2 rounded-full bg-white shadow-sm transition-all duration-200 ease-out group-active:scale-x-125 group-active:scale-y-90 ${styles().knob}`}
				classList={{
					[styles().knobOn]: props.checked,
					[styles().knobOff]: !props.checked,
				}}
			/>
		</button>
	);
}
