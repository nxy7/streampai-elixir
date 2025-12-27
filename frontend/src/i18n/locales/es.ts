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
		back: "Atrás",
		next: "Siguiente",
		search: "Buscar",
		noResults: "Sin resultados",
	},

	// Navigation
	nav: {
		home: "Inicio",
		about: "Nosotros",
		signIn: "Iniciar sesión",
		signOut: "Cerrar sesión",
		dashboard: "Panel",
		google: "Google",
		twitch: "Twitch",
		welcome: "¡Hola, {{name}}!",
	},

	// Dashboard sidebar sections
	sidebar: {
		overview: "Resumen",
		streaming: "Transmisión",
		widgets: "Widgets",
		account: "Cuenta",
		admin: "Admin",
	},

	// Dashboard navigation items
	dashboardNav: {
		dashboard: "Panel",
		analytics: "Estadísticas",
		stream: "Stream",
		chatHistory: "Historial de chat",
		viewers: "Espectadores",
		streamHistory: "Historial de streams",
		widgets: "Widgets",
		smartCanvas: "Smart Canvas",
		settings: "Configuración",
		users: "Usuarios",
		notifications: "Notificaciones",
		moderate: "Moderar",
	},

	// Dashboard
	dashboard: {
		freePlan: "Plan gratis",
		goToSettings: "Ir a configuración",
		closeSidebar: "Cerrar barra lateral",
	},

	// Settings page
	settings: {
		title: "Configuración",
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
		es: "Español",
	},

	// Auth
	auth: {
		loginTitle: "Iniciar sesión en Streampai",
		loginDescription: "Elige tu método de inicio de sesión",
		orContinueWith: "O continuar con",
		continueWithGoogle: "Continuar con Google",
		continueWithTwitch: "Continuar con Twitch",
	},

	// Errors
	errors: {
		generic: "Algo salió mal",
		notFound: "Página no encontrada",
		unauthorized: "No tienes permiso para ver esta página",
		networkError: "Error de red. Verifica tu conexión.",
	},

	// Landing page
	landing: {
		features: "Funciones",
		about: "Nosotros",
		getStarted: "Comenzar",
		heroTitle1: "Transmite",
		heroTitle2: "a todos",
		heroTitle3: "a la vez",
		underConstruction: "En construcción",
		underConstructionText:
			"¡Estamos creando algo increíble! Streampai está en desarrollo. Únete a nuestro newsletter para enterarte primero del lanzamiento.",
		emailPlaceholder: "Tu correo electrónico",
		notifyMe: "Avísame",
		submitting: "Enviando...",
		newsletterSuccess: "Tu correo fue añadido al newsletter",
		heroDescription:
			"Conecta todas tus plataformas de streaming, unifica tu audiencia y potencia tu contenido con herramientas de IA. Transmite a Twitch, YouTube, Kick, Facebook y más a la vez.",
		more: "Más",
		featuresTitle1: "Todo lo que necesitas para",
		featuresTitle2: "dominar",
		featuresSubtitle:
			"Herramientas potentes para streamers que quieren crecer en todas las plataformas",
		multiPlatformTitle: "Streaming multiplataforma",
		multiPlatformDescription:
			"Transmite a Twitch, YouTube, Kick, Facebook y más simultáneamente. Un stream, máximo alcance.",
		unifiedChatTitle: "Chat unificado",
		unifiedChatDescription:
			"Todos los chats de tus plataformas en un solo lugar. No te pierdas ningún mensaje.",
		analyticsTitle: "Estadísticas en vivo",
		analyticsDescription:
			"Seguimiento de espectadores, interacción, ingresos y crecimiento en todas las plataformas.",
		moderationTitle: "Moderación con IA",
		moderationDescription:
			"Moderación automática con reglas personalizadas, detección de spam y filtro de toxicidad.",
		widgetsTitle: "Widgets personalizados",
		widgetsDescription:
			"Widgets bonitos y configurables para donaciones, seguidores, chat y más. Perfectos para tu marca.",
		teamTitle: "Herramientas de equipo",
		teamDescription:
			"Panel de moderadores, gestión de equipo y herramientas colaborativas para streams.",
		aboutTitle1: "Creado por streamers,",
		aboutTitle2: "para streamers",
		aboutParagraph1:
			"Entendemos lo difícil que es gestionar varias plataformas de streaming. Por eso creamos Streampai: la solución para creadores que quieren maximizar su alcance sin complicaciones.",
		aboutParagraph2:
			"Se acabó el saltar entre ventanas de chat, alertas de donaciones y paneles de estadísticas. Streampai lo une todo en una plataforma intuitiva que crece contigo.",
		aboutParagraph3:
			"Ya seas streamer de fin de semana o creador a tiempo completo, nuestras herramientas de IA te ayudan a enfocarte en lo importante: crear contenido increíble y construir tu comunidad.",
		platformIntegrations: "Integraciones",
		uptime: "Disponibilidad",
		realTimeSync: "Sincronización en tiempo real",
		realTimeSyncDescription:
			"Chat y eventos sincronizados instantáneamente en todas las plataformas",
		advancedAnalytics: "Estadísticas avanzadas",
		advancedAnalyticsDescription:
			"Información detallada sobre el comportamiento de espectadores y patrones de interacción",
		aiPoweredGrowth: "Crecimiento con IA",
		aiPoweredGrowthDescription:
			"Recomendaciones inteligentes para optimizar tu estrategia de contenido",
		ctaTitle: "¿Listo para llevar tu stream al siguiente nivel?",
		ctaSubtitle: "Únete a los streamers que ya están creciendo con Streampai",
	},

	// Footer
	footer: {
		privacy: "Privacidad",
		terms: "Términos",
		support: "Soporte",
		contact: "Contacto",
		copyright: "Streampai. Todos los derechos reservados.",
		madeWith: "Hecho con",
		forStreamers: "para streamers.",
	},

	// Privacy page
	privacy: {
		title: "Política de privacidad",
		lastUpdated: "Última actualización: diciembre 2024",
		section1Title: "1. Información que recopilamos",
		section1Intro: "Recopilamos información que nos proporcionas, incluyendo:",
		section1Item1: "Datos de cuenta (nombre, correo, contraseña)",
		section1Item2: "Datos de perfil de plataformas de streaming conectadas",
		section1Item3: "Metadatos de stream y datos analíticos",
		section1Item4: "Mensajes de chat y acciones de moderación",
		section1Item5:
			"Datos de pago (procesados de forma segura por proveedores externos)",
		section2Title: "2. Cómo usamos tu información",
		section2Intro: "Usamos la información recopilada para:",
		section2Item1: "Proporcionar, mantener y mejorar nuestros servicios",
		section2Item2:
			"Conectar y sincronizar tu contenido en varias plataformas de streaming",
		section2Item3:
			"Generar análisis e información sobre el rendimiento de tus streams",
		section2Item4: "Enviarte avisos técnicos y mensajes de soporte",
		section2Item5: "Responder a tus comentarios y preguntas",
		section3Title: "3. Compartir información",
		section3Intro:
			"No vendemos tus datos personales. Podemos compartir tu información en estos casos:",
		section3Item1:
			"Con plataformas de streaming que conectas (para streaming multiplataforma)",
		section3Item2:
			"Con proveedores de servicios que ayudan a operar nuestra plataforma",
		section3Item3:
			"Cuando lo requiera la ley o para proteger nuestros derechos",
		section3Item4: "Con tu consentimiento o por tu indicación",
		section4Title: "4. Seguridad de datos",
		section4Text:
			"Implementamos medidas técnicas y organizativas apropiadas para proteger tus datos personales contra acceso no autorizado, alteración, divulgación o destrucción. Esto incluye cifrado, protocolos seguros y auditorías de seguridad regulares.",
		section5Title: "5. Servicios de terceros",
		section5Text:
			"Nuestro servicio se integra con plataformas de terceros (Twitch, YouTube, Kick, Facebook, etc.). Al conectar estos servicios, pueden recopilar información según sus propias políticas de privacidad. Te recomendamos revisar sus prácticas de privacidad.",
		section6Title: "6. Retención de datos",
		section6Text:
			"Conservamos tu información mientras tu cuenta esté activa o sea necesario para proporcionarte servicios. Puedes solicitar la eliminación de tu cuenta y datos asociados en cualquier momento.",
		section7Title: "7. Tus derechos",
		section7Intro: "Tienes derecho a:",
		section7Item1: "Acceder a los datos personales que tenemos sobre ti",
		section7Item2: "Solicitar la corrección de datos inexactos",
		section7Item3: "Solicitar la eliminación de tus datos",
		section7Item4: "Exportar tus datos en formato portable",
		section7Item5: "Rechazar comunicaciones de marketing",
		section8Title: "8. Cookies y seguimiento",
		section8Text:
			"Usamos cookies y tecnologías similares para mantener tu sesión, recordar tus preferencias y entender cómo usas nuestro servicio. Puedes controlar las cookies en las preferencias de tu navegador.",
		section9Title: "9. Privacidad de menores",
		section9Text:
			"Nuestro servicio no está destinado a menores de 13 años. No recopilamos conscientemente información personal de niños menores de 13 años.",
		section10Title: "10. Cambios a esta política",
		section10Text:
			"Podemos actualizar esta política de privacidad ocasionalmente. Te notificaremos los cambios publicando la nueva política aquí y actualizando la fecha.",
		section11Title: "11. Contáctanos",
		section11Text:
			"Si tienes preguntas sobre esta Política de Privacidad, por favor",
		contactUs: "contáctanos",
	},

	// Terms page
	terms: {
		title: "Términos de servicio",
		lastUpdated: "Última actualización: diciembre 2024",
		section1Title: "1. Aceptación de términos",
		section1Text:
			"Al acceder o usar los servicios de Streampai, aceptas estos Términos de Servicio. Si no estás de acuerdo, no uses nuestros servicios.",
		section2Title: "2. Descripción del servicio",
		section2Text:
			"Streampai es una solución de gestión de streaming multiplataforma que permite transmitir contenido a varias plataformas simultáneamente, gestionar chat unificado y acceder a estadísticas entre plataformas.",
		section3Title: "3. Cuentas de usuario",
		section3Text:
			"Eres responsable de mantener la confidencialidad de tus credenciales y de todas las actividades en tu cuenta. Debes notificarnos inmediatamente cualquier uso no autorizado.",
		section4Title: "4. Uso aceptable",
		section4Intro: "Aceptas no:",
		section4Item1: "Usar el servicio para fines ilegales o no autorizados",
		section4Item2: "Violar leyes, incluyendo derechos de autor",
		section4Item3: "Transmitir contenido dañino o malware",
		section4Item4:
			"Interferir o interrumpir el servicio o servidores conectados",
		section4Item5:
			"Intentar obtener acceso no autorizado a cualquier parte del servicio",
		section5Title: "5. Responsabilidad del contenido",
		section5Text:
			"Eres el único responsable del contenido que transmites, compartes o distribuyes a través de nuestra plataforma. Conservas todos los derechos de propiedad, pero nos otorgas licencia para mostrarlo y distribuirlo a través de nuestro servicio.",
		section6Title: "6. Integraciones de terceros",
		section6Text:
			"Nuestro servicio se integra con plataformas como Twitch, YouTube y otras. Tu uso de estas plataformas está sujeto a sus respectivos términos de servicio y políticas de privacidad.",
		section7Title: "7. Limitación de responsabilidad",
		section7Text:
			"Streampai no será responsable por daños indirectos, incidentales, especiales, consecuentes o punitivos derivados del uso o imposibilidad de uso del servicio.",
		section8Title: "8. Modificaciones a los términos",
		section8Text:
			"Nos reservamos el derecho de modificar estos términos en cualquier momento. Te notificaremos cambios importantes por correo o a través del servicio. El uso continuado implica aceptación.",
		section9Title: "9. Terminación",
		section9Text:
			"Podemos terminar o suspender tu cuenta e acceso inmediatamente, sin previo aviso, por conducta que consideremos viola estos Términos o es dañina para otros usuarios, nosotros o terceros.",
		section10Title: "10. Información de contacto",
		section10Text:
			"Si tienes preguntas sobre estos Términos de Servicio, por favor",
		contactUs: "contáctanos",
	},

	// Support page
	support: {
		title: "Soporte",
		heading: "¿Cómo podemos ayudarte?",
		subheading:
			"Encuentra respuestas a preguntas comunes o contacta a nuestro equipo de soporte.",
		documentation: "Documentación",
		documentationDescription:
			"Guías completas y tutoriales para sacar el máximo provecho de Streampai.",
		faq: "FAQ",
		faqDescription:
			"Respuestas rápidas a preguntas frecuentes sobre nuestro servicio.",
		discord: "Discord de la comunidad",
		discordDescription:
			"Únete a nuestro Discord para conectar con otros streamers y obtener ayuda.",
		emailSupport: "Soporte por correo",
		emailSupportDescription:
			"Contacta directamente a nuestro equipo para asistencia personalizada.",
		contactUs: "Contáctanos",
		comingSoon: "Próximamente",
		faqTitle: "Preguntas frecuentes",
		faqQ1: "¿Qué plataformas soporta Streampai?",
		faqA1:
			"Streampai soporta streaming a Twitch, YouTube, Kick, Facebook y más. Constantemente añadimos nuevas integraciones.",
		faqQ2: "¿Cómo conecto mis cuentas de streaming?",
		faqA2:
			'Después de registrarte, ve a configuración del panel y haz clic en "Conectar cuentas". Sigue las instrucciones de OAuth para vincular tus cuentas de forma segura.',
		faqQ3: "¿Están seguros mis datos?",
		faqA3:
			"Sí, la seguridad es nuestra prioridad. Todos los datos están cifrados en tránsito y en reposo. Nunca guardamos contraseñas de plataformas, usamos tokens OAuth seguros. Lee nuestra",
		privacyPolicy: "Política de privacidad",
		faqA3End: "para más detalles.",
		faqQ4: "¿Puedo cancelar mi suscripción en cualquier momento?",
		faqA4:
			"Sí, puedes cancelar tu suscripción cuando quieras desde la configuración de tu cuenta. Mantendrás el acceso hasta el final de tu período de facturación.",
		faqQ5: "¿Cómo reporto un error o sugiero una función?",
		faqA5:
			"¡Nos encanta recibir feedback! Contáctanos con reportes de errores o sugerencias. También puedes unirte a nuestro Discord para discutir ideas con otros usuarios.",
	},

	// Contact page
	contact: {
		title: "Contacto",
		heading: "Ponte en contacto",
		subheading:
			"¿Tienes una pregunta, sugerencia o necesitas ayuda? Nos encantaría saber de ti.",
		emailTitle: "Correo",
		discordTitle: "Discord",
		discordDescription: "Únete a nuestra comunidad",
		githubTitle: "GitHub",
		githubDescription: "Reportar problemas",
		comingSoon: "Próximamente",
		formTitle: "Envíanos un mensaje",
		nameLabel: "Nombre",
		namePlaceholder: "Tu nombre",
		emailLabel: "Correo",
		emailPlaceholder: "tu@correo.com",
		subjectLabel: "Asunto",
		subjectPlaceholder: "Selecciona un tema",
		subjectGeneral: "Consulta general",
		subjectSupport: "Soporte técnico",
		subjectBilling: "Pregunta de facturación",
		subjectFeature: "Sugerencia de función",
		subjectBug: "Reporte de error",
		subjectPartnership: "Asociación",
		messageLabel: "Mensaje",
		messagePlaceholder: "¿Cómo podemos ayudarte?",
		sending: "Enviando...",
		sendButton: "Enviar mensaje",
		successMessage: "¡Gracias por tu mensaje! Te responderemos pronto.",
	},
};
