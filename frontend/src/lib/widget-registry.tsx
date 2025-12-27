/**
 * Widget Registry - Central configuration for all widgets.
 *
 * This registry maps URL slugs to widget definitions, enabling a single
 * dynamic route to handle all widget settings pages.
 *
 * Each widget definition includes:
 * - schema: Zod schema for config validation and form generation
 * - meta: Form field metadata (labels, descriptions, input types)
 * - component: The preview component
 * - previewWrapper?: Optional wrapper for custom preview behavior (e.g., demo buttons)
 * - previewProps?: Static props passed to preview component
 * - obsSettings?: Recommended OBS browser source dimensions
 * - title/description: Page content
 * - widgetType: Backend identifier
 */
import {
	createSignal,
	onCleanup,
	onMount,
	type Component,
	type JSX,
} from "solid-js";
import { z } from "zod";
import AlertboxWidget from "~/components/widgets/AlertboxWidget";
import ChatWidget from "~/components/widgets/ChatWidget";
import DonationGoalWidget from "~/components/widgets/DonationGoalWidget";
import EventListWidget from "~/components/widgets/EventListWidget";
import FollowerCountWidget from "~/components/widgets/FollowerCountWidget";
import GiveawayWidget from "~/components/widgets/GiveawayWidget";
import PlaceholderWidget from "~/components/widgets/PlaceholderWidget";
import PollWidget from "~/components/widgets/PollWidget";
import SliderWidget from "~/components/widgets/SliderWidget";
import TimerWidget from "~/components/widgets/TimerWidget";
import TopDonorsWidget from "~/components/widgets/TopDonorsWidget";
import ViewerCountWidget from "~/components/widgets/ViewerCountWidget";
import type { WidgetType } from "~/lib/electric";
import {
	generateViewerData,
	generateViewerUpdate,
	type ViewerData,
} from "~/lib/fake/viewer-count";
import type { FormMeta } from "~/lib/schema-form";
import { button, input, text } from "~/styles/design-system";

// =============================================================================
// Widget Definition Type
// =============================================================================

export interface WidgetDefinition<T extends z.ZodRawShape = z.ZodRawShape> {
	title: string;
	description: string;
	widgetType: WidgetType;
	schema: z.ZodObject<T>;
	meta: FormMeta<T>;
	// biome-ignore lint/suspicious/noExplicitAny: Component props vary by widget
	component: Component<any>;
	// biome-ignore lint/suspicious/noExplicitAny: Preview props vary by widget
	previewProps?: Record<string, any>;
	// biome-ignore lint/suspicious/noExplicitAny: Wrapper receives config of widget's type
	previewWrapper?: (props: { config: any; children: JSX.Element }) => JSX.Element;
	obsSettings?: {
		width?: number;
		height?: number;
		customTips?: string[];
	};
}

// =============================================================================
// Schema Definitions
// =============================================================================

export const timerSchema = z.object({
	label: z.string().default("TIMER"),
	fontSize: z.number().min(24).max(120).default(48),
	textColor: z.string().default("#ffffff"),
	backgroundColor: z.string().default("#3b82f6"),
	countdownMinutes: z.number().min(1).max(120).default(5),
	autoStart: z.boolean().default(false),
});

export const followerCountSchema = z.object({
	label: z.string().default("followers"),
	fontSize: z.number().min(12).max(96).default(32),
	textColor: z.string().default("#ffffff"),
	backgroundColor: z.string().default("#9333ea"),
	showIcon: z.boolean().default(true),
	animateOnChange: z.boolean().default(true),
});

export const placeholderSchema = z.object({
	message: z.string().default("Placeholder Widget"),
	fontSize: z.number().min(8).max(72).default(24),
	textColor: z.string().default("#ffffff"),
	backgroundColor: z.string().default("#9333ea"),
	borderColor: z.string().default("#ffffff"),
	borderWidth: z.number().min(0).max(10).default(2),
	padding: z.number().min(0).max(50).default(16),
	borderRadius: z.number().min(0).max(50).default(8),
});

export const chatSchema = z.object({
	fontSize: z.enum(["small", "medium", "large"]).default("medium"),
	maxMessages: z.number().min(1).max(45).default(15),
	showTimestamps: z.boolean().default(false),
	showBadges: z.boolean().default(true),
	showPlatform: z.boolean().default(true),
	showEmotes: z.boolean().default(true),
});

