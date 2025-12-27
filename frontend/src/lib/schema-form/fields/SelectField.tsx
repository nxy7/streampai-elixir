import { For, type Component } from "solid-js";
import { input, text } from "~/styles/design-system";
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
		<div>
			<label class="block">
				<span class={text.label}>{props.field.label}</span>
				<select
					class={`mt-1 ${input.select}`}
					value={props.value ?? ""}
					onChange={(e) => props.onChange(e.currentTarget.value)}
					disabled={props.disabled}
				>
					<For each={props.field.enumValues ?? []}>
						{(option) => (
							<option value={option}>{enumValueToLabel(option)}</option>
						)}
					</For>
				</select>
			</label>
			{props.field.meta.description && (
				<p class={`mt-1 ${text.helper}`}>{props.field.meta.description}</p>
			)}
		</div>
	);
};
