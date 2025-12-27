/**
 * Schema-based form generation system.
 *
 * This module provides utilities for automatically generating form UIs
 * from Zod schemas. It introspects the schema to determine field types,
 * constraints, and metadata, then renders appropriate form controls.
 *
 * ## Usage
 *
 * ### Define a schema with metadata:
 * ```tsx
 * import { z } from "zod";
 * import { withMeta, field } from "~/lib/schema-form";
 *
 * const timerSchema = z.object({
 *   label: withMeta(z.string().default("TIMER"), {
 *     label: "Timer Label",
 *     placeholder: "Enter label text",
 *   }),
 *   fontSize: withMeta(z.number().min(24).max(120).default(48), {
 *     label: "Font Size",
 *     unit: "px",
 *     inputType: "slider",
 *   }),
 *   textColor: withMeta(z.string().default("#ffffff"), {
 *     label: "Text Color",
 *     inputType: "color",
 *   }),
 *   autoStart: withMeta(z.boolean().default(false), {
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
 * ## Field Types
 *
 * The system automatically detects field types from Zod schemas:
 * - `z.string()` -> text input
 * - `z.number()` -> number input (or slider if min/max defined)
 * - `z.boolean()` -> checkbox
 * - `z.enum()` -> select dropdown
 *
 * Override with `inputType` in metadata:
 * - "text", "number", "color", "checkbox", "select", "slider", "textarea"
 *
 * ## Metadata Options
 *
 * - `label`: Human-readable field label
 * - `description`: Help text shown below the field
 * - `placeholder`: Placeholder for text inputs
 * - `inputType`: Override auto-detected input type
 * - `min`, `max`: Number constraints
 * - `step`: Number input step increment
 * - `unit`: Unit label (e.g., "px", "s", "%")
 * - `group`: Group fields into sections
 * - `order`: Sort order (lower = earlier)
 * - `hidden`: Hide field from form
 */

// Core exports
export { SchemaForm } from "./SchemaForm";
export { introspectSchema, withMeta, field } from "./introspect";
export type {
	FieldMeta,
	IntrospectedField,
	IntrospectedSchema,
	SchemaFormProps,
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
