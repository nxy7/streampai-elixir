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

import { type Component, For, Match, Switch } from "solid-js";
import type { z } from "zod";
import {
	CheckboxField,
	ColorField,
	ImageUploadField,
	type ImageUploadHandler,
	NumberField,
	SelectField,
	SliderField,
	TextField,
	TextareaField,
} from "./fields";
import { introspectSchema } from "./introspect";
import type { FormMeta, IntrospectedField, TranslationFunction } from "./types";

/**
 * Resolve a field's display values using translations if available.
 * Falls back to static values when no translation function is provided.
 */
function resolveFieldTranslations(
	field: IntrospectedField,
	t?: TranslationFunction,
): IntrospectedField {
	if (!t) return field;

	const meta = field.meta;
	const resolvedMeta = { ...meta };

	// Resolve label
	const resolvedLabel = meta.labelKey ? t(meta.labelKey) : field.label;

	// Resolve description
	if (meta.descriptionKey) {
		resolvedMeta.description = t(meta.descriptionKey);
	}

	// Resolve placeholder
	if (meta.placeholderKey) {
		resolvedMeta.placeholder = t(meta.placeholderKey);
	}

	// Resolve option labels for select fields
	if (meta.optionKeys && field.enumValues) {
		const resolvedOptions: Record<string, string> = {};
		for (const value of field.enumValues) {
			if (meta.optionKeys[value]) {
				resolvedOptions[value] = t(meta.optionKeys[value]);
			} else if (meta.options?.[value]) {
				resolvedOptions[value] = meta.options[value];
			}
		}
		if (Object.keys(resolvedOptions).length > 0) {
			resolvedMeta.options = resolvedOptions;
		}
	}

	return {
		...field,
		label: resolvedLabel,
		meta: resolvedMeta,
	};
}

/**
 * Resolve group name using translation if available.
 */
function resolveGroupName(
	groupName: string,
	fields: IntrospectedField[],
	t?: TranslationFunction,
): string {
	if (!t) return groupName;

	// Check if any field in the group has a groupKey
	const fieldWithGroupKey = fields.find((f) => f.meta.groupKey);
	if (fieldWithGroupKey?.meta.groupKey) {
		return t(fieldWithGroupKey.meta.groupKey);
	}

	return groupName;
}

/**
 * Configuration for image upload fields.
 * Keyed by field name, provides the upload handler and optional preview URL.
 */
export interface ImageFieldConfig {
	/** Handler for 2-step file upload. Called when user selects a file. */
	onUpload: ImageUploadHandler;
	/** Current preview URL for the image */
	previewUrl?: string | null;
	/** Called when preview URL changes (after upload or clear) */
	onPreviewChange?: (url: string | null) => void;
	/** Accepted file types (default: "image/*") */
	accept?: string;
	/** Maximum file size in bytes (default: 2MB) */
	maxSize?: number;
}

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
	/** Optional translation function for i18n support. When provided, fields can use i18n keys (labelKey, descriptionKey, etc.) */
	t?: TranslationFunction;
	/** Configuration for image upload fields, keyed by field name */
	imageFields?: Record<string, ImageFieldConfig>;
}

/**
 * Render a single field based on its introspected type.
 */
const SchemaField: Component<{
	field: IntrospectedField;
	value: unknown;
	onChange: (value: unknown) => void;
	disabled?: boolean;
	imageFieldConfig?: ImageFieldConfig;
}> = (props) => {
	return (
		<Switch fallback={<div>Unsupported field type: {props.field.type}</div>}>
			<Match when={props.field.inputType === "text"}>
				<TextField
					disabled={props.disabled}
					field={props.field}
					onChange={props.onChange}
					value={props.value as string}
				/>
			</Match>
			<Match when={props.field.inputType === "number"}>
				<NumberField
					disabled={props.disabled}
					field={props.field}
					onChange={props.onChange}
					value={props.value as number}
				/>
			</Match>
			<Match when={props.field.inputType === "color"}>
				<ColorField
					disabled={props.disabled}
					field={props.field}
					onChange={props.onChange}
					value={props.value as string}
				/>
			</Match>
			<Match when={props.field.inputType === "checkbox"}>
				<CheckboxField
					disabled={props.disabled}
					field={props.field}
					onChange={props.onChange}
					value={props.value as boolean}
				/>
			</Match>
			<Match when={props.field.inputType === "select"}>
				<SelectField
					disabled={props.disabled}
					field={props.field}
					onChange={props.onChange}
					value={props.value as string}
				/>
			</Match>
			<Match when={props.field.inputType === "slider"}>
				<SliderField
					disabled={props.disabled}
					field={props.field}
					onChange={props.onChange}
					value={props.value as number}
				/>
			</Match>
			<Match when={props.field.inputType === "textarea"}>
				<TextareaField
					disabled={props.disabled}
					field={props.field}
					onChange={props.onChange}
					value={props.value as string}
				/>
			</Match>
			<Match when={props.field.inputType === "image"}>
				<ImageUploadField
					accept={props.imageFieldConfig?.accept}
					disabled={props.disabled}
					field={props.field}
					maxSize={props.imageFieldConfig?.maxSize}
					onChange={props.onChange}
					onPreviewChange={props.imageFieldConfig?.onPreviewChange}
					onUpload={props.imageFieldConfig?.onUpload}
					previewUrl={props.imageFieldConfig?.previewUrl}
					value={props.value as string | null}
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
							{resolveGroupName(groupName, fields, props.t)}
						</h3>
						<div class="space-y-4">
							<For each={fields}>
								{(field) => (
									<SchemaField
										disabled={props.disabled}
										field={resolveFieldTranslations(field, props.t)}
										imageFieldConfig={props.imageFields?.[field.name]}
										onChange={(value) =>
											props.onChange(
												field.name as keyof z.infer<z.ZodObject<T>>,
												value as z.infer<z.ZodObject<T>>[keyof z.infer<
													z.ZodObject<T>
												>],
											)
										}
										value={
											props.values[field.name as keyof typeof props.values]
										}
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
						disabled={props.disabled}
						field={resolveFieldTranslations(field, props.t)}
						imageFieldConfig={props.imageFields?.[field.name]}
						onChange={(value) =>
							props.onChange(
								field.name as keyof z.infer<z.ZodObject<T>>,
								value as z.infer<z.ZodObject<T>>[keyof z.infer<z.ZodObject<T>>],
							)
						}
						value={props.values[field.name as keyof typeof props.values]}
					/>
				)}
			</For>
		</div>
	);
}