export const alertboxSchema = z.object({
	animationType: z.enum(["slide", "fade", "bounce"]).default("fade"),
	displayDuration: z.number().min(1).max(30).default(5),
	soundEnabled: z.boolean().default(true),
	soundVolume: z.number().min(0).max(100).default(80),
	showMessage: z.boolean().default(true),
	showAmount: z.boolean().default(true),
	fontSize: z.enum(["small", "medium", "large"]).default("medium"),
	alertPosition: z.enum(["top", "center", "bottom"]).default("center"),
});

export const donationGoalSchema = z.object({
	goalAmount: z.number().min(1).default(1000),
	startingAmount: z.number().min(0).default(0),
	currency: z.string().default("$"),
	startDate: z.string().default(() => new Date().toISOString().split("T")[0]),
	endDate: z.string().default(
		() => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
	),
	title: z.string().default("Donation Goal"),
	showPercentage: z.boolean().default(true),
	showAmountRaised: z.boolean().default(true),
	showDaysLeft: z.boolean().default(true),
	theme: z.enum(["default", "minimal", "modern"]).default("default"),
	barColor: z.string().default("#10b981"),
	backgroundColor: z.string().default("#e5e7eb"),
	textColor: z.string().default("#1f2937"),
	animationEnabled: z.boolean().default(true),
});

export const eventListSchema = z.object({
	animationType: z.enum(["slide", "fade", "bounce"]).default("fade"),
	maxEvents: z.number().min(1).max(50).default(10),
	showTimestamps: z.boolean().default(false),
	showPlatform: z.boolean().default(false),
	showAmounts: z.boolean().default(true),
	fontSize: z.enum(["small", "medium", "large"]).default("medium"),
	compactMode: z.boolean().default(true),
});

export const giveawaySchema = z.object({
	showTitle: z.boolean().default(true),
	title: z.string().default("Giveaway"),
	showDescription: z.boolean().default(true),
	description: z.string().default("Join now for a chance to win!"),
	activeLabel: z.string().default("Giveaway Active"),
	inactiveLabel: z.string().default("No Active Giveaway"),
	winnerLabel: z.string().default("Winner!"),
	entryMethodText: z.string().default("Type !join to enter"),
	showEntryMethod: z.boolean().default(true),
	showProgressBar: z.boolean().default(true),
	targetParticipants: z.number().min(1).default(100),
	patreonMultiplier: z.number().min(1).max(10).default(2),
	patreonBadgeText: z.string().default("Patreon"),
	winnerAnimation: z.enum(["fade", "slide", "bounce", "confetti"]).default("confetti"),
	titleColor: z.string().default("#9333ea"),
	textColor: z.string().default("#1f2937"),
	backgroundColor: z.string().default("#ffffff"),
	accentColor: z.string().default("#10b981"),
	fontSize: z.enum(["small", "medium", "large", "extra-large"]).default("medium"),
	showPatreonInfo: z.boolean().default(true),
});

export const pollSchema = z.object({
	showTitle: z.boolean().default(true),
	showPercentages: z.boolean().default(true),
	showVoteCounts: z.boolean().default(true),
	fontSize: z.enum(["small", "medium", "large", "extra-large"]).default("medium"),
	primaryColor: z.string().default("#9333ea"),
	secondaryColor: z.string().default("#3b82f6"),
	backgroundColor: z.string().default("#ffffff"),
	textColor: z.string().default("#1f2937"),
	winnerColor: z.string().default("#fbbf24"),
	animationType: z.enum(["none", "smooth", "bounce"]).default("smooth"),
	highlightWinner: z.boolean().default(true),
	autoHideAfterEnd: z.boolean().default(false),
	hideDelay: z.number().min(1).max(60).default(10),
});

export const sliderSchema = z.object({
	slideDuration: z.number().min(1).max(60).default(5),
	transitionDuration: z.number().min(100).max(3000).default(500),
	transitionType: z.enum(["fade", "slide", "slide-up", "zoom", "flip"]).default("fade"),
	fitMode: z.enum(["contain", "cover", "fill"]).default("contain"),
	backgroundColor: z.string().default("transparent"),
});

export const topDonorsSchema = z.object({
	title: z.string().default("Top Donors"),
	topCount: z.number().min(3).max(20).default(10),
	fontSize: z.number().min(10).max(32).default(16),
	showAmounts: z.boolean().default(true),
	showRanking: z.boolean().default(true),
	backgroundColor: z.string().default("#1f2937"),
	textColor: z.string().default("#ffffff"),
	highlightColor: z.string().default("#ffd700"),
});

