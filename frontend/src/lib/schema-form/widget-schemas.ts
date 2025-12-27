/**
 * Zod schemas for widget configurations.
 *
 * These schemas define the structure and validation rules for widget settings,
 * and include metadata for automatic form generation.
 */

import { z } from "zod";
import { withMeta } from "./introspect";

/**
 * Timer Widget Configuration Schema
 */
export const timerConfigSchema = z.object({
	label: withMeta(z.string().default("TIMER"), {
		label: "Timer Label",
		placeholder: "Enter label text",
		order: 1,
	}),
	fontSize: withMeta(z.number().min(24).max(120).default(48), {
		label: "Font Size",
		unit: "px",
		inputType: "slider",
		order: 2,
	}),
	textColor: withMeta(z.string().default("#ffffff"), {
		label: "Text Color",
		inputType: "color",
		order: 3,
	}),
	backgroundColor: withMeta(z.string().default("#3b82f6"), {
		label: "Background Color",
		inputType: "color",
		order: 4,
	}),
	countdownMinutes: withMeta(z.number().min(1).max(120).default(5), {
		label: "Countdown Duration",
		unit: "minutes",
		order: 5,
	}),
	autoStart: withMeta(z.boolean().default(false), {
		label: "Auto Start on Load",
		description: "Automatically start the timer when the widget loads in OBS",
		order: 6,
	}),
});

export type TimerConfig = z.infer<typeof timerConfigSchema>;

/**
 * Chat Widget Configuration Schema
 */
export const chatConfigSchema = z.object({
	fontSize: withMeta(z.enum(["small", "medium", "large"]).default("medium"), {
		label: "Font Size",
		inputType: "select",
		order: 1,
	}),
	maxMessages: withMeta(z.number().min(5).max(100).default(25), {
		label: "Max Messages",
		description: "Maximum number of messages to display at once",
		order: 2,
	}),
	showTimestamps: withMeta(z.boolean().default(false), {
		label: "Show Timestamps",
		order: 3,
	}),
	showBadges: withMeta(z.boolean().default(true), {
		label: "Show User Badges",
		description: "Display subscriber, moderator, and VIP badges",
		order: 4,
	}),
	showPlatform: withMeta(z.boolean().default(true), {
		label: "Show Platform Icons",
		description: "Display Twitch/YouTube icons next to messages",
		order: 5,
	}),
	showEmotes: withMeta(z.boolean().default(true), {
		label: "Show Emotes",
		description: "Render emotes as images",
		order: 6,
	}),
});

export type ChatConfig = z.infer<typeof chatConfigSchema>;

/**
 * Alertbox Widget Configuration Schema
 */
export const alertboxConfigSchema = z.object({
	animationType: withMeta(
		z.enum(["slide", "fade", "bounce"]).default("fade"),
		{
			label: "Animation Type",
			inputType: "select",
			group: "Animation",
			order: 1,
		},
	),
	alertPosition: withMeta(z.enum(["top", "center", "bottom"]).default("center"), {
		label: "Alert Position",
		inputType: "select",
		group: "Animation",
		order: 2,
	}),
	displayDuration: withMeta(z.number().min(1).max(30).default(5), {
		label: "Display Duration",
		unit: "seconds",
		inputType: "slider",
		group: "Animation",
		order: 3,
	}),
	fontSize: withMeta(z.enum(["small", "medium", "large"]).default("medium"), {
		label: "Font Size",
		inputType: "select",
		group: "Appearance",
		order: 4,
	}),
	showAmount: withMeta(z.boolean().default(true), {
		label: "Show Amount",
		description: "Display donation/raid amounts",
		group: "Content",
		order: 5,
	}),
	showMessage: withMeta(z.boolean().default(true), {
		label: "Show Message",
		description: "Display user messages with alerts",
		group: "Content",
		order: 6,
	}),
	soundEnabled: withMeta(z.boolean().default(true), {
		label: "Enable Sound",
		group: "Audio",
		order: 7,
	}),
	soundVolume: withMeta(z.number().min(0).max(100).default(80), {
		label: "Sound Volume",
		unit: "%",
		inputType: "slider",
		group: "Audio",
		order: 8,
	}),
});

