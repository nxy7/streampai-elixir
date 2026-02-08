import { createEffect, createMemo } from "solid-js";
import { useI18n } from "~/i18n";
import { useCurrentUser, useImpersonation } from "~/lib/auth";
import { useUserPreferencesForUser } from "~/lib/useElectric";

/**
 * Syncs the user's language preference from the database to the i18n context.
 * This component should be placed inside both the I18nProvider and AuthProvider.
 *
 * When a user logs in and their preferences load, this will update the
 * interface language to match their saved preference (if they have one).
 *
 * During impersonation, the impersonator's locale preference takes priority
 * over the impersonated user's preference.
 */
export function LocaleSync() {
	const { user } = useCurrentUser();
	const { setLocaleFromDb } = useI18n();
	const { isImpersonating, impersonator } = useImpersonation();

	// When impersonating, use the impersonator's ID for preferences
	// Otherwise use the current user's ID
	const prefsUserId = createMemo(() => {
		if (isImpersonating() && impersonator()) {
			return impersonator()?.id;
		}
		return user()?.id;
	});

	const prefs = useUserPreferencesForUser(prefsUserId);

	createEffect(() => {
		const data = prefs.data();
		if (data?.language_preference) {
			setLocaleFromDb(data.language_preference);
		}
	});

	// This component renders nothing
	return null;
}
