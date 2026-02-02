import { A } from "@solidjs/router";
import { type JSX, splitProps } from "solid-js";
import { cn } from "~/design-system/design-system";
import { useProximityGlow } from "./useProximityGlow";

// Proximity detection range (pixels outside the button)
const PROXIMITY_RANGE = 80;
// Glow circle size
const GLOW_SIZE = 240;

export type ButtonVariant =
	| "primary"
	| "secondary"
	| "danger"
	| "success"
	| "ghost"
	| "gradient";
export type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
	primary:
		"bg-primary text-white disabled:opacity-50 disabled:cursor-not-allowed",
	secondary:
		"bg-neutral-200 text-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed",
	danger:
		"bg-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed",
	success:
		"bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed",
	ghost: "text-neutral-700",
	gradient: "bg-linear-to-r from-primary to-secondary text-white shadow-md",
};

// Glow colors that work well with each variant
const glowColors: Record<ButtonVariant, string> = {
	primary: "rgba(255, 255, 255, 0.15)",
	secondary: "rgba(0, 0, 0, 0.05)",
	danger: "rgba(255, 255, 255, 0.15)",
	success: "rgba(255, 255, 255, 0.15)",
	ghost: "rgba(0, 0, 0, 0.05)",
	gradient: "rgba(255, 255, 255, 0.2)",
};

const sizeClasses: Record<ButtonSize, string> = {
	sm: "px-3 py-1.5 text-sm",
	md: "px-4 py-2 text-sm",
	lg: "px-6 py-3 text-base",
};

type BaseButtonProps = {
	variant?: ButtonVariant;
	size?: ButtonSize;
	fullWidth?: boolean;
	children: JSX.Element;
	class?: string;
};

type ButtonAsButton = BaseButtonProps & {
	as?: "button";
} & Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseButtonProps>;

type ButtonAsAnchor = BaseButtonProps & {
	as: "a";
	href: string;
} & Omit<JSX.AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseButtonProps>;

type ButtonAsLink = BaseButtonProps & {
	as: "link";
	href: string;
} & Omit<JSX.AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseButtonProps>;

export type ButtonProps = ButtonAsButton | ButtonAsAnchor | ButtonAsLink;

export default function Button(props: ButtonProps) {
	const [local, rest] = splitProps(
		props as BaseButtonProps & { as?: string; href?: string },
		["as", "variant", "size", "fullWidth", "children", "class", "href"],
	);

	const { mousePos, glowOpacity, setRef } = useProximityGlow({
		range: PROXIMITY_RANGE,
	});

	const variant = () => local.variant ?? "primary";

	const classes = () =>
		cn(
			"group relative inline-flex items-center justify-center rounded-lg font-medium transition-colors overflow-hidden",
			variantClasses[variant()],
			sizeClasses[local.size ?? "md"],
			local.fullWidth && "w-full",
			local.class,
		);

	const content = (
		<>
			{/* Cursor glow effect with proximity detection */}
			<span
				class="pointer-events-none absolute rounded-full transition-all duration-300 ease-out"
				style={{
					opacity: glowOpacity(),
					background: `radial-gradient(circle, ${glowColors[variant()]} 0%, transparent 70%)`,
					width: `${GLOW_SIZE}px`,
					height: `${GLOW_SIZE}px`,
					left: `${(mousePos()?.x ?? 0) - GLOW_SIZE / 2}px`,
					top: `${(mousePos()?.y ?? 0) - GLOW_SIZE / 2}px`,
				}}
			/>
			<span class="relative inline-flex items-center gap-2 transition-transform duration-150 group-active:scale-[0.98]">
				{local.children}
			</span>
		</>
	);

	if (local.as === "a") {
		return (
			<a
				class={classes()}
				href={local.href}
				ref={setRef}
				rel="external"
				{...(rest as JSX.AnchorHTMLAttributes<HTMLAnchorElement>)}>
				{content}
			</a>
		);
	}

	if (local.as === "link") {
		return (
			<A
				class={classes()}
				href={local.href ?? ""}
				ref={setRef}
				{...(rest as JSX.AnchorHTMLAttributes<HTMLAnchorElement>)}>
				{content}
			</A>
		);
	}

	return (
		<button
			class={classes()}
			ref={setRef}
			{...(rest as JSX.ButtonHTMLAttributes<HTMLButtonElement>)}>
			{content}
		</button>
	);
}
