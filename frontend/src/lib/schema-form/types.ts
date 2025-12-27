/**
 * Types for the schema-based form generation system.
 * These types define the metadata that can be attached to Zod schemas
 * for automatic form rendering.
 */

import type { z } from "zod";

/**
 * Field metadata that can be attached to any Zod schema field.
 * This controls how the field is rendered in auto-generated forms.
 */
export interface FieldMeta {
	/** Human-readable label for the field */
	label?: string;
	/** Optional description/helper text shown below the field */
	description?: string;
	/** Placeholder text for text inputs */
	placeholder?: string;
	/** Override the auto-detected input type */
	inputType?:
		| "text"
		| "number"
		| "color"
		| "checkbox"
		| "select"
		| "slider"
		| "textarea";
	/** For number inputs: minimum value */
	min?: number;
	/** For number inputs: maximum value */
	max?: number;
	/** For number inputs: step increment */
	step?: number;
	/** For slider inputs: show value label */
	showValue?: boolean;
	/** Unit label to show after number inputs (e.g., "px", "s", "%") */
	unit?: string;
	/** Group fields together under a section */
	group?: string;
	/** Order within the form (lower = earlier) */
	order?: number;
	/** Hide this field in the form (for computed/internal fields) */
	hidden?: boolean;
}

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
	/** For number types: validation constraints */
	min?: number;
	max?: number;
	/** Field metadata from describe/meta */
	meta: FieldMeta;
	/** The original Zod schema for this field */
	schema: z.ZodTypeAny;
}

/**
 * Result of introspecting a Zod object schema
 */
export interface IntrospectedSchema {
	/** All fields in the schema */
	fields: IntrospectedField[];
	/** Fields grouped by their group metadata */
	groups: Record<string, IntrospectedField[]>;
	/** Ungrouped fields */
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
