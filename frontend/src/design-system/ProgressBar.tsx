import { type JSX, Show, splitProps } from "solid-js";
import { cn } from "~/design-system/design-system";

export type ProgressBarVariant = "primary" | "success" | "warning" | "danger";
export type ProgressBarSize = "sm" | "md" | "lg";

const variantClasses: Record<ProgressBarVariant, string> = {
	primary: "bg-indigo-600",
	success: "bg-green-600",
	warning: "bg-yellow-500",
	danger: "bg-red-600",
};

const sizeClasses: Record<ProgressBarSize, string> = {
	sm: "h-1",
	md: "h-2",
	lg: "h-3",
};

export interface ProgressBarProps extends JSX.HTMLAttributes<HTMLDivElement> {
	value: number;
	max?: number;
	variant?: ProgressBarVariant;
	size?: ProgressBarSize;
	label?: string;
	showValue?: boolean;
}

export default function ProgressBar(props: ProgressBarProps) {
	const [local, rest] = splitProps(props, [
		"value",
		"max",
		"variant",
		"size",
		"label",
		"showValue",
		"class",
	]);

	const max = local.max ?? 100;
	const percentage = Math.min(100, Math.max(0, (local.value / max) * 100));

	return (
		<div class={cn("w-full", local.class)} {...rest}>
			<Show when={local.label || local.showValue}>
				<div class="mb-1 flex justify-between text-sm">
					<Show when={local.label}>
						<span class="text-neutral-600">{local.label}</span>
					</Show>
					<Show when={local.showValue}>
						<span class="font-medium text-neutral-900">
							{local.value}
							{max !== 100 && `/${max}`}
						</span>
					</Show>
				</div>
			</Show>
			<div
				class={cn(
					"w-full overflow-hidden rounded-full bg-neutral-200",
					sizeClasses[local.size ?? "md"],
				)}>
				<div
					aria-valuemax={max}
					aria-valuemin={0}
					aria-valuenow={local.value}
					class={cn(
						"h-full rounded-full transition-all duration-500",
						variantClasses[local.variant ?? "primary"],
					)}
					role="progressbar"
					style={{ width: `${percentage}%` }}
				/>
			</div>
		</div>
	);
}
