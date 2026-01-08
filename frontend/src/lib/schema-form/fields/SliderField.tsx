import { type Component, Show } from "solid-js";
import { text } from "~/design-system/design-system";
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
	// biome-ignore lint/suspicious/noExplicitAny: meta is Partial<FieldMeta> union type
	const meta = () => props.field.meta as any;
	const step = () => meta().step ?? 1;
	const unit = () => meta().unit as string | undefined;

	return (
		<div>
			<label class="block">
				<div class="flex items-center justify-between">
					<span class={text.label}>
						{props.field.label}
						<Show when={unit()}>
							<span class="ml-1 text-gray-400">({unit()})</span>
						</Show>
					</span>
					<span class="font-medium text-gray-900 text-sm">
						{props.value ?? min()}
						<Show when={unit()}>
							<span class="text-gray-400">{unit()}</span>
						</Show>
					</span>
				</div>
				<div class="mt-2 flex items-center gap-3">
					<span class="text-gray-400 text-xs">{min()}</span>
					<input
						class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
						disabled={props.disabled}
						max={max()}
						min={min()}
						onInput={(e) => {
							const val = parseFloat(e.currentTarget.value);
							if (!Number.isNaN(val)) props.onChange(val);
						}}
						step={step()}
						type="range"
						value={props.value ?? min()}
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
