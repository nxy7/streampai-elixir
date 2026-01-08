import type { Component } from "solid-js";
import { Textarea } from "~/design-system/Input";
import type { IntrospectedField } from "../types";

interface TextareaFieldProps {
	field: IntrospectedField;
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
}

export const TextareaField: Component<TextareaFieldProps> = (props) => {
	return (
		<Textarea
			disabled={props.disabled}
			helperText={props.field.meta.description}
			label={props.field.label}
			onInput={(e) => props.onChange(e.currentTarget.value)}
			placeholder={props.field.meta.placeholder}
			rows={4}
			value={props.value ?? ""}
		/>
	);
};
