/**
 * Schema introspection utilities for Zod v4.
 * These functions extract metadata from Zod schemas to enable automatic form generation.
 *
 * Note: Zod v4 uses ._zod.def instead of ._def for internal schema definitions.
 */

import { z } from "zod";
import type {
	CheckboxFieldMeta,
	ColorFieldMeta,
	FieldMeta,
	IntrospectedField,
	IntrospectedSchema,
	NumberFieldMeta,
	SelectFieldMeta,
	SliderFieldMeta,
	TextFieldMeta,
	TextareaFieldMeta,
} from "./types";

/**
 * Convert a camelCase or snake_case field name to a human-readable label.
 * Examples: "fontSize" -> "Font Size", "show_timestamps" -> "Show Timestamps"
 */
function fieldNameToLabel(name: string): string {
	const withoutUnderscores = name.replace(/_/g, " ");
	const withSpaces = withoutUnderscores.replace(/([a-z])([A-Z])/g, "$1 $2");
	return withSpaces
		.split(" ")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(" ");
}

/**
 * Parse field metadata from the Zod schema description.
 */
function parseFieldMeta(schema: z.ZodTypeAny): Partial<FieldMeta> {
	const description = schema.description;
	if (!description) return {};

	try {
		const parsed = JSON.parse(description);
		if (typeof parsed === "object" && parsed !== null) {
			return parsed as Partial<FieldMeta>;
		}
	} catch {
		// Not JSON, use as plain description
	}

	return { description } as Partial<FieldMeta>;
}

/**
 * Get the Zod internal definition - works with Zod v4's new structure.
 */
function getDef(schema: z.ZodTypeAny): Record<string, unknown> {
	// biome-ignore lint/suspicious/noExplicitAny: Zod v4 internal structure
	const s = schema as any;
	return s._zod?.def ?? s._def ?? {};
}

/**
 * Get the type name from a Zod schema in v4
 */
function getTypeName(schema: z.ZodTypeAny): string {
	const def = getDef(schema);
	return (def.type as string) ?? (def.typeName as string) ?? "unknown";
}

/**
 * Unwrap a Zod schema to get the inner type (unwraps optional, default, nullable, etc.)
 */
function unwrapSchema(schema: z.ZodTypeAny): {
	inner: z.ZodTypeAny;
	optional: boolean;
	defaultValue?: unknown;
} {
	let current = schema;
	let optional = false;
	let defaultValue: unknown = undefined;

	while (true) {
		const typeName = getTypeName(current);
		const def = getDef(current);

		if (typeName === "optional") {
			optional = true;
			// biome-ignore lint/suspicious/noExplicitAny: Zod internal
			current = (def.innerType ?? (current as any).unwrap?.()) as z.ZodTypeAny;
			if (!current) break;
		} else if (typeName === "default") {
			// biome-ignore lint/suspicious/noExplicitAny: Zod internal
			const defaultDef = def.defaultValue as any;
			defaultValue = typeof defaultDef === "function" ? defaultDef() : defaultDef;
			// biome-ignore lint/suspicious/noExplicitAny: Zod internal
			current = (def.innerType ?? (current as any).unwrap?.()) as z.ZodTypeAny;
			if (!current) break;
		} else if (typeName === "nullable") {
			optional = true;
			// biome-ignore lint/suspicious/noExplicitAny: Zod internal
			current = (def.innerType ?? (current as any).unwrap?.()) as z.ZodTypeAny;
			if (!current) break;
		} else {
			break;
		}
	}

	return { inner: current, optional, defaultValue };
}

/**
 * Get the Zod type name and any relevant constraints.
 */
