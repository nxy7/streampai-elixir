/**
 * Type-safe form field definitions for schema-based form generation.
 */

import type { z } from "zod";

/**
 * Base metadata shared by all field types
 */
interface BaseFieldMeta {
	/** Human-readable label for the field */
	label: string;
	/** Optional description/helper text shown below the field */
	description?: string;
	/** Group fields together under a section */
	group?: string;
	/** Hide this field in the form */
	hidden?: boolean;
}

/**
 * Text field metadata
 */
export interface TextFieldMeta extends BaseFieldMeta {
	inputType: "text";
	/** Placeholder text */
	placeholder?: string;
}

/**
 * Textarea field metadata
 */
export interface TextareaFieldMeta extends BaseFieldMeta {
	inputType: "textarea";
	/** Placeholder text */
	placeholder?: string;
}

/**
 * Number field metadata
 */
export interface NumberFieldMeta extends BaseFieldMeta {
	inputType: "number";
	/** Unit label (e.g., "px", "s", "%") */
	unit?: string;
	/** Step increment */
	step?: number;
}

/**
 * Slider field metadata
 */
export interface SliderFieldMeta extends BaseFieldMeta {
	inputType: "slider";
	/** Unit label (e.g., "px", "s", "%") */
	unit?: string;
	/** Step increment */
	step?: number;
}

/**
 * Color picker field metadata
 */
export interface ColorFieldMeta extends BaseFieldMeta {
	inputType: "color";
}

/**
 * Checkbox field metadata
 */
export interface CheckboxFieldMeta extends BaseFieldMeta {
	inputType: "checkbox";
}

/**
 * Select dropdown field metadata
 */
export interface SelectFieldMeta extends BaseFieldMeta {
	inputType: "select";
}

/**
 * Union of all field metadata types
 */
export type FieldMeta =
	| TextFieldMeta
	| TextareaFieldMeta
	| NumberFieldMeta
	| SliderFieldMeta
	| ColorFieldMeta
	| CheckboxFieldMeta
	| SelectFieldMeta;

/**
 * Extract the input type from a FieldMeta
 */
export type InputType = FieldMeta["inputType"];

/**
 * Introspected field information extracted from a Zod schema
 */
export interface IntrospectedField {
	/** Field name (key in the object) */
	name: string;
	/** Human-readable label */
	label: string;
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
	/** Field metadata from describe */
	meta: Partial<FieldMeta>;
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
 * Props for the auto-generated form component
 */
export interface SchemaFormProps<T extends z.ZodRawShape> {
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
