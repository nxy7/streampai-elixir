import {
	type Accessor,
	type JSX,
	createContext,
	createMemo,
	createSignal,
	createUniqueId,
	onCleanup,
	useContext,
} from "solid-js";

export interface BreadcrumbItem {
	/** Display label for this breadcrumb item */
	label: string;
	/** URL to navigate to (if omitted, item is not clickable) */
	href?: string;
}

interface BreadcrumbEntry {
	id: string;
	getItems: Accessor<BreadcrumbItem[]>;
}

interface BreadcrumbContextValue {
	/** Current breadcrumb items (reactive) */
	items: Accessor<BreadcrumbItem[]>;
	/** Register breadcrumb items with a reactive accessor (returns cleanup function) */
	register: (getItems: Accessor<BreadcrumbItem[]>) => () => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue>();

/**
 * Provider component that manages the breadcrumb registry.
 * Should wrap the dashboard layout to provide breadcrumb context to all pages.
 *
 * Uses a registry pattern where pages register accessor functions rather than
 * static values. This ensures breadcrumbs update reactively when async data loads.
 */
export function BreadcrumbProvider(props: { children: JSX.Element }) {
	const [entries, setEntries] = createSignal<BreadcrumbEntry[]>([]);

	// Derived signal that flattens all registered breadcrumb items
	// This is reactive - when any registered accessor updates, this recomputes
	const items = createMemo(() => {
		return entries().flatMap((entry) => entry.getItems());
	});

	const register = (getItems: Accessor<BreadcrumbItem[]>): (() => void) => {
		const id = createUniqueId();
		setEntries((prev) => [...prev, { id, getItems }]);

		// Return cleanup function that removes this registration
		return () => {
			setEntries((prev) => prev.filter((entry) => entry.id !== id));
		};
	};

	return (
		<BreadcrumbContext.Provider value={{ items, register }}>
			{props.children}
		</BreadcrumbContext.Provider>
	);
}

/**
 * Hook to access the breadcrumb context.
 * Must be used within a BreadcrumbProvider.
 */
export function useBreadcrumbContext(): BreadcrumbContextValue {
	const context = useContext(BreadcrumbContext);
	if (!context) {
		throw new Error(
			"useBreadcrumbContext must be used within a BreadcrumbProvider",
		);
	}
	return context;
}

/**
 * Hook to register breadcrumb items that automatically clean up on unmount.
 * Uses a reactive accessor pattern so breadcrumbs update when data changes.
 *
 * @example
 * ```tsx
 * // In a nested page component with async data:
 * useBreadcrumbs(() => [
 *   { label: t("dashboardNav.widgets"), href: "/dashboard/widgets" },
 *   { label: widget()?.name ?? "Loading..." }
 * ]);
 * ```
 */
export function useBreadcrumbs(getItems: () => BreadcrumbItem[]): void {
	const { register } = useBreadcrumbContext();

	// Wrap in createMemo to make it a proper accessor that tracks dependencies
	const itemsAccessor = createMemo(getItems);

	// Register immediately (not in onMount) so breadcrumbs appear on first render
	const cleanup = register(itemsAccessor);
	onCleanup(cleanup);
}