export const viewerCountSchema = z.object({
	showTotal: z.boolean().default(true),
	showPlatforms: z.boolean().default(true),
	fontSize: z.enum(["small", "medium", "large"]).default("medium"),
	displayStyle: z.enum(["minimal", "detailed", "cards"]).default("detailed"),
	animationEnabled: z.boolean().default(true),
	iconColor: z.string().default("#ef4444"),
	viewerLabel: z.string().default("viewers"),
});

// =============================================================================
// Metadata Definitions
// =============================================================================

const timerMeta: FormMeta<typeof timerSchema.shape> = {
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

const followerCountMeta: FormMeta<typeof followerCountSchema.shape> = {
	label: { label: "Label", placeholder: "followers" },
	fontSize: { label: "Font Size", unit: "px" },
	textColor: { label: "Text Color", inputType: "color" },
	backgroundColor: { label: "Background Color", inputType: "color" },
	showIcon: { label: "Show User Icon" },
	animateOnChange: { label: "Animate on Change", description: "Animate the count when it changes" },
};

const placeholderMeta: FormMeta<typeof placeholderSchema.shape> = {
	message: { label: "Message", placeholder: "Enter placeholder text" },
	fontSize: { label: "Font Size", unit: "px" },
	textColor: { label: "Text Color", inputType: "color" },
	backgroundColor: { label: "Background Color", inputType: "color" },
	borderColor: { label: "Border Color", inputType: "color" },
	borderWidth: { label: "Border Width", unit: "px" },
	padding: { label: "Padding", unit: "px" },
	borderRadius: { label: "Border Radius", unit: "px" },
};

const chatMeta: FormMeta<typeof chatSchema.shape> = {
	fontSize: { label: "Font Size" },
	maxMessages: { label: "Max Messages", description: "Maximum number of messages to display" },
	showTimestamps: { label: "Show Timestamps" },
	showBadges: { label: "Show User Badges", description: "Display subscriber, moderator, and VIP badges" },
	showPlatform: { label: "Show Platform Icons", description: "Display Twitch/YouTube icons next to messages" },
	showEmotes: { label: "Show Emotes", description: "Render emotes as images" },
};

const alertboxMeta: FormMeta<typeof alertboxSchema.shape> = {
	animationType: { label: "Animation Type" },
	displayDuration: { label: "Display Duration", unit: "seconds" },
	soundEnabled: { label: "Sound Enabled", description: "Play sound on alerts" },
	soundVolume: { label: "Sound Volume", unit: "%" },
	showMessage: { label: "Show Message", description: "Display message text on alerts" },
	showAmount: { label: "Show Amount", description: "Show amount for donations/raids" },
	fontSize: { label: "Font Size" },
	alertPosition: { label: "Alert Position" },
};

const donationGoalMeta: FormMeta<typeof donationGoalSchema.shape> = {
	goalAmount: { label: "Goal Amount" },
	startingAmount: { label: "Starting Amount" },
	currency: { label: "Currency Symbol" },
	startDate: { label: "Start Date" },
	endDate: { label: "End Date" },
	title: { label: "Title", placeholder: "Enter widget title" },
	showPercentage: { label: "Show Percentage" },
	showAmountRaised: { label: "Show Amount Raised" },
	showDaysLeft: { label: "Show Days Left" },
	theme: { label: "Theme" },
	barColor: { label: "Progress Bar Color", inputType: "color" },
	backgroundColor: { label: "Background Color", inputType: "color" },
	textColor: { label: "Text Color", inputType: "color" },
	animationEnabled: { label: "Enable Animations", description: "Smooth progress bar animations" },
};

const eventListMeta: FormMeta<typeof eventListSchema.shape> = {
	animationType: { label: "Animation Type" },
	maxEvents: { label: "Max Events", description: "Maximum number of events to display" },
	showTimestamps: { label: "Show Timestamps" },
	showPlatform: { label: "Show Platform Icons" },
	showAmounts: { label: "Show Donation Amounts" },
	fontSize: { label: "Font Size" },
	compactMode: { label: "Compact Mode", description: "Use condensed layout" },
};

const giveawayMeta: FormMeta<typeof giveawaySchema.shape> = {
	showTitle: { label: "Show Title" },
	title: { label: "Title", placeholder: "Enter giveaway title" },
	showDescription: { label: "Show Description" },
	description: { label: "Description", placeholder: "Enter description" },
	activeLabel: { label: "Active Label" },
	inactiveLabel: { label: "Inactive Label" },
	winnerLabel: { label: "Winner Label" },
	entryMethodText: { label: "Entry Method Text" },
	showEntryMethod: { label: "Show Entry Method" },
	showProgressBar: { label: "Show Progress Bar" },
	targetParticipants: { label: "Target Participants" },
	patreonMultiplier: { label: "Patreon Multiplier", description: "Bonus entries for Patreon supporters" },
	patreonBadgeText: { label: "Patreon Badge Text" },
	winnerAnimation: { label: "Winner Animation" },
	titleColor: { label: "Title Color", inputType: "color" },
	textColor: { label: "Text Color", inputType: "color" },
	backgroundColor: { label: "Background Color", inputType: "color" },
	accentColor: { label: "Accent Color", inputType: "color" },
	fontSize: { label: "Font Size" },
	showPatreonInfo: { label: "Show Patreon Info" },
};

const pollMeta: FormMeta<typeof pollSchema.shape> = {
	showTitle: { label: "Show Poll Title" },
	showPercentages: { label: "Show Percentages" },
	showVoteCounts: { label: "Show Vote Counts" },
	fontSize: { label: "Font Size" },
	primaryColor: { label: "Primary Color (Progress Bars)", inputType: "color" },
	secondaryColor: { label: "Secondary Color", inputType: "color" },
	backgroundColor: { label: "Background Color", inputType: "color" },
	textColor: { label: "Text Color", inputType: "color" },
	winnerColor: { label: "Winner Color (Highlight)", inputType: "color" },
	animationType: { label: "Animation Type" },
	highlightWinner: { label: "Highlight Leading Option" },
	autoHideAfterEnd: { label: "Auto Hide After End" },
	hideDelay: { label: "Hide Delay", unit: "seconds" },
};

const sliderMeta: FormMeta<typeof sliderSchema.shape> = {
	slideDuration: { label: "Slide Duration", unit: "seconds", description: "How long each slide is displayed" },
	transitionDuration: { label: "Transition Duration", unit: "ms", description: "Speed of the transition animation" },
	transitionType: { label: "Transition Type" },
	fitMode: { label: "Image Fit Mode", description: "How images are scaled to fit the container" },
	backgroundColor: { label: "Background Color", inputType: "color", placeholder: "transparent or #000000" },
};

const topDonorsMeta: FormMeta<typeof topDonorsSchema.shape> = {
	title: { label: "Widget Title", placeholder: "Enter widget title" },
	topCount: { label: "Top Count", description: "Number of top donors to display" },
	fontSize: { label: "Font Size", unit: "px" },
	showAmounts: { label: "Show Donation Amounts" },
	showRanking: { label: "Show Ranking Numbers" },
	backgroundColor: { label: "Background Color", inputType: "color" },
	textColor: { label: "Text Color", inputType: "color" },
	highlightColor: { label: "Highlight Color", inputType: "color", description: "Used for podium positions (top 3)" },
};

const viewerCountMeta: FormMeta<typeof viewerCountSchema.shape> = {
	showTotal: { label: "Show Total Viewer Count" },
	showPlatforms: { label: "Show Platform Breakdown" },
	fontSize: { label: "Font Size" },
	displayStyle: { label: "Display Style" },
	animationEnabled: { label: "Enable Smooth Number Animations" },
	iconColor: { label: "Icon Color", inputType: "color" },
	viewerLabel: { label: "Viewer Label", placeholder: "viewers", description: "Text displayed next to the viewer count" },
};

// =============================================================================
// Preview Wrappers - Custom preview behavior for widgets
// =============================================================================

// Alertbox preview with demo event cycling
const ALERTBOX_DEMO_EVENTS = [
	{
		id: "1",
		type: "donation" as const,
		username: "GenerosusDono",
		amount: 25,
		currency: "$",
		message: "Keep up the great streams!",
		timestamp: new Date(),
		platform: { icon: "twitch", color: "#9146ff" },
	},
	{
		id: "2",
		type: "follow" as const,
		username: "NewFan123",
		timestamp: new Date(),
		platform: { icon: "youtube", color: "#ff0000" },
	},
	{
		id: "3",
		type: "subscription" as const,
		username: "LoyalViewer42",
		timestamp: new Date(),
		platform: { icon: "twitch", color: "#9146ff" },
	},
	{
		id: "4",
		type: "raid" as const,
		username: "FriendlyStreamer",
		amount: 50,
		timestamp: new Date(),
		platform: { icon: "twitch", color: "#9146ff" },
	},
];

function AlertboxPreviewWrapper(props: {
	config: z.infer<typeof alertboxSchema>;
	children: JSX.Element;
}): JSX.Element {
	const [demoIndex, setDemoIndex] = createSignal(0);

	function cycleDemoEvent() {
		setDemoIndex((demoIndex() + 1) % ALERTBOX_DEMO_EVENTS.length);
	}

	return (
		<div>
			<button type="button" class={`${button.secondary} mb-4`} onClick={cycleDemoEvent}>
				Show Next Alert Type
			</button>
			<div class="rounded-lg bg-gray-900 p-8" style={{ height: "400px" }}>
				<AlertboxWidget config={props.config} event={ALERTBOX_DEMO_EVENTS[demoIndex()]} />
			</div>
		</div>
	);
}

// Chat preview with animated messages
interface ChatMessage {
	id: string;
	username: string;
	content: string;
	timestamp: Date;
	platform: { icon: string; color: string };
	badge?: string;
	badgeColor?: string;
	usernameColor?: string;
}

const CHAT_MOCK_MESSAGES: ChatMessage[] = [
	{
		id: "1",
		username: "StreamFan42",
		content: "Great stream! Love the new overlay design",
		timestamp: new Date(),
		platform: { icon: "twitch", color: "bg-purple-500" },
		badge: "SUB",
		badgeColor: "bg-purple-500 text-white",
		usernameColor: "#9333ea",
	},
	{
		id: "2",
		username: "GamerPro",
		content: "That was an amazing play!",
		timestamp: new Date(),
		platform: { icon: "youtube", color: "bg-red-500" },
		badge: "MOD",
		badgeColor: "bg-green-500 text-white",
		usernameColor: "#10b981",
	},
	{
		id: "3",
		username: "ChatUser99",
		content: "First time here, really enjoying the stream!",
		timestamp: new Date(),
		platform: { icon: "twitch", color: "bg-purple-500" },
		usernameColor: "#3b82f6",
	},
];

function ChatPreviewWrapper(props: {
	config: z.infer<typeof chatSchema>;
	children: JSX.Element;
}): JSX.Element {
	const [messages, setMessages] = createSignal<ChatMessage[]>(CHAT_MOCK_MESSAGES);

	onMount(() => {
		const interval = setInterval(() => {
			const newMessage: ChatMessage = {
				id: `msg_${Date.now()}`,
				username:
					["StreamFan", "GamerPro", "ChatUser", "NewViewer"][Math.floor(Math.random() * 4)] +
					Math.floor(Math.random() * 100),
				content: ["This is awesome!", "Love the stream!", "Amazing content!", "Keep it up!", "You're the best!"][
					Math.floor(Math.random() * 5)
				],
				timestamp: new Date(),
				platform: {
					icon: ["twitch", "youtube"][Math.floor(Math.random() * 2)],
					color: ["bg-purple-500", "bg-red-500"][Math.floor(Math.random() * 2)],
				},
				badge: Math.random() > 0.5 ? ["SUB", "MOD", "VIP"][Math.floor(Math.random() * 3)] : undefined,
				badgeColor: Math.random() > 0.5 ? "bg-purple-500 text-white" : undefined,
				usernameColor: ["#9333ea", "#10b981", "#3b82f6", "#ef4444"][Math.floor(Math.random() * 4)],
			};
			setMessages((prev) => [...prev, newMessage]);
		}, 3000);

		return () => clearInterval(interval);
	});

	return (
		<div class="overflow-hidden rounded-lg bg-gray-900" style={{ height: "400px" }}>
			<ChatWidget config={props.config} messages={messages()} />
		</div>
	);
}

// Donation Goal preview with progress slider
function DonationGoalPreviewWrapper(props: {
	config: z.infer<typeof donationGoalSchema>;
	children: JSX.Element;
}): JSX.Element {
	const [demoAmount, setDemoAmount] = createSignal(350);

	return (
		<div>
			<div class="mb-4">
				<label class="mb-2 block">
					<span class={text.label}>
						Test Progress: {demoAmount()}/{props.config.goalAmount}
					</span>
					<input
						type="range"
						class="w-full"
						min="0"
						max={props.config.goalAmount}
						value={demoAmount()}
						onInput={(e) => setDemoAmount(Number.parseInt(e.target.value, 10))}
					/>
				</label>
			</div>
			<div class="rounded-lg bg-gray-900 p-8" style={{ height: "300px" }}>
				<DonationGoalWidget config={props.config} currentAmount={demoAmount()} />
			</div>
		</div>
	);
}

// Event List preview with animated events
interface StreamEvent {
	id: string;
	type: "donation" | "follow" | "subscription" | "raid" | "chat_message";
	username: string;
	message?: string;
	amount?: number;
	currency?: string;
	timestamp: Date;
	platform: { icon: string; color: string };
}

const EVENTLIST_MOCK_EVENTS: StreamEvent[] = [
	{
		id: "1",
		type: "donation",
		username: "GenerousViewer",
		message: "Love the stream! Keep it up!",
		amount: 25.0,
		currency: "$",
		timestamp: new Date(),
		platform: { icon: "twitch", color: "bg-purple-500" },
	},
	{
		id: "2",
		type: "follow",
		username: "NewFollower42",
		message: "Just followed!",
		timestamp: new Date(),
		platform: { icon: "youtube", color: "bg-red-500" },
	},
	{
		id: "3",
		type: "subscription",
		username: "SubHype",
		message: "Happy to support!",
		timestamp: new Date(),
		platform: { icon: "twitch", color: "bg-purple-500" },
	},
];

const DEFAULT_EVENT_TYPES = ["donation", "follow", "subscription", "raid"];

function EventListPreviewWrapper(props: {
	config: z.infer<typeof eventListSchema>;
	children: JSX.Element;
}): JSX.Element {
	const [events, setEvents] = createSignal<StreamEvent[]>(EVENTLIST_MOCK_EVENTS);

	onMount(() => {
		const interval = setInterval(() => {
			const eventTypes: ("donation" | "follow" | "subscription" | "raid")[] = [
				"donation",
				"follow",
				"subscription",
				"raid",
			];
			const newEvent: StreamEvent = {
				id: `evt_${Date.now()}`,
				type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
				username: [`User${Math.floor(Math.random() * 100)}`, `Viewer${Math.floor(Math.random() * 100)}`][
					Math.floor(Math.random() * 2)
				],
				message: ["Amazing stream!", "Love the content!", "Keep it up!"][Math.floor(Math.random() * 3)],
				amount: Math.random() > 0.7 ? Math.floor(Math.random() * 50) + 5 : undefined,
				currency: "$",
				timestamp: new Date(),
				platform: {
					icon: ["twitch", "youtube"][Math.floor(Math.random() * 2)],
					color: ["bg-purple-500", "bg-red-500"][Math.floor(Math.random() * 2)],
				},
			};
			setEvents((prev) => [newEvent, ...prev].slice(0, 15));
		}, 4000);

		return () => clearInterval(interval);
	});

	const fullConfig = () => ({
		...props.config,
		eventTypes: DEFAULT_EVENT_TYPES,
	});

	return (
		<div class="overflow-hidden rounded-lg bg-gray-900" style={{ height: "500px" }}>
			<EventListWidget config={fullConfig()} events={events()} />
		</div>
	);
}

// Giveaway preview with mode toggle
const GIVEAWAY_DEMO_ACTIVE = {
	type: "update" as const,
	participants: 47,
	patreons: 12,
	isActive: true,
};

const GIVEAWAY_DEMO_WINNER = {
	type: "result" as const,
	winner: { username: "StreamLegend42", isPatreon: true },
	totalParticipants: 89,
	patreonParticipants: 15,
};

function GiveawayPreviewWrapper(props: {
	config: z.infer<typeof giveawaySchema>;
	children: JSX.Element;
}): JSX.Element {
	const [demoMode, setDemoMode] = createSignal<"active" | "winner">("active");

	return (
		<div>
			<div class="mb-4">
				<select
					class={input.select}
					value={demoMode()}
					onChange={(e) => setDemoMode(e.target.value as "active" | "winner")}
				>
					<option value="active">Active Giveaway</option>
					<option value="winner">Winner Announcement</option>
				</select>
			</div>
			<div class="rounded-lg bg-gray-900 p-8">
				<GiveawayWidget config={props.config} event={demoMode() === "active" ? GIVEAWAY_DEMO_ACTIVE : GIVEAWAY_DEMO_WINNER} />
			</div>
		</div>
	);
}

// Poll preview with mode toggle
const POLL_DEMO_ACTIVE = {
	id: "demo-1",
	title: "Which game should we play next?",
	status: "active" as const,
	options: [
		{ id: "1", text: "League of Legends", votes: 145 },
		{ id: "2", text: "Valorant", votes: 203 },
		{ id: "3", text: "Minecraft", votes: 89 },
		{ id: "4", text: "Among Us", votes: 56 },
	],
	totalVotes: 493,
	createdAt: new Date(),
	endsAt: new Date(Date.now() + 5 * 60 * 1000),
};

const POLL_DEMO_ENDED = {
	id: "demo-2",
	title: "Which game should we play next?",
	status: "ended" as const,
	options: [
		{ id: "1", text: "League of Legends", votes: 145 },
		{ id: "2", text: "Valorant", votes: 203 },
		{ id: "3", text: "Minecraft", votes: 89 },
		{ id: "4", text: "Among Us", votes: 56 },
	],
	totalVotes: 493,
	createdAt: new Date(),
};

function PollPreviewWrapper(props: {
	config: z.infer<typeof pollSchema>;
	children: JSX.Element;
}): JSX.Element {
	const [demoMode, setDemoMode] = createSignal<"active" | "ended">("active");

	return (
		<div>
			<div class="mb-4">
				<label class="mb-2 block">
					<span class={text.label}>Preview Mode</span>
					<select
						class={`${input.select} mt-1`}
						value={demoMode()}
						onChange={(e) => setDemoMode(e.target.value as "active" | "ended")}
					>
						<option value="active">Active Poll</option>
						<option value="ended">Ended Poll (Results)</option>
					</select>
				</label>
			</div>
			<div class="rounded-lg bg-gray-900 p-8">
				<PollWidget config={props.config} pollStatus={demoMode() === "active" ? POLL_DEMO_ACTIVE : POLL_DEMO_ENDED} />
			</div>
		</div>
	);
}

// Viewer Count preview with animated data
function ViewerCountPreviewWrapper(props: {
	config: z.infer<typeof viewerCountSchema>;
	children: JSX.Element;
}): JSX.Element {
	const [currentData, setCurrentData] = createSignal<ViewerData>(generateViewerData());

	let demoInterval: number | undefined;

	onMount(() => {
		demoInterval = window.setInterval(() => {
			const current = currentData();
			setCurrentData(generateViewerUpdate(current));
		}, 3000);
	});

	onCleanup(() => {
		if (demoInterval) {
			clearInterval(demoInterval);
		}
	});

	// Convert camelCase config to snake_case for the widget component
	const snakeCaseConfig = () => ({
		show_total: props.config.showTotal,
		show_platforms: props.config.showPlatforms,
		font_size: props.config.fontSize,
		display_style: props.config.displayStyle,
		animation_enabled: props.config.animationEnabled,
		icon_color: props.config.iconColor,
		viewer_label: props.config.viewerLabel,
	});

	return (
		<div class="relative min-h-64 overflow-hidden rounded border border-gray-200 bg-gray-900 p-4">
			<ViewerCountWidget config={snakeCaseConfig()} data={currentData()} id="preview-viewer-count-widget" />
		</div>
	);
}

// =============================================================================
// Sample Data for Preview Props
// =============================================================================

const SLIDER_SAMPLE_IMAGES = [
	{ id: "1", url: "https://picsum.photos/800/450?random=1", alt: "Sample 1", index: 0 },
	{ id: "2", url: "https://picsum.photos/800/450?random=2", alt: "Sample 2", index: 1 },
	{ id: "3", url: "https://picsum.photos/800/450?random=3", alt: "Sample 3", index: 2 },
];

const TOPDONORS_MOCK_DONORS = [
	{ id: "1", username: "GeneroussUser", amount: 2500.0, currency: "$" },
	{ id: "2", username: "MegaDonor", amount: 1800.0, currency: "$" },
	{ id: "3", username: "TopSupporter", amount: 1200.0, currency: "$" },
	{ id: "4", username: "Contributor", amount: 750.0, currency: "$" },
	{ id: "5", username: "FanSupport", amount: 500.0, currency: "$" },
	{ id: "6", username: "StreamFan", amount: 350.0, currency: "$" },
	{ id: "7", username: "Donor7", amount: 250.0, currency: "$" },
	{ id: "8", username: "Supporter8", amount: 150.0, currency: "$" },
	{ id: "9", username: "User9", amount: 100.0, currency: "$" },
	{ id: "10", username: "Viewer10", amount: 75.0, currency: "$" },
];

// =============================================================================
// Widget Registry
// =============================================================================

export const widgetRegistry: Record<string, WidgetDefinition> = {
	timer: {
		title: "Timer Widget Settings",
		description: "Configure your countdown timer widget for OBS",
		widgetType: "timer_widget",
		schema: timerSchema,
		meta: timerMeta,
		component: TimerWidget,
	},
	"follower-count": {
		title: "Follower Count Widget Settings",
		description: "Configure your follower count widget for OBS",
		widgetType: "follower_count_widget",
		schema: followerCountSchema,
		meta: followerCountMeta,
		component: FollowerCountWidget,
		previewProps: { count: 5678 },
	},
	placeholder: {
		title: "Placeholder Widget Settings",
		description: "Configure your placeholder widget for OBS",
		widgetType: "placeholder_widget",
		schema: placeholderSchema,
		meta: placeholderMeta,
		component: PlaceholderWidget,
	},
	chat: {
		title: "Chat Widget Settings",
		description: "Configure your chat overlay widget for OBS",
		widgetType: "chat_widget",
		schema: chatSchema,
		meta: chatMeta,
		component: ChatWidget,
		previewWrapper: ChatPreviewWrapper,
		obsSettings: { width: 400, height: 600 },
	},
	alertbox: {
		title: "Alertbox Widget Settings",
		description: "Configure alert notifications for donations, follows, subscriptions, and raids",
		widgetType: "alertbox_widget",
		schema: alertboxSchema,
		meta: alertboxMeta,
		component: AlertboxWidget,
		previewWrapper: AlertboxPreviewWrapper,
		obsSettings: { width: 800, height: 600 },
	},
	"donation-goal": {
		title: "Donation Goal Widget Settings",
		description: "Track progress toward your donation goals with animated progress bars",
		widgetType: "donation_goal_widget",
		schema: donationGoalSchema,
		meta: donationGoalMeta,
		component: DonationGoalWidget,
		previewWrapper: DonationGoalPreviewWrapper,
		obsSettings: { width: 800, height: 200 },
	},
	eventlist: {
		title: "Event List Widget Settings",
		description: "Configure your stream events widget for OBS",
		widgetType: "eventlist_widget",
		schema: eventListSchema,
		meta: eventListMeta,
		component: EventListWidget,
		previewWrapper: EventListPreviewWrapper,
		obsSettings: { width: 400, height: 800, customTips: ['Enable "Shutdown source when not visible"'] },
	},
	giveaway: {
		title: "Giveaway Widget Settings",
		description: "Configure your giveaway widget for viewer engagement",
		widgetType: "giveaway_widget",
		schema: giveawaySchema,
		meta: giveawayMeta,
		component: GiveawayWidget,
		previewWrapper: GiveawayPreviewWrapper,
		obsSettings: { width: 600, height: 400 },
	},
	poll: {
		title: "Poll Widget Settings",
		description: "Configure your interactive poll widget for live voting on stream",
		widgetType: "poll_widget",
		schema: pollSchema,
		meta: pollMeta,
		component: PollWidget,
		previewWrapper: PollPreviewWrapper,
		obsSettings: { width: 600, height: 400 },
	},
	slider: {
		title: "Slider Widget Settings",
		description: "Configure your image slider widget for OBS",
		widgetType: "slider_widget",
		schema: sliderSchema,
		meta: sliderMeta,
		component: SliderWidget,
		previewProps: { images: SLIDER_SAMPLE_IMAGES },
		obsSettings: {
			width: 1920,
			height: 1080,
			customTips: ['Enable "Shutdown source when not visible"', 'Enable "Refresh browser when scene becomes active"'],
		},
	},
	topdonors: {
		title: "Top Donors Widget Settings",
		description: "Configure your top donors leaderboard widget for OBS",
		widgetType: "top_donors_widget",
		schema: topDonorsSchema,
		meta: topDonorsMeta,
		component: TopDonorsWidget,
		previewProps: { donors: TOPDONORS_MOCK_DONORS },
		obsSettings: { width: 400, height: 800, customTips: ['Enable "Shutdown source when not visible"'] },
	},
	"viewer-count": {
		title: "Viewer Count Widget Settings",
		description: "Configure your viewer count widget and OBS browser source URL generation",
		widgetType: "viewer_count_widget",
		schema: viewerCountSchema,
		meta: viewerCountMeta,
		component: ViewerCountWidget,
		previewWrapper: ViewerCountPreviewWrapper,
		obsSettings: { width: 800, height: 200 },
	},
};

/**
 * Get a widget definition by slug.
 */
export function getWidgetDefinition(slug: string): WidgetDefinition | undefined {
	return widgetRegistry[slug];
}

/**
 * Get all widget slugs.
 */
export function getWidgetSlugs(): string[] {
	return Object.keys(widgetRegistry);
}
