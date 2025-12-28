import type { JSX } from "solid-js";
import type { Meta, StoryObj } from "storybook-solidjs-vite";
import Button from "./Button";

const meta = {
	title: "Design System/Button",
	component: Button,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		variant: {
			control: "select",
			options: [
				"primary",
				"secondary",
				"danger",
				"success",
				"ghost",
				"gradient",
			],
		},
		size: {
			control: "select",
			options: ["sm", "md", "lg"],
		},
		disabled: {
			control: "boolean",
		},
		fullWidth: {
			control: "boolean",
		},
	},
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
	args: {
		variant: "primary",
		children: "Primary Button",
	},
};

export const Secondary: Story = {
	args: {
		variant: "secondary",
		children: "Secondary Button",
	},
};

export const Danger: Story = {
	args: {
		variant: "danger",
		children: "Delete",
	},
};

export const Success: Story = {
	args: {
		variant: "success",
		children: "Save Changes",
	},
};

export const Ghost: Story = {
	args: {
		variant: "ghost",
		children: "Cancel",
	},
};

export const Gradient: Story = {
	args: {
		variant: "gradient",
		children: "Get Started",
	},
};

export const Small: Story = {
	args: {
		size: "sm",
		children: "Small Button",
	},
};

export const Large: Story = {
	args: {
		size: "lg",
		children: "Large Button",
	},
};

export const Disabled: Story = {
	args: {
		disabled: true,
		children: "Disabled Button",
	},
};

export const FullWidth: Story = {
	args: {
		fullWidth: true,
		children: "Full Width Button",
	},
	decorators: [
		(Story: () => JSX.Element) => (
			<div style={{ width: "300px" }}>
				<Story />
			</div>
		),
	],
};

export const AllVariants: Story = {
	render: () => (
		<div style={{ display: "flex", gap: "12px", "flex-wrap": "wrap" }}>
			<Button variant="primary">Primary</Button>
			<Button variant="secondary">Secondary</Button>
			<Button variant="danger">Danger</Button>
			<Button variant="success">Success</Button>
			<Button variant="ghost">Ghost</Button>
			<Button variant="gradient">Gradient</Button>
		</div>
	),
};

export const AllSizes: Story = {
	render: () => (
		<div style={{ display: "flex", gap: "12px", "align-items": "center" }}>
			<Button size="sm">Small</Button>
			<Button size="md">Medium</Button>
			<Button size="lg">Large</Button>
		</div>
	),
};

export const AsAnchor: Story = {
	args: {
		as: "a",
		href: "https://example.com",
		children: "External Link (a)",
	},
};

export const AsRouterLink: Story = {
	args: {
		as: "link",
		href: "/dashboard",
		children: "Internal Link (A)",
	},
};

export const LinkVariants: Story = {
	render: () => (
		<div style={{ display: "flex", gap: "12px", "flex-wrap": "wrap" }}>
			<Button>Button (default)</Button>
			<Button as="a" href="https://example.com">
				External (a)
			</Button>
			<Button as="link" href="/dashboard">
				Internal (A)
			</Button>
		</div>
	),
};
