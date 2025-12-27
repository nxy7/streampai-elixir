/**
 * Schema-based form generation system.
 *
 * This module provides utilities for automatically generating form UIs
 * from Zod schemas. It introspects the schema to determine field types,
 * constraints, and metadata, then renders appropriate form controls.
 *
 * ## Usage
 *
 * ### Define a schema with type-safe field builders:
 * ```tsx
 * import { z } from "zod";
 * import { formField } from "~/lib/schema-form";
 *
 * const timerSchema = z.object({
 *   label: formField.text(z.string().default("TIMER"), {
 *     label: "Timer Label",
 *     placeholder: "Enter label text",
 *   }),
 *   fontSize: formField.slider(z.number().min(24).max(120).default(48), {
 *     label: "Font Size",
 *     unit: "px",
 *   }),
 *   textColor: formField.color(z.string().default("#ffffff"), {
 *     label: "Text Color",
 *   }),
 *   autoStart: formField.checkbox(z.boolean().default(false), {
 *     label: "Auto Start on Load",
 *     description: "Start the timer automatically when the widget loads",
 *   }),
 * });
 * ```
 *
 * ### Render the form:
 * ```tsx
 * import { SchemaForm } from "~/lib/schema-form";
 *
 * <SchemaForm
 *   schema={timerSchema}
 *   values={config()}
 *   onChange={(field, value) => updateConfig(field, value)}
 * />
 * ```
 *
 * ## Type-Safe Field Builders (formField.*)
 *
 * Each builder enforces correct metadata for its input type:
 * - `formField.text(z.string(), { label, placeholder? })`
 * - `formField.textarea(z.string(), { label, placeholder? })`
 * - `formField.number(z.number(), { label, unit?, step? })`
 * - `formField.slider(z.number().min().max(), { label, unit?, step? })`
 * - `formField.color(z.string(), { label })`
 * - `formField.checkbox(z.boolean(), { label, description? })`
 * - `formField.select(z.enum([...]), { label })`
 *
 * ## Common Metadata Options
 *
 * - `label`: Human-readable field label (required)
 * - `description`: Help text shown below the field
 * - `group`: Group fields into sections
 * - `hidden`: Hide field from form
 *
 * ## Field Order
 *
 * Fields are rendered in declaration order (top to bottom in the schema).
 * No explicit ordering is needed.
 */

// Core exports
export { SchemaForm } from "./SchemaForm";
export { introspectSchema, formField, withMeta, field } from "./introspect";
export type {
	FieldMeta,
	InputType,
	IntrospectedField,
	IntrospectedSchema,
	SchemaFormProps,
	TextFieldMeta,
	TextareaFieldMeta,
	NumberFieldMeta,
	SliderFieldMeta,
	ColorFieldMeta,
	CheckboxFieldMeta,
	SelectFieldMeta,
} from "./types";

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
