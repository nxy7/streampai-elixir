/**
 * SchemaForm - Auto-generates form UI from Zod schemas.
 *
 * Design: Schema and metadata are SEPARATE.
 * - Schema: Plain Zod schema (can be auto-generated from Ash)
 * - Metadata: Optional UI hints passed as a separate prop
 *
 * @example
 * ```tsx
 * // Schema can be auto-generated from Ash
 * const timerSchema = z.object({
 *   label: z.string().default("TIMER"),
 *   fontSize: z.number().min(12).max(72).default(16),
 *   textColor: z.string().default("#ffffff"),
 *   autoStart: z.boolean().default(false),
 * });
 *
 * // Metadata is separate - only for UI customization
 * const timerMeta = {
 *   label: { label: "Timer Label", placeholder: "Enter label" },
 *   fontSize: { label: "Font Size", unit: "px" },
 *   textColor: { label: "Text Color", inputType: "color" },
 *   autoStart: { label: "Auto Start on Load" },
 * };
 *
 * <SchemaForm
 *   schema={timerSchema}
 *   meta={timerMeta}
 *   values={config()}
 *   onChange={(field, value) => updateConfig(field, value)}
 * />
 * ```
 */

import { For, Match, Switch, type Component } from "solid-js";
import type { z } from "zod";
import {
	CheckboxField,
	ColorField,
	NumberField,
	SelectField,
	SliderField,
	TextField,
	TextareaField,
} from "./fields";
import { introspectSchema } from "./introspect";
import type { FormMeta, IntrospectedField } from "./types";

interface SchemaFormProps<T extends z.ZodRawShape> {
	/** The Zod schema defining the form structure */
	schema: z.ZodObject<T>;
	/** Optional metadata for customizing field rendering */
	meta?: FormMeta<T>;
	/** Current form values */
	values: z.infer<z.ZodObject<T>>;
	/** Callback when any field value changes */
	onChange: <K extends keyof z.infer<z.ZodObject<T>>>(
		field: K,
		value: z.infer<z.ZodObject<T>>[K],
	) => void;
	/** Optional class name for the form container */
	class?: string;
	/** Whether the form is disabled */
	disabled?: boolean;
}

/**
 * Render a single field based on its introspected type.
 */
const SchemaField: Component<{
	field: IntrospectedField;
	value: unknown;
	onChange: (value: unknown) => void;
	disabled?: boolean;
}> = (props) => {
	return (
		<Switch fallback={<div>Unsupported field type: {props.field.type}</div>}>
			<Match when={props.field.inputType === "text"}>
				<TextField
					field={props.field}
					value={props.value as string}
					onChange={props.onChange}
					disabled={props.disabled}
				/>
			</Match>
			<Match when={props.field.inputType === "number"}>
				<NumberField
					field={props.field}
					value={props.value as number}
					onChange={props.onChange}
					disabled={props.disabled}
				/>
			</Match>
			<Match when={props.field.inputType === "color"}>
				<ColorField
					field={props.field}
					value={props.value as string}
					onChange={props.onChange}
					disabled={props.disabled}
				/>
			</Match>
			<Match when={props.field.inputType === "checkbox"}>
				<CheckboxField
					field={props.field}
					value={props.value as boolean}
					onChange={props.onChange}
					disabled={props.disabled}
				/>
			</Match>
			<Match when={props.field.inputType === "select"}>
				<SelectField
					field={props.field}
					value={props.value as string}
					onChange={props.onChange}
					disabled={props.disabled}
				/>
			</Match>
			<Match when={props.field.inputType === "slider"}>
				<SliderField
					field={props.field}
					value={props.value as number}
					onChange={props.onChange}
					disabled={props.disabled}
				/>
			</Match>
			<Match when={props.field.inputType === "textarea"}>
				<TextareaField
					field={props.field}
					value={props.value as string}
					onChange={props.onChange}
					disabled={props.disabled}
				/>
			</Match>
		</Switch>
	);
};

/**
 * SchemaForm component - renders a complete form based on a Zod schema.
 */
export function SchemaForm<T extends z.ZodRawShape>(
	props: SchemaFormProps<T>,
): ReturnType<Component> {
	// Introspect the schema with metadata
	const introspected = () => introspectSchema(props.schema, props.meta);

	return (
		<div class={props.class ?? "space-y-4"}>
			{/* Render grouped fields first */}
			<For each={Object.entries(introspected().groups)}>
				{([groupName, fields]) => (
					<div class="space-y-4">
						<h3 class="border-gray-200 border-b pb-2 font-medium text-gray-900 text-sm">
							{groupName}
						</h3>
						<div class="space-y-4">
							<For each={fields}>
								{(field) => (
									<SchemaField
										field={field}
										value={props.values[field.name as keyof typeof props.values]}
										onChange={(value) =>
											props.onChange(
												field.name as keyof z.infer<z.ZodObject<T>>,
												value as z.infer<z.ZodObject<T>>[keyof z.infer<
													z.ZodObject<T>
												>],
											)
										}
										disabled={props.disabled}
									/>
								)}
							</For>
						</div>
					</div>
				)}
			</For>

			{/* Render ungrouped fields */}
			<For each={introspected().ungrouped}>
				{(field) => (
					<SchemaField
						field={field}
						value={props.values[field.name as keyof typeof props.values]}
						onChange={(value) =>
							props.onChange(
								field.name as keyof z.infer<z.ZodObject<T>>,
								value as z.infer<z.ZodObject<T>>[keyof z.infer<z.ZodObject<T>>],
							)
						}
						disabled={props.disabled}
					/>
				)}
			</For>
		</div>
	);
}
