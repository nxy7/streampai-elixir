import type { Component } from "solid-js";
import { Textarea } from "~/components/ui/Input";
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
			label={props.field.label}
			rows={4}
			value={props.value ?? ""}
			onInput={(e) => props.onChange(e.currentTarget.value)}
			placeholder={props.field.meta.placeholder}
			disabled={props.disabled}
			helperText={props.field.meta.description}
		/>
	);
};
