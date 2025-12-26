import type { Meta, StoryObj } from "storybook-solidjs-vite";
import EventListWidget from "./EventListWidget";

const meta = {
	title: "Widgets/EventList",
	component: EventListWidget,
	parameters: {
		layout: "fullscreen",
		backgrounds: { default: "dark" },
	},
	tags: ["autodocs"],
	decorators: [
		(Story) => (
			<div
				style={{
					width: "400px",
					height: "500px",
					background: "rgba(0,0,0,0.5)",
				}}
			>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof EventListWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultConfig = {
	animationType: "slide" as const,
	maxEvents: 10,
	eventTypes: ["donation", "follow", "subscription", "raid", "chat_message"],
	showTimestamps: true,
	showPlatform: true,
	showAmounts: true,
	fontSize: "medium" as const,
	compactMode: false,
};

const sampleEvents = [
	{
		id: "1",
		type: "donation" as const,
		username: "GenerousDonor",
		message: "Great stream! Keep it up!",
		amount: 25.0,
		currency: "$",
		timestamp: new Date(),
		platform: { icon: "twitch", color: "bg-purple-600" },
	},
	{
		id: "2",
		type: "follow" as const,
		username: "NewFollower",
		timestamp: new Date(),
		platform: { icon: "youtube", color: "bg-red-600" },
	},
	{
		id: "3",
		type: "subscription" as const,
		username: "LoyalSub",
		message: "6 month resub!",
		timestamp: new Date(),
		platform: { icon: "twitch", color: "bg-purple-600" },
	},
	{
		id: "4",
		type: "raid" as const,
		username: "RaidLeader",
		message: "Incoming with 150 viewers!",
		timestamp: new Date(),
		platform: { icon: "twitch", color: "bg-purple-600" },
	},
	{
		id: "5",
		type: "donation" as const,
		username: "BigTipper",
		message: "Amazing content!",
		amount: 100.0,
		currency: "$",
		timestamp: new Date(),
		platform: { icon: "kick", color: "bg-green-600" },
	},
];

export const Default: Story = {
	args: {
		config: defaultConfig,
		events: sampleEvents,
	},
};

export const FadeAnimation: Story = {
	args: {
		config: { ...defaultConfig, animationType: "fade" as const },
		events: sampleEvents,
	},
};

export const BounceAnimation: Story = {
	args: {
		config: { ...defaultConfig, animationType: "bounce" as const },
		events: sampleEvents,
	},
};

export const CompactMode: Story = {
	args: {
		config: { ...defaultConfig, compactMode: true },
		events: sampleEvents,
	},
};

export const SmallFont: Story = {
	args: {
		config: { ...defaultConfig, fontSize: "small" as const },
		events: sampleEvents,
	},
};

export const LargeFont: Story = {
	args: {
		config: { ...defaultConfig, fontSize: "large" as const },
		events: sampleEvents,
	},
};

export const DonationsOnly: Story = {
	args: {
		config: { ...defaultConfig, eventTypes: ["donation"] },
		events: sampleEvents,
	},
};

export const NoTimestamps: Story = {
	args: {
		config: { ...defaultConfig, showTimestamps: false },
		events: sampleEvents,
	},
};

export const NoPlatform: Story = {
	args: {
		config: { ...defaultConfig, showPlatform: false },
		events: sampleEvents,
	},
};

export const Empty: Story = {
	args: {
		config: defaultConfig,
		events: [],
	},
};
