import type { JSX } from "solid-js";
import AlertboxWidget from "./widgets/AlertboxWidget";
import ChatWidget from "./widgets/ChatWidget";
import DonationGoalWidget from "./widgets/DonationGoalWidget";
import EventListWidget from "./widgets/EventListWidget";
import FollowerCountWidget from "./widgets/FollowerCountWidget";
import GiveawayWidget from "./widgets/GiveawayWidget";
import MessageHighlightWidget from "./widgets/MessageHighlightWidget";
import PlaceholderWidget from "./widgets/PlaceholderWidget";
import PollWidget from "./widgets/PollWidget";
import SliderWidget from "./widgets/SliderWidget";
import TimerWidget from "./widgets/TimerWidget";
import TopDonorsWidget from "./widgets/TopDonorsWidget";
import ViewerCountWidget from "./widgets/ViewerCountWidget";

/**
 * Widget Registry Pattern
 *
 * This module implements a registry pattern for stream widgets, following the
 * open/closed principle. To add a new widget:
 *
 * 1. Create your widget component in ./widgets/
 * 2. Import it here
 * 3. Add an entry to WIDGET_REGISTRY with:
 *    - defaultConfig: Default configuration values
 *    - render: Function that creates the component with merged config
 *
 * The SmartCanvasWidgetRenderer will automatically pick up new widgets
 * without requiring any modifications.
 */

// Type for widget configuration - configs are merged at runtime
type WidgetConfig = Record<string, unknown>;

// Registry entry type - each widget has a default config and render function
interface WidgetRegistryEntry {
	defaultConfig: WidgetConfig;
	render: (config: WidgetConfig) => JSX.Element;
}

/**
 * Central registry of all available widgets.
 * Each entry contains default configuration and a render function.
 *
 * To add a new widget, simply add a new entry here - no other files need modification.
 */
export const WIDGET_REGISTRY: Record<string, WidgetRegistryEntry> = {
	placeholder: {
		defaultConfig: {
			message: "Placeholder Widget",
			fontSize: 24,
			textColor: "#ffffff",
			backgroundColor: "#9333ea",
			borderColor: "#ffffff",
			borderWidth: 2,
			padding: 16,
			borderRadius: 8,
		},
		render: (config) => <PlaceholderWidget config={config as never} />,
	},

	"viewer-count": {
		defaultConfig: {
			label: "viewers",
			fontSize: 32,
			textColor: "#ffffff",
			backgroundColor: "#8b5cf6",
			showIcon: true,
		},
		render: (config) => (
			<ViewerCountWidget config={config as never} data={null} />
		),
	},

	"follower-count": {
		defaultConfig: {
			label: "followers",
			fontSize: 32,
			textColor: "#ffffff",
			backgroundColor: "#ec4899",
			showIcon: true,
		},
		render: (config) => (
			<FollowerCountWidget
				config={config as never}
				count={Math.floor(Math.random() * 10000)}
			/>
		),
	},

	timer: {
		defaultConfig: {
			duration: 300,
			fontSize: 48,
			textColor: "#ffffff",
			backgroundColor: "#3b82f6",
			showLabel: true,
			label: "Time Remaining",
		},
		render: (config) => <TimerWidget config={config as never} />,
	},

	chat: {
		defaultConfig: {
			maxMessages: 10,
			fontSize: 16,
			backgroundColor: "rgba(0, 0, 0, 0.8)",
			textColor: "#ffffff",
			showAvatars: true,
		},
		render: (config) => <ChatWidget config={config as never} messages={[]} />,
	},

	eventlist: {
		defaultConfig: {
			maxEvents: 5,
			fontSize: 16,
			backgroundColor: "rgba(0, 0, 0, 0.8)",
			textColor: "#ffffff",
			showIcons: true,
		},
		render: (config) => (
			<EventListWidget config={config as never} events={[]} />
		),
	},

	topdonors: {
		defaultConfig: {
			maxDonors: 5,
			fontSize: 18,
			backgroundColor: "rgba(0, 0, 0, 0.9)",
			textColor: "#ffffff",
			showRank: true,
		},
		render: (config) => (
			<TopDonorsWidget config={config as never} donors={[]} />
		),
	},

	alertbox: {
		defaultConfig: {
			duration: 5,
			fontSize: 32,
			backgroundColor: "#8b5cf6",
			textColor: "#ffffff",
			soundEnabled: true,
		},
		render: (config) => (
			<AlertboxWidget config={config as never} event={null} />
		),
	},

	poll: {
		defaultConfig: {
			question: "What should we play next?",
			options: ["Game 1", "Game 2", "Game 3"],
			fontSize: 20,
			backgroundColor: "rgba(0, 0, 0, 0.9)",
			textColor: "#ffffff",
		},
		render: (config) => <PollWidget config={config as never} />,
	},

	giveaway: {
		defaultConfig: {
			title: "Giveaway!",
			prize: "Amazing Prize",
			fontSize: 24,
			backgroundColor: "#ec4899",
			textColor: "#ffffff",
		},
		render: (config) => <GiveawayWidget config={config as never} />,
	},

	slider: {
		defaultConfig: {
			slides: [
				{ text: "Slide 1", duration: 5 },
				{ text: "Slide 2", duration: 5 },
			],
			fontSize: 24,
			backgroundColor: "#8b5cf6",
			textColor: "#ffffff",
		},
		render: (config) => <SliderWidget config={config as never} />,
	},

	"donation-goal": {
		defaultConfig: {
			goal: 1000,
			current: 450,
			title: "Support the Stream!",
			fontSize: 24,
			backgroundColor: "#10b981",
			textColor: "#ffffff",
			showPercentage: true,
		},
		render: (config) => (
			<DonationGoalWidget config={config as never} currentAmount={0} />
		),
	},

	"message-highlight": {
		defaultConfig: {
			fontSize: "medium",
			showPlatform: true,
			showTimestamp: true,
			animationType: "slide",
			backgroundColor: "rgba(0, 0, 0, 0.9)",
			textColor: "#ffffff",
			accentColor: "#9333ea",
			borderRadius: 12,
		},
		render: (config) => (
			<MessageHighlightWidget config={config as never} message={null} />
		),
	},
};

/**
 * Get all registered widget types
 */
export function getRegisteredWidgetTypes(): string[] {
	return Object.keys(WIDGET_REGISTRY);
}

/**
 * Check if a widget type is registered
 */
export function isWidgetRegistered(widgetType: string): boolean {
	return widgetType in WIDGET_REGISTRY;
}

/**
 * Get the default config for a widget type
 */
export function getDefaultConfig(widgetType: string): WidgetConfig | null {
	return WIDGET_REGISTRY[widgetType]?.defaultConfig ?? null;
}

/**
 * Render a widget by type with merged configuration
 */
export function renderWidget(
	widgetType: string,
	userConfig?: WidgetConfig,
): JSX.Element | null {
	const entry = WIDGET_REGISTRY[widgetType];
	if (!entry) {
		return null;
	}

	const mergedConfig = { ...entry.defaultConfig, ...userConfig };
	return entry.render(mergedConfig);
}
