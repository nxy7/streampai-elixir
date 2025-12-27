/**
 * Shared utilities for widget components.
 *
 * This module provides common functions used across multiple widgets
 * to ensure consistency and reduce code duplication.
 */

export type FontSize = "small" | "medium" | "large";

/**
 * Font size mappings for different widget contexts.
 * Each context has different base sizes appropriate for its display requirements.
 */
export const FONT_SIZE_CLASSES = {
	/** Standard text sizes for general widgets */
	standard: {
		small: "text-xs",
		medium: "text-sm",
		large: "text-lg",
	},
	/** Larger text sizes for event lists and content-heavy widgets */
	content: {
		small: "text-sm",
		medium: "text-base",
		large: "text-lg",
	},
	/** Display sizes for alertbox overlays */
	alertbox: {
		small: "text-lg",
		medium: "text-2xl",
		large: "text-4xl",
	},
	/** Large counter/number display sizes */
	counter: {
		small: "text-xl",
		medium: "text-3xl",
		large: "text-5xl",
	},
} as const;

export type FontSizeContext = keyof typeof FONT_SIZE_CLASSES;

/**
 * Get the appropriate Tailwind font class for a given size and context.
 *
 * @param size - The font size option (small, medium, large)
 * @param context - The widget context determining the actual sizes
 * @returns The Tailwind CSS class for the font size
 *
 * @example
 * // In a chat widget
 * getFontClass("small", "standard") // returns "text-xs"
 *
 * // In an alertbox widget
 * getFontClass("small", "alertbox") // returns "text-lg"
 *
 * // In a viewer count widget
 * getFontClass("large", "counter") // returns "text-5xl"
 */
export function getFontClass(
	size: FontSize | string,
	context: FontSizeContext = "standard",
): string {
	const sizeKey = (size as FontSize) || "medium";
	return (
		FONT_SIZE_CLASSES[context][sizeKey] || FONT_SIZE_CLASSES[context].medium
	);
}

export type AnimationType = "slide" | "fade" | "bounce";

/**
 * Animation class mappings for widget entrance/exit animations.
 */
export const ANIMATION_CLASSES = {
	in: {
		slide: "animate-slide-in",
		fade: "animate-fade-in",
		bounce: "animate-bounce-in",
	},
	out: {
		slide: "animate-slide-out",
		fade: "animate-fade-out",
		bounce: "animate-bounce-out",
	},
} as const;

/**
 * Get the animation class for a given animation type and direction.
 *
 * @param type - The animation type
 * @param direction - Whether this is an entrance or exit animation
 * @returns The CSS animation class
 */
export function getAnimationClass(
	type: AnimationType | string,
	direction: "in" | "out" = "in",
): string {
	const animationType = (type as AnimationType) || "fade";
	return ANIMATION_CLASSES[direction][animationType];
}

export type AlertPosition = "top" | "center" | "bottom";

/**
 * Position class mappings for alert positioning.
 */
export const POSITION_CLASSES: Record<AlertPosition, string> = {
	top: "items-start pt-8",
	center: "items-center",
	bottom: "items-end pb-8",
};

/**
 * Get the position class for alert placement.
 *
 * @param position - The alert position
 * @returns The CSS class for positioning
 */
export function getPositionClass(position: AlertPosition | string): string {
	return POSITION_CLASSES[position as AlertPosition] || POSITION_CLASSES.center;
}

/**
 * Format a monetary amount for display.
 *
 * @param amount - The amount to format
 * @param currency - The currency symbol (defaults to "$")
 * @returns Formatted amount string
 */
export function formatAmount(amount?: number, currency?: string): string {
	if (!amount) return "";
	return `${currency || "$"}${amount.toFixed(2)}`;
}
