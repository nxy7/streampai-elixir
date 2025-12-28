import type { JSX } from "solid-js";
import type { Meta, StoryObj } from "storybook-solidjs-vite";
import Card from "./Card";
import Stat, { StatGroup } from "./Stat";

const meta = {
	title: "Design System/Stat",
	component: Stat,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		size: {
			control: "select",
			options: ["sm", "md", "lg"],
		},
		highlight: {
			control: "boolean",
		},
	},
} satisfies Meta<typeof Stat>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		value: "1,234",
		label: "Total Viewers",
	},
};

export const Highlighted: Story = {
	args: {
		value: "89%",
		label: "Engagement Rate",
		highlight: true,
	},
};

export const Small: Story = {
	args: {
		value: "456",
		label: "Followers",
		size: "sm",
	},
};

export const Large: Story = {
	args: {
		value: "$12,500",
		label: "Total Revenue",
		size: "lg",
	},
};

export const WithPositiveTrend: Story = {
	args: {
		value: "2,450",
		label: "Monthly Viewers",
		trend: {
			value: 12.5,
			label: "vs last month",
		},
	},
};

export const WithNegativeTrend: Story = {
	args: {
		value: "1,890",
		label: "Active Subscribers",
		trend: {
			value: -3.2,
			label: "vs last month",
		},
	},
};

export const WithIcon: Story = {
	args: {
		value: "42",
		label: "Live Streams",
		icon: (
			<svg
				class="h-8 w-8 text-purple-500"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24">
				<path
					d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
				/>
			</svg>
		),
	},
};

export const StatGroupExample: Story = {
	render: () => (
		<Card>
			<StatGroup columns={3}>
				<Stat label="Days streamed" value="3" />
				<Stat highlight label="Peak viewers" value="170" />
				<Stat label="Avg viewers" value="114" />
			</StatGroup>
		</Card>
	),
	name: "Stat Group (3 columns)",
	decorators: [
		(Story: () => JSX.Element) => (
			<div style={{ width: "500px" }}>
				<Story />
			</div>
		),
	],
};

export const StatGroupFourColumns: Story = {
	render: () => (
		<Card>
			<StatGroup columns={4}>
				<Stat label="Streams" size="sm" value="12" />
				<Stat label="Total Time" size="sm" value="8.4h" />
				<Stat label="Viewers" size="sm" value="2.1K" />
				<Stat label="Retention" size="sm" value="89%" />
			</StatGroup>
		</Card>
	),
	name: "Stat Group (4 columns)",
	decorators: [
		(Story: () => JSX.Element) => (
			<div style={{ width: "600px" }}>
				<Story />
			</div>
		),
	],
};

export const DashboardStats: Story = {
	render: () => (
		<Card>
			<StatGroup columns={4}>
				<Stat
					label="Revenue"
					trend={{ value: 12.5, label: "vs last month" }}
					value="$2,450"
				/>
				<Stat
					label="Subscribers"
					trend={{ value: 8.2, label: "vs last month" }}
					value="1,234"
				/>
				<Stat
					highlight
					label="Engagement"
					trend={{ value: -2.1, label: "vs last month" }}
					value="89%"
				/>
				<Stat
					label="Stream Time"
					trend={{ value: 15.0, label: "vs last month" }}
					value="42h"
				/>
			</StatGroup>
		</Card>
	),
	name: "Dashboard Stats Example",
	decorators: [
		(Story: () => JSX.Element) => (
			<div style={{ width: "800px" }}>
				<Story />
			</div>
		),
	],
};

export const AllSizes: Story = {
	render: () => (
		<div style={{ display: "flex", gap: "48px", "align-items": "flex-end" }}>
			<Stat label="Size: sm" size="sm" value="Small" />
			<Stat label="Size: md" size="md" value="Medium" />
			<Stat label="Size: lg" size="lg" value="Large" />
		</div>
	),
};
