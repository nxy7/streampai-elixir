import type { Component } from "solid-js";
import Input from "~/components/ui/Input";
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
			type="text"
			label={props.field.label}
			value={props.value ?? ""}
			onInput={(e) => props.onChange(e.currentTarget.value)}
			placeholder={props.field.meta.placeholder}
			disabled={props.disabled}
			helperText={props.field.meta.description}
		/>
	);
};
