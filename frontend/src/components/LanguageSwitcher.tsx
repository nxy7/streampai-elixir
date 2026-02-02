import { type Accessor, createMemo } from "solid-js";
import { Select } from "~/design-system";
import { LOCALE_NAMES, type Locale, SUPPORTED_LOCALES, useI18n } from "~/i18n";
import { useCurrentUser } from "~/lib/auth";
import { saveLanguagePreference } from "~/sdk/ash_rpc";

interface LanguageSwitcherProps {
	class?: string;
	/**
	 * Override value from database. When provided, this value is displayed
	 * instead of the current active locale. Useful in settings pages where
	 * you want to show/edit the user's saved preference rather than the
	 * active UI locale (which may differ during impersonation).
	 *
	 * Note: Ensure the parent component waits for data to load before rendering
	 * this component when using valueFromDb, otherwise it will briefly show
	 * the active locale before the database value loads.
	 */
	valueFromDb?: Accessor<string | null | undefined>;
	wrapperClass?: string;
}

export default function LanguageSwitcher(props: LanguageSwitcherProps) {
	const { locale, setLocale } = useI18n();
	const { user } = useCurrentUser();

	// Use database value if provided and valid, otherwise fall back to active locale
	const displayedValue = createMemo(() => {
		const dbValue = props.valueFromDb?.();
		if (dbValue && SUPPORTED_LOCALES.includes(dbValue as Locale)) {
			return dbValue as Locale;
		}
		return locale();
	});

	const handleLanguageChange = async (newLocale: Locale) => {
		// Update local state immediately for responsive UI
		setLocale(newLocale);

		// If user is logged in, save preference to database
		const currentUser = user();
		if (currentUser) {
			try {
				await saveLanguagePreference({
					identity: currentUser.id,
					input: { language: newLocale },
					fetchOptions: { credentials: "include" },
				});
			} catch (error) {
				console.error("Failed to save language preference:", error);
				// Don't revert the local change - the localStorage will keep the preference
			}
		}
	};

	const languageOptions = SUPPORTED_LOCALES.map((localeCode) => ({
		value: localeCode,
		label: LOCALE_NAMES[localeCode],
	}));

	return (
		<Select
			class={props.class}
			onChange={(value) => handleLanguageChange(value as Locale)}
			options={languageOptions}
			value={displayedValue()}
			wrapperClass={props.wrapperClass}
		/>
	);
}
