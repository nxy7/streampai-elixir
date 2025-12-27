import { Show, type Component } from "solid-js";
import { text } from "~/styles/design-system";
import type { IntrospectedField } from "../types";

interface SliderFieldProps {
	field: IntrospectedField;
	value: number;
	onChange: (value: number) => void;
	disabled?: boolean;
}

export const SliderField: Component<SliderFieldProps> = (props) => {
	const min = () => props.field.min ?? 0;
	const max = () => props.field.max ?? 100;
	const step = () => props.field.meta.step ?? 1;
	const showValue = () => props.field.meta.showValue !== false;

	return (
		<div>
			<label class="block">
				<div class="flex items-center justify-between">
					<span class={text.label}>
						{props.field.label}
						{props.field.meta.unit && (
							<span class="ml-1 text-gray-400">({props.field.meta.unit})</span>
						)}
					</span>
					<Show when={showValue()}>
						<span class="font-medium text-gray-900 text-sm">
							{props.value ?? min()}
							{props.field.meta.unit && (
								<span class="text-gray-400">{props.field.meta.unit}</span>
							)}
						</span>
					</Show>
				</div>
				<div class="mt-2 flex items-center gap-3">
					<span class="text-gray-400 text-xs">{min()}</span>
					<input
						type="range"
						class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
						value={props.value ?? min()}
						onInput={(e) => {
							const val = parseFloat(e.currentTarget.value);
							if (!isNaN(val)) props.onChange(val);
						}}
						min={min()}
						max={max()}
						step={step()}
						disabled={props.disabled}
					/>
					<span class="text-gray-400 text-xs">{max()}</span>
				</div>
			</label>
			{props.field.meta.description && (
				<p class={`mt-1 ${text.helper}`}>{props.field.meta.description}</p>
			)}
		</div>
	);
};
