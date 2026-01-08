import { type JSX, Show, splitProps } from "solid-js";
import { cn } from "~/design-system/design-system";

export type StatSize = "sm" | "md" | "lg";

const valueClasses: Record<StatSize, string> = {
	sm: "text-lg font-semibold",
	md: "text-2xl font-semibold",
	lg: "text-3xl font-bold",
};

export interface StatProps extends JSX.HTMLAttributes<HTMLDivElement> {
	value: string | number;
	label: string;
	size?: StatSize;
	highlight?: boolean;
	icon?: JSX.Element;
	trend?: {
		value: number;
		label?: string;
	};
}

export default function Stat(props: StatProps) {
	const [local, rest] = splitProps(props, [
		"value",
		"label",
		"size",
		"highlight",
		"icon",
		"trend",
		"class",
	]);

	const size = local.size ?? "md";
	const isPositiveTrend = local.trend && local.trend.value >= 0;

	return (
		<div class={cn("text-center", local.class)} {...rest}>
			<Show when={local.icon}>
				<div class="mb-2 flex justify-center">{local.icon}</div>
			</Show>
			<p
				class={cn(
					valueClasses[size],
					local.highlight ? "text-indigo-600" : "text-gray-900",
				)}>
				{local.value}
			</p>
			<p class={cn(size === "sm" ? "text-xs" : "text-sm", "text-gray-500")}>
				{local.label}
			</p>
			<Show when={local.trend}>
				<div
					class={cn(
						"mt-1 flex items-center justify-center text-xs",
						isPositiveTrend ? "text-green-600" : "text-red-600",
					)}>
					<Show
						fallback={
							<svg
								aria-hidden="true"
								class="mr-0.5 h-3 w-3"
								fill="currentColor"
								viewBox="0 0 20 20">
								<path
									clip-rule="evenodd"
									d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
									fill-rule="evenodd"
								/>
							</svg>
						}
						when={isPositiveTrend}>
						<svg
							aria-hidden="true"
							class="mr-0.5 h-3 w-3"
							fill="currentColor"
							viewBox="0 0 20 20">
							<path
								clip-rule="evenodd"
								d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
								fill-rule="evenodd"
							/>
						</svg>
					</Show>
					<span>
						{isPositiveTrend ? "+" : ""}
						{local.trend?.value}%
					</span>
					<Show when={local.trend?.label}>
						<span class="ml-1 text-gray-400">{local.trend?.label}</span>
					</Show>
				</div>
			</Show>
		</div>
	);
}

export interface StatGroupProps extends JSX.HTMLAttributes<HTMLDivElement> {
	children: JSX.Element;
	columns?: 2 | 3 | 4;
}

export function StatGroup(props: StatGroupProps) {
	const [local, rest] = splitProps(props, ["children", "columns", "class"]);

	const columnClasses = {
		2: "grid-cols-2",
		3: "grid-cols-3",
		4: "grid-cols-4",
	};

	return (
		<div
			class={cn("grid gap-4", columnClasses[local.columns ?? 3], local.class)}
			{...rest}>
			{local.children}
		</div>
	);
}
