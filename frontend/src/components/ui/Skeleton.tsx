import { For, type JSX, splitProps } from "solid-js";
import { cn } from "~/styles/design-system";

/**
 * Base skeleton element with shimmer animation
 */
export interface SkeletonProps extends JSX.HTMLAttributes<HTMLDivElement> {
	/** Width of the skeleton (CSS value) */
	width?: string;
	/** Height of the skeleton (CSS value) */
	height?: string;
	/** Make skeleton circular */
	circle?: boolean;
	/** Make skeleton rounded (default: true) */
	rounded?: boolean;
}

export default function Skeleton(props: SkeletonProps) {
	const [local, rest] = splitProps(props, [
		"width",
		"height",
		"circle",
		"rounded",
		"class",
	]);

	const roundedClass = local.circle
		? "rounded-full"
		: local.rounded !== false
			? "rounded"
			: "";

	return (
		<div
			class={cn("animate-pulse bg-gray-200", roundedClass, local.class)}
			style={{
				width: local.width,
				height: local.height,
				...(typeof rest.style === "object" ? rest.style : {}),
			}}
			{...rest}
		/>
	);
}

/**
 * Skeleton for text lines - mimics text layout
 */
export interface SkeletonTextProps {
	/** Number of lines */
	lines?: number;
	/** Last line width percentage (0-100) */
	lastLineWidth?: number;
	/** Line height class */
	lineHeight?: "sm" | "md" | "lg";
	/** Custom class */
	class?: string;
}

const lineHeightClasses = {
	sm: "h-3",
	md: "h-4",
	lg: "h-5",
};

export function SkeletonText(props: SkeletonTextProps) {
	const lines = props.lines ?? 3;
	const lastLineWidth = props.lastLineWidth ?? 75;
	const heightClass = lineHeightClasses[props.lineHeight ?? "md"];

	return (
		<div class={cn("space-y-2", props.class)}>
			<For each={Array(lines).fill(0)}>
				{(_, i) => (
					<Skeleton
						class={heightClass}
						width={i() === lines - 1 ? `${lastLineWidth}%` : "100%"}
					/>
				)}
			</For>
		</div>
	);
}

/**
 * Skeleton for stat cards - displays value and label placeholder
 */
export interface SkeletonStatProps {
	/** Show icon placeholder */
	showIcon?: boolean;
	/** Custom class */
	class?: string;
}

export function SkeletonStat(props: SkeletonStatProps) {
	return (
		<div class={cn("flex items-center gap-3", props.class)}>
			{props.showIcon !== false && (
				<Skeleton class="h-10 w-10 shrink-0 rounded-lg" />
			)}
			<div class="flex-1 space-y-2">
				<Skeleton class="h-7 w-16" />
				<Skeleton class="h-4 w-20" />
			</div>
		</div>
	);
}

/**
 * Skeleton for list items (chat messages, events, etc.)
 */
export interface SkeletonListItemProps {
	/** Show avatar */
	showAvatar?: boolean;
	/** Avatar size */
	avatarSize?: "sm" | "md";
	/** Number of text lines */
	lines?: number;
	/** Custom class */
	class?: string;
}

export function SkeletonListItem(props: SkeletonListItemProps) {
	const lines = props.lines ?? 2;
	const avatarClass = props.avatarSize === "sm" ? "h-6 w-6" : "h-8 w-8";

	return (
		<div class={cn("flex items-start gap-3", props.class)}>
			{props.showAvatar !== false && (
				<Skeleton circle class={cn(avatarClass, "shrink-0")} />
			)}
			<div class="min-w-0 flex-1 space-y-2">
				<Skeleton class="h-4 w-2/3" />
				{lines > 1 && <Skeleton class="h-3 w-4/5" />}
			</div>
		</div>
	);
}

/**
 * Skeleton for cards with header and content
 */
export interface SkeletonCardProps {
	/** Show header */
	showHeader?: boolean;
	/** Number of content lines */
	contentLines?: number;
	/** Custom class */
	class?: string;
}

