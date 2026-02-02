import {
	type Accessor,
	type ParentProps,
	createContext,
	createSignal,
	useContext,
} from "solid-js";

type Theme = "light" | "dark";

interface ThemeContextValue {
	theme: Accessor<Theme>;
	toggleTheme: (event: MouseEvent) => void;
}

const ThemeContext = createContext<ThemeContextValue>();

function getInitialTheme(): Theme {
	if (typeof window === "undefined") return "light";
	const stored = localStorage.getItem("theme");
	if (stored === "dark" || stored === "light") return stored;
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

// Apply theme class synchronously to prevent flash
function applyTheme(theme: Theme) {
	if (typeof document === "undefined") return;
	document.documentElement.classList.toggle("dark", theme === "dark");
}

// Initialize before render
const initialTheme = getInitialTheme();
applyTheme(initialTheme);

export function ThemeProvider(props: ParentProps) {
	const [theme, setTheme] = createSignal<Theme>(initialTheme);

	const toggleTheme = (_event: MouseEvent) => {
		const newTheme = theme() === "light" ? "dark" : "light";
		const toDark = newTheme === "dark";

		const applyChange = () => {
			setTheme(newTheme);
			applyTheme(newTheme);
			localStorage.setItem("theme", newTheme);
		};

		// Use View Transition API if available
		if (document.startViewTransition) {
			const transition = document.startViewTransition(applyChange);

			// Animate with diagonal wipe via clip-path polygon
			transition.ready.then(() => {
				// Diagonal wipe with a straight line edge (no visible leading point).
				// Uses a 4-point polygon where the leading edge is always a full
				// diagonal line spanning corner-to-corner, sliding across the viewport.
				// Parallelogram wipe: two parallel diagonal edges slide across.
				// The trailing edge is offset far enough to always cover the viewport.
				// Light→Dark: slides top-left → bottom-right
				// Dark→Light: slides bottom-right → top-left
				const keyframes = toDark
					? [
							{
								clipPath:
									"polygon(0% -100%, -100% 0%, -200% -100%, -100% -200%)",
							},
							{ clipPath: "polygon(0% -100%, -100% 0%, 100% 200%, 200% 100%)" },
						]
					: [
							{
								clipPath: "polygon(100% 200%, 200% 100%, 300% 200%, 200% 300%)",
							},
							{ clipPath: "polygon(100% 200%, 200% 100%, 0% -100%, -100% 0%)" },
						];

				document.documentElement.animate(keyframes, {
					duration: 1000,
					easing: "cubic-bezier(0.4, 0, 0.2, 1)",
					pseudoElement: "::view-transition-new(root)",
				});
			});
		} else {
			applyChange();
		}
	};

	return (
		<ThemeContext.Provider value={{ theme, toggleTheme }}>
			{props.children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	const ctx = useContext(ThemeContext);
	if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
	return ctx;
}
