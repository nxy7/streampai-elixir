/**
 * Schema-based form generation system.
 *
 * This module provides utilities for automatically generating form UIs
 * from Zod schemas. It introspects the schema to determine field types,
 * constraints, and metadata, then renders appropriate form controls.
 *
 * ## Design Principle: Schema and Metadata are SEPARATE
 *
 * - **Schema**: Plain Zod schema (can be auto-generated from Ash TypeScript)
 * - **Metadata**: Optional UI hints passed separately
 *
 * This separation allows schemas to be auto-generated while metadata
 * can be hand-written or derived from Ash attributes.
 *
 * ## Usage
 *
 * ### Define a plain Zod schema:
 * ```tsx
 * import { z } from "zod";
 *
 * // This could be auto-generated from Ash
 * const timerSchema = z.object({
 *   label: z.string().default("TIMER"),
 *   fontSize: z.number().min(24).max(120).default(48),
 *   textColor: z.string().default("#ffffff"),
 *   autoStart: z.boolean().default(false),
 * });
 * ```
 *
 * ### Define optional metadata for UI customization:
 * ```tsx
 * import type { FormMeta } from "~/lib/schema-form";
 *
 * const timerMeta: FormMeta<typeof timerSchema.shape> = {
 *   label: { label: "Timer Label", placeholder: "Enter label text" },
 *   fontSize: { label: "Font Size", unit: "px" },
 *   textColor: { label: "Text Color", inputType: "color" },
 *   autoStart: {
 *     label: "Auto Start on Load",
 *     description: "Start the timer automatically when the widget loads",
 *   },
 * };
 * ```
 *
 * ### Render the form:
 * ```tsx
 * import { SchemaForm } from "~/lib/schema-form";
 *
 * <SchemaForm
 *   schema={timerSchema}
 *   meta={timerMeta}
 *   values={config()}
 *   onChange={(field, value) => updateConfig(field, value)}
 * />
 * ```
 *
 * ## Automatic Input Type Inference
 *
 * Without metadata, input types are inferred from Zod types:
 * - `z.string()` -> text input
 * - `z.number()` with min/max -> slider
 * - `z.number()` without min/max -> number input
 * - `z.boolean()` -> checkbox
 * - `z.enum([...])` -> select dropdown
 *
 * Use `inputType` in metadata to override:
 * ```tsx
 * textColor: { inputType: "color" }  // Force color picker for string
 * bio: { inputType: "textarea" }     // Force textarea for string
 * ```
 *
 * ## Metadata Options
 *
 * - `label`: Human-readable field label (default: derived from field name)
 * - `labelKey`: i18n key for label (used when `t` prop is provided)
 * - `inputType`: Override auto-detected input type
 * - `description`: Help text shown below the field
 * - `descriptionKey`: i18n key for description
 * - `placeholder`: Placeholder text (for text/textarea)
 * - `placeholderKey`: i18n key for placeholder
 * - `unit`: Unit label (for number/slider, e.g., "px", "%")
 * - `step`: Step increment (for number/slider)
 * - `group`: Group fields into sections
 * - `groupKey`: i18n key for group header
 * - `hidden`: Hide field from form
 * - `options`: Custom labels for select options (maps enum value to display label)
 * - `optionKeys`: i18n keys for select options
 *
 * ## i18n Support
 *
 * Pass the `t` translation function to enable localization:
 * ```tsx
 * import { useTranslation } from "~/i18n";
 *
 * const { t } = useTranslation();
 *
 * const meta = {
 *   label: { labelKey: "settings.timerLabel" },
 *   fontSize: { labelKey: "settings.fontSize", descriptionKey: "settings.fontSizeHelp" },
 * };
 *
 * <SchemaForm schema={schema} meta={meta} values={values()} onChange={...} t={t} />
 * ```
 *
 * ## Field Order
 *
 * Fields are rendered in declaration order (top to bottom in the schema).
 * No explicit ordering is needed.
 */

// Field components (for custom form layouts)
export {
	CheckboxField,
	ColorField,
	NumberField,
	SelectField,
	SliderField,
	TextField,
	TextareaField,
} from "./fields";
export { getDefaultValues, introspectSchema } from "./introspect";
// Core exports
export { SchemaForm } from "./SchemaForm";
export type {
	FieldMeta,
	FormMeta,
	InputType,
	IntrospectedField,
	IntrospectedSchema,
	SchemaFormProps,
	TranslationFunction,
} from "./types";
