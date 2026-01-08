import type { Meta, StoryObj } from "storybook-solidjs-vite";
import ProgressBar from "./ProgressBar";

const meta = {
	title: "Design System/ProgressBar",
	component: ProgressBar,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		variant: {
			control: "select",
			options: ["primary", "success", "warning", "danger"],
		},
		size: {
			control: "select",
			options: ["sm", "md", "lg"],
		},
		value: {
			control: { type: "range", min: 0, max: 100 },
		},
	},
	decorators: [
		(Story) => (
			<div style={{ width: "400px" }}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		value: 60,
	},
};

export const WithLabel: Story = {
	args: {
		value: 75,
		label: "Upload Progress",
		showValue: true,
	},
};

export const Primary: Story = {
	args: {
		value: 50,
		variant: "primary",
		label: "Processing",
		showValue: true,
	},
};

export const Success: Story = {
	args: {
		value: 100,
		variant: "success",
		label: "Complete",
		showValue: true,
	},
};

export const Warning: Story = {
	args: {
		value: 80,
		variant: "warning",
		label: "Storage Used",
		showValue: true,
	},
};

export const Danger: Story = {
	args: {
		value: 95,
		variant: "danger",
		label: "Storage Critical",
		showValue: true,
	},
};

export const SmallSize: Story = {
	args: {
		value: 40,
		size: "sm",
	},
};

export const MediumSize: Story = {
	args: {
		value: 60,
		size: "md",
	},
};

export const LargeSize: Story = {
	args: {
		value: 80,
		size: "lg",
	},
};

export const CustomMax: Story = {
	args: {
		value: 750,
		max: 1000,
		label: "Followers",
		showValue: true,
	},
};

export const AllVariants: Story = {
	render: () => (
		<div style={{ display: "flex", "flex-direction": "column", gap: "16px" }}>
			<ProgressBar label="Primary" showValue value={60} variant="primary" />
			<ProgressBar label="Success" showValue value={80} variant="success" />
			<ProgressBar label="Warning" showValue value={50} variant="warning" />
			<ProgressBar label="Danger" showValue value={90} variant="danger" />
		</div>
	),
};

export const AllSizes: Story = {
	render: () => (
		<div style={{ display: "flex", "flex-direction": "column", gap: "16px" }}>
			<ProgressBar label="Small" size="sm" value={60} />
			<ProgressBar label="Medium" size="md" value={60} />
			<ProgressBar label="Large" size="lg" value={60} />
		</div>
	),
};

export const StorageUsage: Story = {
	render: () => (
		<div style={{ display: "flex", "flex-direction": "column", gap: "16px" }}>
			<ProgressBar
				label="Storage"
				max={10}
				showValue
				value={2.5}
				variant="primary"
			/>
			<p style={{ "font-size": "12px", color: "#6b7280", margin: 0 }}>
				2.5 GB of 10 GB used
			</p>
		</div>
	),
	name: "Storage Usage Example",
};

export const DonationGoal: Story = {
	render: () => (
		<div style={{ display: "flex", "flex-direction": "column", gap: "8px" }}>
			<ProgressBar max={500} size="lg" value={340} variant="success" />
			<div
				style={{
					display: "flex",
					"justify-content": "space-between",
					"font-size": "14px",
				}}>
				<span style={{ color: "#059669", "font-weight": "600" }}>$340</span>
				<span style={{ color: "#6b7280" }}>Goal: $500</span>
			</div>
		</div>
	),
	name: "Donation Goal Example",
};
