import { For } from "solid-js";
import {
	SUPPORTED_THEMES,
	THEME_NAMES,
	useTheme,
	type Theme,
} from "~/lib/theme";
import { useCurrentUser } from "~/lib/auth";
import { saveThemePreference } from "~/sdk/ash_rpc";
import { useTranslation } from "~/i18n";

interface ThemeSwitcherProps {
	class?: string;
}

export default function ThemeSwitcher(props: ThemeSwitcherProps) {
	const { theme, setTheme } = useTheme();
	const { user } = useCurrentUser();
	const { t } = useTranslation();

	const handleThemeChange = async (newTheme: Theme) => {
		// Update local state immediately for responsive UI
		setTheme(newTheme);

		// If user is logged in, save preference to database
		const currentUser = user();
		if (currentUser) {
			try {
				await saveThemePreference({
					identity: currentUser.id,
					input: { theme: newTheme },
					fetchOptions: { credentials: "include" },
				});
			} catch (error) {
				console.error("Failed to save theme preference:", error);
				// Don't revert the local change - the localStorage will keep the preference
			}
		}
	};

	// Theme option data with icons
	const themeOptions = [
		{
			value: "light" as Theme,
			label: t("settings.themeLight") || "Light",
			icon: (
				<svg
					class="h-5 w-5"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
					/>
				</svg>
			),
		},
		{
			value: "dark" as Theme,
			label: t("settings.themeDark") || "Dark",
			icon: (
				<svg
					class="h-5 w-5"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
					/>
				</svg>
			),
		},
		{
			value: "system" as Theme,
			label: t("settings.themeSystem") || "System",
			icon: (
				<svg
					class="h-5 w-5"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
					/>
				</svg>
			),
		},
	];

	return (
		<div class={`flex gap-2 ${props.class || ""}`} data-testid="theme-switcher">
			<For each={themeOptions}>
				{(option) => (
					<button
						type="button"
						onClick={() => handleThemeChange(option.value)}
						class={`flex flex-1 flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all ${
							theme() === option.value
								? "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300"
								: "border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text-secondary)] hover:border-[var(--theme-border-hover)] hover:bg-[var(--theme-bg-hover)]"
						}`}
						aria-pressed={theme() === option.value}
						aria-label={`Select ${option.label} theme`}>
						<span
							class={
								theme() === option.value
									? "text-purple-600 dark:text-purple-400"
									: ""
							}>
							{option.icon}
						</span>
						<span class="font-medium text-sm">{option.label}</span>
					</button>
				)}
			</For>
		</div>
	);
}

// Compact version for use in header/navigation
export function ThemeSwitcherCompact(props: ThemeSwitcherProps) {
	const { theme, resolvedTheme, setTheme } = useTheme();
	const { user } = useCurrentUser();

	const handleThemeToggle = async () => {
		// Cycle through: light -> dark -> system -> light
		const newTheme: Theme =
			theme() === "light" ? "dark" : theme() === "dark" ? "system" : "light";

		setTheme(newTheme);

		const currentUser = user();
		if (currentUser) {
			try {
				await saveThemePreference({
					identity: currentUser.id,
					input: { theme: newTheme },
					fetchOptions: { credentials: "include" },
				});
			} catch (error) {
				console.error("Failed to save theme preference:", error);
			}
		}
	};

	return (
		<button
			type="button"
			onClick={handleThemeToggle}
			class={`rounded-lg p-2 transition-colors hover:bg-[var(--theme-bg-hover)] ${props.class || ""}`}
			aria-label={`Current theme: ${theme()}. Click to change.`}
			data-testid="theme-switcher-compact">
			{resolvedTheme() === "dark" ? (
				<svg
					class="h-5 w-5 text-[var(--theme-text-secondary)]"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
					/>
				</svg>
			) : (
				<svg
					class="h-5 w-5 text-[var(--theme-text-secondary)]"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
					/>
				</svg>
			)}
		</button>
	);
}
