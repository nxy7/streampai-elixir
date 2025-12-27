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
			type="number"
			label={labelWithUnit()}
			value={props.value ?? 0}
			onInput={(e) => {
				const val = Number.parseFloat(e.currentTarget.value);
				if (!Number.isNaN(val)) props.onChange(val);
			}}
			min={props.field.min}
			max={props.field.max}
			step={props.field.meta.step ?? 1}
			disabled={props.disabled}
			helperText={props.field.meta.description}
		/>
	);
};
