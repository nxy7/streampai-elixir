/**
 * Generate a deterministic HSL color from any string.
 * The string controls the hue; saturation and lightness are configurable.
 */
export function stringToColor(
	str: string,
	saturation = 70,
	lightness = 65,
): string {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
	}
	const hue = hash % 360;
	return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}
