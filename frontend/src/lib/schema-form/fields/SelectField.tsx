import { For, type Component } from "solid-js";
import { Select } from "~/components/ui/Input";
import type { IntrospectedField } from "../types";

interface SelectFieldProps {
	field: IntrospectedField;
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
}

/**
 * Convert an enum value to a display label.
 * Examples: "slide" -> "Slide", "fade_in" -> "Fade In"
 */
function enumValueToLabel(value: string): string {
	return value
		.replace(/_/g, " ")
		.replace(/([a-z])([A-Z])/g, "$1 $2")
		.split(" ")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(" ");
}

export const SelectField: Component<SelectFieldProps> = (props) => {
	return (
		<Select
			label={props.field.label}
			value={props.value ?? ""}
			onChange={(e) => props.onChange(e.currentTarget.value)}
			disabled={props.disabled}
			helperText={props.field.meta.description}>
			<For each={props.field.enumValues ?? []}>
				{(option) => <option value={option}>{enumValueToLabel(option)}</option>}
			</For>
		</Select>
	);
};
