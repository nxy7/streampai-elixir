/**
 * Design System - Reusable utilities
 *
 * Note: Most component-level styles have been migrated to UI components in ~/components/ui/
 * - Button: ~/components/ui/Button.tsx
 * - Card: ~/components/ui/Card.tsx
 * - Badge: ~/components/ui/Badge.tsx
 * - Alert: ~/components/ui/Alert.tsx
 * - Input/Select/Textarea: ~/components/ui/Input.tsx
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

export const link = {
	default:
		"text-purple-600 hover:text-purple-700 font-medium transition-colors",
	muted: "text-gray-600 hover:text-gray-900 transition-colors",
	nav: "text-gray-300 hover:text-white transition-colors",
};

export const layout = {
	container: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
	containerNarrow: "max-w-3xl mx-auto px-4 sm:px-6 lg:px-8",
	containerWide: "max-w-6xl mx-auto",
	section: "space-y-6",
	sectionLarge: "space-y-8",
};

export const chart = {
	container: "h-64 relative pl-12",
	header: "flex items-center justify-between mb-4",
	title: "text-lg font-medium text-gray-900",
	legend: "flex items-center gap-4 text-xs text-gray-500",
	legendItem: "flex items-center gap-1",
	legendDotPrimary: "w-3 h-3 rounded-full bg-indigo-500",
	legendDotSecondary: "w-3 h-3 rounded-full bg-indigo-300",
	yAxisLabels:
		"absolute left-0 top-0 bottom-6 flex flex-col justify-between text-xs text-gray-500",
	xAxisLabels:
		"absolute bottom-0 left-12 right-0 flex justify-between text-xs text-gray-500",
	emptyState: "h-64 flex items-center justify-center",
	emptyContent: "text-center text-gray-400",
	emptyIcon: "mx-auto h-12 w-12 mb-3",
	emptyTitle: "text-sm font-medium",
	emptyDescription: "text-xs mt-1",
	summaryContainer:
		"mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4 text-center",
	summaryValue: "text-2xl font-semibold text-gray-900",
	summaryValueHighlight: "text-2xl font-semibold text-indigo-600",
	summaryLabel: "text-xs text-gray-500",
	colors: {
		primary: "rgb(99, 102, 241)",
		primaryLight: "rgb(165, 180, 252)",
		primaryDark: "rgb(79, 70, 229)",
		gridLine: "#e5e7eb",
		baseline: "#d1d5db",
	},
};

export const progressBar = {
	track: "w-full bg-gray-200 rounded-full",
	sm: "h-1",
	md: "h-2",
	lg: "h-3",
	primary: "bg-indigo-600 rounded-full transition-all duration-500",
	success: "bg-green-600 rounded-full transition-all duration-500",
	warning: "bg-yellow-500 rounded-full transition-all duration-500",
	danger: "bg-red-600 rounded-full transition-all duration-500",
	labelContainer: "flex justify-between text-sm mb-1",
	labelText: "text-gray-600",
	labelValue: "font-medium text-gray-900",
};

export const stat = {
	container: "text-center",
	valueSm: "text-lg font-semibold text-gray-900",
	valueMd: "text-2xl font-semibold text-gray-900",
	valueLg: "text-3xl font-bold text-gray-900",
	valueHighlightSm: "text-lg font-semibold text-indigo-600",
	valueHighlightMd: "text-2xl font-semibold text-indigo-600",
	valueHighlightLg: "text-3xl font-bold text-indigo-600",
	label: "text-xs text-gray-500",
	labelMd: "text-sm text-gray-500",
};

export const table = {
	container: "overflow-x-auto",
	table: "min-w-full divide-y divide-gray-200",
	thead: "bg-gray-50",
	th: "px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider",
	tbody: "bg-white divide-y divide-gray-200",
	tr: "hover:bg-gray-50",
	td: "px-6 py-4 whitespace-nowrap text-sm text-gray-900",
	tdMuted: "px-6 py-4 whitespace-nowrap text-sm text-gray-500",
	empty: "px-6 py-12 text-center",
};

export const skeleton = {
	base: "animate-pulse bg-gray-200 rounded",
	rounded: "animate-pulse bg-gray-200 rounded",
	roundedLg: "animate-pulse bg-gray-200 rounded-lg",
	roundedFull: "animate-pulse bg-gray-200 rounded-full",
	rounded2xl: "animate-pulse bg-gray-200 rounded-2xl",
	text: "h-4 animate-pulse bg-gray-200 rounded",
	textSm: "h-3 animate-pulse bg-gray-200 rounded",
	textLg: "h-5 animate-pulse bg-gray-200 rounded",
	avatarSm: "h-6 w-6 animate-pulse bg-gray-200 rounded-full",
	avatarMd: "h-8 w-8 animate-pulse bg-gray-200 rounded-full",
	avatarLg: "h-10 w-10 animate-pulse bg-gray-200 rounded-full",
	avatarXl: "h-12 w-12 animate-pulse bg-gray-200 rounded-full",
	icon: "h-5 w-5 animate-pulse bg-gray-200 rounded",
	iconLg: "h-10 w-10 animate-pulse bg-gray-200 rounded-lg",
	button: "h-9 animate-pulse bg-gray-200 rounded-lg",
	buttonSm: "h-8 animate-pulse bg-gray-200 rounded-lg",
	card: "animate-pulse bg-gray-200 rounded-2xl border border-gray-200",
};

export function cn(...classes: (string | undefined | null | false)[]): string {
	return classes.filter(Boolean).join(" ");
}

// Legacy exports for backwards compatibility with StreamControlsWidget
// These were migrated to ~/components/ui/ but are still used by some components
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
	hover: "bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all",
};

export const input = {
	base: "block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500",
	text: "block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500",
	textarea:
		"block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none",
	select:
		"block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500",
};
