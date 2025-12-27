import type { Component } from "solid-js";
import { text } from "~/styles/design-system";
import type { IntrospectedField } from "../types";

interface CheckboxFieldProps {
	field: IntrospectedField;
	value: boolean;
	onChange: (value: boolean) => void;
	disabled?: boolean;
}

export const CheckboxField: Component<CheckboxFieldProps> = (props) => {
	return (
		<div>
			<label class="flex cursor-pointer items-center gap-2">
				<input
					type="checkbox"
					checked={props.value ?? false}
					onChange={(e) => props.onChange(e.currentTarget.checked)}
					disabled={props.disabled}
					class="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
				/>
				<span class="font-medium text-gray-700 text-sm">
					{props.field.label}
				</span>
			</label>
			{props.field.meta.description && (
				<p class={`mt-1 ml-6 ${text.helper}`}>{props.field.meta.description}</p>
			)}
		</div>
	);
};
