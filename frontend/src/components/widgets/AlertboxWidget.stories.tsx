import { expect, waitFor, within } from "@storybook/test";
import type { Meta, StoryObj } from "storybook-solidjs-vite";
import AlertboxWidget from "./AlertboxWidget";

const meta = {
	title: "Widgets/Alertbox",
	component: AlertboxWidget,
	parameters: {
		layout: "centered",
		backgrounds: { default: "dark" },
	},
	tags: ["autodocs"],
	argTypes: {
		config: { control: "object" },
		event: { control: "object" },
	},
	decorators: [
		(Story) => (
			<div style={{ width: "500px", height: "400px" }}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof AlertboxWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultConfig = {
	animationType: "fade" as const,
	displayDuration: 5,
	soundEnabled: false,
	soundVolume: 75,
	showMessage: true,
	showAmount: true,
	fontSize: "medium" as const,
	alertPosition: "center" as const,
};

export const Donation: Story = {
	args: {
		config: defaultConfig,
		event: {
			id: "1",
			type: "donation",
			username: "GenerousViewer",
			message: "Great stream! Keep it up!",
			amount: 25,
			currency: "$",
			timestamp: new Date(),
			platform: { icon: "twitch", color: "bg-purple-600" },
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		// Wait for animation to complete before checking visibility
		await waitFor(
			() => {
				expect(canvas.getByText("GenerousViewer")).toBeVisible();
			},
			{ timeout: 2000 },
		);
		await expect(canvas.getByText("Donation")).toBeVisible();
		// Amount appears twice (once as shadow, once as main text), so use getAllByText
		const amounts = canvas.getAllByText("$25.00");
		await expect(amounts.length).toBeGreaterThan(0);
		await expect(canvas.getByText("Great stream! Keep it up!")).toBeVisible();
		await expect(canvas.getByText("Twitch")).toBeVisible();
	},
};

export const Follow: Story = {
	args: {
		config: defaultConfig,
		event: {
			id: "2",
			type: "follow",
			username: "NewFollower",
			timestamp: new Date(),
			platform: { icon: "youtube", color: "bg-red-600" },
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		// Wait for animation to complete before checking visibility
		await waitFor(
			() => {
				expect(canvas.getByText("NewFollower")).toBeVisible();
			},
			{ timeout: 2000 },
		);
		await expect(canvas.getByText("New Follower")).toBeVisible();
		await expect(canvas.getByText("YouTube")).toBeVisible();
	},
};

export const Subscription: Story = {
	args: {
		config: defaultConfig,
		event: {
			id: "3",
			type: "subscription",
			username: "LoyalSubscriber",
			message: "Happy to support!",
			timestamp: new Date(),
			platform: { icon: "twitch", color: "bg-purple-600" },
		},
	},
};

export const Raid: Story = {
	args: {
		config: defaultConfig,
		event: {
			id: "4",
			type: "raid",
			username: "BigStreamer",
			message: "Raiding with 150 viewers!",
			timestamp: new Date(),
			platform: { icon: "twitch", color: "bg-purple-600" },
		},
	},
};

export const LargeDonation: Story = {
	args: {
		config: { ...defaultConfig, fontSize: "large" as const },
		event: {
			id: "5",
			type: "donation",
			username: "WhaleViewer",
			message: "This is for you!",
			amount: 500,
			currency: "$",
			timestamp: new Date(),
			platform: { icon: "twitch", color: "bg-purple-600" },
		},
	},
};

export const NoEvent: Story = {
	args: {
		config: defaultConfig,
		event: null,
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		// When no event, the alert card should not be visible
		await expect(canvas.queryByText("Donation")).toBeNull();
		await expect(canvas.queryByText("New Follower")).toBeNull();
	},
};
