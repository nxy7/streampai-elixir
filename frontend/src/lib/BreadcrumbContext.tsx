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
 * Only one page's breadcrumbs are shown at a time - registering new breadcrumbs
 * replaces any existing ones to handle SolidJS routing where components may not
 * properly unmount on navigation.
 */
export function BreadcrumbProvider(props: { children: JSX.Element }) {
	const [currentEntry, setCurrentEntry] = createSignal<BreadcrumbEntry | null>(
		null,
	);

	// Derived signal that returns the current breadcrumb items
	const items = createMemo(() => {
		const entry = currentEntry();
		return entry ? entry.getItems() : [];
	});

	const register = (getItems: Accessor<BreadcrumbItem[]>): (() => void) => {
		const id = createUniqueId();
		// Replace any existing breadcrumbs with the new ones
		setCurrentEntry({ id, getItems });

		// Return cleanup function
		return () => {
			// Only clear if this registration is still the current one
			setCurrentEntry((prev) => (prev?.id === id ? null : prev));
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
 * // Static breadcrumbs
 * useBreadcrumbs(() => [
 *   { label: "Widgets", href: "/dashboard/widgets" },
 *   { label: "Timer Widget" }
 * ]);
 *
 * // Dynamic breadcrumbs (reactive)
 * useBreadcrumbs(() => [
 *   { label: t("dashboardNav.widgets"), href: "/dashboard/widgets" },
 *   { label: widget()?.name ?? t("common.loading") }
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
