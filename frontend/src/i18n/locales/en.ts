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
		pleaseWait: "Please wait...",
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
		welcomeMessage: "Welcome to your Streampai dashboard.",
		// Quick Stats
		messages: "Messages",
		viewers: "Viewers",
		followers: "Followers",
		donations: "Donations",
		// Stream Health
		streamHealth: "Stream Health",
		bitrate: "Bitrate",
		dropped: "Dropped",
		uptime: "Uptime",
		excellent: "Excellent",
		good: "Good",
		fair: "Fair",
		poor: "Poor",
		// Engagement Score
		engagementScore: "Engagement Score",
		building: "Building",
		growing: "Growing",
		// Stream Goals
		streamGoals: "Stream Goals",
		dailyFollowers: "Daily Followers",
		donationGoal: "Donation Goal",
		chatActivity: "Chat Activity",
		goalReached: "Goal reached!",
		// Recent sections
		recentChat: "Recent Chat",
		recentEvents: "Recent Events",
		recentStreams: "Recent Streams",
		viewAll: "View all",
		noChatMessages: "No chat messages yet",
		messagesWillAppear: "Messages will appear here during streams",
		noEventsYet: "No events yet",
		eventsWillAppear: "Donations, follows, and subs will show here",
		noStreamsYet: "No streams yet",
		streamsWillAppear: "Your stream history will appear here",
		untitledStream: "Untitled Stream",
		notStarted: "Not started",
		// Activity Feed
		activityFeed: "Activity Feed",
		events: "events",
		all: "All",
		donationsFilter: "Donations",
		follows: "Follows",
		subs: "Subs",
		raids: "Raids",
		noEvents: "No events",
		anonymous: "Anonymous",
		// Quick Actions
		testAlert: "Test Alert",
		widgets: "Widgets",
		goLive: "Go Live",
		customizeOverlays: "Customize your overlays",
		viewStats: "View your stats",
		configureAccount: "Configure your account",
		// Test Alert
		testAlertTitle: "Test Alert!",
		alertsWorking: "Your alerts are working correctly.",
		// Not authenticated
		notAuthenticated: "Not Authenticated",
		signInToAccess: "Please sign in to access the dashboard.",
	},

	// Stream page
	stream: {
		streamTitlePlaceholder: "Enter your stream title...",
		streamDescriptionPlaceholder: "Describe your stream...",
	},

	// Chat History page
	chatHistory: {
		searchPlaceholder: "Search messages...",
	},

	// Analytics page
	analytics: {
		title: "Stream Analytics",
		subtitle: "Track your streaming performance and audience metrics",
		signInToView: "Please sign in to view analytics.",
		failedToLoad: "Failed to load analytics data",
		// Timeframe options
		last24Hours: "Last 24 Hours",
		last7Days: "Last 7 Days",
		last30Days: "Last 30 Days",
		lastYear: "Last Year",
		// Charts
		viewerTrends: "Viewer Trends",
		platformDistribution: "Platform Distribution",
		peakViewers: "Peak viewers",
		avgViewers: "Avg viewers",
		daysStreamed: "Days streamed",
		// Empty states
		noStreamingData: "No streaming data for this period",
		streamToSee: "Stream to see your viewer trends here",
		noStreamsYet: "No streams yet",
		startStreaming:
			"Start streaming to see your analytics and performance data here.",
		// Table
		recentStreams: "Recent Streams",
		stream: "Stream",
		platform: "Platform",
		duration: "Duration",
		chatMessages: "Chat Messages",
	},

	// Settings page
	settings: {
		title: "Settings",
		language: "Language",
		languageDescription: "Choose your preferred language for the interface",
		appearance: "Appearance",
		profile: "Profile",
		// Account Settings
		accountSettings: "Account Settings",
		email: "Email",
		emailCannotChange: "Your email address cannot be changed",
		displayName: "Display Name",
		displayNamePlaceholder: "Enter display name",
		displayNameHelp:
			"Name must be 3-30 characters and contain only letters, numbers, and underscores",
		updateName: "Update Name",
		updating: "Updating...",
		nameUpdated: "Name updated!",
		// Avatar
		profileAvatar: "Profile Avatar",
		uploadNewAvatar: "Upload New Avatar",
		uploading: "Uploading...",
		avatarHelp: "JPG, PNG or GIF. Max size 5MB. Recommended: 256x256px",
		avatarUpdated: "Avatar updated successfully!",
		// Streaming Platforms
		streamingPlatforms: "Streaming Platforms",
		notConnected: "Not connected",
		connect: "Connect",
		// Plan
		getStarted: "Get started with basic features",
		upgradeToPro: "Upgrade to Pro",
		// Donation Page
		donationPage: "Donation Page",
		publicDonationUrl: "Public Donation URL",
		copyUrl: "Copy URL",
		donationUrlHelp:
			"Share this link with your viewers so they can support you with donations",
		publicDonationPage: "Public donation page",
		preview: "Preview",
		support: "Support",
		// Donation Settings
		donationSettings: "Donation Settings",
		minimumAmount: "Minimum Amount",
		maximumAmount: "Maximum Amount",
		noMinimum: "No minimum",
		noMaximum: "No maximum",
		leaveEmptyNoMin: "Leave empty for no minimum",
		leaveEmptyNoMax: "Leave empty for no maximum",
		currency: "Currency",
		defaultTtsVoice: "Default TTS Voice",
		randomVoice: "Random (different voice each time)",
		voiceHelp:
			"This voice will be used when donors don't select a voice, and for donations from streaming platforms",
		donationLimitsInfo: "How donation limits work:",
		donationLimitsItem1:
			"Set limits to control the donation amounts your viewers can send",
		donationLimitsItem2:
			"Both fields are optional - leave empty to allow any amount",
		donationLimitsItem3:
			"Preset buttons and custom input will be filtered based on your limits",
		donationLimitsItem4: "Changes apply immediately to your donation page",
		saveDonationSettings: "Save Donation Settings",
		saving: "Saving...",
		settingsSaved: "Settings saved successfully!",
		// Role Invitations
		roleInvitations: "Role Invitations",
		noPendingInvitations: "No pending role invitations",
		invitationsHelp:
			"You'll see invitations here when streamers invite you to moderate their channels",
		invitedYouAs: "Invited you as",
		accept: "Accept",
		decline: "Decline",
		// My Roles
		myRolesInChannels: "My Roles in Other Channels",
		noRolesInChannels: "You don't have any roles in other channels",
		rolesGrantedHelp:
			"Roles granted to you by other streamers will appear here",
		channel: "'s channel",
		since: "Since",
		// Channel Management
		channelManagement: "Channel Management",
		// Role Management
		roleManagement: "Role Management",
		inviteUser: "Invite User",
		enterUsername: "Enter username",
		moderator: "Moderator",
		manager: "Manager",
		sendInvitation: "Send Invitation",
		sending: "Sending...",
		invitationSent: "Invitation sent successfully!",
		rolePermissions: "Role Permissions:",
		moderatorDesc: "Can moderate chat and manage stream settings",
		managerDesc: "Can manage channel operations and configurations",
		pendingInvitations: "Pending Invitations",
		pending: "Pending",
		cancel: "Cancel",
		yourTeam: "Your Team",
		noRolesGranted: "No roles granted yet",
		rolesGrantedToHelp: "Users you've granted permissions to will appear here",
		revoke: "Revoke",
		// Notifications
		notificationPreferences: "Notification Preferences",
		emailNotifications: "Email Notifications",
		emailNotificationsDesc: "Receive notifications about important events",
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
		loginTitle: "Sign in to Streampai",
		loginDescription: "Choose your preferred sign in method",
		orContinueWith: "Or continue with",
		continueWithGoogle: "Continue with Google",
		continueWithTwitch: "Continue with Twitch",
		welcomeBack: "Welcome back",
		signInToContinue: "Sign in to your account to continue",
		orContinueWithEmail: "Or continue with email",
		signInWithEmail: "Sign in with Email",
		signUpWithEmail: "Sign up with Email",
		noAccount: "Don't have an account?",
		createOne: "Create one",
		agreeToTerms: "By signing in, you agree to our",
		termsOfService: "Terms of Service",
		and: "and",
		privacyPolicy: "Privacy Policy",
		alreadySignedIn: "Already signed in!",
		alreadyLoggedIn: "You're already logged in.",
		goToDashboard: "Go to Dashboard",
		pageTitle: "Sign In - Streampai",
	},

	// Errors
	errors: {
		generic: "Something went wrong",
		notFound: "Page not found",
		unauthorized: "You are not authorized to view this page",
		networkError: "Network error. Please check your connection.",
	},

	// Landing page
	landing: {
		// Navigation
		features: "Features",
		about: "About",
		getStarted: "Get Started",

		// Hero section
		heroTitle1: "Stream to",
		heroTitle2: "Everyone",
		heroTitle3: "at Once",
		underConstruction: "Under Construction",
		underConstructionText:
			"We're building something amazing! Streampai is currently under development. Join our newsletter to be the first to know when we launch.",
		emailPlaceholder: "Enter your email address",
		notifyMe: "Notify Me",
		submitting: "Submitting...",
		newsletterSuccess: "Your email has been added to our newsletter",
		heroDescription:
			"Connect all your streaming platforms, unify your audience, and supercharge your content with AI-powered tools. Stream to Twitch, YouTube, Kick, Facebook and more simultaneously.",
		more: "More",

		// Features section
		featuresTitle1: "Everything You Need to",
		featuresTitle2: "Dominate",
		featuresSubtitle:
			"Powerful tools designed for serious streamers who want to grow their audience across all platforms",
		multiPlatformTitle: "Multi-Platform Streaming",
		multiPlatformDescription:
			"Stream to Twitch, YouTube, Kick, Facebook, and more simultaneously. One stream, maximum reach.",
		unifiedChatTitle: "Unified Chat Management",
		unifiedChatDescription:
			"Merge all platform chats into one stream. Never miss a message from any platform again.",
		analyticsTitle: "Real-time Analytics",
		analyticsDescription:
			"Track viewers, engagement, revenue, and growth across all platforms in one beautiful dashboard.",
		moderationTitle: "AI-Powered Moderation",
		moderationDescription:
			"Auto-moderation with custom rules, spam detection, and toxicity filtering across all platforms.",
		widgetsTitle: "Custom Stream Widgets",
		widgetsDescription:
			"Beautiful, customizable widgets for donations, follows, chat, and more. Perfect for your brand.",
		teamTitle: "Team & Moderator Tools",
		teamDescription:
			"Powerful moderator dashboard, team management, and collaborative stream management tools.",

		// About section
		aboutTitle1: "Built by Streamers,",
		aboutTitle2: "for Streamers",
		aboutParagraph1:
			"We understand the struggle of managing multiple streaming platforms. That's why we created Streampai - the ultimate solution for content creators who want to maximize their reach without the complexity.",
		aboutParagraph2:
			"Gone are the days of juggling multiple chat windows, donation alerts, and analytics dashboards. Streampai brings everything together in one powerful, intuitive platform that scales with your growth.",
		aboutParagraph3:
			"Whether you're a weekend warrior or a full-time content creator, our AI-powered tools help you focus on what matters most: creating amazing content and building your community.",
		platformIntegrations: "Platform Integrations",
		uptime: "Uptime",
		realTimeSync: "Real-time Sync",
		realTimeSyncDescription:
			"Chat and events synchronized across all platforms instantly",
		advancedAnalytics: "Advanced Analytics",
		advancedAnalyticsDescription:
			"Deep insights into viewer behavior and engagement patterns",
		aiPoweredGrowth: "AI-Powered Growth",
		aiPoweredGrowthDescription:
			"Smart recommendations to optimize your content strategy",

		// CTA section
		ctaTitle: "Ready to Level Up Your Stream?",
		ctaSubtitle:
			"Join streamers who are already growing their audience with Streampai",
	},

	// Footer
	footer: {
		privacy: "Privacy",
		terms: "Terms",
		support: "Support",
		contact: "Contact",
		copyright: "Streampai. All rights reserved.",
		madeWith: "Made with",
		forStreamers: "for streamers.",
	},

	// Privacy page
	privacy: {
		title: "Privacy Policy",
		lastUpdated: "Last updated: December 2024",
		section1Title: "1. Information We Collect",
		section1Intro:
			"We collect information you provide directly to us, including:",
		section1Item1: "Account information (name, email, password)",
		section1Item2: "Profile information from connected streaming platforms",
		section1Item3: "Stream metadata and analytics data",
		section1Item4: "Chat messages and moderation actions",
		section1Item5:
			"Payment information (processed securely by third-party providers)",
		section2Title: "2. How We Use Your Information",
		section2Intro: "We use the information we collect to:",
		section2Item1: "Provide, maintain, and improve our services",
		section2Item2:
			"Connect and sync your content across multiple streaming platforms",
		section2Item3:
			"Generate analytics and insights about your streaming performance",
		section2Item4: "Send you technical notices and support messages",
		section2Item5: "Respond to your comments and questions",
		section3Title: "3. Information Sharing",
		section3Intro:
			"We do not sell your personal information. We may share your information in the following circumstances:",
		section3Item1:
			"With streaming platforms you connect (to enable multi-platform streaming)",
		section3Item2:
			"With service providers who assist in operating our platform",
		section3Item3: "When required by law or to protect our rights",
		section3Item4: "With your consent or at your direction",
		section4Title: "4. Data Security",
		section4Text:
			"We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes encryption, secure protocols, and regular security audits.",
		section5Title: "5. Third-Party Services",
		section5Text:
			"Our service integrates with third-party streaming platforms (Twitch, YouTube, Kick, Facebook, etc.). When you connect these services, they may collect information according to their own privacy policies. We encourage you to review their privacy practices.",
		section6Title: "6. Data Retention",
		section6Text:
			"We retain your information for as long as your account is active or as needed to provide you services. You can request deletion of your account and associated data at any time by contacting us.",
		section7Title: "7. Your Rights",
		section7Intro: "You have the right to:",
		section7Item1: "Access the personal information we hold about you",
		section7Item2: "Request correction of inaccurate data",
		section7Item3: "Request deletion of your data",
		section7Item4: "Export your data in a portable format",
		section7Item5: "Opt out of marketing communications",
		section8Title: "8. Cookies and Tracking",
		section8Text:
			"We use cookies and similar technologies to maintain your session, remember your preferences, and understand how you use our service. You can control cookie settings through your browser preferences.",
		section9Title: "9. Children's Privacy",
		section9Text:
			"Our service is not intended for users under 13 years of age. We do not knowingly collect personal information from children under 13.",
		section10Title: "10. Changes to This Policy",
		section10Text:
			'We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.',
		section11Title: "11. Contact Us",
		section11Text:
			"If you have any questions about this Privacy Policy, please",
		contactUs: "contact us",
	},

	// Terms page
	terms: {
		title: "Terms of Service",
		lastUpdated: "Last updated: December 2024",
		section1Title: "1. Acceptance of Terms",
		section1Text:
			"By accessing or using Streampai's services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.",
		section2Title: "2. Description of Service",
		section2Text:
			"Streampai provides a multi-platform streaming management solution that allows users to stream content to multiple platforms simultaneously, manage unified chat, and access analytics across platforms.",
		section3Title: "3. User Accounts",
		section3Text:
			"You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.",
		section4Title: "4. Acceptable Use",
		section4Intro: "You agree not to:",
		section4Item1: "Use the service for any illegal or unauthorized purpose",
		section4Item2:
			"Violate any laws in your jurisdiction, including copyright laws",
		section4Item3: "Transmit harmful content or malware",
		section4Item4:
			"Interfere with or disrupt the service or servers connected to the service",
		section4Item5:
			"Attempt to gain unauthorized access to any part of the service",
		section5Title: "5. Content Responsibility",
		section5Text:
			"You are solely responsible for the content you stream, share, or distribute through our platform. You retain all ownership rights to your content, but grant us a license to display and distribute it through our service.",
		section6Title: "6. Third-Party Integrations",
		section6Text:
			"Our service integrates with third-party platforms such as Twitch, YouTube, and others. Your use of these platforms is subject to their respective terms of service and privacy policies.",
		section7Title: "7. Limitation of Liability",
		section7Text:
			"Streampai shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.",
		section8Title: "8. Modifications to Terms",
		section8Text:
			"We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through the service. Continued use of the service after such changes constitutes acceptance of the new terms.",
		section9Title: "9. Termination",
		section9Text:
			"We may terminate or suspend your account and access to the service immediately, without prior notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties.",
		section10Title: "10. Contact Information",
		section10Text:
			"If you have any questions about these Terms of Service, please",
		contactUs: "contact us",
	},

	// Support page
	support: {
		title: "Support",
		heading: "How can we help you?",
		subheading:
			"Find answers to common questions or reach out to our support team.",
		documentation: "Documentation",
		documentationDescription:
			"Comprehensive guides and tutorials to help you get the most out of Streampai.",
		faq: "FAQ",
		faqDescription:
			"Quick answers to frequently asked questions about our service.",
		discord: "Community Discord",
		discordDescription:
			"Join our Discord server to connect with other streamers and get community support.",
		emailSupport: "Email Support",
		emailSupportDescription:
			"Reach out to our support team directly for personalized assistance.",
		contactUs: "Contact us",
		comingSoon: "Coming soon",
		faqTitle: "Frequently Asked Questions",
		faqQ1: "What platforms does Streampai support?",
		faqA1:
			"Streampai supports multi-platform streaming to Twitch, YouTube, Kick, Facebook, and more. We're constantly adding new platform integrations.",
		faqQ2: "How do I connect my streaming accounts?",
		faqA2:
			'After signing up, go to your dashboard settings and click on "Connect Accounts". Follow the OAuth prompts to securely link your streaming platform accounts.',
		faqQ3: "Is my data secure?",
		faqA3:
			"Yes, we take security seriously. All data is encrypted in transit and at rest. We never store your streaming platform passwords - we use secure OAuth tokens for authentication. Read our",
		privacyPolicy: "Privacy Policy",
		faqA3End: "for more details.",
		faqQ4: "Can I cancel my subscription anytime?",
		faqA4:
			"Yes, you can cancel your subscription at any time from your account settings. You'll continue to have access until the end of your billing period.",
		faqQ5: "How do I report a bug or request a feature?",
		faqA5:
			"We love hearing from our users! Please contact us with bug reports or feature requests. You can also join our Discord community to discuss ideas with other users.",
	},

	// Admin pages
	admin: {
		enterUserUuid: "Enter user UUID",
		enterNotificationMessage: "Enter notification message...",
	},

	// Donation page
	donation: {
		customAmountPlaceholder: "Custom amount",
		anonymousPlaceholder: "Anonymous",
		emailPlaceholder: "email@example.com",
		messagePlaceholder: "Say something nice...",
	},

	// Contact page
	contact: {
		title: "Contact Us",
		heading: "Get in Touch",
		subheading:
			"Have a question, suggestion, or need help? We'd love to hear from you.",
		emailTitle: "Email",
		discordTitle: "Discord",
		discordDescription: "Join our community",
		githubTitle: "GitHub",
		githubDescription: "Report issues",
		comingSoon: "Coming soon",
		formTitle: "Send us a message",
		nameLabel: "Name",
		namePlaceholder: "Your name",
		emailLabel: "Email",
		emailPlaceholder: "your@email.com",
		subjectLabel: "Subject",
		subjectPlaceholder: "Select a topic",
		subjectGeneral: "General Inquiry",
		subjectSupport: "Technical Support",
		subjectBilling: "Billing Question",
		subjectFeature: "Feature Request",
		subjectBug: "Bug Report",
		subjectPartnership: "Partnership",
		messageLabel: "Message",
		messagePlaceholder: "How can we help you?",
		sending: "Sending...",
		sendButton: "Send Message",
		successMessage: "Thank you for your message! We'll get back to you soon.",
	},
};

export type Dictionary = typeof dict;
