/**
 * Example widget configuration schemas.
 *
 * Design: Schema and metadata are SEPARATE.
 * - Schema: Plain Zod schema (can be auto-generated from Ash TypeScript)
 * - Metadata: Optional UI hints for form rendering
 *
 * This separation allows schemas to be auto-generated while
 * metadata can be hand-written or derived from Ash attributes.
 */

import { z } from "zod";
import type { FormMeta } from "./types";

// =============================================================================
// Timer Widget
// =============================================================================

/**
 * Timer widget schema - plain Zod, could be auto-generated from Ash
 */
export const timerConfigSchema = z.object({
	label: z.string().default("TIMER"),
	fontSize: z.number().min(24).max(120).default(48),
	textColor: z.string().default("#ffffff"),
	backgroundColor: z.string().default("#3b82f6"),
	countdownMinutes: z.number().min(1).max(120).default(5),
	autoStart: z.boolean().default(false),
});

export type TimerConfig = z.infer<typeof timerConfigSchema>;

/**
 * Timer widget metadata - UI customization hints
 */
export const timerConfigMeta: FormMeta<typeof timerConfigSchema.shape> = {
	label: { label: "Timer Label", placeholder: "Enter label text" },
	fontSize: { label: "Font Size", unit: "px" },
	textColor: { label: "Text Color", inputType: "color" },
	backgroundColor: { label: "Background Color", inputType: "color" },
	countdownMinutes: { label: "Countdown Duration", unit: "minutes" },
	autoStart: {
		label: "Auto Start on Load",
		description: "Automatically start the timer when the widget loads in OBS",
	},
};

// =============================================================================
// Chat Widget
// =============================================================================

/**
 * Chat widget schema - plain Zod
 */
export const chatConfigSchema = z.object({
	fontSize: z.enum(["small", "medium", "large"]).default("medium"),
	maxMessages: z.number().min(5).max(100).default(25),
	showTimestamps: z.boolean().default(false),
	showBadges: z.boolean().default(true),
	showPlatform: z.boolean().default(true),
	showEmotes: z.boolean().default(true),
});

export type ChatConfig = z.infer<typeof chatConfigSchema>;

/**
 * Chat widget metadata
 */
export const chatConfigMeta: FormMeta<typeof chatConfigSchema.shape> = {
	fontSize: { label: "Font Size" },
	maxMessages: {
		label: "Max Messages",
		description: "Maximum number of messages to display at once",
	},
	showTimestamps: { label: "Show Timestamps" },
	showBadges: {
		label: "Show User Badges",
		description: "Display subscriber, moderator, and VIP badges",
	},
	showPlatform: {
		label: "Show Platform Icons",
		description: "Display Twitch/YouTube icons next to messages",
	},
	showEmotes: {
		label: "Show Emotes",
		description: "Render emotes as images",
	},
};

// =============================================================================
// Alertbox Widget
// =============================================================================

/**
 * Alertbox widget schema - plain Zod
 */
export const alertboxConfigSchema = z.object({
	// Animation settings
	animationType: z.enum(["slide", "fade", "bounce"]).default("fade"),
	alertPosition: z.enum(["top", "center", "bottom"]).default("center"),
	displayDuration: z.number().min(1).max(30).default(5),
	// Appearance
	fontSize: z.enum(["small", "medium", "large"]).default("medium"),
	// Content
	showAmount: z.boolean().default(true),
	showMessage: z.boolean().default(true),
	// Audio
	soundEnabled: z.boolean().default(true),
	soundVolume: z.number().min(0).max(100).default(80),
});

export type AlertboxConfig = z.infer<typeof alertboxConfigSchema>;

/**
 * Alertbox widget metadata - with grouping
 */
