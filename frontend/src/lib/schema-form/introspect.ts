/**
 * Schema introspection utilities for Zod v4.
 * These functions extract metadata from Zod schemas to enable automatic form generation.
 *
 * Note: Zod v4 uses ._zod.def instead of ._def for internal schema definitions.
 */

import { z } from "zod";
import type { FieldMeta, IntrospectedField, IntrospectedSchema } from "./types";

/**
 * Convert a camelCase or snake_case field name to a human-readable label.
 * Examples: "fontSize" -> "Font Size", "show_timestamps" -> "Show Timestamps"
 */
function fieldNameToLabel(name: string): string {
	// Handle snake_case
	const withoutUnderscores = name.replace(/_/g, " ");
	// Handle camelCase - insert space before capital letters
	const withSpaces = withoutUnderscores.replace(/([a-z])([A-Z])/g, "$1 $2");
	// Capitalize first letter of each word
	return withSpaces
		.split(" ")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(" ");
}

/**
 * Parse field metadata from the Zod schema description.
 * Supports JSON metadata in the description field.
 */
function parseFieldMeta(schema: z.ZodTypeAny): FieldMeta {
	// In Zod v4, description is accessed via ._zod.def.description or the description getter
	const description = schema.description;
	if (!description) return {};

	// Try to parse as JSON first (for structured metadata)
	try {
		const parsed = JSON.parse(description);
		if (typeof parsed === "object" && parsed !== null) {
			return parsed as FieldMeta;
		}
	} catch {
		// Not JSON, use as plain description
	}

	// Plain string description
	return { description };
}

/**
 * Get the Zod internal definition - works with Zod v4's new structure.
 * In Zod v4, the def is at schema._zod.def
 */
function getDef(schema: z.ZodTypeAny): Record<string, unknown> {
	// biome-ignore lint/suspicious/noExplicitAny: Zod v4 internal structure
	const s = schema as any;
	// Zod v4 uses _zod.def, but fallback to _def for compatibility
	return s._zod?.def ?? s._def ?? {};
}

/**
 * Get the type name from a Zod schema in v4
 */
function getTypeName(schema: z.ZodTypeAny): string {
	const def = getDef(schema);
	// In Zod v4, the type is at def.type or def.typeName
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

	// Keep unwrapping until we hit a base type
	// In Zod v4, we check the type name from the def
	while (true) {
		const typeName = getTypeName(current);
		const def = getDef(current);

		if (typeName === "optional") {
			optional = true;
			// biome-ignore lint/suspicious/noExplicitAny: Zod internal
			current = (def.innerType ?? (current as any).unwrap?.()) as z.ZodTypeAny;
			if (!current) break;
		} else if (typeName === "default") {
			// biome-ignore lint/suspicious/noExplicitAny: Zod internal - defaultValue can be a function or value
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
		// In Zod v4, checks are at def.checks
		const checks = (def.checks as Array<{ kind: string; value?: number }>) || [];
		let min: number | undefined;
		let max: number | undefined;

		for (const check of checks) {
			if (check.kind === "min" || check.kind === "minimum") {
				min = check.value;
			} else if (check.kind === "max" || check.kind === "maximum") {
				max = check.value;
			}
		}

		return { type: "number", min, max };
	}

	if (typeName === "boolean") {
		return { type: "boolean" };
	}

	if (typeName === "enum") {
		// In Zod v4, enum values are at def.entries or def.values
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
		// In Zod v4, literal uses 'values' (a Set) instead of 'value'
		const values = def.values as Set<unknown> | undefined;
		const value = def.value as unknown; // fallback for v3 compatibility

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
		// Check if it's a union of literals (effectively an enum)
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
function introspectField(
	name: string,
	schema: z.ZodTypeAny,
): IntrospectedField {
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
		min: meta.min ?? typeInfo.min,
		max: meta.max ?? typeInfo.max,
		meta,
		schema: inner,
	};
}

/**
 * Introspect a Zod object schema to extract all field information.
 * This is the main entry point for schema introspection.
 */
export function introspectSchema<T extends z.ZodRawShape>(
	schema: z.ZodObject<T>,
): IntrospectedSchema {
	const shape = schema.shape;
	const fields: IntrospectedField[] = [];

	for (const [name, fieldSchema] of Object.entries(shape)) {
		const field = introspectField(name, fieldSchema as z.ZodTypeAny);
		// Skip hidden fields
		if (!field.meta.hidden) {
			fields.push(field);
		}
	}

	// Sort by order metadata, then by name
	fields.sort((a, b) => {
		const orderA = a.meta.order ?? 999;
		const orderB = b.meta.order ?? 999;
		if (orderA !== orderB) return orderA - orderB;
		return a.name.localeCompare(b.name);
	});

	// Group fields by their group metadata
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

/**
 * Helper to create a Zod schema with metadata.
 * This enables a fluent API for defining schemas with form metadata.
 *
 * @example
 * const schema = z.object({
 *   fontSize: withMeta(z.number().min(12).max(72), {
 *     label: "Font Size",
 *     unit: "px",
 *     inputType: "slider",
 *   }),
 * });
 */
export function withMeta<T extends z.ZodTypeAny>(
	schema: T,
	meta: FieldMeta,
): T {
	// Store metadata as JSON in the description
	return schema.describe(JSON.stringify(meta)) as T;
}

/**
 * Shorthand helpers for common field types
 */
export const field = {
	/** Text field */
	text: (meta?: Omit<FieldMeta, "inputType">) =>
		withMeta(z.string(), { ...meta, inputType: "text" }),

	/** Number field with optional min/max */
	number: (options?: { min?: number; max?: number } & FieldMeta) => {
		let schema = z.number();
		if (options?.min !== undefined) schema = schema.min(options.min);
		if (options?.max !== undefined) schema = schema.max(options.max);
		return withMeta(schema, { ...options, inputType: "number" });
	},

	/** Color picker field */
	color: (meta?: Omit<FieldMeta, "inputType">) =>
		withMeta(z.string(), { ...meta, inputType: "color" }),

	/** Checkbox/boolean field */
	checkbox: (meta?: Omit<FieldMeta, "inputType">) =>
		withMeta(z.boolean(), { ...meta, inputType: "checkbox" }),

	/** Select dropdown with options */
	select: <T extends string>(values: readonly T[], meta?: FieldMeta) =>
		withMeta(z.enum(values as unknown as [T, ...T[]]), {
			...meta,
			inputType: "select",
		}),

	/** Range slider */
	slider: (options: { min: number; max: number; step?: number } & FieldMeta) =>
		withMeta(z.number().min(options.min).max(options.max), {
			...options,
			inputType: "slider",
		}),
};
