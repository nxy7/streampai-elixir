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

	// Landing page
	landing: {
		features: "Funciones",
		about: "Acerca de",
		getStarted: "Comenzar",
		heroTitle1: "Transmite a",
		heroTitle2: "todos",
		heroTitle3: "a la vez",
		underConstruction: "En construccion",
		underConstructionText:
			"Estamos construyendo algo increible! Streampai esta actualmente en desarrollo. Unete a nuestro boletin para ser el primero en saber cuando lancemos.",
		emailPlaceholder: "Ingresa tu correo electronico",
		notifyMe: "Notificarme",
		submitting: "Enviando...",
		newsletterSuccess: "Tu correo ha sido agregado a nuestro boletin",
		heroDescription:
			"Conecta todas tus plataformas de streaming, unifica tu audiencia y potencia tu contenido con herramientas impulsadas por IA. Transmite a Twitch, YouTube, Kick, Facebook y mas simultaneamente.",
		more: "Mas",
		featuresTitle1: "Todo lo que necesitas para",
		featuresTitle2: "dominar",
		featuresSubtitle:
			"Herramientas poderosas disenadas para streamers serios que quieren hacer crecer su audiencia en todas las plataformas",
		multiPlatformTitle: "Streaming multiplataforma",
		multiPlatformDescription:
			"Transmite a Twitch, YouTube, Kick, Facebook y mas simultaneamente. Un stream, maximo alcance.",
		unifiedChatTitle: "Gestion de chat unificada",
		unifiedChatDescription:
			"Fusiona todos los chats de las plataformas en un solo stream. Nunca mas te pierdas un mensaje de ninguna plataforma.",
		analyticsTitle: "Analiticas en tiempo real",
		analyticsDescription:
			"Rastrea espectadores, interaccion, ingresos y crecimiento en todas las plataformas en un hermoso panel.",
		moderationTitle: "Moderacion impulsada por IA",
		moderationDescription:
			"Moderacion automatica con reglas personalizadas, deteccion de spam y filtrado de toxicidad en todas las plataformas.",
		widgetsTitle: "Widgets de stream personalizados",
		widgetsDescription:
			"Widgets hermosos y personalizables para donaciones, seguidores, chat y mas. Perfecto para tu marca.",
		teamTitle: "Herramientas de equipo y moderadores",
		teamDescription:
			"Panel de moderador potente, gestion de equipo y herramientas de gestion de stream colaborativas.",
		aboutTitle1: "Creado por streamers,",
		aboutTitle2: "para streamers",
		aboutParagraph1:
			"Entendemos la lucha de gestionar multiples plataformas de streaming. Por eso creamos Streampai - la solucion definitiva para creadores de contenido que quieren maximizar su alcance sin la complejidad.",
		aboutParagraph2:
			"Se acabaron los dias de malabarismo con multiples ventanas de chat, alertas de donaciones y paneles de analiticas. Streampai reune todo en una plataforma potente e intuitiva que escala con tu crecimiento.",
		aboutParagraph3:
			"Ya seas un streamer de fin de semana o un creador de contenido a tiempo completo, nuestras herramientas impulsadas por IA te ayudan a concentrarte en lo que mas importa: crear contenido increible y construir tu comunidad.",
		platformIntegrations: "Integraciones de plataformas",
		uptime: "Disponibilidad",
		realTimeSync: "Sincronizacion en tiempo real",
		realTimeSyncDescription:
			"Chat y eventos sincronizados en todas las plataformas instantaneamente",
		advancedAnalytics: "Analiticas avanzadas",
		advancedAnalyticsDescription:
			"Informacion profunda sobre el comportamiento de los espectadores y patrones de interaccion",
		aiPoweredGrowth: "Crecimiento impulsado por IA",
		aiPoweredGrowthDescription:
			"Recomendaciones inteligentes para optimizar tu estrategia de contenido",
		ctaTitle: "Listo para llevar tu stream al siguiente nivel?",
		ctaSubtitle:
			"Unete a los streamers que ya estan haciendo crecer su audiencia con Streampai",
	},

	// Footer
	footer: {
		privacy: "Privacidad",
		terms: "Terminos",
		support: "Soporte",
		contact: "Contacto",
		copyright: "Streampai. Todos los derechos reservados.",
		madeWith: "Hecho con",
		forStreamers: "para streamers.",
	},

	// Privacy page
	privacy: {
		title: "Politica de privacidad",
		lastUpdated: "Ultima actualizacion: diciembre 2024",
		section1Title: "1. Informacion que recopilamos",
		section1Intro:
			"Recopilamos informacion que nos proporcionas directamente, incluyendo:",
		section1Item1: "Informacion de cuenta (nombre, correo electronico, contrasena)",
		section1Item2: "Informacion de perfil de plataformas de streaming conectadas",
		section1Item3: "Metadatos de stream y datos analiticos",
		section1Item4: "Mensajes de chat y acciones de moderacion",
		section1Item5: "Informacion de pago (procesada de forma segura por proveedores externos)",
		section2Title: "2. Como usamos tu informacion",
		section2Intro: "Usamos la informacion recopilada para:",
		section2Item1: "Proporcionar, mantener y mejorar nuestros servicios",
		section2Item2: "Conectar y sincronizar tu contenido en multiples plataformas de streaming",
		section2Item3: "Generar analiticas e informacion sobre el rendimiento de tus streams",
		section2Item4: "Enviarte avisos tecnicos y mensajes de soporte",
		section2Item5: "Responder a tus comentarios y preguntas",
		section3Title: "3. Compartir informacion",
		section3Intro:
			"No vendemos tu informacion personal. Podemos compartir tu informacion en las siguientes circunstancias:",
		section3Item1: "Con plataformas de streaming que conectas (para habilitar streaming multiplataforma)",
		section3Item2: "Con proveedores de servicios que asisten en la operacion de nuestra plataforma",
		section3Item3: "Cuando lo requiera la ley o para proteger nuestros derechos",
		section3Item4: "Con tu consentimiento o a tu direccion",
		section4Title: "4. Seguridad de datos",
		section4Text:
			"Implementamos medidas tecnicas y organizativas apropiadas para proteger tu informacion personal contra acceso no autorizado, alteracion, divulgacion o destruccion. Esto incluye encriptacion, protocolos seguros y auditorias de seguridad regulares.",
		section5Title: "5. Servicios de terceros",
		section5Text:
			"Nuestro servicio se integra con plataformas de streaming de terceros (Twitch, YouTube, Kick, Facebook, etc.). Cuando conectas estos servicios, pueden recopilar informacion segun sus propias politicas de privacidad. Te animamos a revisar sus practicas de privacidad.",
		section6Title: "6. Retencion de datos",
		section6Text:
			"Retenemos tu informacion mientras tu cuenta este activa o sea necesario para proporcionarte servicios. Puedes solicitar la eliminacion de tu cuenta y datos asociados en cualquier momento contactandonos.",
		section7Title: "7. Tus derechos",
		section7Intro: "Tienes derecho a:",
		section7Item1: "Acceder a la informacion personal que tenemos sobre ti",
		section7Item2: "Solicitar la correccion de datos inexactos",
		section7Item3: "Solicitar la eliminacion de tus datos",
		section7Item4: "Exportar tus datos en un formato portable",
		section7Item5: "Optar por no recibir comunicaciones de marketing",
		section8Title: "8. Cookies y seguimiento",
		section8Text:
			"Usamos cookies y tecnologias similares para mantener tu sesion, recordar tus preferencias y entender como usas nuestro servicio. Puedes controlar la configuracion de cookies a traves de las preferencias de tu navegador.",
		section9Title: "9. Privacidad de menores",
		section9Text:
			"Nuestro servicio no esta destinado a usuarios menores de 13 anos. No recopilamos conscientemente informacion personal de ninos menores de 13 anos.",
		section10Title: "10. Cambios a esta politica",
		section10Text:
			'Podemos actualizar esta politica de privacidad de vez en cuando. Te notificaremos sobre cualquier cambio publicando la nueva politica en esta pagina y actualizando la fecha de "Ultima actualizacion".',
		section11Title: "11. Contactanos",
		section11Text:
			"Si tienes alguna pregunta sobre esta Politica de Privacidad, por favor",
		contactUs: "contactanos",
	},

	// Terms page
	terms: {
		title: "Terminos de servicio",
		lastUpdated: "Ultima actualizacion: diciembre 2024",
		section1Title: "1. Aceptacion de terminos",
		section1Text:
			"Al acceder o usar los servicios de Streampai, aceptas estar sujeto a estos Terminos de Servicio. Si no estas de acuerdo con estos terminos, por favor no uses nuestros servicios.",
		section2Title: "2. Descripcion del servicio",
		section2Text:
			"Streampai proporciona una solucion de gestion de streaming multiplataforma que permite a los usuarios transmitir contenido a multiples plataformas simultaneamente, gestionar chat unificado y acceder a analiticas entre plataformas.",
		section3Title: "3. Cuentas de usuario",
		section3Text:
			"Eres responsable de mantener la confidencialidad de las credenciales de tu cuenta y de todas las actividades que ocurran bajo tu cuenta. Debes notificarnos inmediatamente sobre cualquier uso no autorizado de tu cuenta.",
		section4Title: "4. Uso aceptable",
		section4Intro: "Aceptas no:",
		section4Item1: "Usar el servicio para cualquier proposito ilegal o no autorizado",
		section4Item2: "Violar cualquier ley en tu jurisdiccion, incluyendo leyes de derechos de autor",
		section4Item3: "Transmitir contenido danino o malware",
		section4Item4: "Interferir o interrumpir el servicio o servidores conectados al servicio",
		section4Item5: "Intentar obtener acceso no autorizado a cualquier parte del servicio",
		section5Title: "5. Responsabilidad del contenido",
		section5Text:
			"Eres el unico responsable del contenido que transmites, compartes o distribuyes a traves de nuestra plataforma. Retienes todos los derechos de propiedad sobre tu contenido, pero nos otorgas una licencia para mostrarlo y distribuirlo a traves de nuestro servicio.",
		section6Title: "6. Integraciones de terceros",
		section6Text:
			"Nuestro servicio se integra con plataformas de terceros como Twitch, YouTube y otros. Tu uso de estas plataformas esta sujeto a sus respectivos terminos de servicio y politicas de privacidad.",
		section7Title: "7. Limitacion de responsabilidad",
		section7Text:
			"Streampai no sera responsable por danos indirectos, incidentales, especiales, consecuentes o punitivos resultantes de tu uso o incapacidad de usar el servicio.",
		section8Title: "8. Modificaciones a los terminos",
		section8Text:
			"Nos reservamos el derecho de modificar estos terminos en cualquier momento. Notificaremos a los usuarios sobre cualquier cambio material por correo electronico o a traves del servicio. El uso continuado del servicio despues de tales cambios constituye la aceptacion de los nuevos terminos.",
		section9Title: "9. Terminacion",
		section9Text:
			"Podemos terminar o suspender tu cuenta y acceso al servicio inmediatamente, sin previo aviso, por conducta que creamos viola estos Terminos de Servicio o es danina para otros usuarios, nosotros o terceros.",
		section10Title: "10. Informacion de contacto",
		section10Text:
			"Si tienes alguna pregunta sobre estos Terminos de Servicio, por favor",
		contactUs: "contactanos",
	},

	// Support page
	support: {
		title: "Soporte",
		heading: "Como podemos ayudarte?",
		subheading:
			"Encuentra respuestas a preguntas comunes o comunicate con nuestro equipo de soporte.",
		documentation: "Documentacion",
		documentationDescription:
			"Guias completas y tutoriales para ayudarte a sacar el maximo provecho de Streampai.",
		faq: "FAQ",
		faqDescription:
			"Respuestas rapidas a preguntas frecuentes sobre nuestro servicio.",
		discord: "Discord de la comunidad",
		discordDescription:
			"Unete a nuestro servidor de Discord para conectarte con otros streamers y obtener soporte de la comunidad.",
		emailSupport: "Soporte por correo",
		emailSupportDescription:
			"Comunicate directamente con nuestro equipo de soporte para asistencia personalizada.",
		contactUs: "Contactanos",
		comingSoon: "Proximamente",
		faqTitle: "Preguntas frecuentes",
		faqQ1: "Que plataformas soporta Streampai?",
		faqA1:
			"Streampai soporta streaming multiplataforma a Twitch, YouTube, Kick, Facebook y mas. Estamos constantemente agregando nuevas integraciones de plataformas.",
		faqQ2: "Como conecto mis cuentas de streaming?",
		faqA2:
			'Despues de registrarte, ve a la configuracion de tu panel y haz clic en "Conectar cuentas". Sigue las indicaciones de OAuth para vincular de forma segura tus cuentas de plataformas de streaming.',
		faqQ3: "Estan seguros mis datos?",
		faqA3:
			"Si, tomamos la seguridad en serio. Todos los datos estan encriptados en transito y en reposo. Nunca almacenamos las contrasenas de tus plataformas de streaming - usamos tokens OAuth seguros para autenticacion. Lee nuestra",
		privacyPolicy: "Politica de privacidad",
		faqA3End: "para mas detalles.",
		faqQ4: "Puedo cancelar mi suscripcion en cualquier momento?",
		faqA4:
			"Si, puedes cancelar tu suscripcion en cualquier momento desde la configuracion de tu cuenta. Continuaras teniendo acceso hasta el final de tu periodo de facturacion.",
		faqQ5: "Como reporto un error o solicito una funcion?",
		faqA5:
			"Nos encanta escuchar a nuestros usuarios! Por favor contactanos con reportes de errores o solicitudes de funciones. Tambien puedes unirte a nuestra comunidad de Discord para discutir ideas con otros usuarios.",
	},

	// Contact page
	contact: {
		title: "Contacto",
		heading: "Ponte en contacto",
		subheading:
			"Tienes una pregunta, sugerencia o necesitas ayuda? Nos encantaria saber de ti.",
		emailTitle: "Correo",
		discordTitle: "Discord",
		discordDescription: "Unete a nuestra comunidad",
		githubTitle: "GitHub",
		githubDescription: "Reportar problemas",
		comingSoon: "Proximamente",
		formTitle: "Envianos un mensaje",
		nameLabel: "Nombre",
		namePlaceholder: "Tu nombre",
		emailLabel: "Correo",
		emailPlaceholder: "tu@correo.com",
		subjectLabel: "Asunto",
		subjectPlaceholder: "Selecciona un tema",
		subjectGeneral: "Consulta general",
		subjectSupport: "Soporte tecnico",
		subjectBilling: "Pregunta de facturacion",
		subjectFeature: "Solicitud de funcion",
		subjectBug: "Reporte de error",
		subjectPartnership: "Asociacion",
		messageLabel: "Mensaje",
		messagePlaceholder: "Como podemos ayudarte?",
		sending: "Enviando...",
		sendButton: "Enviar mensaje",
		successMessage:
			"Gracias por tu mensaje! Nos pondremos en contacto pronto.",
	},
};
