// Polish translations
import type { Dictionary } from "./en";

export const dict: Dictionary = {
	// Common
	common: {
		loading: "Ładowanie...",
		error: "Błąd",
		save: "Zapisz",
		cancel: "Anuluj",
		delete: "Usuń",
		edit: "Edytuj",
		close: "Zamknij",
		confirm: "Potwierdź",
		back: "Wstecz",
		next: "Dalej",
		search: "Szukaj",
		noResults: "Brak wyników",
	},

	// Navigation
	nav: {
		home: "Strona główna",
		about: "O nas",
		signIn: "Zaloguj się",
		signOut: "Wyloguj się",
		dashboard: "Panel",
		google: "Google",
		twitch: "Twitch",
		welcome: "Cześć, {{name}}!",
	},

	// Dashboard sidebar sections
	sidebar: {
		overview: "Przegląd",
		streaming: "Streaming",
		widgets: "Widżety",
		account: "Konto",
		admin: "Admin",
	},

	// Dashboard navigation items
	dashboardNav: {
		dashboard: "Panel",
		analytics: "Statystyki",
		stream: "Stream",
		chatHistory: "Historia czatu",
		viewers: "Widzowie",
		streamHistory: "Historia streamów",
		widgets: "Widżety",
		smartCanvas: "Smart Canvas",
		settings: "Ustawienia",
		users: "Użytkownicy",
		notifications: "Powiadomienia",
		moderate: "Moderacja",
	},

	// Dashboard
	dashboard: {
		freePlan: "Plan darmowy",
		goToSettings: "Przejdź do ustawień",
		closeSidebar: "Zwiń panel boczny",
	},

	// Settings page
	settings: {
		title: "Ustawienia",
		language: "Język",
		languageDescription: "Wybierz język interfejsu",
		appearance: "Wygląd",
		profile: "Profil",
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
		loginTitle: "Zaloguj się do Streampai",
		loginDescription: "Wybierz sposób logowania",
		orContinueWith: "Lub kontynuuj przez",
		continueWithGoogle: "Kontynuuj przez Google",
		continueWithTwitch: "Kontynuuj przez Twitch",
		welcomeBack: "Witaj ponownie",
		signInToContinue: "Zaloguj się, aby kontynuować",
		orContinueWithEmail: "Lub kontynuuj przez e-mail",
		signInWithEmail: "Zaloguj przez e-mail",
		noAccount: "Nie masz konta?",
		createOne: "Utwórz je",
		agreeToTerms: "Logując się, akceptujesz nasz",
		termsOfService: "Regulamin",
		and: "i",
		privacyPolicy: "Politykę prywatności",
		alreadySignedIn: "Już zalogowany!",
		alreadyLoggedIn: "Jesteś już zalogowany.",
		goToDashboard: "Przejdź do panelu",
		pageTitle: "Logowanie - Streampai",
	},

	// Errors
	errors: {
		generic: "Coś poszło nie tak",
		notFound: "Nie znaleziono strony",
		unauthorized: "Nie masz dostępu do tej strony",
		networkError: "Błąd połączenia. Sprawdź internet.",
	},

	// Landing page
	landing: {
		features: "Funkcje",
		about: "O nas",
		getStarted: "Rozpocznij",
		heroTitle1: "Streamuj",
		heroTitle2: "wszędzie",
		heroTitle3: "naraz",
		underConstruction: "W budowie",
		underConstructionText:
			"Pracujemy nad czymś wyjątkowym! Streampai jest w trakcie rozwoju. Zapisz się na newsletter, żeby dowiedzieć się pierwszy o premierze.",
		emailPlaceholder: "Wpisz swój e-mail",
		notifyMe: "Powiadom mnie",
		submitting: "Wysyłanie...",
		newsletterSuccess: "Twój e-mail został dodany do newslettera",
		heroDescription:
			"Połącz wszystkie platformy streamingowe, zjednocz widownię i wzbogać swoje treści narzędziami AI. Streamuj jednocześnie na Twitch, YouTube, Kick, Facebook i inne.",
		more: "Więcej",
		featuresTitle1: "Wszystko, czego potrzebujesz, by",
		featuresTitle2: "zdominować",
		featuresSubtitle:
			"Potężne narzędzia dla ambitnych streamerów, którzy chcą rozwijać widownię na wszystkich platformach",
		multiPlatformTitle: "Streaming wieloplatformowy",
		multiPlatformDescription:
			"Streamuj jednocześnie na Twitch, YouTube, Kick, Facebook i inne. Jeden stream, maksymalny zasięg.",
		unifiedChatTitle: "Wspólny czat",
		unifiedChatDescription:
			"Połącz czaty ze wszystkich platform w jeden strumień. Nie przegapisz żadnej wiadomości.",
		analyticsTitle: "Statystyki na żywo",
		analyticsDescription:
			"Śledź widzów, zaangażowanie, przychody i wzrost na wszystkich platformach w jednym miejscu.",
		moderationTitle: "Moderacja AI",
		moderationDescription:
			"Automatyczna moderacja z własnymi regułami, wykrywaniem spamu i filtrowaniem toksycznych treści.",
		widgetsTitle: "Własne widżety",
		widgetsDescription:
			"Piękne, konfigurowalne widżety dla donacji, obserwujących, czatu i więcej. Dopasuj je do swojej marki.",
		teamTitle: "Narzędzia dla zespołu",
		teamDescription:
			"Panel moderatora, zarządzanie zespołem i narzędzia do współpracy przy streamach.",
		aboutTitle1: "Stworzone przez streamerów,",
		aboutTitle2: "dla streamerów",
		aboutParagraph1:
			"Rozumiemy, jak trudne jest zarządzanie wieloma platformami streamingowymi. Dlatego stworzyliśmy Streampai – rozwiązanie dla twórców, którzy chcą maksymalizować zasięg bez komplikacji.",
		aboutParagraph2:
			"Koniec z przeskakiwaniem między oknami czatu, alertami donacji i panelami statystyk. Streampai łączy wszystko w jednej intuicyjnej platformie, która rośnie razem z Tobą.",
		aboutParagraph3:
			"Nieważne, czy streamujesz hobbystycznie, czy zawodowo – nasze narzędzia AI pomogą Ci skupić się na tym, co najważniejsze: tworzeniu świetnych treści i budowaniu społeczności.",
		platformIntegrations: "Integracji platform",
		uptime: "Dostępność",
		realTimeSync: "Synchronizacja w czasie rzeczywistym",
		realTimeSyncDescription:
			"Czat i wydarzenia synchronizowane natychmiast na wszystkich platformach",
		advancedAnalytics: "Zaawansowane statystyki",
		advancedAnalyticsDescription:
			"Dogłębna analiza zachowań widzów i wzorców zaangażowania",
		aiPoweredGrowth: "Wzrost napędzany AI",
		aiPoweredGrowthDescription:
			"Inteligentne rekomendacje do optymalizacji Twojej strategii treści",
		ctaTitle: "Gotowy, by podnieść swój stream na wyższy poziom?",
		ctaSubtitle:
			"Dołącz do streamerów, którzy już rozwijają widownię dzięki Streampai",
	},

	// Footer
	footer: {
		privacy: "Prywatność",
		terms: "Regulamin",
		support: "Pomoc",
		contact: "Kontakt",
		copyright: "Streampai. Wszelkie prawa zastrzeżone.",
		madeWith: "Stworzone z",
		forStreamers: "dla streamerów.",
	},

	// Privacy page
	privacy: {
		title: "Polityka prywatności",
		lastUpdated: "Ostatnia aktualizacja: grudzień 2024",
		section1Title: "1. Jakie dane zbieramy",
		section1Intro: "Zbieramy dane, które nam przekazujesz, w tym:",
		section1Item1: "Dane konta (imię, e-mail, hasło)",
		section1Item2: "Dane profilu z połączonych platform streamingowych",
		section1Item3: "Metadane streamów i dane analityczne",
		section1Item4: "Wiadomości czatu i akcje moderacyjne",
		section1Item5: "Dane płatności (bezpiecznie przetwarzane przez zewnętrznych dostawców)",
		section2Title: "2. Jak wykorzystujemy Twoje dane",
		section2Intro: "Wykorzystujemy zebrane dane, aby:",
		section2Item1: "Świadczyć, utrzymywać i ulepszać nasze usługi",
		section2Item2: "Łączyć i synchronizować Twoje treści na wielu platformach",
		section2Item3: "Generować analizy i statystyki Twoich streamów",
		section2Item4: "Wysyłać Ci powiadomienia techniczne i wiadomości wsparcia",
		section2Item5: "Odpowiadać na Twoje komentarze i pytania",
		section3Title: "3. Udostępnianie danych",
		section3Intro:
			"Nie sprzedajemy Twoich danych osobowych. Możemy je udostępniać w następujących przypadkach:",
		section3Item1:
			"Platformom streamingowym, które łączysz (aby umożliwić streaming wieloplatformowy)",
		section3Item2: "Dostawcom usług, którzy pomagają nam prowadzić platformę",
		section3Item3: "Gdy wymaga tego prawo lub ochrona naszych praw",
		section3Item4: "Za Twoją zgodą lub na Twoje polecenie",
		section4Title: "4. Bezpieczeństwo danych",
		section4Text:
			"Stosujemy odpowiednie środki techniczne i organizacyjne, aby chronić Twoje dane osobowe przed nieautoryzowanym dostępem, zmianą, ujawnieniem lub zniszczeniem. Obejmuje to szyfrowanie, bezpieczne protokoły i regularne audyty bezpieczeństwa.",
		section5Title: "5. Usługi zewnętrzne",
		section5Text:
			"Nasza usługa integruje się z zewnętrznymi platformami streamingowymi (Twitch, YouTube, Kick, Facebook itp.). Gdy łączysz te usługi, mogą zbierać dane zgodnie z własnymi politykami prywatności. Zachęcamy do zapoznania się z nimi.",
		section6Title: "6. Przechowywanie danych",
		section6Text:
			"Przechowujemy Twoje dane tak długo, jak Twoje konto jest aktywne lub jak jest to potrzebne do świadczenia usług. Możesz w każdej chwili zażądać usunięcia konta i powiązanych danych, kontaktując się z nami.",
		section7Title: "7. Twoje prawa",
		section7Intro: "Masz prawo do:",
		section7Item1: "Dostępu do danych osobowych, które przechowujemy",
		section7Item2: "Żądania poprawienia nieprawidłowych danych",
		section7Item3: "Żądania usunięcia Twoich danych",
		section7Item4: "Eksportu danych w przenośnym formacie",
		section7Item5: "Rezygnacji z komunikacji marketingowej",
		section8Title: "8. Pliki cookie i śledzenie",
		section8Text:
			"Używamy plików cookie i podobnych technologii do utrzymania sesji, zapamiętania preferencji i analizy korzystania z usługi. Możesz kontrolować ustawienia cookie w preferencjach przeglądarki.",
		section9Title: "9. Prywatność dzieci",
		section9Text:
			"Nasza usługa nie jest przeznaczona dla osób poniżej 13 roku życia. Świadomie nie zbieramy danych osobowych od dzieci poniżej 13 lat.",
		section10Title: "10. Zmiany w polityce",
		section10Text:
			"Możemy od czasu do czasu aktualizować tę politykę prywatności. O zmianach poinformujemy, publikując nową wersję na tej stronie i aktualizując datę ostatniej aktualizacji.",
		section11Title: "11. Kontakt",
		section11Text:
			"Jeśli masz pytania dotyczące tej Polityki Prywatności, prosimy o",
		contactUs: "kontakt",
	},

	// Terms page
	terms: {
		title: "Regulamin",
		lastUpdated: "Ostatnia aktualizacja: grudzień 2024",
		section1Title: "1. Akceptacja warunków",
		section1Text:
			"Korzystając z usług Streampai, zgadzasz się przestrzegać niniejszego Regulaminu. Jeśli nie akceptujesz tych warunków, nie korzystaj z naszych usług.",
		section2Title: "2. Opis usługi",
		section2Text:
			"Streampai to platforma do zarządzania streamingiem wieloplatformowym, która pozwala użytkownikom streamować treści na wiele platform jednocześnie, zarządzać wspólnym czatem i korzystać ze statystyk międzyplatformowych.",
		section3Title: "3. Konta użytkowników",
		section3Text:
			"Odpowiadasz za bezpieczeństwo danych logowania i wszystkie działania wykonywane na Twoim koncie. O nieautoryzowanym użyciu konta powiadom nas natychmiast.",
		section4Title: "4. Dozwolone użycie",
		section4Intro: "Zobowiązujesz się nie:",
		section4Item1: "Używać usługi do celów nielegalnych lub nieautoryzowanych",
		section4Item2: "Łamać przepisów prawa, w tym praw autorskich",
		section4Item3: "Przesyłać szkodliwych treści lub złośliwego oprogramowania",
		section4Item4: "Zakłócać działania usługi lub połączonych z nią serwerów",
		section4Item5: "Próbować uzyskać nieautoryzowany dostęp do jakiejkolwiek części usługi",
		section5Title: "5. Odpowiedzialność za treści",
		section5Text:
			"Ponosisz wyłączną odpowiedzialność za treści, które streamujesz, udostępniasz lub rozpowszechniasz przez naszą platformę. Zachowujesz wszystkie prawa własności do swoich treści, ale udzielasz nam licencji na ich wyświetlanie i dystrybucję przez naszą usługę.",
		section6Title: "6. Integracje zewnętrzne",
		section6Text:
			"Nasza usługa integruje się z platformami zewnętrznymi, takimi jak Twitch, YouTube i inne. Korzystanie z tych platform podlega ich regulaminom i politykom prywatności.",
		section7Title: "7. Ograniczenie odpowiedzialności",
		section7Text:
			"Streampai nie ponosi odpowiedzialności za jakiekolwiek pośrednie, przypadkowe, specjalne, wtórne lub karne szkody wynikające z korzystania lub niemożności korzystania z usługi.",
		section8Title: "8. Zmiany warunków",
		section8Text:
			"Zastrzegamy sobie prawo do zmiany tych warunków w dowolnym momencie. O istotnych zmianach powiadomimy e-mailem lub przez usługę. Dalsze korzystanie z usługi po zmianach oznacza ich akceptację.",
		section9Title: "9. Wypowiedzenie",
		section9Text:
			"Możemy wypowiedzieć lub zawiesić Twoje konto i dostęp do usługi natychmiast, bez wcześniejszego powiadomienia, za zachowanie naruszające niniejszy Regulamin lub szkodliwe dla innych użytkowników, nas lub osób trzecich.",
		section10Title: "10. Kontakt",
		section10Text:
			"Jeśli masz pytania dotyczące niniejszego Regulaminu, prosimy o",
		contactUs: "kontakt",
	},

	// Support page
	support: {
		title: "Pomoc",
		heading: "Jak możemy Ci pomóc?",
		subheading:
			"Znajdź odpowiedzi na częste pytania lub skontaktuj się z naszym zespołem.",
		documentation: "Dokumentacja",
		documentationDescription:
			"Kompleksowe przewodniki i poradniki, które pomogą Ci w pełni wykorzystać Streampai.",
		faq: "FAQ",
		faqDescription: "Szybkie odpowiedzi na najczęściej zadawane pytania.",
		discord: "Społeczność Discord",
		discordDescription:
			"Dołącz do naszego Discorda, by poznać innych streamerów i uzyskać wsparcie społeczności.",
		emailSupport: "Wsparcie e-mail",
		emailSupportDescription:
			"Skontaktuj się z naszym zespołem, by uzyskać indywidualną pomoc.",
		contactUs: "Napisz do nas",
		comingSoon: "Wkrótce",
		faqTitle: "Najczęściej zadawane pytania",
		faqQ1: "Jakie platformy obsługuje Streampai?",
		faqA1:
			"Streampai obsługuje streaming na Twitch, YouTube, Kick, Facebook i inne. Stale dodajemy nowe integracje.",
		faqQ2: "Jak połączyć moje konta streamingowe?",
		faqA2:
			"Po rejestracji przejdź do ustawień i kliknij \"Połącz konta\". Postępuj zgodnie z instrukcjami OAuth, by bezpiecznie połączyć swoje konta.",
		faqQ3: "Czy moje dane są bezpieczne?",
		faqA3:
			"Tak, bezpieczeństwo traktujemy poważnie. Wszystkie dane są szyfrowane podczas przesyłania i przechowywania. Nie przechowujemy haseł do platform – używamy bezpiecznych tokenów OAuth. Przeczytaj naszą",
		privacyPolicy: "Politykę prywatności",
		faqA3End: "po więcej szczegółów.",
		faqQ4: "Czy mogę anulować subskrypcję w dowolnym momencie?",
		faqA4:
			"Tak, możesz anulować subskrypcję w każdej chwili w ustawieniach konta. Dostęp zachowasz do końca okresu rozliczeniowego.",
		faqQ5: "Jak zgłosić błąd lub zaproponować funkcję?",
		faqA5:
			"Chętnie słuchamy użytkowników! Napisz do nas z informacją o błędzie lub propozycją nowej funkcji. Możesz też dołączyć do naszego Discorda i podzielić się pomysłami z innymi.",
	},

	// Contact page
	contact: {
		title: "Kontakt",
		heading: "Skontaktuj się z nami",
		subheading:
			"Masz pytanie, sugestię lub potrzebujesz pomocy? Chętnie pomożemy.",
		emailTitle: "E-mail",
		discordTitle: "Discord",
		discordDescription: "Dołącz do społeczności",
		githubTitle: "GitHub",
		githubDescription: "Zgłoś problem",
		comingSoon: "Wkrótce",
		formTitle: "Wyślij wiadomość",
		nameLabel: "Imię",
		namePlaceholder: "Twoje imię",
		emailLabel: "E-mail",
		emailPlaceholder: "twoj@email.com",
		subjectLabel: "Temat",
		subjectPlaceholder: "Wybierz temat",
		subjectGeneral: "Pytanie ogólne",
		subjectSupport: "Wsparcie techniczne",
		subjectBilling: "Płatności",
		subjectFeature: "Propozycja funkcji",
		subjectBug: "Zgłoszenie błędu",
		subjectPartnership: "Współpraca",
		messageLabel: "Wiadomość",
		messagePlaceholder: "W czym możemy pomóc?",
		sending: "Wysyłanie...",
		sendButton: "Wyślij wiadomość",
		successMessage: "Dziękujemy za wiadomość! Odezwiemy się wkrótce.",
	},
};
