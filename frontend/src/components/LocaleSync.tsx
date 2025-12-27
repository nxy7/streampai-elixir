import { createEffect } from "solid-js";
import { useI18n } from "~/i18n";
import { useCurrentUser } from "~/lib/auth";
import { useUserPreferencesForUser } from "~/lib/useElectric";

/**
 * Syncs the user's language preference from the database to the i18n context.
 * This component should be placed inside both the I18nProvider and AuthProvider.
 *
 * When a user logs in and their preferences load, this will update the
 * interface language to match their saved preference (if they have one).
 */
export function LocaleSync() {
	const { user } = useCurrentUser();
	const { setLocaleFromDb } = useI18n();
	const prefs = useUserPreferencesForUser(() => user()?.id);

	createEffect(() => {
		const data = prefs.data();
		if (data?.language_preference) {
			setLocaleFromDb(data.language_preference);
		}
	});

	// This component renders nothing
	return null;
}
