// Polish translations
import type { Dictionary } from "./en";

export const dict: Dictionary = {
	// Common
	common: {
		loading: "Ladowanie...",
		error: "Blad",
		save: "Zapisz",
		cancel: "Anuluj",
		delete: "Usun",
		edit: "Edytuj",
		close: "Zamknij",
		confirm: "Potwierdz",
		back: "Wstecz",
		next: "Dalej",
		search: "Szukaj",
		noResults: "Nie znaleziono wynikow",
	},

	// Navigation
	nav: {
		home: "Strona glowna",
		about: "O nas",
		signIn: "Zaloguj sie",
		signOut: "Wyloguj sie",
		dashboard: "Panel",
		google: "Google",
		twitch: "Twitch",
		welcome: "Witaj, {{name}}!",
	},

	// Dashboard sidebar sections
	sidebar: {
		overview: "Przeglad",
		streaming: "Streaming",
		widgets: "Widgety",
		account: "Konto",
		admin: "Admin",
	},

	// Dashboard navigation items
	dashboardNav: {
		dashboard: "Panel",
		analytics: "Analityka",
		stream: "Stream",
		chatHistory: "Historia czatu",
		viewers: "Widzowie",
		streamHistory: "Historia streamow",
		widgets: "Widgety",
		smartCanvas: "Inteligentne plotno",
		settings: "Ustawienia",
		users: "Uzytkownicy",
		notifications: "Powiadomienia",
		moderate: "Moderacja",
	},

	// Dashboard
	dashboard: {
		freePlan: "Darmowy plan",
		goToSettings: "Przejdz do ustawien",
		closeSidebar: "Zamknij pasek boczny",
	},

	// Settings page
	settings: {
		title: "Ustawienia",
		language: "Jezyk",
		languageDescription: "Wybierz preferowany jezyk interfejsu",
		appearance: "Wyglad",
		profile: "Profil",
	},

	// Language names (for language selector)
	languages: {
		en: "English",
		de: "Deutsch",
		pl: "Polski",
		es: "Espanol",
	},

	// Auth
	auth: {
		loginTitle: "Zaloguj sie do Streampai",
		loginDescription: "Wybierz preferowana metode logowania",
		orContinueWith: "Lub kontynuuj z",
		continueWithGoogle: "Kontynuuj z Google",
		continueWithTwitch: "Kontynuuj z Twitch",
	},

	// Errors
	errors: {
		generic: "Cos poszlo nie tak",
		notFound: "Strona nie znaleziona",
		unauthorized: "Nie masz uprawnien do wyswietlenia tej strony",
		networkError: "Blad sieci. Sprawdz polaczenie internetowe.",
	},
};
