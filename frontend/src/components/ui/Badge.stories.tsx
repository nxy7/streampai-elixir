import type { Meta, StoryObj } from "storybook-solidjs-vite";
import Badge from "./Badge";

const meta = {
	title: "Design System/Badge",
	component: Badge,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		variant: {
			control: "select",
			options: [
				"success",
				"warning",
				"error",
				"info",
				"neutral",
				"purple",
				"pink",
			],
		},
		size: {
			control: "select",
			options: ["sm", "md"],
		},
	},
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
	args: {
		variant: "success",
		children: "Active",
	},
};

export const Warning: Story = {
	args: {
		variant: "warning",
		children: "Pending",
	},
};

export const Error: Story = {
	args: {
		variant: "error",
		children: "Failed",
	},
};

export const Info: Story = {
	args: {
		variant: "info",
		children: "New",
	},
};

export const Neutral: Story = {
	args: {
		variant: "neutral",
		children: "Draft",
	},
};

export const Purple: Story = {
	args: {
		variant: "purple",
		children: "Twitch",
	},
};

export const Pink: Story = {
	args: {
		variant: "pink",
		children: "Featured",
	},
};

export const SmallSize: Story = {
	args: {
		size: "sm",
		variant: "success",
		children: "Small",
	},
};

export const MediumSize: Story = {
	args: {
		size: "md",
		variant: "success",
		children: "Medium",
	},
};

export const AllVariants: Story = {
	render: () => (
		<div style={{ display: "flex", gap: "8px", "flex-wrap": "wrap" }}>
			<Badge variant="success">Success</Badge>
			<Badge variant="warning">Warning</Badge>
			<Badge variant="error">Error</Badge>
			<Badge variant="info">Info</Badge>
			<Badge variant="neutral">Neutral</Badge>
			<Badge variant="purple">Purple</Badge>
			<Badge variant="pink">Pink</Badge>
		</div>
	),
};

export const PlatformBadges: Story = {
	render: () => (
		<div style={{ display: "flex", gap: "8px" }}>
			<Badge variant="purple">Twitch</Badge>
			<Badge variant="error">YouTube</Badge>
			<Badge variant="success">Kick</Badge>
			<Badge variant="info">Facebook</Badge>
		</div>
	),
	name: "Platform Badges",
};

export const StatusBadges: Story = {
	render: () => (
		<div style={{ display: "flex", gap: "8px" }}>
			<Badge variant="success">Live</Badge>
			<Badge variant="neutral">Offline</Badge>
			<Badge variant="warning">Starting Soon</Badge>
			<Badge variant="error">Ended</Badge>
		</div>
	),
	name: "Status Badges",
};

export const WithIcon: Story = {
	render: () => (
		<Badge variant="success">
			<svg class="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
				<path
					fill-rule="evenodd"
					d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
					clip-rule="evenodd"
				/>
			</svg>
			Verified
		</Badge>
	),
};
