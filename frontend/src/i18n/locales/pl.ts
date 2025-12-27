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

	// Landing page
	landing: {
		features: "Funkcje",
		about: "O nas",
		getStarted: "Rozpocznij",
		heroTitle1: "Streamuj do",
		heroTitle2: "wszystkich",
		heroTitle3: "naraz",
		underConstruction: "W budowie",
		underConstructionText:
			"Budujemy cos niesamowitego! Streampai jest obecnie w fazie rozwoju. Zapisz sie do newslettera, aby jako pierwszy dowiedziec sie o starcie.",
		emailPlaceholder: "Wpisz swoj adres e-mail",
		notifyMe: "Powiadom mnie",
		submitting: "Wysylanie...",
		newsletterSuccess: "Twoj e-mail zostal dodany do newslettera",
		heroDescription:
			"Polacz wszystkie swoje platformy streamingowe, zjednocz widownie i wzmocnij swoje tresci narzedziami AI. Streamuj jednoczesnie na Twitch, YouTube, Kick, Facebook i wiele innych.",
		more: "Wiecej",
		featuresTitle1: "Wszystko, czego potrzebujesz, aby",
		featuresTitle2: "zdominowac",
		featuresSubtitle:
			"Potezne narzedzia dla ambitnych streamerow, ktorzy chca rozwijac widownie na wszystkich platformach",
		multiPlatformTitle: "Streaming wieloplatformowy",
		multiPlatformDescription:
			"Streamuj jednoczesnie na Twitch, YouTube, Kick, Facebook i inne. Jeden stream, maksymalny zasieg.",
		unifiedChatTitle: "Zintegrowane zarzadzanie czatem",
		unifiedChatDescription:
			"Polacz wszystkie czaty platform w jeden stream. Nigdy wiecej nie przegapisz wiadomosci z zadnej platformy.",
		analyticsTitle: "Analityka w czasie rzeczywistym",
		analyticsDescription:
			"Sledz widzow, zaangazowanie, przychody i wzrost na wszystkich platformach w jednym pieknym panelu.",
		moderationTitle: "Moderacja wspomagana AI",
		moderationDescription:
			"Automatyczna moderacja z niestandardowymi regulami, wykrywaniem spamu i filtrowaniem toksycznosci na wszystkich platformach.",
		widgetsTitle: "Niestandardowe widgety streamowe",
		widgetsDescription:
			"Piekne, konfigurowalne widgety dla darowizn, obserwujacych, czatu i innych. Idealne dla Twojej marki.",
		teamTitle: "Narzedzia zespolowe i moderatorskie",
		teamDescription:
			"Potezny panel moderatora, zarzadzanie zespolem i narzedzia do wspolpracy przy streamowaniu.",
		aboutTitle1: "Stworzone przez streamerow,",
		aboutTitle2: "dla streamerow",
		aboutParagraph1:
			"Rozumiemy trudnosci w zarzadzaniu wieloma platformami streamingowymi. Dlatego stworzyliśmy Streampai - ostateczne rozwiazanie dla tworcow tresci, ktorzy chca maksymalizowac swoj zasieg bez komplikacji.",
		aboutParagraph2:
			"Minaly czasy zonglowania wieloma oknami czatu, alertami darowizn i panelami analitycznymi. Streampai laczy wszystko w jedna potezna, intuicyjna platforme, ktora skaluje sie wraz z Twoim rozwojem.",
		aboutParagraph3:
			"Niezaleznie od tego, czy streamujesz w weekendy, czy jestes pelnoetawtowym tworca tresci - nasze narzedzia AI pomoga Ci skupic sie na tym, co najwazniejsze: tworzeniu niesamowitych tresci i budowaniu spolecznosci.",
		platformIntegrations: "Integracje platform",
		uptime: "Dostepnosc",
		realTimeSync: "Synchronizacja w czasie rzeczywistym",
		realTimeSyncDescription:
			"Czat i wydarzenia synchronizowane natychmiast na wszystkich platformach",
		advancedAnalytics: "Zaawansowana analityka",
		advancedAnalyticsDescription:
			"Gleboki wglad w zachowania widzow i wzorce zaangazowania",
		aiPoweredGrowth: "Wzrost wspomagany AI",
		aiPoweredGrowthDescription:
			"Inteligentne rekomendacje do optymalizacji strategii tresci",
		ctaTitle: "Gotowy podniesc swoj stream na wyzszy poziom?",
		ctaSubtitle:
			"Dolacz do streamerow, ktorzy juz rozwijaja widownie dzieki Streampai",
	},

	// Footer
	footer: {
		privacy: "Prywatnosc",
		terms: "Regulamin",
		support: "Wsparcie",
		contact: "Kontakt",
		copyright: "Streampai. Wszelkie prawa zastrzezone.",
		madeWith: "Stworzone z",
		forStreamers: "dla streamerow.",
	},

	// Privacy page
	privacy: {
		title: "Polityka prywatnosci",
		lastUpdated: "Ostatnia aktualizacja: grudzien 2024",
		section1Title: "1. Jakie informacje zbieramy",
		section1Intro:
			"Zbieramy informacje, ktore przekazujesz nam bezposrednio, w tym:",
		section1Item1: "Informacje o koncie (imie, e-mail, haslo)",
		section1Item2: "Informacje profilowe z polaczonych platform streamingowych",
		section1Item3: "Metadane streamow i dane analityczne",
		section1Item4: "Wiadomosci czatu i akcje moderacyjne",
		section1Item5: "Informacje platnicze (bezpiecznie przetwarzane przez dostawcow zewnetrznych)",
		section2Title: "2. Jak uzywamy Twoich informacji",
		section2Intro: "Uzywamy zebranych informacji, aby:",
		section2Item1: "Dostarczac, utrzymywac i ulepszac nasze uslugi",
		section2Item2: "Laczyc i synchronizowac Twoje tresci na wielu platformach streamingowych",
		section2Item3: "Generowac analizy i wglady w wydajnosc Twoich streamow",
		section2Item4: "Wysylac Ci powiadomienia techniczne i wiadomosci wsparcia",
		section2Item5: "Odpowiadac na Twoje komentarze i pytania",
		section3Title: "3. Udostepnianie informacji",
		section3Intro:
			"Nie sprzedajemy Twoich danych osobowych. Mozemy udostepniac Twoje informacje w nastepujacych okolicznosciach:",
		section3Item1:
			"Z platformami streamingowymi, ktore laczysz (aby umozliwic streaming wieloplatformowy)",
		section3Item2: "Z dostawcami uslug, ktorzy pomagaja nam w prowadzeniu platformy",
		section3Item3: "Gdy jest to wymagane prawem lub w celu ochrony naszych praw",
		section3Item4: "Za Twoja zgoda lub na Twoje polecenie",
		section4Title: "4. Bezpieczenstwo danych",
		section4Text:
			"Wdrazamy odpowiednie srodki techniczne i organizacyjne w celu ochrony Twoich danych osobowych przed nieautoryzowanym dostepem, zmiana, ujawnieniem lub zniszczeniem. Obejmuje to szyfrowanie, bezpieczne protokoly i regularne audyty bezpieczenstwa.",
		section5Title: "5. Uslugi stron trzecich",
		section5Text:
			"Nasza usluga integruje sie z zewnetrznymi platformami streamingowymi (Twitch, YouTube, Kick, Facebook itp.). Gdy laczysz te uslugi, moga zbierac informacje zgodnie z wlasnymi politykami prywatnosci. Zachecamy do zapoznania sie z ich praktykami dotyczacymi prywatnosci.",
		section6Title: "6. Przechowywanie danych",
		section6Text:
			"Przechowujemy Twoje informacje tak dlugo, jak Twoje konto jest aktywne lub jak jest to potrzebne do swiadczenia uslug. Mozesz w kazdej chwili zazadac usuniecia konta i powiazanych danych, kontaktujac sie z nami.",
		section7Title: "7. Twoje prawa",
		section7Intro: "Masz prawo do:",
		section7Item1: "Dostepu do danych osobowych, ktore przechowujemy na Twoj temat",
		section7Item2: "Zadania poprawienia niedokladnych danych",
		section7Item3: "Zadania usuniecia Twoich danych",
		section7Item4: "Eksportu danych w przenośnym formacie",
		section7Item5: "Rezygnacji z komunikacji marketingowej",
		section8Title: "8. Ciasteczka i sledzenie",
		section8Text:
			"Uzywamy ciasteczek i podobnych technologii do utrzymania sesji, zapamietania preferencji i zrozumienia, jak korzystasz z naszej uslugi. Mozesz kontrolowac ustawienia ciasteczek poprzez preferencje przegladarki.",
		section9Title: "9. Prywatnosc dzieci",
		section9Text:
			"Nasza usluga nie jest przeznaczona dla uzytkownikow ponizej 13 roku zycia. Nie zbieramy swiadomie danych osobowych od dzieci ponizej 13 lat.",
		section10Title: "10. Zmiany w polityce",
		section10Text:
			'Mozemy od czasu do czasu aktualizowac te polityke prywatnosci. Poinformujemy Cie o wszelkich zmianach, publikujac nowa polityke na tej stronie i aktualizujac date "Ostatnia aktualizacja".',
		section11Title: "11. Skontaktuj sie z nami",
		section11Text:
			"Jesli masz jakiekolwiek pytania dotyczace tej Polityki Prywatnosci, prosimy o",
		contactUs: "kontakt",
	},

	// Terms page
	terms: {
		title: "Regulamin",
		lastUpdated: "Ostatnia aktualizacja: grudzien 2024",
		section1Title: "1. Akceptacja warunkow",
		section1Text:
			"Uzyskujac dostep lub korzystajac z uslug Streampai, zgadzasz sie byc zwiazany niniejszym Regulaminem. Jesli nie zgadzasz sie z tymi warunkami, prosimy nie korzystac z naszych uslug.",
		section2Title: "2. Opis uslugi",
		section2Text:
			"Streampai zapewnia rozwiazanie do zarzadzania streamingiem wieloplatformowym, ktore pozwala uzytkownikom streamowac tresci na wiele platform jednoczesnie, zarzadzac zjednoczonym czatem i uzyskiwac dostep do analityki miedzyplatformowej.",
		section3Title: "3. Konta uzytkownikow",
		section3Text:
			"Jestes odpowiedzialny za zachowanie poufnosci danych logowania i za wszystkie dzialania wykonywane na Twoim koncie. Musisz natychmiast powiadomic nas o nieautoryzowanym uzyciu Twojego konta.",
		section4Title: "4. Dozwolone uzycie",
		section4Intro: "Zgadzasz sie nie:",
		section4Item1: "Uzywac uslugi do jakichkolwiek nielegalnych lub nieautoryzowanych celow",
		section4Item2: "Lamac przepisow prawa w Twojej jurysdykcji, w tym praw autorskich",
		section4Item3: "Przesylac szkodliwych tresci lub zlosliwego oprogramowania",
		section4Item4: "Zaklócac lub przeszkadzac w dzialaniu uslugi lub serwerow z nia polaczonych",
		section4Item5: "Probowac uzyskac nieautoryzowany dostep do jakiejkolwiek czesci uslugi",
		section5Title: "5. Odpowiedzialnosc za tresci",
		section5Text:
			"Jestes wylacznie odpowiedzialny za tresci, ktore streamujesz, udostepniasz lub rozpowszechniasz przez nasza platforme. Zachowujesz wszystkie prawa wlasnosci do swoich tresci, ale udzielasz nam licencji na ich wyswietlanie i dystrybucje przez nasza usluge.",
		section6Title: "6. Integracje z podmiotami trzecimi",
		section6Text:
			"Nasza usluga integruje sie z platformami stron trzecich, takimi jak Twitch, YouTube i inne. Korzystanie z tych platform podlega ich wlasnym regulaminom i politykom prywatnosci.",
		section7Title: "7. Ograniczenie odpowiedzialnosci",
		section7Text:
			"Streampai nie ponosi odpowiedzialnosci za jakiekolwiek posrednie, przypadkowe, specjalne, wynikowe lub karne szkody wynikajace z korzystania lub niemoznosci korzystania z uslugi.",
		section8Title: "8. Zmiany warunkow",
		section8Text:
			"Zastrzegamy sobie prawo do zmiany tych warunkow w dowolnym momencie. Powiadomimy uzytkownikow o wszelkich istotnych zmianach za posrednictwem poczty e-mail lub przez usluge. Dalsze korzystanie z uslugi po takich zmianach stanowi akceptacje nowych warunkow.",
		section9Title: "9. Wypowiedzenie",
		section9Text:
			"Mozemy wypowiedziec lub zawiesic Twoje konto i dostep do uslugi natychmiast, bez wczesniejszego powiadomienia, za zachowanie, ktore uznamy za naruszenie niniejszego Regulaminu lub szkodliwe dla innych uzytkownikow, nas lub osob trzecich.",
		section10Title: "10. Informacje kontaktowe",
		section10Text:
			"Jesli masz jakiekolwiek pytania dotyczace niniejszego Regulaminu, prosimy o",
		contactUs: "kontakt",
	},

	// Support page
	support: {
		title: "Wsparcie",
		heading: "Jak mozemy Ci pomoc?",
		subheading:
			"Znajdz odpowiedzi na czeste pytania lub skontaktuj sie z naszym zespolem wsparcia.",
		documentation: "Dokumentacja",
		documentationDescription:
			"Kompleksowe przewodniki i samouczki, ktore pomoga Ci w pelni wykorzystac Streampai.",
		faq: "FAQ",
		faqDescription: "Szybkie odpowiedzi na czesto zadawane pytania o naszej usludze.",
		discord: "Spolecznosc Discord",
		discordDescription:
			"Dolacz do naszego serwera Discord, aby polaczyc sie z innymi streamerami i uzyskac wsparcie spolecznosci.",
		emailSupport: "Wsparcie e-mail",
		emailSupportDescription:
			"Skontaktuj sie bezposrednio z naszym zespolem wsparcia, aby uzyskac spersonalizowana pomoc.",
		contactUs: "Skontaktuj sie z nami",
		comingSoon: "Wkrotce",
		faqTitle: "Czesto zadawane pytania",
		faqQ1: "Jakie platformy obsluguje Streampai?",
		faqA1:
			"Streampai obsluguje streaming wieloplatformowy na Twitch, YouTube, Kick, Facebook i wiecej. Ciagle dodajemy nowe integracje platform.",
		faqQ2: "Jak polaczyc moje konta streamingowe?",
		faqA2:
			'Po rejestracji przejdz do ustawien panelu i kliknij "Polacz konta". Postepuj zgodnie z monitami OAuth, aby bezpiecznie polaczyc konta platform streamingowych.',
		faqQ3: "Czy moje dane sa bezpieczne?",
		faqA3:
			"Tak, traktujemy bezpieczenstwo powaznie. Wszystkie dane sa szyfrowane w tranzycie i w spoczynku. Nigdy nie przechowujemy hasel do platform streamingowych - uzywamy bezpiecznych tokenow OAuth do uwierzytelniania. Przeczytaj nasza",
		privacyPolicy: "Polityke prywatnosci",
		faqA3End: "po wiecej szczegolow.",
		faqQ4: "Czy moge anulowac subskrypcje w dowolnym momencie?",
		faqA4:
			"Tak, mozesz anulowac subskrypcje w dowolnym momencie w ustawieniach konta. Bedziesz miec dostep do konca okresu rozliczeniowego.",
		faqQ5: "Jak zglasic blad lub poprosic o funkcje?",
		faqA5:
			"Lubimy slyszec od naszych uzytkownikow! Prosimy o kontakt z raportami bledow lub prosba o funkcje. Mozesz tez dolaczyc do naszej spolecznosci Discord, aby dyskutowac o pomyslach z innymi uzytkownikami.",
	},

	// Contact page
	contact: {
		title: "Kontakt",
		heading: "Skontaktuj sie z nami",
		subheading:
			"Masz pytanie, sugestie lub potrzebujesz pomocy? Chetnie od Ciebie usłyszymy.",
		emailTitle: "E-mail",
		discordTitle: "Discord",
		discordDescription: "Dolacz do naszej spolecznosci",
		githubTitle: "GitHub",
		githubDescription: "Zglos problemy",
		comingSoon: "Wkrotce",
		formTitle: "Wyslij nam wiadomosc",
		nameLabel: "Imie",
		namePlaceholder: "Twoje imie",
		emailLabel: "E-mail",
		emailPlaceholder: "twoj@email.com",
		subjectLabel: "Temat",
		subjectPlaceholder: "Wybierz temat",
		subjectGeneral: "Zapytanie ogolne",
		subjectSupport: "Wsparcie techniczne",
		subjectBilling: "Pytanie o platnosci",
		subjectFeature: "Prosba o funkcje",
		subjectBug: "Raport bledu",
		subjectPartnership: "Partnerstwo",
		messageLabel: "Wiadomosc",
		messagePlaceholder: "Jak mozemy Ci pomoc?",
		sending: "Wysylanie...",
		sendButton: "Wyslij wiadomosc",
		successMessage: "Dziekujemy za wiadomosc! Odezwiemy sie wkrotce.",
	},
};
