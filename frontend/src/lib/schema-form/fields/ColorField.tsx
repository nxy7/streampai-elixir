import type { Component } from "solid-js";
import { input, text } from "~/styles/design-system";
import type { IntrospectedField } from "../types";

interface ColorFieldProps {
	field: IntrospectedField;
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
}

export const ColorField: Component<ColorFieldProps> = (props) => {
	return (
		<div>
			<label class="block">
				<span class={text.label}>{props.field.label}</span>
				<div class="mt-1 flex gap-2">
					<input
						type="color"
						class="h-10 w-20 cursor-pointer rounded border border-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
						value={props.value ?? "#000000"}
						onInput={(e) => props.onChange(e.currentTarget.value)}
						disabled={props.disabled}
					/>
					<input
						type="text"
						class={input.text}
						value={props.value ?? ""}
						onInput={(e) => props.onChange(e.currentTarget.value)}
						placeholder="#000000"
						disabled={props.disabled}
					/>
				</div>
			</label>
			{props.field.meta.description && (
				<p class={`mt-1 ${text.helper}`}>{props.field.meta.description}</p>
			)}
		</div>
	);
};
