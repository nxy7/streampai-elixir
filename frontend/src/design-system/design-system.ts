/**
 * Design System - Reusable utilities
 *
 * Note: Most component-level styles have been migrated to UI components in ~/design-system/
 * - Button: ~/design-system/Button.tsx
 * - Card: ~/design-system/Card.tsx
 * - Badge: ~/design-system/Badge.tsx
 * - Alert: ~/design-system/Alert.tsx
 * - Input/Select/Textarea: ~/design-system/Input.tsx
 */

export const text = {
	h1: "text-3xl font-bold text-gray-900",
	h2: "text-2xl font-bold text-gray-900",
	h3: "text-lg font-medium text-gray-900",
	h4: "text-base font-semibold text-gray-900",
	body: "text-gray-700",
	label: "block text-sm font-medium text-gray-700 mb-1",
	muted: "text-gray-600 text-sm",
	helper: "text-xs text-gray-500",
	error: "text-sm text-red-600",
	success: "text-sm text-green-600",
};

export function cn(...classes: (string | undefined | null | false)[]): string {
	return classes.filter(Boolean).join(" ");
}

// Legacy exports for backwards compatibility with StreamControlsWidget
// These were migrated to ~/design-system/ but are still used by some components
export const badge = {
	base: "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
	success: "bg-green-100 text-green-800",
	neutral: "bg-gray-100 text-gray-800",
	warning: "bg-yellow-100 text-yellow-800",
	error: "bg-red-100 text-red-800",
	info: "bg-blue-100 text-blue-800",
	purple: "bg-purple-100 text-purple-800",
};

export const button = {
	base: "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
	primary:
		"bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500 px-4 py-2",
	secondary:
		"bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500 px-4 py-2",
	ghost:
		"text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500 px-2 py-1",
	gradient:
		"bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 focus:ring-purple-500 px-4 py-2",
};

export const card = {
	base: "bg-white rounded-2xl border border-gray-200",
	default: "bg-white rounded-2xl border border-gray-200 p-6",
	hover:
		"bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all",
};

export const input = {
	base: "block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500",
	text: "block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500",
	textarea:
		"block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none",
	select:
		"block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500",
};