export const alertboxConfigMeta: FormMeta<typeof alertboxConfigSchema.shape> = {
	// Animation group
	animationType: { label: "Animation Type", group: "Animation" },
	alertPosition: { label: "Alert Position", group: "Animation" },
	displayDuration: {
		label: "Display Duration",
		unit: "seconds",
		group: "Animation",
	},
	// Appearance group
	fontSize: { label: "Font Size", group: "Appearance" },
	// Content group
	showAmount: {
		label: "Show Amount",
		description: "Display donation/raid amounts",
		group: "Content",
	},
	showMessage: {
		label: "Show Message",
		description: "Display user messages with alerts",
		group: "Content",
	},
	// Audio group
	soundEnabled: { label: "Enable Sound", group: "Audio" },
	soundVolume: { label: "Sound Volume", unit: "%", group: "Audio" },
};

// =============================================================================
// Donation Goal Widget
// =============================================================================

/**
 * Donation goal widget schema - plain Zod
 */
export const donationGoalConfigSchema = z.object({
	title: z.string().default("Donation Goal"),
	targetAmount: z.number().min(1).default(100),
	currentAmount: z.number().min(0).default(0),
	// Appearance
	barColor: z.string().default("#10b981"),
	backgroundColor: z.string().default("#1f2937"),
	textColor: z.string().default("#ffffff"),
	showPercentage: z.boolean().default(true),
	showAmount: z.boolean().default(true),
});

export type DonationGoalConfig = z.infer<typeof donationGoalConfigSchema>;

/**
 * Donation goal widget metadata
 */
export const donationGoalConfigMeta: FormMeta<
	typeof donationGoalConfigSchema.shape
> = {
	title: { label: "Goal Title", placeholder: "Enter goal title" },
	targetAmount: { label: "Target Amount", unit: "$", inputType: "number" },
	currentAmount: {
		label: "Starting Amount",
		unit: "$",
		inputType: "number",
		description: "Initial amount (updates automatically with donations)",
	},
	barColor: {
		label: "Progress Bar Color",
		inputType: "color",
		group: "Appearance",
	},
	backgroundColor: {
		label: "Background Color",
		inputType: "color",
		group: "Appearance",
	},
	textColor: { label: "Text Color", inputType: "color", group: "Appearance" },
	showPercentage: { label: "Show Percentage" },
	showAmount: {
		label: "Show Amount",
		description: "Display current/target amounts",
	},
};

// =============================================================================
// Follower Count Widget
// =============================================================================

/**
 * Follower count widget schema - plain Zod
 */
export const followerCountConfigSchema = z.object({
	label: z.string().default("Followers"),
	fontSize: z.number().min(16).max(96).default(32),
	textColor: z.string().default("#ffffff"),
	backgroundColor: z.string().default("transparent"),
	showLabel: z.boolean().default(true),
	animateChanges: z.boolean().default(true),
});

export type FollowerCountConfig = z.infer<typeof followerCountConfigSchema>;

/**
 * Follower count widget metadata
 */
export const followerCountConfigMeta: FormMeta<
	typeof followerCountConfigSchema.shape
> = {
	label: { label: "Label Text", placeholder: "Enter label" },
	fontSize: { label: "Font Size", unit: "px" },
	textColor: { label: "Text Color", inputType: "color" },
	backgroundColor: { label: "Background Color", inputType: "color" },
	showLabel: { label: "Show Label" },
	animateChanges: {
		label: "Animate Count Changes",
		description: "Smooth animation when follower count updates",
	},
};

// =============================================================================
// Poll Widget
// =============================================================================

/**
 * Poll widget schema - plain Zod
 */
export const pollConfigSchema = z.object({
	title: z.string().default("Vote Now!"),
	// Appearance
	barColor: z.string().default("#8b5cf6"),
	backgroundColor: z.string().default("#1f2937"),
	textColor: z.string().default("#ffffff"),
	showPercentages: z.boolean().default(true),
	showVoteCount: z.boolean().default(true),
	allowMultipleVotes: z.boolean().default(false),
});

export type PollConfig = z.infer<typeof pollConfigSchema>;

/**
 * Poll widget metadata
 */