export type AlertboxConfig = z.infer<typeof alertboxConfigSchema>;

/**
 * Donation Goal Widget Configuration Schema
 */
export const donationGoalConfigSchema = z.object({
	title: withMeta(z.string().default("Donation Goal"), {
		label: "Goal Title",
		placeholder: "Enter goal title",
		order: 1,
	}),
	targetAmount: withMeta(z.number().min(1).default(100), {
		label: "Target Amount",
		unit: "$",
		order: 2,
	}),
	currentAmount: withMeta(z.number().min(0).default(0), {
		label: "Starting Amount",
		unit: "$",
		description: "Initial amount (updates automatically with donations)",
		order: 3,
	}),
	barColor: withMeta(z.string().default("#10b981"), {
		label: "Progress Bar Color",
		inputType: "color",
		group: "Appearance",
		order: 4,
	}),
	backgroundColor: withMeta(z.string().default("#1f2937"), {
		label: "Background Color",
		inputType: "color",
		group: "Appearance",
		order: 5,
	}),
	textColor: withMeta(z.string().default("#ffffff"), {
		label: "Text Color",
		inputType: "color",
		group: "Appearance",
		order: 6,
	}),
	showPercentage: withMeta(z.boolean().default(true), {
		label: "Show Percentage",
		order: 7,
	}),
	showAmount: withMeta(z.boolean().default(true), {
		label: "Show Amount",
		description: "Display current/target amounts",
		order: 8,
	}),
});

export type DonationGoalConfig = z.infer<typeof donationGoalConfigSchema>;

/**
 * Follower Count Widget Configuration Schema
 */
export const followerCountConfigSchema = z.object({
	label: withMeta(z.string().default("Followers"), {
		label: "Label Text",
		placeholder: "Enter label",
		order: 1,
	}),
	fontSize: withMeta(z.number().min(16).max(96).default(32), {
		label: "Font Size",
		unit: "px",
		inputType: "slider",
		order: 2,
	}),
	textColor: withMeta(z.string().default("#ffffff"), {
		label: "Text Color",
		inputType: "color",
		order: 3,
	}),
	backgroundColor: withMeta(z.string().default("transparent"), {
		label: "Background Color",
		inputType: "color",
		order: 4,
	}),
	showLabel: withMeta(z.boolean().default(true), {
		label: "Show Label",
		order: 5,
	}),
	animateChanges: withMeta(z.boolean().default(true), {
		label: "Animate Count Changes",
		description: "Smooth animation when follower count updates",
		order: 6,
	}),
});

export type FollowerCountConfig = z.infer<typeof followerCountConfigSchema>;

/**
 * Poll Widget Configuration Schema
 */
export const pollConfigSchema = z.object({
	title: withMeta(z.string().default("Vote Now!"), {
		label: "Poll Title",
		placeholder: "Enter poll question",
		order: 1,
	}),
	barColor: withMeta(z.string().default("#8b5cf6"), {
		label: "Bar Color",
		inputType: "color",
		group: "Appearance",
		order: 2,
	}),
	backgroundColor: withMeta(z.string().default("#1f2937"), {
		label: "Background Color",
		inputType: "color",
		group: "Appearance",
		order: 3,
	}),
	textColor: withMeta(z.string().default("#ffffff"), {
		label: "Text Color",
		inputType: "color",
		group: "Appearance",
		order: 4,
	}),
	showPercentages: withMeta(z.boolean().default(true), {
		label: "Show Percentages",
		order: 5,
	}),
	showVoteCount: withMeta(z.boolean().default(true), {
		label: "Show Vote Count",
		order: 6,
	}),
	allowMultipleVotes: withMeta(z.boolean().default(false), {
		label: "Allow Multiple Votes",
		description: "Let users vote for multiple options",
		order: 7,
	}),
});

export type PollConfig = z.infer<typeof pollConfigSchema>;
