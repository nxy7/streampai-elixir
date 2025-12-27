import { expect, within } from "@storybook/test";
import type { Meta, StoryObj } from "storybook-solidjs-vite";
import PollWidget from "./PollWidget";

const meta = {
	title: "Widgets/Poll",
	component: PollWidget,
	parameters: {
		layout: "centered",
		backgrounds: { default: "dark" },
	},
	tags: ["autodocs"],
	decorators: [
		(Story) => (
			<div style={{ width: "400px" }}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof PollWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultConfig = {
	showTitle: true,
	showPercentages: true,
	showVoteCounts: true,
	fontSize: "medium" as const,
	primaryColor: "#8b5cf6",
	secondaryColor: "#c4b5fd",
	backgroundColor: "#1e293b",
	textColor: "#e2e8f0",
	winnerColor: "#fbbf24",
	animationType: "smooth" as const,
	highlightWinner: true,
	autoHideAfterEnd: false,
	hideDelay: 5000,
};

const activeOptions = [
	{ id: "1", text: "Option A", votes: 45 },
	{ id: "2", text: "Option B", votes: 32 },
	{ id: "3", text: "Option C", votes: 18 },
	{ id: "4", text: "Option D", votes: 5 },
];

export const Waiting: Story = {
	args: {
		config: defaultConfig,
		pollStatus: undefined,
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByText("Waiting for poll...")).toBeVisible();
	},
};

export const Active: Story = {
	args: {
		config: defaultConfig,
		pollStatus: {
			id: "poll-1",
			title: "What game should we play next?",
			status: "active",
			options: activeOptions,
			totalVotes: 100,
			createdAt: new Date(),
			endsAt: new Date(Date.now() + 5 * 60 * 1000),
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.getByText("What game should we play next?"),
		).toBeVisible();
		await expect(canvas.getByText("Option A")).toBeVisible();
		await expect(canvas.getByText("Option B")).toBeVisible();
		await expect(canvas.getByText("100 total votes")).toBeVisible();
		// Check percentages are displayed
		await expect(canvas.getByText("45%")).toBeVisible();
		await expect(canvas.getByText("32%")).toBeVisible();
	},
};

export const ActiveCloseRace: Story = {
	args: {
		config: defaultConfig,
		pollStatus: {
			id: "poll-2",
			title: "Close Vote!",
			status: "active",
			options: [
				{ id: "1", text: "Team A", votes: 48 },
				{ id: "2", text: "Team B", votes: 52 },
			],
			totalVotes: 100,
			createdAt: new Date(),
			endsAt: new Date(Date.now() + 2 * 60 * 1000),
		},
	},
};

export const Ended: Story = {
	args: {
		config: defaultConfig,
		pollStatus: {
			id: "poll-3",
			title: "Best Snack?",
			status: "ended",
			options: [
				{ id: "1", text: "Pizza", votes: 120 },
				{ id: "2", text: "Tacos", votes: 85 },
				{ id: "3", text: "Burgers", votes: 65 },
				{ id: "4", text: "Salad", votes: 30 },
			],
			totalVotes: 300,
			createdAt: new Date(Date.now() - 10 * 60 * 1000),
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByText("Poll Results")).toBeVisible();
		await expect(canvas.getByText("Poll ended")).toBeVisible();
		// Winner should be #1
		await expect(canvas.getByText("#1")).toBeVisible();
		await expect(canvas.getByText("Pizza")).toBeVisible();
		await expect(canvas.getByText("300 total votes")).toBeVisible();
	},
};

export const BounceAnimation: Story = {
	args: {
		config: { ...defaultConfig, animationType: "bounce" as const },
		pollStatus: {
			id: "poll-4",
			title: "Favorite Color?",
			status: "active",
			options: [
				{ id: "1", text: "Blue", votes: 40 },
				{ id: "2", text: "Red", votes: 35 },
				{ id: "3", text: "Green", votes: 25 },
			],
			totalVotes: 100,
			createdAt: new Date(),
		},
	},
};

export const NoAnimation: Story = {
	args: {
		config: { ...defaultConfig, animationType: "none" as const },
		pollStatus: {
			id: "poll-5",
			title: "Static Poll",
			status: "active",
			options: activeOptions,
			totalVotes: 100,
			createdAt: new Date(),
		},
	},
};

export const SmallFont: Story = {
	args: {
		config: { ...defaultConfig, fontSize: "small" as const },
		pollStatus: {
			id: "poll-6",
			title: "Small Font Poll",
			status: "active",
			options: activeOptions,
			totalVotes: 100,
			createdAt: new Date(),
		},
	},
};

export const LargeFont: Story = {
	args: {
		config: { ...defaultConfig, fontSize: "large" as const },
		pollStatus: {
			id: "poll-7",
			title: "Large Font Poll",
			status: "active",
			options: activeOptions,
			totalVotes: 100,
			createdAt: new Date(),
		},
	},
};

export const CustomColors: Story = {
	args: {
		config: {
			...defaultConfig,
			primaryColor: "#ec4899",
			backgroundColor: "#fdf2f8",
			textColor: "#831843",
			winnerColor: "#f59e0b",
		},
		pollStatus: {
			id: "poll-8",
			title: "Custom Styled Poll",
			status: "active",
			options: activeOptions,
			totalVotes: 100,
			createdAt: new Date(),
		},
	},
};

export const NoWinnerHighlight: Story = {
	args: {
		config: { ...defaultConfig, highlightWinner: false },
		pollStatus: {
			id: "poll-9",
			title: "No Highlight",
			status: "active",
			options: activeOptions,
			totalVotes: 100,
			createdAt: new Date(),
		},
	},
};
