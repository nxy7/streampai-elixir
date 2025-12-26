import {
	generateDonationAmount,
	generateHexId,
	generatePlatform,
	generateUsername,
	maybeRandom,
} from "./base";

export type AlertType = "donation" | "follow" | "subscription" | "raid";

export interface AlertConfig {
	animation_type: "fade" | "slide" | "bounce";
	display_duration: number;
	sound_enabled: boolean;
	sound_volume: number;
	show_message: boolean;
	show_amount: boolean;
	font_size: "small" | "medium" | "large";
	alert_position: "top" | "center" | "bottom";
}

export interface AlertEvent {
	id: string;
	type: AlertType;
	username: string;
	message?: string;
	amount?: number;
	currency?: string;
	timestamp: Date;
	platform: {
		icon: string;
		color: string;
	};
	display_time?: number;
}

const donationMessages = [
	"Great stream! Keep it up!",
	"Love your content!",
	"Thanks for the entertainment!",
	"You're awesome!",
	"Best streamer ever!",
	"Hope this helps with the setup!",
	"Amazing gameplay!",
	"Can't wait for the next stream!",
	"You deserve this!",
	"Thanks for making my day!",
	"Keep being amazing!",
	"Your content is incredible!",
	"So glad I found your stream!",
	"You're hilarious!",
	"Best part of my day!",
	"Thanks for all you do!",
	"You've got this!",
	"Loving the vibes!",
	"Your energy is contagious!",
	"Thanks for the laughs!",
];

const subscriptionMessages = [
	"Happy to support!",
	"Love being part of the community!",
	"Worth every penny!",
	"Can't wait for subscriber perks!",
	"Here for the long haul!",
	"Best decision ever!",
	"Your content is worth it!",
	"Proud to be a subscriber!",
	"Thanks for all you do!",
	"Keep up the amazing work!",
];

export function defaultConfig(): AlertConfig {
	return {
		animation_type: "fade",
		display_duration: 5,
		sound_enabled: true,
		sound_volume: 75,
		show_message: true,
		show_amount: true,
		font_size: "medium",
		alert_position: "center",
	};
}

export function generateEvent(): AlertEvent {
	const types: AlertType[] = ["donation", "follow", "subscription", "raid"];
	const type = types[Math.floor(Math.random() * types.length)];
	const username = generateUsername();
	const platform = generatePlatform();

	const baseEvent: AlertEvent = {
		id: generateHexId(),
		type,
		username,
		timestamp: new Date(),
		platform,
	};

	switch (type) {
		case "donation": {
			const amount = generateDonationAmount();
			return {
				...baseEvent,
				amount,
				currency: "$",
				message: maybeRandom(donationMessages),
			};
		}

		case "subscription":
			return {
				...baseEvent,
				message: maybeRandom(subscriptionMessages),
			};

		case "follow":
			return {
				...baseEvent,
				message: Math.random() < 0.1 ? "Thanks for the follow!" : undefined,
			};

		case "raid": {
			const viewers = Math.floor(Math.random() * 495) + 5;
			return {
				...baseEvent,
				message: `Raiding with ${viewers} viewers!`,
			};
		}
	}
}
