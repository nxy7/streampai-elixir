import type { Component } from "solid-js";
import Input from "~/components/ui/Input";
import type { IntrospectedField } from "../types";

interface NumberFieldProps {
	field: IntrospectedField;
	value: number;
	onChange: (value: number) => void;
	disabled?: boolean;
}

export const NumberField: Component<NumberFieldProps> = (props) => {
	const labelWithUnit = () => {
		if (props.field.meta.unit) {
			return `${props.field.label} (${props.field.meta.unit})`;
		}
		return props.field.label;
	};

	return (
		<Input
			disabled={props.disabled}
			helperText={props.field.meta.description}
			label={labelWithUnit()}
			max={props.field.max}
			min={props.field.min}
			onInput={(e) => {
				const val = Number.parseFloat(e.currentTarget.value);
				if (!Number.isNaN(val)) props.onChange(val);
			}}
			step={props.field.meta.step ?? 1}
			type="number"
			value={props.value ?? 0}
		/>
	);
};
