// German translations
import type { Dictionary } from "./en";

export const dict: Dictionary = {
	// Common
	common: {
		loading: "Wird geladen...",
		error: "Fehler",
		save: "Speichern",
		cancel: "Abbrechen",
		delete: "Löschen",
		edit: "Bearbeiten",
		close: "Schließen",
		confirm: "Bestätigen",
		back: "Zurück",
		next: "Weiter",
		search: "Suchen",
		noResults: "Keine Ergebnisse gefunden",
		pleaseWait: "Bitte warten...",
	},

	// Navigation
	nav: {
		home: "Startseite",
		about: "Über uns",
		signIn: "Anmelden",
		signOut: "Abmelden",
		dashboard: "Dashboard",
		google: "Google",
		twitch: "Twitch",
		welcome: "Hallo, {{name}}!",
	},

	// Dashboard sidebar sections
	sidebar: {
		overview: "Übersicht",
		streaming: "Streaming",
		widgets: "Widgets",
		account: "Konto",
		admin: "Admin",
	},

	// Dashboard navigation items
	dashboardNav: {
		dashboard: "Dashboard",
		analytics: "Statistiken",
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
		freePlan: "Kostenlos",
		goToSettings: "Zu Einstellungen",
		closeSidebar: "Seitenleiste schließen",
		welcomeMessage: "Willkommen in deinem Streampai-Dashboard.",
		// Quick Stats
		messages: "Nachrichten",
		viewers: "Zuschauer",
		followers: "Follower",
		donations: "Spenden",
		// Stream Health
		streamHealth: "Stream-Status",
		bitrate: "Bitrate",
		dropped: "Verloren",
		uptime: "Laufzeit",
		excellent: "Ausgezeichnet",
		good: "Gut",
		fair: "Mäßig",
		poor: "Schlecht",
		// Engagement Score
		engagementScore: "Engagement-Score",
		building: "Aufbauend",
		growing: "Wachsend",
		// Stream Goals
		streamGoals: "Stream-Ziele",
		dailyFollowers: "Tägliche Follower",
		donationGoal: "Spendenziel",
		chatActivity: "Chat-Aktivität",
		goalReached: "Ziel erreicht!",
		// Recent sections
		recentChat: "Letzte Nachrichten",
		recentEvents: "Letzte Events",
		recentStreams: "Letzte Streams",
		viewAll: "Alle anzeigen",
		noChatMessages: "Noch keine Chatnachrichten",
		messagesWillAppear: "Nachrichten erscheinen hier während des Streams",
		noEventsYet: "Noch keine Events",
		eventsWillAppear: "Spenden, Follows und Abos werden hier angezeigt",
		noStreamsYet: "Noch keine Streams",
		streamsWillAppear: "Dein Streamverlauf erscheint hier",
		untitledStream: "Unbenannter Stream",
		notStarted: "Nicht gestartet",
		// Activity Feed
		activityFeed: "Aktivitäten",
		events: "Events",
		all: "Alle",
		donationsFilter: "Spenden",
		follows: "Follows",
		subs: "Abos",
		raids: "Raids",
		noEvents: "Keine Events",
		anonymous: "Anonym",
		// Quick Actions
		testAlert: "Test-Alert",
		widgets: "Widgets",
		goLive: "Live gehen",
		customizeOverlays: "Overlays anpassen",
		viewStats: "Statistiken ansehen",
		configureAccount: "Konto konfigurieren",
		// Test Alert
		testAlertTitle: "Test-Alert!",
		alertsWorking: "Deine Alerts funktionieren einwandfrei.",
		// Not authenticated
		notAuthenticated: "Nicht angemeldet",
		signInToAccess: "Bitte melde dich an, um aufs Dashboard zuzugreifen.",
	},

	// Stream page
	stream: {
		streamTitlePlaceholder: "Titel deines Streams...",
		streamDescriptionPlaceholder: "Beschreibe deinen Stream...",
		addTagPlaceholder: "Tag hinzufügen...",
		searchByNameOrMessage: "Nach Name oder Nachricht suchen...",
		sendMessageToChat: "Nachricht an den Chat senden...",
		timerLabelPlaceholder: "z.B. Social Media, Discord usw.",
		timerMessagePlaceholder: "Nachricht für jedes Intervall...",
	},

	// Chat History page
	chatHistory: {
		searchPlaceholder: "Nachrichten suchen...",
	},

	// Viewers page
	viewers: {
		searchPlaceholder: "Nach Anzeigename suchen...",
	},

	// Analytics page
	analytics: {
		title: "Stream-Statistiken",
		subtitle: "Verfolge deine Streaming-Performance und Zuschauermetriken",
		signInToView: "Bitte melde dich an, um Statistiken anzuzeigen.",
		failedToLoad: "Statistiken konnten nicht geladen werden",
		// Timeframe options
		last24Hours: "Letzte 24 Stunden",
		last7Days: "Letzte 7 Tage",
		last30Days: "Letzte 30 Tage",
		lastYear: "Letztes Jahr",
		// Charts
		viewerTrends: "Zuschauer-Trends",
		platformDistribution: "Plattformverteilung",
		peakViewers: "Maximale Zuschauer",
		avgViewers: "Durchschnittliche Zuschauer",
		daysStreamed: "Tage gestreamt",
		// Empty states
		noStreamingData: "Keine Streaming-Daten für diesen Zeitraum",
		streamToSee: "Streame, um deine Zuschauer-Trends hier zu sehen",
		noStreamsYet: "Noch keine Streams",
		startStreaming:
			"Starte einen Stream, um Statistiken und Performance-Daten zu sehen.",
		// Table
		recentStreams: "Letzte Streams",
		stream: "Stream",
		platform: "Plattform",
		duration: "Dauer",
		chatMessages: "Chatnachrichten",
	},

	// Settings page
	settings: {
		title: "Einstellungen",
		language: "Sprache",
		languageDescription: "Wähle deine bevorzugte Sprache für die Oberfläche",
		appearance: "Darstellung",
		profile: "Profil",
		// Account Settings
		accountSettings: "Kontoeinstellungen",
		email: "E-Mail",
		emailCannotChange: "Deine E-Mail-Adresse kann nicht geändert werden",
		displayName: "Anzeigename",
		displayNamePlaceholder: "Anzeigename eingeben",
		displayNameHelp:
			"Name muss 3-30 Zeichen lang sein und nur Buchstaben, Zahlen und Unterstriche enthalten",
		updateName: "Namen aktualisieren",
		updating: "Wird aktualisiert...",
		nameUpdated: "Name aktualisiert!",
		// Avatar
		profileAvatar: "Profilbild",
		uploadNewAvatar: "Neues Bild hochladen",
		uploading: "Wird hochgeladen...",
		avatarHelp: "JPG, PNG oder GIF. Maximal 5MB. Empfohlen: 256x256px",
		avatarUpdated: "Profilbild erfolgreich aktualisiert!",
		// Streaming Platforms
		streamingPlatforms: "Streaming-Plattformen",
		notConnected: "Nicht verbunden",
		connect: "Verbinden",
		// Plan
		getStarted: "Starte mit den Basisfunktionen",
		upgradeToPro: "Auf Pro upgraden",
		// Donation Page
		donationPage: "Spendenseite",
		publicDonationUrl: "Öffentliche Spenden-URL",
		copyUrl: "URL kopieren",
		donationUrlHelp:
			"Teile diesen Link mit deinen Zuschauern, damit sie dich mit Spenden unterstützen können",
		publicDonationPage: "Öffentliche Spendenseite",
		preview: "Vorschau",
		support: "Unterstütze",
		// Donation Settings
		donationSettings: "Spendeneinstellungen",
		minimumAmount: "Mindestbetrag",
		maximumAmount: "Höchstbetrag",
		noMinimum: "Kein Minimum",
		noMaximum: "Kein Maximum",
		leaveEmptyNoMin: "Leer lassen für kein Minimum",
		leaveEmptyNoMax: "Leer lassen für kein Maximum",
		currency: "Währung",
		defaultTtsVoice: "Standard-TTS-Stimme",
		randomVoice: "Zufällig (jedes Mal andere Stimme)",
		voiceHelp:
			"Diese Stimme wird verwendet, wenn Spender keine Stimme wählen und für Spenden von Streaming-Plattformen",
		donationLimitsInfo: "So funktionieren Spendenlimits:",
		donationLimitsItem1: "Lege Limits fest, um Spendenbeträge zu kontrollieren",
		donationLimitsItem2:
			"Beide Felder sind optional - leer lassen erlaubt jeden Betrag",
		donationLimitsItem3:
			"Voreingestellte Buttons und eigene Eingaben werden gefiltert",
		donationLimitsItem4: "Änderungen gelten sofort auf deiner Spendenseite",
		saveDonationSettings: "Spendeneinstellungen speichern",
		saving: "Wird gespeichert...",
		settingsSaved: "Einstellungen erfolgreich gespeichert!",
		// Role Invitations
		roleInvitations: "Rolleneinladungen",
		noPendingInvitations: "Keine ausstehenden Einladungen",
		invitationsHelp:
			"Einladungen erscheinen hier, wenn Streamer dich als Moderator einladen",
		invitedYouAs: "Hat dich eingeladen als",
		accept: "Annehmen",
		decline: "Ablehnen",
		// My Roles
		myRolesInChannels: "Meine Rollen in anderen Kanälen",
		noRolesInChannels: "Du hast keine Rollen in anderen Kanälen",
		rolesGrantedHelp: "Von anderen Streamern vergebene Rollen erscheinen hier",
		channel: "s Kanal",
		since: "Seit",
		// Channel Management
		channelManagement: "Kanalverwaltung",
		// Role Management
		roleManagement: "Rollenverwaltung",
		inviteUser: "Benutzer einladen",
		enterUsername: "Benutzername eingeben",
		moderator: "Moderator",
		manager: "Manager",
		sendInvitation: "Einladung senden",
		sending: "Wird gesendet...",
		invitationSent: "Einladung erfolgreich gesendet!",
		rolePermissions: "Rollenberechtigungen:",
		moderatorDesc: "Kann Chat moderieren und Streameinstellungen verwalten",
		managerDesc: "Kann Kanalbetrieb und Konfigurationen verwalten",
		pendingInvitations: "Ausstehende Einladungen",
		pending: "Ausstehend",
		cancel: "Abbrechen",
		yourTeam: "Dein Team",
		noRolesGranted: "Noch keine Rollen vergeben",
		rolesGrantedToHelp:
			"Benutzer mit von dir vergebenen Berechtigungen erscheinen hier",
		revoke: "Entziehen",
		// Notifications
		notificationPreferences: "Benachrichtigungseinstellungen",
		emailNotifications: "E-Mail-Benachrichtigungen",
		emailNotificationsDesc:
			"Erhalte Benachrichtigungen über wichtige Ereignisse",
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
		loginTitle: "Bei Streampai anmelden",
		loginDescription: "Wähle deine bevorzugte Anmeldemethode",
		orContinueWith: "Oder fortfahren mit",
		continueWithGoogle: "Mit Google fortfahren",
		continueWithTwitch: "Mit Twitch fortfahren",
		welcomeBack: "Willkommen zurück",
		signInToContinue: "Melde dich an, um fortzufahren",
		orContinueWithEmail: "Oder mit E-Mail fortfahren",
		signInWithEmail: "Mit E-Mail anmelden",
		signUpWithEmail: "Mit E-Mail registrieren",
		noAccount: "Noch kein Konto?",
		createOne: "Jetzt erstellen",
		agreeToTerms: "Mit der Anmeldung stimmst du unseren",
		termsOfService: "Nutzungsbedingungen",
		and: "und der",
		privacyPolicy: "Datenschutzerklärung",
		alreadySignedIn: "Bereits angemeldet!",
		alreadyLoggedIn: "Du bist bereits eingeloggt.",
		goToDashboard: "Zum Dashboard",
		pageTitle: "Anmelden - Streampai",
	},

	// Errors
	errors: {
		generic: "Etwas ist schiefgelaufen",
		notFound: "Seite nicht gefunden",
		unauthorized: "Du hast keine Berechtigung für diese Seite",
		networkError: "Netzwerkfehler. Bitte überprüfe deine Verbindung.",
	},

	// Landing page
	landing: {
		features: "Funktionen",
		about: "Über uns",
		getStarted: "Loslegen",
		heroTitle1: "Streame",
		heroTitle2: "überall",
		heroTitle3: "gleichzeitig",
		underConstruction: "In Arbeit",
		underConstructionText:
			"Wir bauen etwas Großartiges! Streampai ist gerade in Entwicklung. Melde dich für unseren Newsletter an, um als Erster vom Launch zu erfahren.",
		emailPlaceholder: "Deine E-Mail-Adresse",
		notifyMe: "Benachrichtigen",
		submitting: "Wird gesendet...",
		newsletterSuccess: "Deine E-Mail wurde zum Newsletter hinzugefügt",
		heroDescription:
			"Verbinde alle deine Streaming-Plattformen, vereinige dein Publikum und verbessere deinen Content mit KI-Tools. Streame gleichzeitig zu Twitch, YouTube, Kick, Facebook und mehr.",
		more: "Mehr",
		featuresTitle1: "Alles, was du brauchst, um zu",
		featuresTitle2: "dominieren",
		featuresSubtitle:
			"Leistungsstarke Tools für ambitionierte Streamer, die ihr Publikum auf allen Plattformen vergrößern wollen",
		multiPlatformTitle: "Multi-Plattform-Streaming",
		multiPlatformDescription:
			"Streame gleichzeitig zu Twitch, YouTube, Kick, Facebook und mehr. Ein Stream, maximale Reichweite.",
		unifiedChatTitle: "Gemeinsamer Chat",
		unifiedChatDescription:
			"Alle Plattform-Chats in einem Stream vereint. Du verpasst keine Nachricht mehr.",
		analyticsTitle: "Live-Statistiken",
		analyticsDescription:
			"Verfolge Zuschauer, Engagement, Einnahmen und Wachstum über alle Plattformen in einem Dashboard.",
		moderationTitle: "KI-Moderation",
		moderationDescription:
			"Automatische Moderation mit eigenen Regeln, Spam-Erkennung und Toxizitätsfilter für alle Plattformen.",
		widgetsTitle: "Eigene Widgets",
		widgetsDescription:
			"Schöne, anpassbare Widgets für Spenden, Follows, Chat und mehr. Perfekt für deine Marke.",
		teamTitle: "Team-Tools",
		teamDescription:
			"Moderator-Dashboard, Teamverwaltung und Tools für die Zusammenarbeit beim Streamen.",
		aboutTitle1: "Von Streamern entwickelt,",
		aboutTitle2: "für Streamer",
		aboutParagraph1:
			"Wir kennen das Problem, mehrere Streaming-Plattformen zu verwalten. Deshalb haben wir Streampai entwickelt – die Lösung für Content-Creator, die ihre Reichweite ohne Aufwand maximieren wollen.",
		aboutParagraph2:
			"Schluss mit dem Wechseln zwischen Chat-Fenstern, Spendenalarmen und Statistik-Dashboards. Streampai bringt alles in einer intuitiven Plattform zusammen, die mit dir wächst.",
		aboutParagraph3:
			"Ob Hobby-Streamer oder Vollzeit-Creator – unsere KI-Tools helfen dir, dich aufs Wesentliche zu konzentrieren: großartigen Content erstellen und deine Community aufbauen.",
		platformIntegrations: "Plattform-Integrationen",
		uptime: "Verfügbarkeit",
		realTimeSync: "Echtzeit-Sync",
		realTimeSyncDescription:
			"Chat und Events sofort auf allen Plattformen synchronisiert",
		advancedAnalytics: "Erweiterte Statistiken",
		advancedAnalyticsDescription:
			"Tiefe Einblicke in Zuschauerverhalten und Engagement-Muster",
		aiPoweredGrowth: "KI-gesteuertes Wachstum",
		aiPoweredGrowthDescription:
			"Smarte Empfehlungen zur Optimierung deiner Content-Strategie",
		ctaTitle: "Bereit, deinen Stream aufs nächste Level zu bringen?",
		ctaSubtitle:
			"Schließ dich Streamern an, die ihr Publikum bereits mit Streampai vergrößern",
	},

	// Footer
	footer: {
		privacy: "Datenschutz",
		terms: "AGB",
		support: "Support",
		contact: "Kontakt",
		copyright: "Streampai. Alle Rechte vorbehalten.",
		madeWith: "Mit",
		forStreamers: "für Streamer gemacht.",
	},

	// Privacy page
	privacy: {
		title: "Datenschutzerklärung",
		lastUpdated: "Zuletzt aktualisiert: Dezember 2024",
		section1Title: "1. Welche Daten wir erheben",
		section1Intro: "Wir erheben Daten, die du uns direkt gibst, darunter:",
		section1Item1: "Kontodaten (Name, E-Mail, Passwort)",
		section1Item2: "Profildaten von verbundenen Streaming-Plattformen",
		section1Item3: "Stream-Metadaten und Analysedaten",
		section1Item4: "Chat-Nachrichten und Moderationsaktionen",
		section1Item5: "Zahlungsdaten (sicher verarbeitet durch Drittanbieter)",
		section2Title: "2. Wie wir deine Daten nutzen",
		section2Intro: "Wir nutzen die erhobenen Daten, um:",
		section2Item1:
			"Unsere Dienste bereitzustellen, zu warten und zu verbessern",
		section2Item2:
			"Deinen Content über mehrere Streaming-Plattformen zu verbinden und zu synchronisieren",
		section2Item3:
			"Analysen und Einblicke in deine Streaming-Performance zu generieren",
		section2Item4: "Dir technische Hinweise und Support-Nachrichten zu senden",
		section2Item5: "Auf deine Kommentare und Fragen zu antworten",
		section3Title: "3. Datenweitergabe",
		section3Intro:
			"Wir verkaufen deine Daten nicht. Wir können sie in folgenden Fällen weitergeben:",
		section3Item1:
			"An Streaming-Plattformen, die du verbindest (für Multi-Plattform-Streaming)",
		section3Item2:
			"An Dienstleister, die uns beim Betrieb der Plattform unterstützen",
		section3Item3:
			"Wenn gesetzlich vorgeschrieben oder zum Schutz unserer Rechte",
		section3Item4: "Mit deiner Zustimmung oder auf deine Anweisung",
		section4Title: "4. Datensicherheit",
		section4Text:
			"Wir setzen geeignete technische und organisatorische Maßnahmen ein, um deine Daten vor unbefugtem Zugriff, Änderung, Offenlegung oder Vernichtung zu schützen. Das umfasst Verschlüsselung, sichere Protokolle und regelmäßige Sicherheitsprüfungen.",
		section5Title: "5. Drittanbieter-Dienste",
		section5Text:
			"Unser Dienst verbindet sich mit Drittanbieter-Plattformen (Twitch, YouTube, Kick, Facebook usw.). Wenn du diese Dienste verbindest, können sie gemäß ihren eigenen Datenschutzrichtlinien Daten erheben. Wir empfehlen, deren Datenschutzpraktiken zu prüfen.",
		section6Title: "6. Datenspeicherung",
		section6Text:
			"Wir speichern deine Daten, solange dein Konto aktiv ist oder wie für die Bereitstellung unserer Dienste nötig. Du kannst jederzeit die Löschung deines Kontos und der zugehörigen Daten beantragen.",
		section7Title: "7. Deine Rechte",
		section7Intro: "Du hast das Recht:",
		section7Item1: "Auf die von uns gespeicherten Daten zuzugreifen",
		section7Item2: "Die Korrektur ungenauer Daten zu verlangen",
		section7Item3: "Die Löschung deiner Daten zu verlangen",
		section7Item4: "Deine Daten in einem portablen Format zu exportieren",
		section7Item5: "Marketing-Kommunikation abzulehnen",
		section8Title: "8. Cookies und Tracking",
		section8Text:
			"Wir nutzen Cookies und ähnliche Technologien, um deine Sitzung aufrechtzuerhalten, deine Präferenzen zu speichern und zu verstehen, wie du unseren Dienst nutzt. Du kannst Cookie-Einstellungen in deinem Browser anpassen.",
		section9Title: "9. Datenschutz für Kinder",
		section9Text:
			"Unser Dienst ist nicht für Nutzer unter 13 Jahren gedacht. Wir erheben wissentlich keine Daten von Kindern unter 13 Jahren.",
		section10Title: "10. Änderungen dieser Erklärung",
		section10Text:
			"Wir können diese Datenschutzerklärung gelegentlich aktualisieren. Über Änderungen informieren wir, indem wir die neue Version hier veröffentlichen und das Datum aktualisieren.",
		section11Title: "11. Kontakt",
		section11Text: "Bei Fragen zu dieser Datenschutzerklärung kannst du uns",
		contactUs: "kontaktieren",
	},

	// Terms page
	terms: {
		title: "Nutzungsbedingungen",
		lastUpdated: "Zuletzt aktualisiert: Dezember 2024",
		section1Title: "1. Annahme der Bedingungen",
		section1Text:
			"Mit der Nutzung von Streampai stimmst du diesen Nutzungsbedingungen zu. Wenn du nicht einverstanden bist, nutze unsere Dienste bitte nicht.",
		section2Title: "2. Beschreibung des Dienstes",
		section2Text:
			"Streampai ist eine Multi-Plattform-Streaming-Lösung, mit der du Content gleichzeitig auf mehrere Plattformen streamen, einen gemeinsamen Chat verwalten und plattformübergreifende Statistiken nutzen kannst.",
		section3Title: "3. Benutzerkonten",
		section3Text:
			"Du bist für die Geheimhaltung deiner Zugangsdaten und alle Aktivitäten unter deinem Konto verantwortlich. Bei unbefugter Nutzung informiere uns bitte sofort.",
		section4Title: "4. Akzeptable Nutzung",
		section4Intro: "Du verpflichtest dich, Folgendes zu unterlassen:",
		section4Item1:
			"Den Dienst für illegale oder nicht autorisierte Zwecke nutzen",
		section4Item2: "Gesetze zu verletzen, einschließlich Urheberrechte",
		section4Item3: "Schädliche Inhalte oder Malware zu übertragen",
		section4Item4:
			"Den Dienst oder verbundene Server zu stören oder zu unterbrechen",
		section4Item5: "Unbefugten Zugang zu Teilen des Dienstes zu erlangen",
		section5Title: "5. Content-Verantwortung",
		section5Text:
			"Du bist allein für den Content verantwortlich, den du über unsere Plattform streamst, teilst oder verbreitest. Du behältst alle Eigentumsrechte, gewährst uns aber eine Lizenz zur Anzeige und Verbreitung über unseren Dienst.",
		section6Title: "6. Drittanbieter-Integrationen",
		section6Text:
			"Unser Dienst verbindet sich mit Drittanbieter-Plattformen wie Twitch, YouTube und anderen. Deren Nutzung unterliegt deren jeweiligen Nutzungsbedingungen und Datenschutzrichtlinien.",
		section7Title: "7. Haftungsbeschränkung",
		section7Text:
			"Streampai haftet nicht für indirekte, zufällige, besondere, Folge- oder Strafschäden, die sich aus der Nutzung oder Nichtnutzung des Dienstes ergeben.",
		section8Title: "8. Änderungen der Bedingungen",
		section8Text:
			"Wir behalten uns das Recht vor, diese Bedingungen jederzeit zu ändern. Über wesentliche Änderungen informieren wir per E-Mail oder über den Dienst. Die weitere Nutzung gilt als Zustimmung.",
		section9Title: "9. Kündigung",
		section9Text:
			"Wir können dein Konto und deinen Zugang sofort, ohne Vorankündigung, für Verhalten kündigen oder sperren, das wir als Verstoß gegen diese Bedingungen oder als schädlich für andere ansehen.",
		section10Title: "10. Kontakt",
		section10Text: "Bei Fragen zu diesen Nutzungsbedingungen kannst du uns",
		contactUs: "kontaktieren",
	},

	// Support page
	support: {
		title: "Support",
		heading: "Wie können wir helfen?",
		subheading:
			"Finde Antworten auf häufige Fragen oder wende dich an unser Support-Team.",
		documentation: "Dokumentation",
		documentationDescription:
			"Umfassende Anleitungen und Tutorials, um das Beste aus Streampai herauszuholen.",
		faq: "FAQ",
		faqDescription: "Schnelle Antworten auf häufig gestellte Fragen.",
		discord: "Discord-Community",
		discordDescription:
			"Tritt unserem Discord-Server bei, um dich mit anderen Streamern zu vernetzen.",
		emailSupport: "E-Mail-Support",
		emailSupportDescription:
			"Wende dich direkt an unser Team für persönliche Unterstützung.",
		contactUs: "Kontaktiere uns",
		comingSoon: "Demnächst",
		faqTitle: "Häufig gestellte Fragen",
		faqQ1: "Welche Plattformen unterstützt Streampai?",
		faqA1:
			"Streampai unterstützt Multi-Plattform-Streaming zu Twitch, YouTube, Kick, Facebook und mehr. Wir fügen ständig neue Integrationen hinzu.",
		faqQ2: "Wie verbinde ich meine Streaming-Konten?",
		faqA2:
			'Nach der Registrierung gehst du zu den Dashboard-Einstellungen und klickst auf "Konten verbinden". Folge den OAuth-Anweisungen, um deine Konten sicher zu verknüpfen.',
		faqQ3: "Sind meine Daten sicher?",
		faqA3:
			"Ja, Sicherheit ist uns wichtig. Alle Daten werden bei Übertragung und Speicherung verschlüsselt. Wir speichern nie deine Plattform-Passwörter – wir nutzen sichere OAuth-Tokens. Lies unsere",
		privacyPolicy: "Datenschutzerklärung",
		faqA3End: "für mehr Details.",
		faqQ4: "Kann ich mein Abo jederzeit kündigen?",
		faqA4:
			"Ja, du kannst dein Abo jederzeit in den Kontoeinstellungen kündigen. Du behältst den Zugang bis zum Ende deines Abrechnungszeitraums.",
		faqQ5: "Wie melde ich einen Fehler oder schlage eine Funktion vor?",
		faqA5:
			"Wir freuen uns über Feedback! Kontaktiere uns mit Fehlerberichten oder Funktionsvorschlägen. Du kannst auch unserer Discord-Community beitreten und Ideen diskutieren.",
	},

	// Admin pages
	admin: {
		enterUserUuid: "Benutzer-UUID eingeben",
		enterNotificationMessage: "Benachrichtigungstext eingeben...",
	},

	// Contact page
	contact: {
		title: "Kontakt",
		heading: "Schreib uns",
		subheading:
			"Hast du eine Frage, einen Vorschlag oder brauchst Hilfe? Wir freuen uns, von dir zu hören.",
		emailTitle: "E-Mail",
		discordTitle: "Discord",
		discordDescription: "Tritt unserer Community bei",
		githubTitle: "GitHub",
		githubDescription: "Probleme melden",
		comingSoon: "Demnächst",
		formTitle: "Nachricht senden",
		nameLabel: "Name",
		namePlaceholder: "Dein Name",
		emailLabel: "E-Mail",
		emailPlaceholder: "deine@email.de",
		subjectLabel: "Betreff",
		subjectPlaceholder: "Wähle ein Thema",
		subjectGeneral: "Allgemeine Anfrage",
		subjectSupport: "Technischer Support",
		subjectBilling: "Abrechnungsfrage",
		subjectFeature: "Funktionsvorschlag",
		subjectBug: "Fehlerbericht",
		subjectPartnership: "Partnerschaft",
		messageLabel: "Nachricht",
		messagePlaceholder: "Wie können wir dir helfen?",
		sending: "Wird gesendet...",
		sendButton: "Nachricht senden",
		successMessage: "Danke für deine Nachricht! Wir melden uns bald bei dir.",
	},
};
