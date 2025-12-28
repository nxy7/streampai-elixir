import * as i18n from "@solid-primitives/i18n";
import {
	type ParentComponent,
	createContext,
	createEffect,
	createResource,
	createSignal,
	onMount,
	useContext,
} from "solid-js";
import type { Dictionary } from "./locales/en";

// Supported locales
export const SUPPORTED_LOCALES = ["en", "de", "pl", "es"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

// Default locale
export const DEFAULT_LOCALE: Locale = "en";

// Storage key for persisting language preference
const LOCALE_STORAGE_KEY = "streampai_locale";

// Type for flattened dictionary
export type FlatDictionary = i18n.Flatten<Dictionary>;

// Async loader for dictionaries (enables code splitting)
async function fetchDictionary(locale: Locale): Promise<FlatDictionary> {
	const module = await import(`./locales/${locale}.ts`);
	return i18n.flatten(module.dict) as FlatDictionary;
}

// Detect browser language and match to supported locale
function detectBrowserLocale(): Locale {
	if (typeof navigator === "undefined") return DEFAULT_LOCALE;

	const browserLang = navigator.language?.split("-")[0]?.toLowerCase();
	if (browserLang && SUPPORTED_LOCALES.includes(browserLang as Locale)) {
		return browserLang as Locale;
	}

	// Check navigator.languages array
	for (const lang of navigator.languages || []) {
		const shortLang = lang.split("-")[0].toLowerCase();
		if (SUPPORTED_LOCALES.includes(shortLang as Locale)) {
			return shortLang as Locale;
		}
	}

	return DEFAULT_LOCALE;
}

// Get initial locale from storage or browser detection
function getInitialLocale(): Locale {
	if (typeof localStorage !== "undefined") {
		const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
		if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
			return stored as Locale;
		}
	}
	return detectBrowserLocale();
}

// Template resolver for interpolation like {{name}}
function resolveTemplate(
	template: string,
	params: Record<string, string | number>,
): string {
	return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
		String(params[key] ?? ""),
	);
}

// I18n context type
export type I18nContextValue = {
	locale: () => Locale;
	setLocale: (locale: Locale) => void;
	setLocaleFromDb: (locale: string | null) => void;
	t: (key: string, params?: Record<string, string | number>) => string;
	isLoading: () => boolean;
};

export const I18nContext = createContext<I18nContextValue>();

// I18n Provider component
export const I18nProvider: ParentComponent = (props) => {
	const [locale, setLocaleSignal] = createSignal<Locale>(DEFAULT_LOCALE);
	const [mounted, setMounted] = createSignal(false);

	// Load dictionary based on current locale
	const [dict] = createResource(locale, fetchDictionary);

	// Initialize locale from storage on mount
	onMount(() => {
		const initial = getInitialLocale();
		setLocaleSignal(initial);
		setMounted(true);
	});

	// Persist locale changes to storage
	createEffect(() => {
		if (mounted()) {
			const currentLocale = locale();
			localStorage.setItem(LOCALE_STORAGE_KEY, currentLocale);
		}
	});

	// Set locale and persist
	const setLocale = (newLocale: Locale) => {
		if (SUPPORTED_LOCALES.includes(newLocale)) {
			setLocaleSignal(newLocale);
		}
	};

	// Set locale from DB preference (only updates if different from current)
	// This is used to sync locale from user preferences without triggering localStorage updates
	const setLocaleFromDb = (dbLocale: string | null) => {
		if (
			dbLocale &&
			SUPPORTED_LOCALES.includes(dbLocale as Locale) &&
			dbLocale !== locale()
		) {
			setLocaleSignal(dbLocale as Locale);
		}
	};

	// Translation function with fallback
	const t = (key: string, params?: Record<string, string | number>): string => {
		const dictionary = dict();
		if (!dictionary) return key;

		const value = dictionary[key as keyof FlatDictionary];
		if (typeof value === "string") {
			return params ? resolveTemplate(value, params) : value;
		}

		// Fallback to key if translation not found
		return key;
	};

	const contextValue: I18nContextValue = {
		locale,
		setLocale,
		setLocaleFromDb,
		t,
		isLoading: () => dict.loading,
	};

	return (
		<I18nContext.Provider value={contextValue}>
			{props.children}
		</I18nContext.Provider>
	);
};

// Hook to use i18n context
export function useI18n(): I18nContextValue {
	const context = useContext(I18nContext);
	if (!context) {
		throw new Error("useI18n must be used within an I18nProvider");
	}
	return context;
}

// Convenience hook for just the translation function
export function useTranslation() {
	const { t, locale, isLoading } = useI18n();
	return { t, locale, isLoading };
}

// Locale display names (always in their native language)
export const LOCALE_NAMES: Record<Locale, string> = {
	en: "English",
	de: "Deutsch",
	pl: "Polski",
	es: "Español",
};
