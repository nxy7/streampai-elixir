/**
 * SchemaForm - Auto-generates form UI from Zod schemas.
 *
 * This component introspects a Zod object schema and renders appropriate
 * form fields for each property based on its type and metadata.
 *
 * @example
 * ```tsx
 * const timerSchema = z.object({
 *   label: withMeta(z.string(), { label: "Timer Label" }),
 *   fontSize: withMeta(z.number().min(12).max(72), { label: "Font Size", unit: "px" }),
 *   textColor: withMeta(z.string(), { label: "Text Color", inputType: "color" }),
 *   autoStart: withMeta(z.boolean(), { label: "Auto Start on Load" }),
 * });
 *
 * <SchemaForm
 *   schema={timerSchema}
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
import type { IntrospectedField } from "./types";

interface SchemaFormProps<T extends z.ZodRawShape> {
	/** The Zod schema defining the form structure */
	schema: z.ZodObject<T>;
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
 * Determine the best input type for a field based on its type and metadata.
 */
function getInputType(field: IntrospectedField): string {
	// Explicit inputType takes precedence
	if (field.meta.inputType) {
		return field.meta.inputType;
	}

	// Infer from Zod type
	switch (field.type) {
		case "boolean":
			return "checkbox";
		case "enum":
			return "select";
		case "number":
			// Use slider if min and max are both defined
			if (field.min !== undefined && field.max !== undefined) {
				return "slider";
			}
			return "number";
		case "string":
			// Check if field name suggests a color
			if (
				field.name.toLowerCase().includes("color") ||
				field.name.toLowerCase().includes("colour")
			) {
				return "color";
			}
			return "text";
		default:
			return "text";
	}
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
	const inputType = () => getInputType(props.field);

	return (
		<Switch fallback={<div>Unsupported field type: {props.field.type}</div>}>
			<Match when={inputType() === "text"}>
				<TextField
					field={props.field}
					value={props.value as string}
					onChange={props.onChange}
					disabled={props.disabled}
				/>
			</Match>
			<Match when={inputType() === "number"}>
				<NumberField
					field={props.field}
					value={props.value as number}
					onChange={props.onChange}
					disabled={props.disabled}
				/>
			</Match>
			<Match when={inputType() === "color"}>
				<ColorField
					field={props.field}
					value={props.value as string}
					onChange={props.onChange}
					disabled={props.disabled}
				/>
			</Match>
			<Match when={inputType() === "checkbox"}>
				<CheckboxField
					field={props.field}
					value={props.value as boolean}
					onChange={props.onChange}
					disabled={props.disabled}
				/>
			</Match>
			<Match when={inputType() === "select"}>
				<SelectField
					field={props.field}
					value={props.value as string}
					onChange={props.onChange}
					disabled={props.disabled}
				/>
			</Match>
			<Match when={inputType() === "slider"}>
				<SliderField
					field={props.field}
					value={props.value as number}
					onChange={props.onChange}
					disabled={props.disabled}
				/>
			</Match>
			<Match when={inputType() === "textarea"}>
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
	// Introspect the schema once
	const introspected = () => introspectSchema(props.schema);

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
