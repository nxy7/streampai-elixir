import { A } from "@solidjs/router";
import { type JSX, splitProps } from "solid-js";
import { cn } from "~/styles/design-system";

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
		"bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed",
	secondary:
		"bg-gray-200 text-gray-900 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed",
	danger:
		"bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed",
	success:
		"bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed",
	ghost: "text-gray-700 hover:bg-gray-100",
	gradient:
		"bg-linear-to-r from-purple-600 to-pink-500 text-white hover:from-purple-700 hover:to-pink-600 shadow-md",
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

	const classes = cn(
		"inline-flex items-center justify-center rounded-lg font-medium transition-colors",
		variantClasses[local.variant ?? "primary"],
		sizeClasses[local.size ?? "md"],
		local.fullWidth && "w-full",
		local.class,
	);

	if (local.as === "a") {
		return (
			<a
				href={local.href}
				class={classes}
				rel="external"
				{...(rest as JSX.AnchorHTMLAttributes<HTMLAnchorElement>)}>
				{local.children}
			</a>
		);
	}

	if (local.as === "link") {
		return (
			<A
				href={local.href!}
				class={classes}
				{...(rest as JSX.AnchorHTMLAttributes<HTMLAnchorElement>)}>
				{local.children}
			</A>
		);
	}

	return (
		<button class={classes} {...(rest as JSX.ButtonHTMLAttributes<HTMLButtonElement>)}>
			{local.children}
		</button>
	);
}
