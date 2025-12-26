import type { Meta, StoryObj } from "storybook-solidjs-vite";
import FollowerCountWidget from "./FollowerCountWidget";

const meta = {
	title: "Widgets/FollowerCount",
	component: FollowerCountWidget,
	parameters: {
		layout: "centered",
		backgrounds: { default: "dark" },
	},
	tags: ["autodocs"],
} satisfies Meta<typeof FollowerCountWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultConfig = {
	label: "Followers",
	fontSize: 32,
	textColor: "#ffffff",
	backgroundColor: "#6366f1",
	showIcon: true,
	animateOnChange: true,
};

export const Default: Story = {
	args: {
		config: defaultConfig,
		count: 12543,
	},
};

export const SmallCount: Story = {
	args: {
		config: defaultConfig,
		count: 42,
	},
};

export const LargeCount: Story = {
	args: {
		config: defaultConfig,
		count: 1234567,
	},
};

export const NoIcon: Story = {
	args: {
		config: { ...defaultConfig, showIcon: false },
		count: 8765,
	},
};

export const NoLabel: Story = {
	args: {
		config: { ...defaultConfig, label: "" },
		count: 5000,
	},
};

export const LargeFont: Story = {
	args: {
		config: { ...defaultConfig, fontSize: 48 },
		count: 9999,
	},
};

export const SmallFont: Story = {
	args: {
		config: { ...defaultConfig, fontSize: 20 },
		count: 3210,
	},
};

export const CustomColors: Story = {
	args: {
		config: {
			...defaultConfig,
			backgroundColor: "#dc2626",
			textColor: "#fef2f2",
			label: "Subscribers",
		},
		count: 25000,
	},
};

export const GreenTheme: Story = {
	args: {
		config: {
			...defaultConfig,
			backgroundColor: "#10b981",
			textColor: "#ecfdf5",
			label: "Members",
		},
		count: 750,
	},
};

export const Zero: Story = {
	args: {
		config: defaultConfig,
		count: 0,
	},
};
