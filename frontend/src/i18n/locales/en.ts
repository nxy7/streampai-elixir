// English translations (base language)
export const dict = {
	// Common
	common: {
		loading: "Loading...",
		error: "Error",
		save: "Save",
		cancel: "Cancel",
		delete: "Delete",
		edit: "Edit",
		close: "Close",
		confirm: "Confirm",
		back: "Back",
		next: "Next",
		search: "Search",
		noResults: "No results found",
	},

	// Navigation
	nav: {
		home: "Home",
		about: "About",
		signIn: "Sign In",
		signOut: "Sign Out",
		dashboard: "Dashboard",
		google: "Google",
		twitch: "Twitch",
		welcome: "Welcome, {{name}}!",
	},

	// Dashboard sidebar sections
	sidebar: {
		overview: "Overview",
		streaming: "Streaming",
		widgets: "Widgets",
		account: "Account",
		admin: "Admin",
	},

	// Dashboard navigation items
	dashboardNav: {
		dashboard: "Dashboard",
		analytics: "Analytics",
		stream: "Stream",
		chatHistory: "Chat History",
		viewers: "Viewers",
		streamHistory: "Stream History",
		widgets: "Widgets",
		smartCanvas: "Smart Canvas",
		settings: "Settings",
		users: "Users",
		notifications: "Notifications",
		moderate: "Moderate",
	},

	// Dashboard
	dashboard: {
		freePlan: "Free Plan",
		goToSettings: "Go to Settings",
		closeSidebar: "Close sidebar",
	},

	// Settings page
	settings: {
		title: "Settings",
		language: "Language",
		languageDescription: "Choose your preferred language for the interface",
		appearance: "Appearance",
		profile: "Profile",
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
		loginTitle: "Sign in to Streampai",
		loginDescription: "Choose your preferred sign in method",
		orContinueWith: "Or continue with",
		continueWithGoogle: "Continue with Google",
		continueWithTwitch: "Continue with Twitch",
	},

	// Errors
	errors: {
		generic: "Something went wrong",
		notFound: "Page not found",
		unauthorized: "You are not authorized to view this page",
		networkError: "Network error. Please check your connection.",
	},
};

export type Dictionary = typeof dict;
