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
		pleaseWait: "Por favor espera...",
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
		welcomeMessage: "Bienvenido a tu panel de Streampai.",
		// Quick Stats
		messages: "Mensajes",
		viewers: "Espectadores",
		followers: "Seguidores",
		donations: "Donaciones",
		// Stream Health
		streamHealth: "Estado del stream",
		bitrate: "Bitrate",
		dropped: "Perdidos",
		uptime: "Tiempo activo",
		excellent: "Excelente",
		good: "Bueno",
		fair: "Regular",
		poor: "Malo",
		// Engagement Score
		engagementScore: "Puntuación de interacción",
		building: "En construcción",
		growing: "En crecimiento",
		// Stream Goals
		streamGoals: "Objetivos del stream",
		dailyFollowers: "Seguidores diarios",
		donationGoal: "Meta de donaciones",
		chatActivity: "Actividad del chat",
		goalReached: "¡Meta alcanzada!",
		// Recent sections
		recentChat: "Chat reciente",
		recentEvents: "Eventos recientes",
		recentStreams: "Streams recientes",
		viewAll: "Ver todos",
		noChatMessages: "Sin mensajes de chat aún",
		messagesWillAppear: "Los mensajes aparecerán aquí durante los streams",
		noEventsYet: "Sin eventos aún",
		eventsWillAppear: "Donaciones, seguidores y suscripciones aparecerán aquí",
		noStreamsYet: "Sin streams aún",
		streamsWillAppear: "Tu historial de streams aparecerá aquí",
		untitledStream: "Stream sin título",
		notStarted: "No iniciado",
		// Activity Feed
		activityFeed: "Actividad",
		events: "eventos",
		all: "Todos",
		donationsFilter: "Donaciones",
		follows: "Seguidores",
		subs: "Suscripciones",
		raids: "Raids",
		noEvents: "Sin eventos",
		anonymous: "Anónimo",
		// Quick Actions
		testAlert: "Alerta de prueba",
		widgets: "Widgets",
		goLive: "Iniciar stream",
		customizeOverlays: "Personaliza tus overlays",
		viewStats: "Ver estadísticas",
		configureAccount: "Configurar cuenta",
		// Test Alert
		testAlertTitle: "¡Alerta de prueba!",
		alertsWorking: "Tus alertas funcionan correctamente.",
		// Not authenticated
		notAuthenticated: "No autenticado",
		signInToAccess: "Inicia sesión para acceder al panel.",
	},

	// Stream page
	stream: {
		streamTitlePlaceholder: "Ingresa el título del stream...",
		streamDescriptionPlaceholder: "Describe tu stream...",
		addTagPlaceholder: "Agregar etiqueta...",
		searchByNameOrMessage: "Buscar por nombre o mensaje...",
		sendMessageToChat: "Enviar mensaje al chat...",
		timerLabelPlaceholder: "ej. Redes sociales, Discord, etc.",
		timerMessagePlaceholder: "Mensaje a enviar en cada intervalo...",
	},

	// Chat History page
	chatHistory: {
		searchPlaceholder: "Buscar mensajes...",
	},

	// Viewers page
	viewers: {
		searchPlaceholder: "Buscar por nombre...",
	},

	// Analytics page
	analytics: {
		title: "Estadísticas de streams",
		subtitle: "Sigue el rendimiento de tus streams y métricas de audiencia",
		signInToView: "Inicia sesión para ver las estadísticas.",
		failedToLoad: "Error al cargar los datos",
		// Timeframe options
		last24Hours: "Últimas 24 horas",
		last7Days: "Últimos 7 días",
		last30Days: "Últimos 30 días",
		lastYear: "Último año",
		// Charts
		viewerTrends: "Tendencias de espectadores",
		platformDistribution: "Distribución por plataforma",
		peakViewers: "Pico de espectadores",
		avgViewers: "Espectadores promedio",
		daysStreamed: "Días transmitidos",
		// Empty states
		noStreamingData: "Sin datos para este período",
		streamToSee: "Transmite para ver tendencias de espectadores",
		noStreamsYet: "Sin streams aún",
		startStreaming:
			"Comienza a transmitir para ver estadísticas y datos de rendimiento.",
		// Table
		recentStreams: "Streams recientes",
		stream: "Stream",
		platform: "Plataforma",
		duration: "Duración",
		chatMessages: "Mensajes de chat",
	},

	// Settings page
	settings: {
		title: "Configuración",
		language: "Idioma",
		languageDescription: "Elige tu idioma preferido para la interfaz",
		appearance: "Apariencia",
		profile: "Perfil",
		// Account Settings
		accountSettings: "Configuración de cuenta",
		email: "Correo electrónico",
		emailCannotChange: "Tu correo electrónico no puede ser cambiado",
		displayName: "Nombre para mostrar",
		displayNamePlaceholder: "Ingresa nombre para mostrar",
		displayNameHelp:
			"El nombre debe tener 3-30 caracteres y solo contener letras, números y guiones bajos",
		updateName: "Actualizar nombre",
		updating: "Actualizando...",
		nameUpdated: "¡Nombre actualizado!",
		// Avatar
		profileAvatar: "Foto de perfil",
		uploadNewAvatar: "Subir nueva foto",
		uploading: "Subiendo...",
		avatarHelp: "JPG, PNG o GIF. Máximo 5MB. Recomendado: 256x256px",
		avatarUpdated: "¡Foto de perfil actualizada!",
		// Streaming Platforms
		streamingPlatforms: "Plataformas de streaming",
		notConnected: "No conectado",
		connect: "Conectar",
		// Plan
		getStarted: "Comienza con funciones básicas",
		upgradeToPro: "Actualizar a Pro",
		// Donation Page
		donationPage: "Página de donaciones",
		publicDonationUrl: "URL pública de donaciones",
		copyUrl: "Copiar URL",
		donationUrlHelp:
			"Comparte este enlace con tus espectadores para que puedan apoyarte con donaciones",
		publicDonationPage: "Página pública de donaciones",
		preview: "Vista previa",
		support: "Apoya a",
		// Donation Settings
		donationSettings: "Configuración de donaciones",
		minimumAmount: "Monto mínimo",
		maximumAmount: "Monto máximo",
		noMinimum: "Sin mínimo",
		noMaximum: "Sin máximo",
		leaveEmptyNoMin: "Dejar vacío para sin mínimo",
		leaveEmptyNoMax: "Dejar vacío para sin máximo",
		currency: "Moneda",
		defaultTtsVoice: "Voz TTS predeterminada",
		randomVoice: "Aleatorio (voz diferente cada vez)",
		voiceHelp:
			"Esta voz se usará cuando los donantes no elijan una voz, y para donaciones desde plataformas de streaming",
		donationLimitsInfo: "Cómo funcionan los límites de donación:",
		donationLimitsItem1:
			"Establece límites para controlar los montos de donación de tus espectadores",
		donationLimitsItem2:
			"Ambos campos son opcionales - déjalos vacíos para permitir cualquier monto",
		donationLimitsItem3:
			"Los botones predefinidos y la entrada personalizada se filtrarán según tus límites",
		donationLimitsItem4:
			"Los cambios se aplican inmediatamente en tu página de donaciones",
		saveDonationSettings: "Guardar configuración de donaciones",
		saving: "Guardando...",
		settingsSaved: "¡Configuración guardada exitosamente!",
		// Role Invitations
		roleInvitations: "Invitaciones de roles",
		noPendingInvitations: "Sin invitaciones pendientes",
		invitationsHelp:
			"Verás invitaciones aquí cuando streamers te inviten a moderar sus canales",
		invitedYouAs: "Te invitó como",
		accept: "Aceptar",
		decline: "Rechazar",
		// My Roles
		myRolesInChannels: "Mis roles en otros canales",
		noRolesInChannels: "No tienes roles en otros canales",
		rolesGrantedHelp: "Los roles otorgados por otros streamers aparecerán aquí",
		channel: " - canal",
		since: "Desde",
		// Channel Management
		channelManagement: "Gestión del canal",
		// Role Management
		roleManagement: "Gestión de roles",
		inviteUser: "Invitar usuario",
		enterUsername: "Ingresa nombre de usuario",
		moderator: "Moderador",
		manager: "Administrador",
		sendInvitation: "Enviar invitación",
		sending: "Enviando...",
		invitationSent: "¡Invitación enviada exitosamente!",
		rolePermissions: "Permisos de roles:",
		moderatorDesc: "Puede moderar el chat y gestionar configuración del stream",
		managerDesc: "Puede gestionar operaciones del canal y configuraciones",
		pendingInvitations: "Invitaciones pendientes",
		pending: "Pendiente",
		cancel: "Cancelar",
		yourTeam: "Tu equipo",
		noRolesGranted: "Sin roles otorgados aún",
		rolesGrantedToHelp:
			"Los usuarios con permisos otorgados por ti aparecerán aquí",
		revoke: "Revocar",
		// Notifications
		notificationPreferences: "Preferencias de notificaciones",
		emailNotifications: "Notificaciones por correo",
		emailNotificationsDesc: "Recibe notificaciones sobre eventos importantes",
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
		welcomeBack: "Bienvenido de nuevo",
		signInToContinue: "Inicia sesión para continuar",
		orContinueWithEmail: "O continuar con email",
		signInWithEmail: "Iniciar sesión con Email",
		signUpWithEmail: "Registrarse con Email",
		noAccount: "¿No tienes cuenta?",
		createOne: "Crea una",
		agreeToTerms: "Al iniciar sesión, aceptas nuestros",
		termsOfService: "Términos de Servicio",
		and: "y",
		privacyPolicy: "Política de Privacidad",
		alreadySignedIn: "¡Ya has iniciado sesión!",
		alreadyLoggedIn: "Ya estás conectado.",
		goToDashboard: "Ir al Panel",
		pageTitle: "Iniciar Sesión - Streampai",
		emailPlaceholder: "tu@ejemplo.com",
		passwordPlaceholder: "Ingresa tu contraseña",
		confirmPasswordPlaceholder: "Confirma tu contraseña",
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

	// Admin pages
	admin: {
		enterUserUuid: "Ingresa el UUID del usuario",
		enterNotificationMessage: "Ingresa el mensaje de notificación...",
		impersonate: "Suplantar",
	},

	// Impersonation
	impersonation: {
		banner: "Viendo como {{name}}",
		exit: "Salir",
	},

	// Donation page
	donation: {
		customAmountPlaceholder: "Monto personalizado",
		anonymousPlaceholder: "Anónimo",
		emailPlaceholder: "correo@ejemplo.com",
		messagePlaceholder: "Escribe algo lindo...",
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
