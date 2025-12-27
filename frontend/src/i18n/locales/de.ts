// German translations
import type { Dictionary } from "./en";

export const dict: Dictionary = {
	// Common
	common: {
		loading: "Wird geladen...",
		error: "Fehler",
		save: "Speichern",
		cancel: "Abbrechen",
		delete: "Loschen",
		edit: "Bearbeiten",
		close: "Schliessen",
		confirm: "Bestatigen",
		back: "Zuruck",
		next: "Weiter",
		search: "Suchen",
		noResults: "Keine Ergebnisse gefunden",
	},

	// Navigation
	nav: {
		home: "Startseite",
		about: "Uber uns",
		signIn: "Anmelden",
		signOut: "Abmelden",
		dashboard: "Dashboard",
		google: "Google",
		twitch: "Twitch",
		welcome: "Willkommen, {{name}}!",
	},

	// Dashboard sidebar sections
	sidebar: {
		overview: "Ubersicht",
		streaming: "Streaming",
		widgets: "Widgets",
		account: "Konto",
		admin: "Admin",
	},

	// Dashboard navigation items
	dashboardNav: {
		dashboard: "Dashboard",
		analytics: "Analytik",
		stream: "Stream",
		chatHistory: "Chatverlauf",
		viewers: "Zuschauer",
		streamHistory: "Streamverlauf",
		widgets: "Widgets",
		smartCanvas: "Smart Canvas",
		settings: "Einstellungen",
		users: "Benutzer",
		notifications: "Benachrichtigungen",
		moderate: "Moderieren",
	},

	// Dashboard
	dashboard: {
		freePlan: "Kostenloser Plan",
		goToSettings: "Zu den Einstellungen",
		closeSidebar: "Seitenleiste schliessen",
	},

	// Settings page
	settings: {
		title: "Einstellungen",
		language: "Sprache",
		languageDescription:
			"Wahlen Sie Ihre bevorzugte Sprache fur die Oberflache",
		appearance: "Erscheinungsbild",
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
		loginTitle: "Bei Streampai anmelden",
		loginDescription: "Wahlen Sie Ihre bevorzugte Anmeldemethode",
		orContinueWith: "Oder fortfahren mit",
		continueWithGoogle: "Mit Google fortfahren",
		continueWithTwitch: "Mit Twitch fortfahren",
	},

	// Errors
	errors: {
		generic: "Etwas ist schief gelaufen",
		notFound: "Seite nicht gefunden",
		unauthorized: "Sie sind nicht berechtigt, diese Seite anzuzeigen",
		networkError:
			"Netzwerkfehler. Bitte uberprufen Sie Ihre Internetverbindung.",
	},
};
