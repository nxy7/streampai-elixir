import { A } from "@solidjs/router";
import { For, type JSX, Show } from "solid-js";

export interface BreadcrumbItem {
	/** Display label for this breadcrumb item */
	label: string;
	/** URL to navigate to (if omitted, item is not clickable) */
	href?: string;
}

interface BreadcrumbsProps {
	/** Array of breadcrumb items to display */
	items: BreadcrumbItem[];
	/** Optional CSS class */
	class?: string;
}

/**
 * Breadcrumbs navigation component for nested dashboard pages.
 *
 * @example
 * ```tsx
 * <Breadcrumbs
 *   items={[
 *     { label: "Widgets", href: "/dashboard/widgets" },
 *     { label: "Timer Widget" }
 *   ]}
 * />
 * ```
 */
export default function Breadcrumbs(props: BreadcrumbsProps): JSX.Element {
	return (
		<nav
			aria-label="Breadcrumb"
			class={`flex items-center space-x-2 text-sm ${props.class ?? ""}`}>
			<For each={props.items}>
				{(item, index) => (
					<>
						<Show when={index() > 0}>
							<ChevronIcon />
						</Show>
						<Show
							fallback={
								<span class="font-medium text-gray-900">{item.label}</span>
							}
							when={item.href}>
							{(href) => (
								<A
									class="text-gray-500 transition-colors hover:text-purple-600"
									href={href()}>
									{item.label}
								</A>
							)}
						</Show>
					</>
				)}
			</For>
		</nav>
	);
}

function ChevronIcon() {
	return (
		<svg
			aria-hidden="true"
			class="h-4 w-4 shrink-0 text-gray-400"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24">
			<path
				d="M9 5l7 7-7 7"
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
			/>
		</svg>
	);
}
