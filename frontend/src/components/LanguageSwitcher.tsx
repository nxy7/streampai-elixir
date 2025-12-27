import { For } from "solid-js";
import { LOCALE_NAMES, SUPPORTED_LOCALES, useI18n, type Locale } from "~/i18n";
import { useCurrentUser } from "~/lib/auth";
import { saveLanguagePreference } from "~/sdk/ash_rpc";

interface LanguageSwitcherProps {
	class?: string;
}

export default function LanguageSwitcher(props: LanguageSwitcherProps) {
	const { locale, setLocale } = useI18n();
	const { user } = useCurrentUser();

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

	return (
		<select
			value={locale()}
			onChange={(e) => handleLanguageChange(e.currentTarget.value as Locale)}
			class={`rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 ${props.class ?? ""}`}
			aria-label="Select language"
			data-testid="language-switcher">
			<For each={[...SUPPORTED_LOCALES]}>
				{(localeCode) => (
					<option value={localeCode}>{LOCALE_NAMES[localeCode]}</option>
				)}
			</For>
		</select>
	);
}