function getTypeInfo(schema: z.ZodTypeAny): {
	type: string;
	enumValues?: string[];
	min?: number;
	max?: number;
} {
	const typeName = getTypeName(schema);
	const def = getDef(schema);

	if (typeName === "string") {
		return { type: "string" };
	}

	if (typeName === "number" || typeName === "int" || typeName === "float") {
		let min: number | undefined;
		let max: number | undefined;

		// Zod v4 stores checks as objects with _zod.def containing check type and value
		const checks = def.checks as Array<unknown> | undefined;
		if (checks) {
			for (const check of checks) {
				// biome-ignore lint/suspicious/noExplicitAny: Zod v4 internal structure
				const checkDef = (check as any)?._zod?.def;
				if (checkDef) {
					// Zod v4 uses "greater_than" for min and "less_than" for max
					if (checkDef.check === "greater_than" || checkDef.check === "min") {
						min = checkDef.value as number;
					} else if (checkDef.check === "less_than" || checkDef.check === "max") {
						max = checkDef.value as number;
					}
				} else {
					// Fallback for older Zod versions with direct check objects
					// biome-ignore lint/suspicious/noExplicitAny: Zod internal
					const legacyCheck = check as any;
					if (legacyCheck.kind === "min" || legacyCheck.kind === "minimum") {
						min = legacyCheck.value;
					} else if (legacyCheck.kind === "max" || legacyCheck.kind === "maximum") {
						max = legacyCheck.value;
					}
				}
			}
		}

		return { type: "number", min, max };
	}

	if (typeName === "boolean") {
		return { type: "boolean" };
	}

	if (typeName === "enum") {
		const entries = def.entries as Record<string, string> | undefined;
		const values = def.values as string[] | Set<string> | undefined;

		let enumValues: string[] = [];
		if (entries) {
			enumValues = Object.values(entries);
		} else if (values) {
			enumValues = values instanceof Set ? Array.from(values) : values;
		}
		return { type: "enum", enumValues };
	}

	if (typeName === "literal") {
		const values = def.values as Set<unknown> | undefined;
		const value = def.value as unknown;

		if (values && values.size > 0) {
			const firstValue = Array.from(values)[0];
			if (typeof firstValue === "string") {
				return { type: "enum", enumValues: Array.from(values) as string[] };
			}
			return { type: typeof firstValue as string };
		} else if (value !== undefined) {
			if (typeof value === "string") {
				return { type: "enum", enumValues: [value] };
			}
			return { type: typeof value };
		}
		return { type: "unknown" };
	}

	if (typeName === "union") {
		const options = def.options as z.ZodTypeAny[] | undefined;
		if (options) {
			const allLiterals = options.every((opt) => getTypeName(opt) === "literal");
			if (allLiterals) {
				const values: string[] = [];
				for (const opt of options) {
					const optDef = getDef(opt);
					const literalValues = optDef.values as Set<unknown> | undefined;
					const literalValue = optDef.value as unknown;

					if (literalValues && literalValues.size > 0) {
						const val = Array.from(literalValues)[0];
						if (typeof val === "string") values.push(val);
					} else if (typeof literalValue === "string") {
						values.push(literalValue);
					}
				}
				if (values.length > 0) {
					return { type: "enum", enumValues: values };
				}
			}
		}
	}

	if (typeName === "array") {
		return { type: "array" };
	}

	if (typeName === "object") {
		return { type: "object" };
	}

	return { type: typeName || "unknown" };
}

/**
 * Introspect a single field from a Zod object schema.
 */
function introspectField(name: string, schema: z.ZodTypeAny): IntrospectedField {
	const { inner, optional, defaultValue } = unwrapSchema(schema);
	const typeInfo = getTypeInfo(inner);
	const meta = parseFieldMeta(schema);

	return {
		name,
		label: meta.label || fieldNameToLabel(name),
		type: typeInfo.type,
		defaultValue,
		optional,
		enumValues: typeInfo.enumValues,
		// Use min/max from schema constraints (not from meta)
		min: typeInfo.min,
		max: typeInfo.max,
		meta,
		schema: inner,
	};
}

/**
 * Introspect a Zod object schema to extract all field information.
 * Fields are returned in declaration order (no sorting).
 */
export function introspectSchema<T extends z.ZodRawShape>(
	schema: z.ZodObject<T>,
): IntrospectedSchema {
	const shape = schema.shape;
	const fields: IntrospectedField[] = [];

	// Object.entries preserves insertion order in modern JS
	for (const [name, fieldSchema] of Object.entries(shape)) {
		const field = introspectField(name, fieldSchema as z.ZodTypeAny);
		if (!field.meta.hidden) {
			fields.push(field);
		}
	}

	// No sorting - use declaration order
	// Group fields by their group metadata, preserving order
	const groups: Record<string, IntrospectedField[]> = {};
	const ungrouped: IntrospectedField[] = [];

	for (const field of fields) {
		if (field.meta.group) {
			if (!groups[field.meta.group]) {
				groups[field.meta.group] = [];
			}
			groups[field.meta.group].push(field);
		} else {
			ungrouped.push(field);
		}
	}

	return { fields, groups, ungrouped };
}

