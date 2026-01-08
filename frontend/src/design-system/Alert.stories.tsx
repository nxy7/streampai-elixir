import type { Meta, StoryObj } from "storybook-solidjs-vite";
import Alert from "./Alert";

const meta = {
	title: "Design System/Alert",
	component: Alert,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		variant: {
			control: "select",
			options: ["success", "warning", "error", "info"],
		},
	},
	decorators: [
		(Story) => (
			<div style={{ width: "500px" }}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
	args: {
		variant: "success",
		children: "Your changes have been saved successfully.",
	},
};

export const Warning: Story = {
	args: {
		variant: "warning",
		children: "Your session will expire in 5 minutes. Please save your work.",
	},
};

export const Error: Story = {
	args: {
		variant: "error",
		children: "There was an error processing your request. Please try again.",
	},
};

export const Info: Story = {
	args: {
		variant: "info",
		children: "A new version is available. Refresh to update.",
	},
};

export const WithTitle: Story = {
	args: {
		variant: "success",
		title: "Payment Successful",
		children:
			"Your payment of $49.99 has been processed. A receipt has been sent to your email.",
	},
};

export const ErrorWithTitle: Story = {
	args: {
		variant: "error",
		title: "Connection Failed",
		children:
			"Unable to connect to the streaming server. Check your internet connection and try again.",
	},
};

export const WarningWithTitle: Story = {
	args: {
		variant: "warning",
		title: "Stream Quality Warning",
		children:
			"Your upload speed is below recommended levels. Consider lowering your stream quality.",
	},
};

export const InfoWithTitle: Story = {
	args: {
		variant: "info",
		title: "Tip",
		children:
			"You can use keyboard shortcuts to control your stream. Press ? to see all available shortcuts.",
	},
};

export const AllVariants: Story = {
	render: () => (
		<div style={{ display: "flex", "flex-direction": "column", gap: "16px" }}>
			<Alert title="Success" variant="success">
				Operation completed successfully.
			</Alert>
			<Alert title="Warning" variant="warning">
				Please review before continuing.
			</Alert>
			<Alert title="Error" variant="error">
				Something went wrong.
			</Alert>
			<Alert title="Information" variant="info">
				Here's something you should know.
			</Alert>
		</div>
	),
};

export const LongContent: Story = {
	args: {
		variant: "info",
		title: "Stream Analytics Available",
		children:
			"Your stream analytics for the past 30 days are now ready to view. This includes detailed viewer statistics, chat engagement metrics, peak viewer times, and follower growth data. Visit the Analytics dashboard to explore your performance insights.",
	},
};
