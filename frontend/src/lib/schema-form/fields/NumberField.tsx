import type { Component } from "solid-js";
import { input, text } from "~/styles/design-system";
import type { IntrospectedField } from "../types";

interface NumberFieldProps {
	field: IntrospectedField;
	value: number;
	onChange: (value: number) => void;
	disabled?: boolean;
}

export const NumberField: Component<NumberFieldProps> = (props) => {
	return (
		<div>
			<label class="block">
				<span class={text.label}>
					{props.field.label}
					{props.field.meta.unit && (
						<span class="ml-1 text-gray-400">({props.field.meta.unit})</span>
					)}
				</span>
				<input
					type="number"
					class={`mt-1 ${input.text}`}
					value={props.value ?? 0}
					onInput={(e) => {
						const val = parseFloat(e.currentTarget.value);
						if (!isNaN(val)) props.onChange(val);
					}}
					min={props.field.min}
					max={props.field.max}
					step={props.field.meta.step ?? 1}
					disabled={props.disabled}
				/>
			</label>
			{props.field.meta.description && (
				<p class={`mt-1 ${text.helper}`}>{props.field.meta.description}</p>
			)}
		</div>
	);
};
