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
  h1: "text-3xl font-bold text-neutral-900",
  h2: "text-2xl font-bold text-neutral-900",
  h3: "text-lg font-medium text-neutral-900",
  h4: "text-base font-semibold text-neutral-900",
  body: "text-neutral-700",
  label: "block text-sm font-medium text-neutral-700 mb-1",
  muted: "text-neutral-600 text-sm",
  helper: "text-xs text-neutral-500",
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
  neutral: "bg-neutral-100 text-neutral-800",
  warning: "bg-yellow-100 text-yellow-800",
  error: "bg-red-100 text-red-800",
  info: "bg-blue-100 text-blue-800",
  purple: "bg-primary-100 text-primary-800",
};

export const button = {
  base: "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
  primary:
    "bg-primary text-white hover:bg-primary-hover focus:ring-primary-light px-4 py-2",
  secondary:
    "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 focus:ring-neutral-500 px-4 py-2",
  ghost:
    "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 focus:ring-neutral-500 px-2 py-1",
  gradient:
    "bg-gradient-to-r from-primary to-indigo-600 text-white hover:from-primary-hover hover:to-indigo-700 focus:ring-primary-light px-4 py-2",
};

export const card = {
  base: "bg-white rounded-2xl",
  default: "bg-white rounded-2xl shadow-sm p-6",
  hover: "bg-white rounded-2xl shadow-sm hover:shadow-md transition-all",
};

export const input = {
  base: "block w-full rounded-lg bg-surface px-3 py-2 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-light",
  text: "block w-full rounded-lg bg-surface px-3 py-2 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-light",
  textarea:
    "block w-full rounded-lg bg-surface px-3 py-2 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-light resize-none",
  select:
    "block w-full rounded-lg bg-surface px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-light",
};
