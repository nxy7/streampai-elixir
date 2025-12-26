import { type JSX, Show, splitProps } from "solid-js";
import { cn } from "~/styles/design-system";

export type AlertVariant = "success" | "warning" | "error" | "info";

const variantClasses: Record<AlertVariant, string> = {
	success: "bg-green-50 border-green-200 text-green-800",
	warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
	error: "bg-red-50 border-red-200 text-red-800",
	info: "bg-blue-50 border-blue-200 text-blue-800",
};

const iconColors: Record<AlertVariant, string> = {
	success: "text-green-500",
	warning: "text-yellow-500",
	error: "text-red-500",
	info: "text-blue-500",
};

export interface AlertProps extends JSX.HTMLAttributes<HTMLDivElement> {
	variant?: AlertVariant;
	title?: string;
	children: JSX.Element;
	onClose?: () => void;
}

export default function Alert(props: AlertProps) {
	const [local, rest] = splitProps(props, [
		"variant",
		"title",
		"children",
		"class",
		"onClose",
	]);

	const variant = local.variant ?? "info";

	return (
		<div
			class={cn(
				"flex items-start space-x-3 rounded-lg border p-4",
				variantClasses[variant],
				local.class,
			)}
			role="alert"
			{...rest}
		>
			<div class={cn("mt-0.5 shrink-0", iconColors[variant])}>
				<Show when={variant === "success"}>
					<svg
						aria-hidden="true"
						class="h-5 w-5"
						fill="currentColor"
						viewBox="0 0 20 20"
					>
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
							clip-rule="evenodd"
						/>
					</svg>
				</Show>
				<Show when={variant === "warning"}>
					<svg
						aria-hidden="true"
						class="h-5 w-5"
						fill="currentColor"
						viewBox="0 0 20 20"
					>
						<path
							fill-rule="evenodd"
							d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
							clip-rule="evenodd"
						/>
					</svg>
				</Show>
				<Show when={variant === "error"}>
					<svg
						aria-hidden="true"
						class="h-5 w-5"
						fill="currentColor"
						viewBox="0 0 20 20"
					>
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
							clip-rule="evenodd"
						/>
					</svg>
				</Show>
				<Show when={variant === "info"}>
					<svg
						aria-hidden="true"
						class="h-5 w-5"
						fill="currentColor"
						viewBox="0 0 20 20"
					>
						<path
							fill-rule="evenodd"
							d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
							clip-rule="evenodd"
						/>
					</svg>
				</Show>
			</div>
			<div class="min-w-0 flex-1">
				<Show when={local.title}>
					<h3 class="font-medium text-sm">{local.title}</h3>
				</Show>
				<div class={cn("text-sm", local.title && "mt-1")}>{local.children}</div>
			</div>
			<Show when={local.onClose}>
				<button
					type="button"
					onClick={local.onClose}
					class={cn(
						"ml-auto shrink-0",
						iconColors[variant],
						"hover:opacity-70",
					)}
				>
					<svg
						aria-hidden="true"
						class="h-5 w-5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</Show>
		</div>
	);
}
