import type { Meta, StoryObj } from "storybook-solidjs-vite";
import Button from "./Button";
import Card, { CardContent, CardHeader, CardTitle } from "./Card";

const meta = {
	title: "Design System/Card",
	component: Card,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		variant: {
			control: "select",
			options: ["default", "interactive", "gradient", "outline"],
		},
		padding: {
			control: "select",
			options: ["none", "sm", "md", "lg"],
		},
	},
	decorators: [
		(Story) => (
			<div style={{ width: "400px" }}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		children: (
			<div>
				<h3 style={{ margin: "0 0 8px 0", "font-weight": "600" }}>
					Card Title
				</h3>
				<p style={{ margin: 0, color: "#6b7280" }}>
					This is a default card with some content inside. Cards are used to
					group related information.
				</p>
			</div>
		),
	},
};

export const Interactive: Story = {
	args: {
		variant: "interactive",
		children: (
			<div>
				<h3 style={{ margin: "0 0 8px 0", "font-weight": "600" }}>
					Clickable Card
				</h3>
				<p style={{ margin: 0, color: "#6b7280" }}>
					Hover over this card to see the interactive effect.
				</p>
			</div>
		),
	},
};

export const Gradient: Story = {
	args: {
		variant: "gradient",
		children: (
			<div>
				<h3 style={{ margin: "0 0 8px 0", "font-weight": "600" }}>
					Premium Feature
				</h3>
				<p style={{ margin: 0, opacity: 0.9 }}>
					Upgrade to unlock this amazing feature and many more.
				</p>
			</div>
		),
	},
};

export const Outline: Story = {
	args: {
		variant: "outline",
		children: (
			<div>
				<h3 style={{ margin: "0 0 8px 0", "font-weight": "600" }}>
					Outline Card
				</h3>
				<p style={{ margin: 0, color: "#6b7280" }}>
					A subtle card variant with just a border.
				</p>
			</div>
		),
	},
};

export const NoPadding: Story = {
	args: {
		padding: "none",
		children: (
			<div>
				<div style={{ padding: "16px", "border-bottom": "1px solid #e5e7eb" }}>
					<h3 style={{ margin: 0, "font-weight": "600" }}>Card Header</h3>
				</div>
				<div style={{ padding: "16px" }}>
					<p style={{ margin: 0, color: "#6b7280" }}>Card body content</p>
				</div>
			</div>
		),
	},
};

export const WithHeaderAndContent: Story = {
	render: () => (
		<Card padding="none">
			<CardHeader>
				<CardTitle>Stream Settings</CardTitle>
			</CardHeader>
			<CardContent>
				<p style={{ margin: 0, color: "#6b7280" }}>
					Configure your stream settings here. You can change the title,
					description, and other options.
				</p>
				<div style={{ "margin-top": "16px" }}>
					<Button>Save Settings</Button>
				</div>
			</CardContent>
		</Card>
	),
};

export const AllVariants: Story = {
	render: () => (
		<div style={{ display: "flex", "flex-direction": "column", gap: "16px" }}>
			<Card variant="default">
				<p style={{ margin: 0 }}>Default Card</p>
			</Card>
			<Card variant="interactive">
				<p style={{ margin: 0 }}>Interactive Card (hover me)</p>
			</Card>
			<Card variant="outline">
				<p style={{ margin: 0 }}>Outline Card</p>
			</Card>
			<Card variant="gradient">
				<p style={{ margin: 0 }}>Gradient Card</p>
			</Card>
		</div>
	),
};

export const AllPaddings: Story = {
	render: () => (
		<div style={{ display: "flex", "flex-direction": "column", gap: "16px" }}>
			<Card padding="sm">
				<p style={{ margin: 0 }}>Small padding</p>
			</Card>
			<Card padding="md">
				<p style={{ margin: 0 }}>Medium padding (default)</p>
			</Card>
			<Card padding="lg">
				<p style={{ margin: 0 }}>Large padding</p>
			</Card>
		</div>
	),
};
