import { For } from "solid-js";
import { Select } from "~/components/ui/Input";
import { LOCALE_NAMES, type Locale, SUPPORTED_LOCALES, useI18n } from "~/i18n";
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
		<Select
			aria-label="Select language"
			class={props.class}
			data-testid="language-switcher"
			onChange={(e) => handleLanguageChange(e.currentTarget.value as Locale)}
			value={locale()}>
			<For each={[...SUPPORTED_LOCALES]}>
				{(localeCode) => (
					<option value={localeCode}>{LOCALE_NAMES[localeCode]}</option>
				)}
			</For>
		</Select>
	);
}
