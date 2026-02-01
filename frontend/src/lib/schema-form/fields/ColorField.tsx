import type { Component } from "solid-js";
import { text } from "~/design-system/design-system";
import Input from "~/design-system/Input";
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
						class="h-10 w-20 cursor-pointer rounded border border-neutral-300 disabled:cursor-not-allowed disabled:opacity-50"
						disabled={props.disabled}
						onInput={(e) => props.onChange(e.currentTarget.value)}
						type="color"
						value={props.value ?? "#000000"}
					/>
					<Input
						disabled={props.disabled}
						onInput={(e) => props.onChange(e.currentTarget.value)}
						placeholder="#000000"
						type="text"
						value={props.value ?? ""}
					/>
				</div>
			</label>
			{props.field.meta.description && (
				<p class={`mt-1 ${text.helper}`}>{props.field.meta.description}</p>
			)}
		</div>
	);
};
