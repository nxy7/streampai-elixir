/**
 * Zod schemas for widget configurations.
 *
 * These schemas define the structure and validation rules for widget settings,
 * and include metadata for automatic form generation.
 *
 * Fields are rendered in declaration order (top to bottom).
 */

import { z } from "zod";
import { formField } from "./introspect";

/**
 * Timer Widget Configuration Schema
 */
export const timerConfigSchema = z.object({
	label: formField.text(z.string().default("TIMER"), {
		label: "Timer Label",
		placeholder: "Enter label text",
	}),
	fontSize: formField.slider(z.number().min(24).max(120).default(48), {
		label: "Font Size",
		unit: "px",
	}),
	textColor: formField.color(z.string().default("#ffffff"), {
		label: "Text Color",
	}),
	backgroundColor: formField.color(z.string().default("#3b82f6"), {
		label: "Background Color",
	}),
	countdownMinutes: formField.number(z.number().min(1).max(120).default(5), {
		label: "Countdown Duration",
		unit: "minutes",
	}),
	autoStart: formField.checkbox(z.boolean().default(false), {
		label: "Auto Start on Load",
		description: "Automatically start the timer when the widget loads in OBS",
	}),
});

export type TimerConfig = z.infer<typeof timerConfigSchema>;

/**
 * Chat Widget Configuration Schema
 */
export const chatConfigSchema = z.object({
	fontSize: formField.select(z.enum(["small", "medium", "large"]).default("medium"), {
		label: "Font Size",
	}),
	maxMessages: formField.number(z.number().min(5).max(100).default(25), {
		label: "Max Messages",
		description: "Maximum number of messages to display at once",
	}),
	showTimestamps: formField.checkbox(z.boolean().default(false), {
		label: "Show Timestamps",
	}),
	showBadges: formField.checkbox(z.boolean().default(true), {
		label: "Show User Badges",
		description: "Display subscriber, moderator, and VIP badges",
	}),
	showPlatform: formField.checkbox(z.boolean().default(true), {
		label: "Show Platform Icons",
		description: "Display Twitch/YouTube icons next to messages",
	}),
	showEmotes: formField.checkbox(z.boolean().default(true), {
		label: "Show Emotes",
		description: "Render emotes as images",
	}),
});

export type ChatConfig = z.infer<typeof chatConfigSchema>;

/**
 * Alertbox Widget Configuration Schema
 */
export const alertboxConfigSchema = z.object({
	// Animation group
	animationType: formField.select(z.enum(["slide", "fade", "bounce"]).default("fade"), {
		label: "Animation Type",
		group: "Animation",
	}),
	alertPosition: formField.select(z.enum(["top", "center", "bottom"]).default("center"), {
		label: "Alert Position",
		group: "Animation",
	}),
	displayDuration: formField.slider(z.number().min(1).max(30).default(5), {
		label: "Display Duration",
		unit: "seconds",
		group: "Animation",
	}),
	// Appearance group
	fontSize: formField.select(z.enum(["small", "medium", "large"]).default("medium"), {
		label: "Font Size",
		group: "Appearance",
	}),
	// Content group
	showAmount: formField.checkbox(z.boolean().default(true), {
		label: "Show Amount",
		description: "Display donation/raid amounts",
		group: "Content",
	}),
	showMessage: formField.checkbox(z.boolean().default(true), {
		label: "Show Message",
		description: "Display user messages with alerts",
		group: "Content",
	}),
	// Audio group
	soundEnabled: formField.checkbox(z.boolean().default(true), {
		label: "Enable Sound",
		group: "Audio",
	}),
	soundVolume: formField.slider(z.number().min(0).max(100).default(80), {
		label: "Sound Volume",
		unit: "%",
		group: "Audio",
	}),
});

export type AlertboxConfig = z.infer<typeof alertboxConfigSchema>;

/**
 * Donation Goal Widget Configuration Schema
 */
export const donationGoalConfigSchema = z.object({
	title: formField.text(z.string().default("Donation Goal"), {
		label: "Goal Title",
		placeholder: "Enter goal title",
	}),
	targetAmount: formField.number(z.number().min(1).default(100), {
		label: "Target Amount",
		unit: "$",
	}),
	currentAmount: formField.number(z.number().min(0).default(0), {
		label: "Starting Amount",
		unit: "$",
		description: "Initial amount (updates automatically with donations)",
	}),
	// Appearance group
	barColor: formField.color(z.string().default("#10b981"), {
		label: "Progress Bar Color",
		group: "Appearance",
	}),
	backgroundColor: formField.color(z.string().default("#1f2937"), {
		label: "Background Color",
		group: "Appearance",
	}),
	textColor: formField.color(z.string().default("#ffffff"), {
		label: "Text Color",
		group: "Appearance",
	}),
	showPercentage: formField.checkbox(z.boolean().default(true), {
		label: "Show Percentage",
	}),
	showAmount: formField.checkbox(z.boolean().default(true), {
		label: "Show Amount",
		description: "Display current/target amounts",
	}),
});

export type DonationGoalConfig = z.infer<typeof donationGoalConfigSchema>;

/**
 * Follower Count Widget Configuration Schema
 */
export const followerCountConfigSchema = z.object({
	label: formField.text(z.string().default("Followers"), {
		label: "Label Text",
		placeholder: "Enter label",
	}),
	fontSize: formField.slider(z.number().min(16).max(96).default(32), {
		label: "Font Size",
		unit: "px",
	}),
	textColor: formField.color(z.string().default("#ffffff"), {
		label: "Text Color",
	}),
	backgroundColor: formField.color(z.string().default("transparent"), {
		label: "Background Color",
	}),
	showLabel: formField.checkbox(z.boolean().default(true), {
		label: "Show Label",
	}),
	animateChanges: formField.checkbox(z.boolean().default(true), {
		label: "Animate Count Changes",
		description: "Smooth animation when follower count updates",
	}),
});

export type FollowerCountConfig = z.infer<typeof followerCountConfigSchema>;

/**
 * Poll Widget Configuration Schema
 */
export const pollConfigSchema = z.object({
	title: formField.text(z.string().default("Vote Now!"), {
		label: "Poll Title",
		placeholder: "Enter poll question",
	}),
	// Appearance group
	barColor: formField.color(z.string().default("#8b5cf6"), {
		label: "Bar Color",
		group: "Appearance",
	}),
	backgroundColor: formField.color(z.string().default("#1f2937"), {
		label: "Background Color",
		group: "Appearance",
	}),
	textColor: formField.color(z.string().default("#ffffff"), {
		label: "Text Color",
		group: "Appearance",
	}),
	showPercentages: formField.checkbox(z.boolean().default(true), {
		label: "Show Percentages",
	}),
	showVoteCount: formField.checkbox(z.boolean().default(true), {
		label: "Show Vote Count",
	}),
	allowMultipleVotes: formField.checkbox(z.boolean().default(false), {
		label: "Allow Multiple Votes",
		description: "Let users vote for multiple options",
	}),
});

export type PollConfig = z.infer<typeof pollConfigSchema>;