// ============================================================================
// Type-safe field builders
// ============================================================================

/**
 * Store metadata as JSON in the schema description
 */
function withMeta<T extends z.ZodTypeAny>(schema: T, meta: FieldMeta): T {
	return schema.describe(JSON.stringify(meta)) as T;
}

/**
 * Type-safe field builders that enforce correct metadata for each input type.
 *
 * @example
 * const schema = z.object({
 *   name: formField.text(z.string(), { label: "Name", placeholder: "Enter name" }),
 *   age: formField.slider(z.number().min(0).max(120), { label: "Age", unit: "years" }),
 *   color: formField.color(z.string(), { label: "Favorite Color" }),
 *   active: formField.checkbox(z.boolean(), { label: "Active" }),
 *   size: formField.select(z.enum(["s", "m", "l"]), { label: "Size" }),
 * });
 */
export const formField = {
	/**
	 * Text input field
	 */
	text: <T extends z.ZodString>(
		schema: T,
		meta: Omit<TextFieldMeta, "inputType">,
	) => withMeta(schema, { ...meta, inputType: "text" }),

	/**
	 * Textarea field for longer text
	 */
	textarea: <T extends z.ZodString>(
		schema: T,
		meta: Omit<TextareaFieldMeta, "inputType">,
	) => withMeta(schema, { ...meta, inputType: "textarea" }),

	/**
	 * Number input field
	 */
	number: <T extends z.ZodNumber>(
		schema: T,
		meta: Omit<NumberFieldMeta, "inputType">,
	) => withMeta(schema, { ...meta, inputType: "number" }),

	/**
	 * Slider field for numbers with min/max constraints.
	 * The slider will use min/max from the Zod schema (e.g., z.number().min(0).max(100))
	 */
	slider: <T extends z.ZodNumber>(
		schema: T,
		meta: Omit<SliderFieldMeta, "inputType">,
	) => withMeta(schema, { ...meta, inputType: "slider" }),

	/**
	 * Color picker field
	 */
	color: <T extends z.ZodString>(
		schema: T,
		meta: Omit<ColorFieldMeta, "inputType">,
	) => withMeta(schema, { ...meta, inputType: "color" }),

	/**
	 * Checkbox field for boolean values
	 */
	checkbox: <T extends z.ZodBoolean>(
		schema: T,
		meta: Omit<CheckboxFieldMeta, "inputType">,
	) => withMeta(schema, { ...meta, inputType: "checkbox" }),

	/**
	 * Select dropdown for enum values
	 */
	select: <T extends z.ZodEnum<[string, ...string[]]>>(
		schema: T,
		meta: Omit<SelectFieldMeta, "inputType">,
	) => withMeta(schema, { ...meta, inputType: "select" }),
};

// Keep backwards compatibility with old API
export { withMeta };

/**
 * @deprecated Use formField.* instead for type safety
 */
export const field = {
	text: (meta?: Partial<Omit<TextFieldMeta, "inputType">>) =>
		withMeta(z.string(), { label: meta?.label ?? "", ...meta, inputType: "text" }),

	number: (options?: { min?: number; max?: number } & Partial<Omit<NumberFieldMeta, "inputType">>) => {
		let schema = z.number();
		if (options?.min !== undefined) schema = schema.min(options.min);
		if (options?.max !== undefined) schema = schema.max(options.max);
		return withMeta(schema, { label: options?.label ?? "", ...options, inputType: "number" });
	},

	color: (meta?: Partial<Omit<ColorFieldMeta, "inputType">>) =>
		withMeta(z.string(), { label: meta?.label ?? "", ...meta, inputType: "color" }),

	checkbox: (meta?: Partial<Omit<CheckboxFieldMeta, "inputType">>) =>
		withMeta(z.boolean(), { label: meta?.label ?? "", ...meta, inputType: "checkbox" }),

	select: <T extends string>(values: readonly T[], meta?: Partial<Omit<SelectFieldMeta, "inputType">>) =>
		withMeta(z.enum(values as unknown as [T, ...T[]]), {
			label: meta?.label ?? "",
			...meta,
			inputType: "select",
		}),

	slider: (options: { min: number; max: number; step?: number } & Partial<Omit<SliderFieldMeta, "inputType">>) =>
		withMeta(z.number().min(options.min).max(options.max), {
			label: options.label ?? "",
			...options,
			inputType: "slider",
		}),
};
