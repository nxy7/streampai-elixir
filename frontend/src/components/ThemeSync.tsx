import { createEffect } from "solid-js";
import { useTheme } from "~/lib/theme";
import { useCurrentUser } from "~/lib/auth";
import { useUserPreferencesForUser } from "~/lib/useElectric";

/**
 * Syncs the user's theme preference from the database to the theme context.
 * This component should be placed inside both the ThemeProvider and AuthProvider.
 *
 * When a user logs in and their preferences load, this will update the
 * theme to match their saved preference (if they have one).
 */
export function ThemeSync() {
	const { user } = useCurrentUser();
	const { setThemeFromDb } = useTheme();
	const prefs = useUserPreferencesForUser(() => user()?.id);

	createEffect(() => {
		const data = prefs.data();
		if (data?.theme_preference) {
			setThemeFromDb(data.theme_preference);
		}
	});

	// This component renders nothing
	return null;
}