export const pollConfigMeta: FormMeta<typeof pollConfigSchema.shape> = {
	title: { label: "Poll Title", placeholder: "Enter poll question" },
	barColor: { label: "Bar Color", inputType: "color", group: "Appearance" },
	backgroundColor: {
		label: "Background Color",
		inputType: "color",
		group: "Appearance",
	},
	textColor: { label: "Text Color", inputType: "color", group: "Appearance" },
	showPercentages: { label: "Show Percentages" },
	showVoteCount: { label: "Show Vote Count" },
	allowMultipleVotes: {
		label: "Allow Multiple Votes",
		description: "Let users vote for multiple options",
	},
};

// =============================================================================
// All Field Types (for testing/demo)
// =============================================================================

/**
 * Demo schema showing all supported field types
 */
export const allFieldTypesSchema = z.object({
	// Text
	name: z.string().default(""),
	// Textarea (specified via meta)
	description: z.string().default(""),
	// Number (no min/max)
	count: z.number().default(0),
	// Slider (has min/max)
	opacity: z.number().min(0).max(100).default(100),
	// Color (specified via meta)
	color: z.string().default("#3b82f6"),
	// Checkbox
	enabled: z.boolean().default(true),
	// Select (enum)
	size: z.enum(["small", "medium", "large"]).default("medium"),
});

export type AllFieldTypesConfig = z.infer<typeof allFieldTypesSchema>;

/**
 * Demo metadata showing all customization options
 */
export const allFieldTypesMeta: FormMeta<typeof allFieldTypesSchema.shape> = {
	name: { label: "Name", placeholder: "Enter your name" },
	description: {
		label: "Description",
		inputType: "textarea",
		placeholder: "Enter description...",
	},
	count: { label: "Count", unit: "items" },
	opacity: { label: "Opacity", unit: "%" },
	color: { label: "Favorite Color", inputType: "color" },
	enabled: { label: "Enabled", description: "Toggle this feature on/off" },
	size: { label: "Size" },
};

// =============================================================================
// Custom Select Options (for testing custom option labels)
// =============================================================================

/**
 * Demo schema showing custom option labels for select fields
 */
export const customOptionsSchema = z.object({
	duration: z.enum(["7", "30", "90", "180", "365"]).default("30"),
	priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
});

export type CustomOptionsConfig = z.infer<typeof customOptionsSchema>;

/**
 * Demo metadata with custom option labels
 */
export const customOptionsMeta: FormMeta<typeof customOptionsSchema.shape> = {
	duration: {
		label: "Duration",
		description: "Select how long to apply the setting",
		options: {
			"7": "7 days",
			"30": "30 days (1 month)",
			"90": "90 days (3 months)",
			"180": "180 days (6 months)",
			"365": "365 days (1 year)",
		},
	},
	priority: {
		label: "Priority Level",
		options: {
			low: "Low Priority",
			medium: "Medium Priority",
			high: "High Priority",
			critical: "Critical - Urgent!",
		},
	},
};

// =============================================================================
// i18n Demo (for testing localization support)
// =============================================================================

/**
 * Demo schema for i18n support
 */
export const i18nDemoSchema = z.object({
	displayName: z.string().default(""),
	theme: z.enum(["light", "dark", "system"]).default("system"),
	emailNotifications: z.boolean().default(true),
});

export type I18nDemoConfig = z.infer<typeof i18nDemoSchema>;

/**
 * Demo metadata with i18n keys - labels/descriptions are resolved via translation function
 */
export const i18nDemoMeta: FormMeta<typeof i18nDemoSchema.shape> = {
	displayName: {
		labelKey: "demo.displayName",
		placeholderKey: "demo.displayNamePlaceholder",
		descriptionKey: "demo.displayNameDescription",
	},
	theme: {
		labelKey: "demo.theme",
		descriptionKey: "demo.themeDescription",
		optionKeys: {
			light: "demo.themeLight",
			dark: "demo.themeDark",
			system: "demo.themeSystem",
		},
	},
	emailNotifications: {
		labelKey: "demo.emailNotifications",
		descriptionKey: "demo.emailNotificationsDescription",
	},
};
