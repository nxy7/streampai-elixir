/**
 * Schema introspection utilities for auto-generating forms from Zod schemas.
 *
 * Design: Schema and metadata are SEPARATE.
 * - Schema: Plain Zod schema (can be auto-generated from Ash)
 * - Metadata: Optional UI configuration passed separately
 */

import { z } from "zod";
import type {
	FieldMeta,
	FormMeta,
	InputType,
	IntrospectedField,
	IntrospectedSchema,
} from "./types";

/**
 * Get the internal definition from a Zod schema.
 * Handles both Zod v3 (_def) and Zod v4 (_zod.def) structures.
 */
// biome-ignore lint/suspicious/noExplicitAny: Zod internal types
function getDef(schema: z.ZodTypeAny): any {
	// biome-ignore lint/suspicious/noExplicitAny: Zod internal
	const s = schema as any;
	// Zod v4 uses _zod.def, v3 uses _def
	return s._zod?.def ?? s._def ?? {};
}

/**
 * Get the type name from a Zod schema.
 */
function getTypeName(schema: z.ZodTypeAny): string {
	const def = getDef(schema);
	return (def.type as string) ?? (def.typeName as string) ?? "unknown";
}

/**
 * Unwrap wrapper types (default, optional, nullable) to get the inner schema.
 */
function unwrapSchema(schema: z.ZodTypeAny): {
	inner: z.ZodTypeAny;
	optional: boolean;
	defaultValue: unknown;
} {
	let current = schema;
	let optional = false;
	let defaultValue: unknown = undefined;

	// Keep unwrapping until we hit a non-wrapper type
	// biome-ignore lint/suspicious/noConstantCondition: loop until break
	while (true) {
		const typeName = getTypeName(current);
		const def = getDef(current);

		if (typeName === "default") {
			// biome-ignore lint/suspicious/noExplicitAny: Zod internal
			const defaultDef = def.defaultValue as any;
			defaultValue =
				typeof defaultDef === "function" ? defaultDef() : defaultDef;
			current = def.innerType as z.ZodTypeAny;
			if (!current) break;
			continue;
		}

		if (typeName === "optional") {
			optional = true;
			current = def.innerType as z.ZodTypeAny;
			if (!current) break;
			continue;
		}

		if (typeName === "nullable") {
			optional = true;
			current = def.innerType as z.ZodTypeAny;
			if (!current) break;
			continue;
		}

		break;
	}

	return { inner: current, optional, defaultValue };
}

/**
 * Extract type information from a Zod schema.
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
					} else if (
						checkDef.check === "less_than" ||
						checkDef.check === "max"
					) {
						max = checkDef.value as number;
					}
				} else {
					// Fallback for older Zod versions with direct check objects
					// biome-ignore lint/suspicious/noExplicitAny: Zod internal
					const legacyCheck = check as any;
					if (legacyCheck.kind === "min" || legacyCheck.kind === "minimum") {
						min = legacyCheck.value;
					} else if (
						legacyCheck.kind === "max" ||
						legacyCheck.kind === "maximum"
					) {
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

	return { type: typeName || "unknown" };
}

/**
 * Convert a field name to a human-readable label.
 * "fontSize" -> "Font Size", "show_timestamps" -> "Show Timestamps"
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
 * Determine the input type based on schema type and metadata.
 */
function resolveInputType(
	typeInfo: { type: string; min?: number; max?: number },
	meta: FieldMeta,
): InputType {
	// If explicitly specified in metadata, use that
	if (meta.inputType) {
		return meta.inputType;
	}

	// Otherwise infer from Zod type
	switch (typeInfo.type) {
		case "string":
			return "text";
		case "number":
			// Use slider if both min and max are defined
			if (typeInfo.min !== undefined && typeInfo.max !== undefined) {
				return "slider";
			}
			return "number";
		case "boolean":
			return "checkbox";
		case "enum":
			return "select";
		default:
			return "text";
	}
}

/**
 * Introspect a single field from a Zod object schema.
 */
function introspectField(
	name: string,
	schema: z.ZodTypeAny,
	meta: FieldMeta,
): IntrospectedField {
	const { inner, optional, defaultValue } = unwrapSchema(schema);
	const typeInfo = getTypeInfo(inner);
	const inputType = resolveInputType(typeInfo, meta);

	return {
		name,
		label: meta.label || fieldNameToLabel(name),
		inputType,
		type: typeInfo.type,
		defaultValue,
		optional,
		enumValues: typeInfo.enumValues,
		min: typeInfo.min,
		max: typeInfo.max,
		meta,
		schema: inner,
	};
}

/**
 * Introspect a Zod object schema to extract all field information.
 *
 * @param schema - The Zod object schema to introspect
 * @param meta - Optional metadata for customizing field rendering
 * @returns Introspected schema with fields, groups, and ungrouped fields
 *
 * @example
 * // Schema can be plain Zod (auto-generated from Ash)
 * const schema = z.object({
 *   fontSize: z.number().min(12).max(72).default(16),
 *   textColor: z.string().default("#ffffff"),
 *   showLabel: z.boolean().default(true),
 *   position: z.enum(["top", "bottom"]).default("top"),
 * });
 *
 * // Metadata is separate - only needed for customization
 * const meta = {
 *   fontSize: { label: "Font Size", unit: "px" },
 *   textColor: { label: "Text Color", inputType: "color" },
 *   showLabel: { label: "Show Label" },
 *   position: { label: "Position" },
 * };
 *
 * const introspected = introspectSchema(schema, meta);
 */
export function introspectSchema<T extends z.ZodRawShape>(
	schema: z.ZodObject<T>,
	meta?: FormMeta<T>,
): IntrospectedSchema {
	const shape = schema.shape;
	const fields: IntrospectedField[] = [];
	const groups: Record<string, IntrospectedField[]> = {};
	const ungrouped: IntrospectedField[] = [];

	// Use Object.entries to preserve declaration order
	for (const [name, fieldSchema] of Object.entries(shape)) {
		const fieldMeta = (meta?.[name as keyof T] as FieldMeta) ?? {};
		const field = introspectField(name, fieldSchema as z.ZodTypeAny, fieldMeta);

		// Skip hidden fields
		if (fieldMeta.hidden) {
			continue;
		}

		fields.push(field);

		if (fieldMeta.group) {
			if (!groups[fieldMeta.group]) {
				groups[fieldMeta.group] = [];
			}
			groups[fieldMeta.group].push(field);
		} else {
			ungrouped.push(field);
		}
	}

	return { fields, groups, ungrouped };
}

/**
 * Get default values from a Zod schema.
 * Uses schema defaults where defined.
 */
export function getDefaultValues<T extends z.ZodRawShape>(
	schema: z.ZodObject<T>,
): z.infer<z.ZodObject<T>> {
	const shape = schema.shape;
	const defaults: Record<string, unknown> = {};

	for (const [name, fieldSchema] of Object.entries(shape)) {
		const { defaultValue } = unwrapSchema(fieldSchema as z.ZodTypeAny);
		if (defaultValue !== undefined) {
			defaults[name] = defaultValue;
		}
	}

	return defaults as z.infer<z.ZodObject<T>>;
}
