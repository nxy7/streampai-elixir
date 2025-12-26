import type { Meta, StoryObj } from "storybook-solidjs-vite";
import GiveawayWidget from "./GiveawayWidget";

const meta = {
	title: "Widgets/Giveaway",
	component: GiveawayWidget,
	parameters: {
		layout: "centered",
		backgrounds: { default: "dark" },
	},
	tags: ["autodocs"],
	decorators: [
		(Story) => (
			<div style={{ width: "350px" }}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof GiveawayWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultConfig = {
	showTitle: true,
	title: "Stream Giveaway",
	showDescription: true,
	description: "Win a $50 Steam Gift Card!",
	activeLabel: "Giveaway Active",
	inactiveLabel: "No Active Giveaway",
	winnerLabel: "Winner!",
	entryMethodText: "Type !join to enter",
	showEntryMethod: true,
	showProgressBar: true,
	targetParticipants: 100,
	patreonMultiplier: 2,
	patreonBadgeText: "Patreon",
	winnerAnimation: "bounce" as const,
	titleColor: "#ffffff",
	textColor: "#e2e8f0",
	backgroundColor: "#1e293b",
	accentColor: "#8b5cf6",
	fontSize: "medium" as const,
	showPatreonInfo: true,
};

export const Inactive: Story = {
	args: {
		config: defaultConfig,
		event: undefined,
	},
};

export const Active: Story = {
	args: {
		config: defaultConfig,
		event: {
			type: "update",
			participants: 45,
			patreons: 8,
			isActive: true,
		},
	},
};

export const HighParticipation: Story = {
	args: {
		config: defaultConfig,
		event: {
			type: "update",
			participants: 87,
			patreons: 15,
			isActive: true,
		},
	},
};

export const TargetReached: Story = {
	args: {
		config: defaultConfig,
		event: {
			type: "update",
			participants: 100,
			patreons: 20,
			isActive: true,
		},
	},
};

export const WinnerAnnounced: Story = {
	args: {
		config: defaultConfig,
		event: {
			type: "result",
			winner: {
				username: "LuckyWinner123",
				isPatreon: false,
			},
			totalParticipants: 100,
			patreonParticipants: 20,
		},
	},
};

export const PatreonWinner: Story = {
	args: {
		config: defaultConfig,
		event: {
			type: "result",
			winner: {
				username: "PatreonSupporter",
				isPatreon: true,
			},
			totalParticipants: 85,
			patreonParticipants: 12,
		},
	},
};

export const FadeAnimation: Story = {
	args: {
		config: { ...defaultConfig, winnerAnimation: "fade" as const },
		event: {
			type: "result",
			winner: {
				username: "FadeWinner",
				isPatreon: false,
			},
			totalParticipants: 75,
			patreonParticipants: 10,
		},
	},
};

export const SmallFont: Story = {
	args: {
		config: { ...defaultConfig, fontSize: "small" as const },
		event: {
			type: "update",
			participants: 50,
			patreons: 5,
			isActive: true,
		},
	},
};

export const LargeFont: Story = {
	args: {
		config: { ...defaultConfig, fontSize: "large" as const },
		event: {
			type: "update",
			participants: 60,
			patreons: 8,
			isActive: true,
		},
	},
};

export const NoProgressBar: Story = {
	args: {
		config: { ...defaultConfig, showProgressBar: false },
		event: {
			type: "update",
			participants: 40,
			patreons: 6,
			isActive: true,
		},
	},
};
