import { type JSX, splitProps } from "solid-js";
import { cn } from "~/styles/design-system";

export type BadgeVariant =
	| "success"
	| "warning"
	| "error"
	| "info"
	| "neutral"
	| "purple"
	| "pink";
export type BadgeSize = "sm" | "md";

const variantClasses: Record<BadgeVariant, string> = {
	success: "bg-green-100 text-green-800",
	warning: "bg-yellow-100 text-yellow-800",
	error: "bg-red-100 text-red-800",
	info: "bg-blue-100 text-blue-800",
	neutral: "bg-gray-100 text-gray-800",
	purple: "bg-purple-100 text-purple-800",
	pink: "bg-pink-100 text-pink-800",
};

const sizeClasses: Record<BadgeSize, string> = {
	sm: "px-2 py-0.5 text-xs",
	md: "px-2.5 py-1 text-sm",
};

export interface BadgeProps extends JSX.HTMLAttributes<HTMLSpanElement> {
	variant?: BadgeVariant;
	size?: BadgeSize;
	children: JSX.Element;
}

export default function Badge(props: BadgeProps) {
	const [local, rest] = splitProps(props, [
		"variant",
		"size",
		"children",
		"class",
	]);

	return (
		<span
			class={cn(
				"inline-flex items-center rounded-full font-medium",
				variantClasses[local.variant ?? "neutral"],
				sizeClasses[local.size ?? "sm"],
				local.class,
			)}
			{...rest}
		>
			{local.children}
		</span>
	);
}
