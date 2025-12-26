import type { Meta, StoryObj } from "storybook-solidjs-vite";
import DonationGoalWidget from "./DonationGoalWidget";

const meta = {
	title: "Widgets/DonationGoal",
	component: DonationGoalWidget,
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
					padding: "20px",
					background: "rgba(0,0,0,0.5)",
				}}
			>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof DonationGoalWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultConfig = {
	goalAmount: 1000,
	startingAmount: 0,
	currency: "$",
	startDate: "2024-01-01",
	endDate: "2024-12-31",
	title: "Stream Goal",
	showPercentage: true,
	showAmountRaised: true,
	showDaysLeft: true,
	theme: "default" as const,
	barColor: "#10b981",
	backgroundColor: "#e5e7eb",
	textColor: "#1f2937",
	animationEnabled: true,
};

export const Default: Story = {
	args: {
		config: defaultConfig,
		currentAmount: 350,
	},
};

export const HalfwayThere: Story = {
	args: {
		config: defaultConfig,
		currentAmount: 500,
	},
};

export const AlmostComplete: Story = {
	args: {
		config: { ...defaultConfig, title: "Almost There!" },
		currentAmount: 950,
	},
};

export const Completed: Story = {
	args: {
		config: { ...defaultConfig, title: "Goal Reached! 🎉" },
		currentAmount: 1000,
	},
};

export const MinimalTheme: Story = {
	args: {
		config: { ...defaultConfig, theme: "minimal" as const },
		currentAmount: 420,
	},
};

export const ModernTheme: Story = {
	args: {
		config: {
			...defaultConfig,
			theme: "modern" as const,
			textColor: "#e2e8f0",
		},
		currentAmount: 600,
	},
};

export const CustomColors: Story = {
	args: {
		config: {
			...defaultConfig,
			barColor: "#8b5cf6",
			backgroundColor: "#fef3c7",
			textColor: "#7c2d12",
			title: "Custom Styled Goal",
		},
		currentAmount: 750,
	},
};

export const WithDonation: Story = {
	args: {
		config: defaultConfig,
		currentAmount: 400,
		donation: {
			id: "1",
			amount: 50,
			currency: "$",
			username: "GenerousDonor",
			timestamp: new Date(),
		},
	},
};

export const NoExtras: Story = {
	args: {
		config: {
			...defaultConfig,
			showPercentage: false,
			showDaysLeft: false,
			showAmountRaised: false,
		},
		currentAmount: 300,
	},
};
