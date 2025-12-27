// Spanish translations
import type { Dictionary } from "./en";

export const dict: Dictionary = {
	// Common
	common: {
		loading: "Cargando...",
		error: "Error",
		save: "Guardar",
		cancel: "Cancelar",
		delete: "Eliminar",
		edit: "Editar",
		close: "Cerrar",
		confirm: "Confirmar",
		back: "Atras",
		next: "Siguiente",
		search: "Buscar",
		noResults: "No se encontraron resultados",
	},

	// Navigation
	nav: {
		home: "Inicio",
		about: "Acerca de",
		signIn: "Iniciar sesion",
		signOut: "Cerrar sesion",
		dashboard: "Panel",
		google: "Google",
		twitch: "Twitch",
		welcome: "Bienvenido, {{name}}!",
	},

	// Dashboard sidebar sections
	sidebar: {
		overview: "Resumen",
		streaming: "Transmision",
		widgets: "Widgets",
		account: "Cuenta",
		admin: "Admin",
	},

	// Dashboard navigation items
	dashboardNav: {
		dashboard: "Panel",
		analytics: "Analiticas",
		stream: "Stream",
		chatHistory: "Historial de chat",
		viewers: "Espectadores",
		streamHistory: "Historial de streams",
		widgets: "Widgets",
		smartCanvas: "Lienzo inteligente",
		settings: "Configuracion",
		users: "Usuarios",
		notifications: "Notificaciones",
		moderate: "Moderar",
	},

	// Dashboard
	dashboard: {
		freePlan: "Plan gratuito",
		goToSettings: "Ir a configuracion",
		closeSidebar: "Cerrar barra lateral",
	},

	// Settings page
	settings: {
		title: "Configuracion",
		language: "Idioma",
		languageDescription: "Elige tu idioma preferido para la interfaz",
		appearance: "Apariencia",
		profile: "Perfil",
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
		loginTitle: "Iniciar sesion en Streampai",
		loginDescription: "Elige tu metodo de inicio de sesion preferido",
		orContinueWith: "O continuar con",
		continueWithGoogle: "Continuar con Google",
		continueWithTwitch: "Continuar con Twitch",
	},

	// Errors
	errors: {
		generic: "Algo salio mal",
		notFound: "Pagina no encontrada",
		unauthorized: "No estas autorizado para ver esta pagina",
		networkError: "Error de red. Por favor, verifica tu conexion.",
	},
};
