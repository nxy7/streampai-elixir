import type { Component } from "solid-js";
import { input, text } from "~/styles/design-system";
import type { IntrospectedField } from "../types";

interface TextareaFieldProps {
	field: IntrospectedField;
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
}

export const TextareaField: Component<TextareaFieldProps> = (props) => {
	return (
		<div>
			<label class="block">
				<span class={text.label}>{props.field.label}</span>
				<textarea
					class={`mt-1 ${input.textarea}`}
					rows={4}
					value={props.value ?? ""}
					onInput={(e) => props.onChange(e.currentTarget.value)}
					placeholder={props.field.meta.placeholder}
					disabled={props.disabled}
				/>
			</label>
			{props.field.meta.description && (
				<p class={`mt-1 ${text.helper}`}>{props.field.meta.description}</p>
			)}
		</div>
	);
};
