import {
	createContext,
	createEffect,
	createSignal,
	onMount,
	useContext,
	type ParentComponent,
} from "solid-js";

// Supported themes
export const SUPPORTED_THEMES = ["light", "dark", "system"] as const;
export type Theme = (typeof SUPPORTED_THEMES)[number];
export type ResolvedTheme = "light" | "dark";

// Default theme
export const DEFAULT_THEME: Theme = "system";

// Storage key for persisting theme preference
const THEME_STORAGE_KEY = "streampai_theme";

// Detect system color scheme preference
function getSystemTheme(): ResolvedTheme {
	if (typeof window === "undefined") return "light";
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

// Get initial theme from storage or default to system
function getInitialTheme(): Theme {
	if (typeof localStorage !== "undefined") {
		const stored = localStorage.getItem(THEME_STORAGE_KEY);
		if (stored && SUPPORTED_THEMES.includes(stored as Theme)) {
			return stored as Theme;
		}
	}
	return DEFAULT_THEME;
}

// Resolve theme to actual light/dark value
function resolveTheme(theme: Theme): ResolvedTheme {
	if (theme === "system") {
		return getSystemTheme();
	}
	return theme;
}

// Apply theme to document
function applyTheme(resolvedTheme: ResolvedTheme) {
	if (typeof document === "undefined") return;

	const root = document.documentElement;
	root.setAttribute("data-theme", resolvedTheme);

	// Also update color-scheme for native browser elements
	root.style.colorScheme = resolvedTheme;
}

// Theme context type
export type ThemeContextValue = {
	theme: () => Theme;
	resolvedTheme: () => ResolvedTheme;
	setTheme: (theme: Theme) => void;
	setThemeFromDb: (theme: string | null) => void;
};

export const ThemeContext = createContext<ThemeContextValue>();

// Theme Provider component
export const ThemeProvider: ParentComponent = (props) => {
	const [theme, setThemeSignal] = createSignal<Theme>(DEFAULT_THEME);
	const [resolvedTheme, setResolvedTheme] =
		createSignal<ResolvedTheme>("light");
	const [mounted, setMounted] = createSignal(false);

	// Initialize theme from storage on mount
	onMount(() => {
		const initial = getInitialTheme();
		setThemeSignal(initial);
		const resolved = resolveTheme(initial);
		setResolvedTheme(resolved);
		applyTheme(resolved);
		setMounted(true);

		// Listen for system theme changes when theme is set to "system"
		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		const handleChange = () => {
			if (theme() === "system") {
				const newResolved = getSystemTheme();
				setResolvedTheme(newResolved);
				applyTheme(newResolved);
			}
		};
		mediaQuery.addEventListener("change", handleChange);

		// Cleanup listener on unmount
		return () => mediaQuery.removeEventListener("change", handleChange);
	});

	// Persist theme changes to storage and apply to document
	createEffect(() => {
		if (mounted()) {
			const currentTheme = theme();
			localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
			const resolved = resolveTheme(currentTheme);
			setResolvedTheme(resolved);
			applyTheme(resolved);
		}
	});

	// Set theme and persist
	const setTheme = (newTheme: Theme) => {
		if (SUPPORTED_THEMES.includes(newTheme)) {
			setThemeSignal(newTheme);
		}
	};

	// Set theme from DB preference (only updates if different from current)
	// This is used to sync theme from user preferences without triggering unnecessary updates
	const setThemeFromDb = (dbTheme: string | null) => {
		if (
			dbTheme &&
			SUPPORTED_THEMES.includes(dbTheme as Theme) &&
			dbTheme !== theme()
		) {
			setThemeSignal(dbTheme as Theme);
		}
	};

	const contextValue: ThemeContextValue = {
		theme,
		resolvedTheme,
		setTheme,
		setThemeFromDb,
	};

	return (
		<ThemeContext.Provider value={contextValue}>
			{props.children}
		</ThemeContext.Provider>
	);
};

// Hook to use theme context
export function useTheme(): ThemeContextValue {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
}

// Theme display names
export const THEME_NAMES: Record<Theme, string> = {
	light: "Light",
	dark: "Dark",
	system: "System",
};

// Theme icons (for UI)
export const THEME_ICONS: Record<Theme, string> = {
	light: "sun",
	dark: "moon",
	system: "computer",
};
