import type { Meta, StoryObj } from "storybook-solidjs-vite";
import TopDonorsWidget from "./TopDonorsWidget";

const meta = {
	title: "Widgets/TopDonors",
	component: TopDonorsWidget,
	parameters: {
		layout: "centered",
		backgrounds: { default: "dark" },
	},
	tags: ["autodocs"],
	decorators: [
		(Story) => (
			<div style={{ width: "380px", height: "500px" }}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof TopDonorsWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultConfig = {
	title: "Top Donors",
	topCount: 5,
	fontSize: 16,
	showAmounts: true,
	showRanking: true,
	backgroundColor: "#1f2937",
	textColor: "#ffffff",
	highlightColor: "#ffd700",
};

const sampleDonors = [
	{ id: "1", username: "GenerousGamer", amount: 500, currency: "$" },
	{ id: "2", username: "StreamSupporter", amount: 250, currency: "$" },
	{ id: "3", username: "LoyalFan", amount: 150, currency: "$" },
	{ id: "4", username: "BigTipper", amount: 100, currency: "$" },
	{ id: "5", username: "KindViewer", amount: 75, currency: "$" },
	{ id: "6", username: "AwesomeDonor", amount: 50, currency: "$" },
];

export const Default: Story = {
	args: {
		config: defaultConfig,
		donors: sampleDonors,
	},
};

export const Top3Only: Story = {
	args: {
		config: { ...defaultConfig, topCount: 3 },
		donors: sampleDonors,
	},
};

export const Top10: Story = {
	args: {
		config: { ...defaultConfig, topCount: 10 },
		donors: [
			...sampleDonors,
			{ id: "7", username: "GreatSupporter", amount: 40, currency: "$" },
			{ id: "8", username: "NiceViewer", amount: 30, currency: "$" },
			{ id: "9", username: "CoolDonor", amount: 25, currency: "$" },
			{ id: "10", username: "HappyTipper", amount: 20, currency: "$" },
		],
	},
};

export const NoAmounts: Story = {
	args: {
		config: { ...defaultConfig, showAmounts: false },
		donors: sampleDonors,
	},
};

export const NoRanking: Story = {
	args: {
		config: { ...defaultConfig, showRanking: false },
		donors: sampleDonors,
	},
};

export const LargeFont: Story = {
	args: {
		config: { ...defaultConfig, fontSize: 20 },
		donors: sampleDonors,
	},
};

export const SmallFont: Story = {
	args: {
		config: { ...defaultConfig, fontSize: 12 },
		donors: sampleDonors,
	},
};

export const CustomTitle: Story = {
	args: {
		config: { ...defaultConfig, title: "Hall of Fame" },
		donors: sampleDonors,
	},
};

export const PurpleTheme: Story = {
	args: {
		config: {
			...defaultConfig,
			backgroundColor: "#4c1d95",
			textColor: "#f3e8ff",
			highlightColor: "#a78bfa",
		},
		donors: sampleDonors,
	},
};

export const DarkBlueTheme: Story = {
	args: {
		config: {
			...defaultConfig,
			backgroundColor: "#0f172a",
			textColor: "#cbd5e1",
			highlightColor: "#38bdf8",
		},
		donors: sampleDonors,
	},
};

export const SingleDonor: Story = {
	args: {
		config: defaultConfig,
		donors: [sampleDonors[0]],
	},
};

export const Empty: Story = {
	args: {
		config: defaultConfig,
		donors: [],
	},
};
