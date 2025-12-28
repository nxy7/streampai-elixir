import { type Component, For } from "solid-js";
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

/**
 * Get the display label for an option value.
 * Uses custom options from metadata if provided, otherwise auto-generates from value.
 */
function getOptionLabel(value: string, customOptions?: Record<string, string>): string {
	if (customOptions && value in customOptions) {
		return customOptions[value];
	}
	return enumValueToLabel(value);
}

export const SelectField: Component<SelectFieldProps> = (props) => {
	return (
		<Select
			disabled={props.disabled}
			helperText={props.field.meta.description}
			label={props.field.label}
			onChange={(e) => props.onChange(e.currentTarget.value)}
			value={props.value ?? ""}>
			<For each={props.field.enumValues ?? []}>
				{(option) => (
					<option value={option}>
						{getOptionLabel(option, props.field.meta.options)}
					</option>
				)}
			</For>
		</Select>
	);
};
