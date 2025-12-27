export type EventType =
	| "donation"
	| "follow"
	| "subscription"
	| "raid"
	| "cheer"
	| "chat_message";

export interface EventMetadata {
	icon: string;
	label: string;
	color: string;
	bgColor: string;
}

const EVENT_METADATA: Record<string, EventMetadata> = {
	donation: {
		icon: "💰",
		label: "Donation",
		color: "text-green-400",
		bgColor: "bg-green-100 text-green-600",
	},
	follow: {
		icon: "❤️",
		label: "Follow",
		color: "text-blue-400",
		bgColor: "bg-pink-100 text-pink-600",
	},
	subscription: {
		icon: "⭐",
		label: "Sub",
		color: "text-purple-400",
		bgColor: "bg-yellow-100 text-yellow-600",
	},
	raid: {
		icon: "⚡",
		label: "Raid",
		color: "text-yellow-400",
		bgColor: "bg-purple-100 text-purple-600",
	},
	cheer: {
		icon: "🎉",
		label: "Cheer",
		color: "text-orange-400",
		bgColor: "bg-orange-100 text-orange-600",
	},
	chat_message: {
		icon: "💬",
		label: "Chat",
		color: "text-gray-300",
		bgColor: "bg-blue-100 text-blue-600",
	},
};

const DEFAULT_METADATA: EventMetadata = {
	icon: "⚡",
	label: "Event",
	color: "text-gray-300",
	bgColor: "bg-blue-100 text-blue-600",
};

export function getEventMetadata(type: string): EventMetadata {
	return EVENT_METADATA[type] || DEFAULT_METADATA;
}

export function getEventIcon(type: string): string {
	return getEventMetadata(type).icon;
}

export function getEventLabel(type: string): string {
	return getEventMetadata(type).label;
}

export function getEventColor(type: string): string {
	return getEventMetadata(type).color;
}

export function getEventBgColor(type: string): string {
	return getEventMetadata(type).bgColor;
}

export interface PlatformMetadata {
	name: string;
	color: string;
}

const PLATFORM_METADATA: Record<string, PlatformMetadata> = {
	twitch: { name: "Twitch", color: "text-purple-500" },
	youtube: { name: "YouTube", color: "text-red-500" },
	facebook: { name: "Facebook", color: "text-blue-500" },
	kick: { name: "Kick", color: "text-green-500" },
};

const DEFAULT_PLATFORM: PlatformMetadata = {
	name: "Unknown",
	color: "text-gray-500",
};

export function getPlatformMetadata(platform: string): PlatformMetadata {
	return PLATFORM_METADATA[platform.toLowerCase()] || DEFAULT_PLATFORM;
}

export function getPlatformName(platform: string): string {
	return getPlatformMetadata(platform).name;
}
