/**
 * Type-safe form field definitions for schema-based form generation.
 *
 * Design principle: Schema and metadata are SEPARATE concerns.
 * - Schema: Plain Zod schema (can be auto-generated from Ash)
 * - Metadata: Optional UI hints keyed by field name
 */

import type { z } from "zod";

/**
 * Input types that can be used for form fields.
 * If not specified, inferred from Zod type:
 * - z.string() -> "text"
 * - z.number() with min/max -> "slider", otherwise "number"
 * - z.boolean() -> "checkbox"
 * - z.enum() -> "select"
 */
export type InputType =
	| "text"
	| "textarea"
	| "number"
	| "slider"
	| "color"
	| "checkbox"
	| "select"
	| "image";

/**
 * Metadata for a single form field.
 * All properties are optional - sensible defaults are derived from schema.
 */
export interface FieldMeta {
	/** Human-readable label (default: derived from field name) */
	label?: string;
	/** i18n key for label - when provided with a translation function, used instead of label */
	labelKey?: string;
	/** Override the auto-detected input type */
	inputType?: InputType;
	/** Description/helper text shown below the field */
	description?: string;
	/** i18n key for description - when provided with a translation function, used instead of description */
	descriptionKey?: string;
	/** Group fields together under a section header */
	group?: string;
	/** i18n key for group header - when provided with a translation function, used instead of group */
	groupKey?: string;
	/** Hide this field in the form */
	hidden?: boolean;
	/** Placeholder text (for text/textarea fields) */
	placeholder?: string;
	/** i18n key for placeholder - when provided with a translation function, used instead of placeholder */
	placeholderKey?: string;
	/** Unit label (for number/slider fields, e.g., "px", "s", "%") */
	unit?: string;
	/** Step increment (for number/slider fields) */
	step?: number;
	/** Custom labels for select options (maps enum value to display label) */
	options?: Record<string, string>;
	/** i18n keys for select options (maps enum value to i18n key) */
	optionKeys?: Record<string, string>;
}

/**
 * Metadata for all fields in a schema, keyed by field name.
 * This is kept SEPARATE from the schema so schemas can be auto-generated.
 *
 * @example
 * const schema = z.object({
 *   fontSize: z.number().min(12).max(72).default(16),
 *   textColor: z.string().default("#ffffff"),
 * });
 *
 * const meta: FormMeta<typeof schema> = {
 *   fontSize: { label: "Font Size", unit: "px", inputType: "slider" },
 *   textColor: { label: "Text Color", inputType: "color" },
 * };
 */
export type FormMeta<T extends z.ZodRawShape> = {
	[K in keyof T]?: FieldMeta;
};

/**
 * Introspected field information extracted from a Zod schema + metadata
 */
export interface IntrospectedField {
	/** Field name (key in the object) */
	name: string;
	/** Human-readable label */
	label: string;
	/** Resolved input type */
	inputType: InputType;
	/** Zod type name (e.g., "string", "number", "boolean", "enum") */
	type: string;
	/** Default value if any */
	defaultValue?: unknown;
	/** Whether the field is optional */
	optional: boolean;
	/** For enum types: list of allowed values */
	enumValues?: string[];
	/** For number types: minimum value from schema */
	min?: number;
	/** For number types: maximum value from schema */
	max?: number;
	/** Combined metadata */
	meta: FieldMeta;
	/** The original Zod schema for this field */
	schema: z.ZodTypeAny;
}

/**
 * Result of introspecting a Zod object schema
 */
export interface IntrospectedSchema {
	/** All fields in the schema (in declaration order) */
	fields: IntrospectedField[];
	/** Fields grouped by their group metadata (preserves declaration order within groups) */
	groups: Record<string, IntrospectedField[]>;
	/** Ungrouped fields (in declaration order) */
	ungrouped: IntrospectedField[];
}

/**
 * Translation function type - compatible with useTranslation().t
 */
export type TranslationFunction = (
	key: string,
	params?: Record<string, string | number>,
) => string;

/**
 * Props for the auto-generated form component
 */
export interface SchemaFormProps<T extends z.ZodRawShape> {
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
}
