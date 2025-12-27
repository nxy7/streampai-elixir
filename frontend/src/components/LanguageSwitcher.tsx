import { For } from "solid-js";
import {
	LOCALE_NAMES,
	SUPPORTED_LOCALES,
	useI18n,
	type Locale,
} from "~/i18n";

interface LanguageSwitcherProps {
	class?: string;
}

export default function LanguageSwitcher(props: LanguageSwitcherProps) {
	const { locale, setLocale } = useI18n();

	return (
		<select
			value={locale()}
			onChange={(e) => setLocale(e.currentTarget.value as Locale)}
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
