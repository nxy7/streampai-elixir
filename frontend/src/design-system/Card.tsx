import { type JSX, splitProps } from "solid-js";
import { cn } from "~/design-system/design-system";

export type CardVariant =
	| "default"
	| "interactive"
	| "gradient"
	| "outline"
	| "ghost";

const variantClasses: Record<CardVariant, string> = {
	default: "bg-surface shadow-sm",
	interactive:
		"bg-surface shadow-sm hover:shadow-md transition-shadow cursor-pointer",
	gradient: "bg-linear-to-r from-primary to-secondary shadow-sm text-white",
	outline: "bg-transparent border border-neutral-200",
	ghost: "",
};

export interface CardProps extends JSX.HTMLAttributes<HTMLDivElement> {
	variant?: CardVariant;
	padding?: "none" | "sm" | "md" | "lg";
	children: JSX.Element;
}

const paddingClasses = {
	none: "",
	sm: "p-3",
	md: "p-6",
	lg: "p-8",
};

export default function Card(props: CardProps) {
	const [local, rest] = splitProps(props, [
		"variant",
		"padding",
		"children",
		"class",
	]);

	return (
		<div
			class={cn(
				"rounded-2xl",
				variantClasses[local.variant ?? "default"],
				paddingClasses[local.padding ?? "md"],
				local.class,
			)}
			{...rest}>
			{local.children}
		</div>
	);
}

export interface CardHeaderProps extends JSX.HTMLAttributes<HTMLDivElement> {
	children: JSX.Element;
}

export function CardHeader(props: CardHeaderProps) {
	const [local, rest] = splitProps(props, ["children", "class"]);

	return (
		<div class={cn("px-6 py-4", local.class)} {...rest}>
			{local.children}
		</div>
	);
}

export interface CardTitleProps extends JSX.HTMLAttributes<HTMLHeadingElement> {
	children: JSX.Element;
}

export function CardTitle(props: CardTitleProps) {
	const [local, rest] = splitProps(props, ["children", "class"]);

	return (
		<h3
			class={cn("font-medium text-lg text-neutral-900", local.class)}
			{...rest}>
			{local.children}
		</h3>
	);
}

export interface CardContentProps extends JSX.HTMLAttributes<HTMLDivElement> {
	children: JSX.Element;
}

export function CardContent(props: CardContentProps) {
	const [local, rest] = splitProps(props, ["children", "class"]);

	return (
		<div class={cn("p-6", local.class)} {...rest}>
			{local.children}
		</div>
	);
}
