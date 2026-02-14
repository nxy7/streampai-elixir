import { type JSX, Show, splitProps } from "solid-js";
import { cn } from "~/design-system/design-system";

const baseClasses =
	"w-full rounded-lg px-3 py-2 text-sm bg-surface-input focus:ring-1 focus:outline-none transition-colors";

export interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
	helperText?: string;
	wrapperClass?: string;
}

export default function Input(props: InputProps) {
	const [local, rest] = splitProps(props, [
		"label",
		"error",
		"helperText",
		"class",
		"wrapperClass",
		"id",
	]);

	const inputId = local.id ?? `input-${Math.random().toString(36).slice(2)}`;

	return (
		<div class={local.wrapperClass ?? "w-full"}>
			<Show when={local.label}>
				<label
					class="mb-1 block font-medium text-neutral-700 text-sm"
					for={inputId}>
					{local.label}
				</label>
			</Show>
			<input
				class={cn(
					baseClasses,
					local.error ? "ring-1 ring-red-300" : "focus:ring-neutral-400",
					"disabled:cursor-not-allowed disabled:opacity-60",
					local.class,
				)}
				id={inputId}
				{...rest}
			/>
			<Show when={local.error}>
				<p class="mt-1 text-red-600 text-sm">{local.error}</p>
			</Show>
			<Show when={local.helperText && !local.error}>
				<p class="mt-1 text-neutral-500 text-xs">{local.helperText}</p>
			</Show>
		</div>
	);
}

export interface TextareaProps
	extends JSX.TextareaHTMLAttributes<HTMLTextAreaElement> {
	label?: string;
	error?: string;
	helperText?: string;
}

export function Textarea(props: TextareaProps) {
	const [local, rest] = splitProps(props, [
		"label",
		"error",
		"helperText",
		"class",
		"id",
	]);

	const inputId = local.id ?? `textarea-${Math.random().toString(36).slice(2)}`;

	return (
		<div class="w-full">
			<Show when={local.label}>
				<label
					class="mb-1 block font-medium text-neutral-700 text-sm"
					for={inputId}>
					{local.label}
				</label>
			</Show>
			<textarea
				class={cn(
					baseClasses,
					"resize-none",
					local.error ? "ring-1 ring-red-300" : "focus:ring-neutral-400",
					"disabled:cursor-not-allowed disabled:opacity-60",
					local.class,
				)}
				id={inputId}
				{...rest}
			/>
			<Show when={local.error}>
				<p class="mt-1 text-red-600 text-sm">{local.error}</p>
			</Show>
			<Show when={local.helperText && !local.error}>
				<p class="mt-1 text-neutral-500 text-xs">{local.helperText}</p>
			</Show>
		</div>
	);
}
