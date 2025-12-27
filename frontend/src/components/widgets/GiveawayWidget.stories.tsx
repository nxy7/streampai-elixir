import { expect, waitFor, within } from "@storybook/test";
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
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByText("Stream Giveaway")).toBeVisible();
		await expect(canvas.getByText("No Active Giveaway")).toBeVisible();
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
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByText("Stream Giveaway")).toBeVisible();
		await expect(canvas.getByText("Giveaway Active")).toBeVisible();
		await expect(canvas.getByText("45")).toBeVisible();
		await expect(canvas.getByText("Participants")).toBeVisible();
		await expect(canvas.getByText("Type !join to enter")).toBeVisible();
		await expect(canvas.getByText("8 Patreons (2x entries)")).toBeVisible();
		// Progress bar should show 45/100
		await expect(canvas.getByText("45 / 100")).toBeVisible();
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
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		// Wait for animation to complete before checking visibility
		await waitFor(
			() => {
				expect(canvas.getByText("Winner!")).toBeVisible();
			},
			{ timeout: 2000 },
		);
		await expect(canvas.getByText("LuckyWinner123")).toBeVisible();
		// Non-patreon winner should not show patreon badge
		await expect(canvas.queryByText("Patreon")).toBeNull();
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
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		// Wait for animation to complete before checking visibility
		await waitFor(
			() => {
				expect(canvas.getByText("Winner!")).toBeVisible();
			},
			{ timeout: 2000 },
		);
		await expect(canvas.getByText("PatreonSupporter")).toBeVisible();
		// Patreon winner should show badge
		await expect(canvas.getByText("Patreon")).toBeVisible();
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
