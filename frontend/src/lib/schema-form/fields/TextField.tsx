import type { Component } from "solid-js";
import Input from "~/design-system/Input";
import type { IntrospectedField } from "../types";

interface TextFieldProps {
	field: IntrospectedField;
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
}

export const TextField: Component<TextFieldProps> = (props) => {
	return (
		<Input
			disabled={props.disabled}
			helperText={props.field.meta.description}
			label={props.field.label}
			onInput={(e) => props.onChange(e.currentTarget.value)}
			placeholder={props.field.meta.placeholder}
			type="text"
			value={props.value ?? ""}
		/>
	);
};
