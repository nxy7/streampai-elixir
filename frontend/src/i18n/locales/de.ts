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

	// Landing page
	landing: {
		features: "Funktionen",
		about: "Uber uns",
		getStarted: "Loslegen",
		heroTitle1: "Streame zu",
		heroTitle2: "Allen",
		heroTitle3: "gleichzeitig",
		underConstruction: "Im Aufbau",
		underConstructionText:
			"Wir bauen etwas Grossartiges! Streampai befindet sich derzeit in der Entwicklung. Melden Sie sich fur unseren Newsletter an, um als Erster zu erfahren, wann wir starten.",
		emailPlaceholder: "Ihre E-Mail-Adresse eingeben",
		notifyMe: "Benachrichtigen",
		submitting: "Wird gesendet...",
		newsletterSuccess: "Ihre E-Mail wurde zu unserem Newsletter hinzugefugt",
		heroDescription:
			"Verbinden Sie alle Ihre Streaming-Plattformen, vereinen Sie Ihr Publikum und verbessern Sie Ihre Inhalte mit KI-gesteuerten Tools. Streamen Sie gleichzeitig zu Twitch, YouTube, Kick, Facebook und mehr.",
		more: "Mehr",
		featuresTitle1: "Alles, was Sie brauchen, um zu",
		featuresTitle2: "dominieren",
		featuresSubtitle:
			"Leistungsstarke Tools fur ambitionierte Streamer, die ihr Publikum auf allen Plattformen vergrossern mochten",
		multiPlatformTitle: "Multi-Plattform-Streaming",
		multiPlatformDescription:
			"Streamen Sie gleichzeitig zu Twitch, YouTube, Kick, Facebook und mehr. Ein Stream, maximale Reichweite.",
		unifiedChatTitle: "Einheitliche Chat-Verwaltung",
		unifiedChatDescription:
			"Fuhren Sie alle Plattform-Chats in einem Stream zusammen. Verpassen Sie nie wieder eine Nachricht von irgendeiner Plattform.",
		analyticsTitle: "Echtzeit-Analytik",
		analyticsDescription:
			"Verfolgen Sie Zuschauer, Engagement, Einnahmen und Wachstum uber alle Plattformen in einem schonen Dashboard.",
		moderationTitle: "KI-gesteuerte Moderation",
		moderationDescription:
			"Auto-Moderation mit benutzerdefinierten Regeln, Spam-Erkennung und Toxizitatsfilterung uber alle Plattformen.",
		widgetsTitle: "Benutzerdefinierte Stream-Widgets",
		widgetsDescription:
			"Schone, anpassbare Widgets fur Spenden, Follows, Chat und mehr. Perfekt fur Ihre Marke.",
		teamTitle: "Team- und Moderator-Tools",
		teamDescription:
			"Leistungsstarkes Moderator-Dashboard, Team-Management und kollaborative Stream-Management-Tools.",
		aboutTitle1: "Von Streamern erstellt,",
		aboutTitle2: "fur Streamer",
		aboutParagraph1:
			"Wir verstehen die Muhe, mehrere Streaming-Plattformen zu verwalten. Deshalb haben wir Streampai entwickelt - die ultimative Losung fur Content-Ersteller, die ihre Reichweite ohne Komplexitat maximieren mochten.",
		aboutParagraph2:
			"Vorbei sind die Zeiten, in denen Sie mehrere Chat-Fenster, Spendenalarme und Analyse-Dashboards jonglieren mussten. Streampai bringt alles in einer leistungsstarken, intuitiven Plattform zusammen, die mit Ihrem Wachstum skaliert.",
		aboutParagraph3:
			"Ob Sie ein Wochenend-Krieger oder ein Vollzeit-Content-Ersteller sind - unsere KI-gesteuerten Tools helfen Ihnen, sich auf das Wesentliche zu konzentrieren: grossartige Inhalte zu erstellen und Ihre Community aufzubauen.",
		platformIntegrations: "Plattform-Integrationen",
		uptime: "Verfugbarkeit",
		realTimeSync: "Echtzeit-Synchronisierung",
		realTimeSyncDescription:
			"Chat und Events werden sofort uber alle Plattformen synchronisiert",
		advancedAnalytics: "Erweiterte Analytik",
		advancedAnalyticsDescription:
			"Tiefe Einblicke in das Zuschauerverhalten und Engagement-Muster",
		aiPoweredGrowth: "KI-gesteuertes Wachstum",
		aiPoweredGrowthDescription:
			"Intelligente Empfehlungen zur Optimierung Ihrer Content-Strategie",
		ctaTitle: "Bereit, Ihren Stream aufzuwerten?",
		ctaSubtitle:
			"Schliessen Sie sich Streamern an, die ihr Publikum bereits mit Streampai vergrossern",
	},

	// Footer
	footer: {
		privacy: "Datenschutz",
		terms: "AGB",
		support: "Support",
		contact: "Kontakt",
		copyright: "Streampai. Alle Rechte vorbehalten.",
		madeWith: "Mit",
		forStreamers: "fur Streamer gemacht.",
	},

	// Privacy page
	privacy: {
		title: "Datenschutzrichtlinie",
		lastUpdated: "Zuletzt aktualisiert: Dezember 2024",
		section1Title: "1. Welche Informationen wir sammeln",
		section1Intro:
			"Wir sammeln Informationen, die Sie uns direkt zur Verfugung stellen, einschliesslich:",
		section1Item1: "Kontoinformationen (Name, E-Mail, Passwort)",
		section1Item2: "Profilinformationen von verbundenen Streaming-Plattformen",
		section1Item3: "Stream-Metadaten und Analysedaten",
		section1Item4: "Chat-Nachrichten und Moderationsaktionen",
		section1Item5: "Zahlungsinformationen (sicher verarbeitet durch Drittanbieter)",
		section2Title: "2. Wie wir Ihre Informationen verwenden",
		section2Intro: "Wir verwenden die gesammelten Informationen, um:",
		section2Item1: "Unsere Dienste bereitzustellen, zu warten und zu verbessern",
		section2Item2:
			"Ihre Inhalte uber mehrere Streaming-Plattformen zu verbinden und zu synchronisieren",
		section2Item3: "Analysen und Einblicke in Ihre Streaming-Leistung zu generieren",
		section2Item4: "Ihnen technische Hinweise und Support-Nachrichten zu senden",
		section2Item5: "Auf Ihre Kommentare und Fragen zu antworten",
		section3Title: "3. Weitergabe von Informationen",
		section3Intro:
			"Wir verkaufen Ihre personlichen Daten nicht. Wir konnen Ihre Informationen unter folgenden Umstanden weitergeben:",
		section3Item1:
			"Mit Streaming-Plattformen, die Sie verbinden (um Multi-Plattform-Streaming zu ermoglichen)",
		section3Item2: "Mit Dienstleistern, die uns beim Betrieb unserer Plattform unterstutzen",
		section3Item3: "Wenn es gesetzlich vorgeschrieben ist oder um unsere Rechte zu schutzen",
		section3Item4: "Mit Ihrer Zustimmung oder auf Ihre Anweisung",
		section4Title: "4. Datensicherheit",
		section4Text:
			"Wir implementieren geeignete technische und organisatorische Massnahmen, um Ihre personlichen Daten vor unbefugtem Zugriff, Anderung, Offenlegung oder Zerstorung zu schutzen. Dies umfasst Verschlusselung, sichere Protokolle und regelmasige Sicherheitsaudits.",
		section5Title: "5. Drittanbieter-Dienste",
		section5Text:
			"Unser Dienst integriert sich mit Drittanbieter-Streaming-Plattformen (Twitch, YouTube, Kick, Facebook usw.). Wenn Sie diese Dienste verbinden, konnen sie gema ihren eigenen Datenschutzrichtlinien Informationen sammeln. Wir empfehlen Ihnen, deren Datenschutzpraktiken zu uberprufen.",
		section6Title: "6. Datenaufbewahrung",
		section6Text:
			"Wir bewahren Ihre Informationen auf, solange Ihr Konto aktiv ist oder wie fur die Bereitstellung unserer Dienste erforderlich. Sie konnen jederzeit die Loschung Ihres Kontos und der zugehorigen Daten beantragen, indem Sie uns kontaktieren.",
		section7Title: "7. Ihre Rechte",
		section7Intro: "Sie haben das Recht:",
		section7Item1: "Auf die personlichen Daten zuzugreifen, die wir uber Sie speichern",
		section7Item2: "Die Korrektur ungenauer Daten zu beantragen",
		section7Item3: "Die Loschung Ihrer Daten zu beantragen",
		section7Item4: "Ihre Daten in einem portablen Format zu exportieren",
		section7Item5: "Marketing-Kommunikationen abzulehnen",
		section8Title: "8. Cookies und Tracking",
		section8Text:
			"Wir verwenden Cookies und ahnliche Technologien, um Ihre Sitzung aufrechtzuerhalten, Ihre Praferenzen zu speichern und zu verstehen, wie Sie unseren Dienst nutzen. Sie konnen die Cookie-Einstellungen uber Ihre Browser-Praferenzen steuern.",
		section9Title: "9. Datenschutz fur Kinder",
		section9Text:
			"Unser Dienst ist nicht fur Benutzer unter 13 Jahren bestimmt. Wir sammeln wissentlich keine personlichen Daten von Kindern unter 13 Jahren.",
		section10Title: "10. Anderungen dieser Richtlinie",
		section10Text:
			'Wir konnen diese Datenschutzrichtlinie von Zeit zu Zeit aktualisieren. Wir werden Sie uber alle Anderungen informieren, indem wir die neue Richtlinie auf dieser Seite veroffentlichen und das Datum "Zuletzt aktualisiert" aktualisieren.',
		section11Title: "11. Kontaktieren Sie uns",
		section11Text:
			"Wenn Sie Fragen zu dieser Datenschutzrichtlinie haben, kontaktieren Sie uns bitte",
		contactUs: "hier",
	},

	// Terms page
	terms: {
		title: "Nutzungsbedingungen",
		lastUpdated: "Zuletzt aktualisiert: Dezember 2024",
		section1Title: "1. Annahme der Bedingungen",
		section1Text:
			"Durch den Zugriff auf oder die Nutzung der Dienste von Streampai stimmen Sie zu, an diese Nutzungsbedingungen gebunden zu sein. Wenn Sie diesen Bedingungen nicht zustimmen, nutzen Sie bitte unsere Dienste nicht.",
		section2Title: "2. Beschreibung des Dienstes",
		section2Text:
			"Streampai bietet eine Multi-Plattform-Streaming-Management-Losung, die es Benutzern ermoglicht, Inhalte gleichzeitig auf mehreren Plattformen zu streamen, einen einheitlichen Chat zu verwalten und plattformubergreifende Analysen zu nutzen.",
		section3Title: "3. Benutzerkonten",
		section3Text:
			"Sie sind verantwortlich fur die Geheimhaltung Ihrer Kontodaten und fur alle Aktivitaten, die unter Ihrem Konto stattfinden. Sie mussen uns sofort uber jede unbefugte Nutzung Ihres Kontos informieren.",
		section4Title: "4. Akzeptable Nutzung",
		section4Intro: "Sie stimmen zu, Folgendes nicht zu tun:",
		section4Item1: "Den Dienst fur illegale oder nicht autorisierte Zwecke nutzen",
		section4Item2: "Gesetze in Ihrer Gerichtsbarkeit verletzen, einschliesslich Urheberrechtsgesetze",
		section4Item3: "Schadliche Inhalte oder Malware ubertragen",
		section4Item4: "Den Dienst oder mit dem Dienst verbundene Server storen oder unterbrechen",
		section4Item5: "Versuchen, unbefugten Zugang zu irgendeinem Teil des Dienstes zu erlangen",
		section5Title: "5. Verantwortung fur Inhalte",
		section5Text:
			"Sie sind allein verantwortlich fur die Inhalte, die Sie uber unsere Plattform streamen, teilen oder verbreiten. Sie behalten alle Eigentumsrechte an Ihren Inhalten, gewahren uns aber eine Lizenz, diese uber unseren Dienst anzuzeigen und zu verbreiten.",
		section6Title: "6. Drittanbieter-Integrationen",
		section6Text:
			"Unser Dienst integriert sich mit Drittanbieter-Plattformen wie Twitch, YouTube und anderen. Ihre Nutzung dieser Plattformen unterliegt deren jeweiligen Nutzungsbedingungen und Datenschutzrichtlinien.",
		section7Title: "7. Haftungsbeschrankung",
		section7Text:
			"Streampai haftet nicht fur indirekte, zufallige, besondere, Folge- oder Strafschaden, die sich aus Ihrer Nutzung oder Unfahigkeit zur Nutzung des Dienstes ergeben.",
		section8Title: "8. Anderungen der Bedingungen",
		section8Text:
			"Wir behalten uns das Recht vor, diese Bedingungen jederzeit zu andern. Wir werden Benutzer uber wesentliche Anderungen per E-Mail oder uber den Dienst informieren. Die weitere Nutzung des Dienstes nach solchen Anderungen gilt als Akzeptanz der neuen Bedingungen.",
		section9Title: "9. Kundigung",
		section9Text:
			"Wir konnen Ihr Konto und Ihren Zugang zum Dienst sofort, ohne vorherige Ankundigung, fur Verhalten kundigen oder sperren, das wir als Verletzung dieser Nutzungsbedingungen oder als schadlich fur andere Benutzer, uns oder Dritte betrachten.",
		section10Title: "10. Kontaktinformationen",
		section10Text:
			"Wenn Sie Fragen zu diesen Nutzungsbedingungen haben, kontaktieren Sie uns bitte",
		contactUs: "hier",
	},

	// Support page
	support: {
		title: "Support",
		heading: "Wie konnen wir Ihnen helfen?",
		subheading:
			"Finden Sie Antworten auf haufige Fragen oder wenden Sie sich an unser Support-Team.",
		documentation: "Dokumentation",
		documentationDescription:
			"Umfassende Anleitungen und Tutorials, um das Beste aus Streampai herauszuholen.",
		faq: "FAQ",
		faqDescription:
			"Schnelle Antworten auf haufig gestellte Fragen zu unserem Dienst.",
		discord: "Community Discord",
		discordDescription:
			"Treten Sie unserem Discord-Server bei, um sich mit anderen Streamern zu vernetzen und Community-Support zu erhalten.",
		emailSupport: "E-Mail-Support",
		emailSupportDescription:
			"Wenden Sie sich direkt an unser Support-Team fur personliche Unterstutzung.",
		contactUs: "Kontaktieren Sie uns",
		comingSoon: "Demnachst",
		faqTitle: "Haufig gestellte Fragen",
		faqQ1: "Welche Plattformen unterstutzt Streampai?",
		faqA1:
			"Streampai unterstutzt Multi-Plattform-Streaming zu Twitch, YouTube, Kick, Facebook und mehr. Wir fugen standig neue Plattform-Integrationen hinzu.",
		faqQ2: "Wie verbinde ich meine Streaming-Konten?",
		faqA2:
			'Nach der Registrierung gehen Sie zu Ihren Dashboard-Einstellungen und klicken auf "Konten verbinden". Folgen Sie den OAuth-Aufforderungen, um Ihre Streaming-Plattform-Konten sicher zu verknupfen.',
		faqQ3: "Sind meine Daten sicher?",
		faqA3:
			"Ja, wir nehmen Sicherheit ernst. Alle Daten werden bei der Ubertragung und im Ruhezustand verschlusselt. Wir speichern niemals Ihre Streaming-Plattform-Passworter - wir verwenden sichere OAuth-Tokens zur Authentifizierung. Lesen Sie unsere",
		privacyPolicy: "Datenschutzrichtlinie",
		faqA3End: "fur weitere Details.",
		faqQ4: "Kann ich mein Abonnement jederzeit kundigen?",
		faqA4:
			"Ja, Sie konnen Ihr Abonnement jederzeit in Ihren Kontoeinstellungen kundigen. Sie haben bis zum Ende Ihrer Abrechnungsperiode weiterhin Zugang.",
		faqQ5: "Wie melde ich einen Fehler oder fordere eine Funktion an?",
		faqA5:
			"Wir horen gerne von unseren Benutzern! Bitte kontaktieren Sie uns mit Fehlerberichten oder Funktionsanfragen. Sie konnen auch unserer Discord-Community beitreten, um Ideen mit anderen Benutzern zu diskutieren.",
	},

	// Contact page
	contact: {
		title: "Kontakt",
		heading: "Kontaktieren Sie uns",
		subheading:
			"Haben Sie eine Frage, einen Vorschlag oder benotigen Hilfe? Wir horen gerne von Ihnen.",
		emailTitle: "E-Mail",
		discordTitle: "Discord",
		discordDescription: "Treten Sie unserer Community bei",
		githubTitle: "GitHub",
		githubDescription: "Probleme melden",
		comingSoon: "Demnachst",
		formTitle: "Senden Sie uns eine Nachricht",
		nameLabel: "Name",
		namePlaceholder: "Ihr Name",
		emailLabel: "E-Mail",
		emailPlaceholder: "ihre@email.com",
		subjectLabel: "Betreff",
		subjectPlaceholder: "Wahlen Sie ein Thema",
		subjectGeneral: "Allgemeine Anfrage",
		subjectSupport: "Technischer Support",
		subjectBilling: "Abrechnungsfrage",
		subjectFeature: "Funktionsanfrage",
		subjectBug: "Fehlerbericht",
		subjectPartnership: "Partnerschaft",
		messageLabel: "Nachricht",
		messagePlaceholder: "Wie konnen wir Ihnen helfen?",
		sending: "Wird gesendet...",
		sendButton: "Nachricht senden",
		successMessage:
			"Vielen Dank fur Ihre Nachricht! Wir werden uns bald bei Ihnen melden.",
	},
};
