import { type JSX, Show, splitProps } from "solid-js";
import { cn } from "~/styles/design-system";

const baseClasses =
	"w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:border-transparent transition-colors bg-[var(--theme-input-bg)] border-[var(--theme-input-border)] text-[var(--theme-text-primary)] placeholder:text-[var(--theme-input-placeholder)]";

export interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
	helperText?: string;
}

export default function Input(props: InputProps) {
	const [local, rest] = splitProps(props, [
		"label",
		"error",
		"helperText",
		"class",
		"id",
	]);

	const inputId = local.id ?? `input-${Math.random().toString(36).slice(2)}`;

	return (
		<div class="w-full">
			<Show when={local.label}>
				<label
					class="mb-1 block font-medium text-theme-secondary text-sm"
					for={inputId}>
					{local.label}
				</label>
			</Show>
			<input
				class={cn(
					baseClasses,
					local.error
						? "border-red-300 focus:ring-red-500"
						: "focus:ring-purple-500",
					"disabled:cursor-not-allowed disabled:bg-[var(--theme-input-disabled-bg)]",
					local.class,
				)}
				id={inputId}
				{...rest}
			/>
			<Show when={local.error}>
				<p class="mt-1 text-red-600 text-sm">{local.error}</p>
			</Show>
			<Show when={local.helperText && !local.error}>
				<p class="mt-1 text-theme-tertiary text-xs">{local.helperText}</p>
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
					class="mb-1 block font-medium text-theme-secondary text-sm"
					for={inputId}>
					{local.label}
				</label>
			</Show>
			<textarea
				class={cn(
					baseClasses,
					"resize-none",
					local.error
						? "border-red-300 focus:ring-red-500"
						: "focus:ring-purple-500",
					"disabled:cursor-not-allowed disabled:bg-[var(--theme-input-disabled-bg)]",
					local.class,
				)}
				id={inputId}
				{...rest}
			/>
			<Show when={local.error}>
				<p class="mt-1 text-red-600 text-sm">{local.error}</p>
			</Show>
			<Show when={local.helperText && !local.error}>
				<p class="mt-1 text-theme-tertiary text-xs">{local.helperText}</p>
			</Show>
		</div>
	);
}

export interface SelectProps
	extends JSX.SelectHTMLAttributes<HTMLSelectElement> {
	label?: string;
	error?: string;
	helperText?: string;
	children: JSX.Element;
}

export function Select(props: SelectProps) {
	const [local, rest] = splitProps(props, [
		"label",
		"error",
		"helperText",
		"class",
		"id",
		"children",
	]);

	const inputId = local.id ?? `select-${Math.random().toString(36).slice(2)}`;

	return (
		<div class="w-full">
			<Show when={local.label}>
				<label
					class="mb-1 block font-medium text-theme-secondary text-sm"
					for={inputId}>
					{local.label}
				</label>
			</Show>
			<select
				class={cn(
					baseClasses,
					local.error
						? "border-red-300 focus:ring-red-500"
						: "focus:ring-purple-500",
					"disabled:cursor-not-allowed disabled:bg-[var(--theme-input-disabled-bg)]",
					local.class,
				)}
				id={inputId}
				{...rest}>
				{local.children}
			</select>
			<Show when={local.error}>
				<p class="mt-1 text-red-600 text-sm">{local.error}</p>
			</Show>
			<Show when={local.helperText && !local.error}>
				<p class="mt-1 text-theme-tertiary text-xs">{local.helperText}</p>
			</Show>
		</div>
	);
}
