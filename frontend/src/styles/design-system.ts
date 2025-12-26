/**
 * Design System - Reusable component class patterns
 *
 * These utilities ensure consistent styling across the app.
 * Update CSS variables in app.css to change colors globally.
 */

export const button = {
	// Primary button (main CTAs)
	primary:
		"bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed",

	// Secondary button (less prominent actions)
	secondary:
		"bg-gray-200 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed",

	// Danger button (destructive actions)
	danger:
		"bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed",

	// Success button
	success:
		"bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed",

	// Ghost button (minimal)
	ghost:
		"text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium",

	// Icon button
	icon: "p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center",

	// Gradient button (special CTAs)
	gradient:
		"bg-linear-to-r from-purple-600 to-pink-500 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-600 transition-all font-semibold shadow-md",
};

export const input = {
	// Standard text input
	text: "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed",

	// Input with error
	error:
		"w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent",

	// Select dropdown
	select:
		"w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white",

	// Textarea
	textarea:
		"w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none",
};

export const card = {
	// Standard card
	base: "bg-white border border-gray-200 rounded-2xl shadow-sm",

	// Card with padding
	default: "bg-white border border-gray-200 rounded-2xl shadow-sm p-6",

	// Interactive card (clickable)
	interactive:
		"bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer",

	// Gradient card (special sections)
	gradient:
		"bg-linear-to-r from-purple-600 to-pink-600 rounded-lg shadow-sm p-6 text-white",

	// Section card with header
	section: "bg-white rounded-lg shadow-sm border border-gray-200 p-6",
};

export const text = {
	// Page heading
	h1: "text-3xl font-bold text-gray-900",

	// Section heading
	h2: "text-2xl font-bold text-gray-900",

	// Subsection heading
	h3: "text-lg font-medium text-gray-900",

	// Card title
	h4: "text-base font-semibold text-gray-900",

	// Body text
	body: "text-gray-700",

	// Form label
	label: "block text-sm font-medium text-gray-700 mb-1",

	// Secondary/muted text
	muted: "text-gray-600 text-sm",

	// Small helper text
	helper: "text-xs text-gray-500",

	// Error text
	error: "text-sm text-red-600",

	// Success text
	success: "text-sm text-green-600",
};

export const badge = {
	// Status badges
	success:
		"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800",
	warning:
		"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800",
	error:
		"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800",
	info: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800",
	neutral:
		"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800",
};

export const alert = {
	// Alert boxes
	success:
		"flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-200",
	warning:
		"flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200",
	error:
		"flex items-start space-x-3 p-3 bg-red-50 rounded-lg border border-red-200",
	info: "flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200",
};

export const link = {
	// Standard link
	default:
		"text-purple-600 hover:text-purple-700 font-medium transition-colors",

	// Muted link
	muted: "text-gray-600 hover:text-gray-900 transition-colors",

	// Navigation link
	nav: "text-gray-300 hover:text-white transition-colors",
};

export const layout = {
	// Container max widths
	container: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
	containerNarrow: "max-w-3xl mx-auto px-4 sm:px-6 lg:px-8",
	containerWide: "max-w-6xl mx-auto",

	// Common spacing
	section: "space-y-6",
	sectionLarge: "space-y-8",
};

export const chart = {
	// Chart container
	container: "h-64 relative pl-12",

	// Chart header with title and legend
	header: "flex items-center justify-between mb-4",
	title: "text-lg font-medium text-gray-900",

	// Legend styles
	legend: "flex items-center gap-4 text-xs text-gray-500",
	legendItem: "flex items-center gap-1",
	legendDotPrimary: "w-3 h-3 rounded-full bg-indigo-500",
	legendDotSecondary: "w-3 h-3 rounded-full bg-indigo-300",

	// Axis labels
	yAxisLabels:
		"absolute left-0 top-0 bottom-6 flex flex-col justify-between text-xs text-gray-500",
	xAxisLabels:
		"absolute bottom-0 left-12 right-0 flex justify-between text-xs text-gray-500",

	// Empty state
	emptyState: "h-64 flex items-center justify-center",
	emptyContent: "text-center text-gray-400",
	emptyIcon: "mx-auto h-12 w-12 mb-3",
	emptyTitle: "text-sm font-medium",
	emptyDescription: "text-xs mt-1",

	// Summary stats
	summaryContainer:
		"mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4 text-center",
	summaryValue: "text-2xl font-semibold text-gray-900",
	summaryValueHighlight: "text-2xl font-semibold text-indigo-600",
	summaryLabel: "text-xs text-gray-500",

	// SVG colors (for inline use)
	colors: {
		primary: "rgb(99, 102, 241)",
		primaryLight: "rgb(165, 180, 252)",
		primaryDark: "rgb(79, 70, 229)",
		gridLine: "#e5e7eb",
		baseline: "#d1d5db",
	},
};

export const progressBar = {
	// Progress bar track
	track: "w-full bg-gray-200 rounded-full",

	// Progress bar sizes
	sm: "h-1",
	md: "h-2",
	lg: "h-3",

	// Progress bar fill variants
	primary: "bg-indigo-600 rounded-full transition-all duration-500",
	success: "bg-green-600 rounded-full transition-all duration-500",
	warning: "bg-yellow-500 rounded-full transition-all duration-500",
	danger: "bg-red-600 rounded-full transition-all duration-500",

	// With label
	labelContainer: "flex justify-between text-sm mb-1",
	labelText: "text-gray-600",
	labelValue: "font-medium text-gray-900",
};

export const stat = {
	// Stat card container
	container: "text-center",

	// Stat values
	valueSm: "text-lg font-semibold text-gray-900",
	valueMd: "text-2xl font-semibold text-gray-900",
	valueLg: "text-3xl font-bold text-gray-900",

	// Highlighted values
	valueHighlightSm: "text-lg font-semibold text-indigo-600",
	valueHighlightMd: "text-2xl font-semibold text-indigo-600",
	valueHighlightLg: "text-3xl font-bold text-indigo-600",

	// Stat labels
	label: "text-xs text-gray-500",
	labelMd: "text-sm text-gray-500",
};

export const table = {
	// Table container
	container: "overflow-x-auto",

	// Table element
	table: "min-w-full divide-y divide-gray-200",

	// Table header
	thead: "bg-gray-50",
	th: "px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider",

	// Table body
	tbody: "bg-white divide-y divide-gray-200",
	tr: "hover:bg-gray-50",
	td: "px-6 py-4 whitespace-nowrap text-sm text-gray-900",
	tdMuted: "px-6 py-4 whitespace-nowrap text-sm text-gray-500",

	// Empty state
	empty: "px-6 py-12 text-center",
};

/**
 * Helper function to merge class names
 * Usage: cn(button.primary, "text-lg") => "bg-purple-600 ... text-lg"
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
	return classes.filter(Boolean).join(" ");
}