export function SkeletonCard(props: SkeletonCardProps) {
	const contentLines = props.contentLines ?? 3;

	return (
		<div
			class={cn(
				"rounded-2xl border border-gray-200 bg-white shadow-sm",
				props.class,
			)}>
			{props.showHeader !== false && (
				<div class="border-gray-200 border-b px-6 py-4">
					<Skeleton class="h-5 w-32" />
				</div>
			)}
			<div class="p-6">
				<SkeletonText lines={contentLines} />
			</div>
		</div>
	);
}

/**
 * Skeleton for stream/video cards
 */
export interface SkeletonStreamCardProps {
	/** Custom class */
	class?: string;
}

export function SkeletonStreamCard(props: SkeletonStreamCardProps) {
	return (
		<div class={cn("flex items-center gap-4 px-6 py-4", props.class)}>
			<Skeleton class="h-12 w-12 shrink-0 rounded-lg" />
			<div class="min-w-0 flex-1 space-y-2">
				<Skeleton class="h-5 w-3/5" />
				<Skeleton class="h-4 w-1/4" />
			</div>
			<Skeleton class="h-6 w-16 rounded-full" />
		</div>
	);
}

/**
 * Skeleton for the dashboard health/engagement/goals cards
 */
export interface SkeletonMetricCardProps {
	/** Number of metric rows */
	rows?: number;
	/** Custom class */
	class?: string;
}

export function SkeletonMetricCard(props: SkeletonMetricCardProps) {
	const rows = props.rows ?? 3;

	return (
		<div
			class={cn(
				"rounded-2xl border border-gray-200 bg-white p-4 shadow-sm",
				props.class,
			)}>
			{/* Header */}
			<div class="mb-4 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<Skeleton class="h-5 w-5" />
					<Skeleton class="h-5 w-28" />
				</div>
				<Skeleton class="h-6 w-16 rounded-full" />
			</div>
			{/* Content */}
			<div class="space-y-3">
				<For each={Array(rows).fill(0)}>
					{() => (
						<div class="space-y-2">
							<div class="flex items-center justify-between">
								<Skeleton class="h-4 w-24" />
								<Skeleton class="h-4 w-16" />
							</div>
							<Skeleton class="h-2 w-full rounded-full" />
						</div>
					)}
				</For>
			</div>
		</div>
	);
}

/**
 * Skeleton for table rows
 */
export interface SkeletonTableRowProps {
	/** Number of columns */
	columns?: number;
	/** Custom class */
	class?: string;
}

export function SkeletonTableRow(props: SkeletonTableRowProps) {
	const columns = props.columns ?? 5;

	return (
		<tr class={cn("hover:bg-gray-50", props.class)}>
			<For each={Array(columns).fill(0)}>
				{(_, i) => (
					<td class="whitespace-nowrap px-6 py-4">
						<Skeleton
							class="h-4"
							width={i() === 0 ? "80%" : i() === columns - 1 ? "60px" : "70%"}
						/>
					</td>
				)}
			</For>
		</tr>
	);
}

/**
 * Skeleton for chart areas
 */
export interface SkeletonChartProps {
	/** Custom class */
	class?: string;
}

export function SkeletonChart(props: SkeletonChartProps) {
	return (
		<div class={cn("space-y-4", props.class)}>
			{/* Chart header */}
			<div class="flex items-center justify-between">
				<Skeleton class="h-5 w-32" />
				<div class="flex items-center gap-4">
					<Skeleton class="h-4 w-20" />
					<Skeleton class="h-4 w-20" />
				</div>
			</div>
			{/* Chart area */}
			<div class="relative h-64">
				<div class="absolute inset-0 flex items-end justify-between gap-2 px-12 pb-6">
					<For each={Array(12).fill(0)}>
						{() => (
							<Skeleton class="flex-1" height={`${Math.random() * 60 + 20}%`} />
						)}
					</For>
				</div>
			</div>
		</div>
	);
}

/**
 * Skeleton for filter/action bar
 */
export interface SkeletonFilterBarProps {
	/** Number of filter buttons */
	filters?: number;
	/** Custom class */
	class?: string;
}

export function SkeletonFilterBar(props: SkeletonFilterBarProps) {
	const filters = props.filters ?? 4;

	return (
		<div class={cn("flex flex-wrap gap-2", props.class)}>
			<For each={Array(filters).fill(0)}>
				{() => <Skeleton class="h-8 w-20 rounded-full" />}
			</For>
		</div>
	);
}
