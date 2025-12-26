import type { Meta, StoryObj } from "storybook-solidjs-vite";
import TimerWidget from "./TimerWidget";

const meta = {
	title: "Widgets/Timer",
	component: TimerWidget,
	parameters: {
		layout: "centered",
		backgrounds: { default: "dark" },
	},
	tags: ["autodocs"],
} satisfies Meta<typeof TimerWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultConfig = {
	label: "Stream Timer",
	fontSize: 48,
	textColor: "#ffffff",
	backgroundColor: "#6366f1",
	countdownMinutes: 10,
	autoStart: false,
};

export const Default: Story = {
	args: {
		config: defaultConfig,
	},
};

export const AutoStart: Story = {
	args: {
		config: { ...defaultConfig, autoStart: true },
	},
};

export const FiveMinutes: Story = {
	args: {
		config: { ...defaultConfig, countdownMinutes: 5, label: "5 Min Countdown" },
	},
};

export const OneHour: Story = {
	args: {
		config: { ...defaultConfig, countdownMinutes: 60, label: "1 Hour Timer" },
	},
};

export const LargeFont: Story = {
	args: {
		config: { ...defaultConfig, fontSize: 72 },
	},
};

export const SmallFont: Story = {
	args: {
		config: { ...defaultConfig, fontSize: 32 },
	},
};

export const NoLabel: Story = {
	args: {
		config: { ...defaultConfig, label: "" },
	},
};

export const RedTheme: Story = {
	args: {
		config: {
			...defaultConfig,
			backgroundColor: "#dc2626",
			textColor: "#fef2f2",
			label: "Danger Zone",
		},
	},
};

export const GreenTheme: Story = {
	args: {
		config: {
			...defaultConfig,
			backgroundColor: "#10b981",
			textColor: "#ecfdf5",
			label: "Go Time",
		},
	},
};

export const DarkTheme: Story = {
	args: {
		config: {
			...defaultConfig,
			backgroundColor: "#1e293b",
			textColor: "#94a3b8",
			label: "Dark Mode",
		},
	},
};

export const BreakTimer: Story = {
	args: {
		config: {
			...defaultConfig,
			countdownMinutes: 15,
			backgroundColor: "#f59e0b",
			textColor: "#1e1b4b",
			label: "Break Time",
		},
	},
};

export const LongTimer: Story = {
	args: {
		config: {
			...defaultConfig,
			countdownMinutes: 180,
			label: "Marathon Stream",
		},
	},
};
