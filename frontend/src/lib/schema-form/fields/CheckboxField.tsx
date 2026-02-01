import type { Component } from "solid-js";
import { text } from "~/design-system/design-system";
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
					checked={props.value ?? false}
					class="h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary-light disabled:cursor-not-allowed disabled:opacity-50"
					disabled={props.disabled}
					onChange={(e) => props.onChange(e.currentTarget.checked)}
					type="checkbox"
				/>
				<span class="font-medium text-neutral-700 text-sm">
					{props.field.label}
				</span>
			</label>
			{props.field.meta.description && (
				<p class={`mt-1 ml-6 ${text.helper}`}>{props.field.meta.description}</p>
			)}
		</div>
	);
};
