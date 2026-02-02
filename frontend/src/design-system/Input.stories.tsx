import { type JSX, createSignal } from "solid-js";
import type { Meta, StoryObj } from "storybook-solidjs-vite";
import Input, { Textarea } from "./Input";
import Select from "./Select";

const meta = {
	title: "Design System/Input",
	component: Input,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	decorators: [
		(Story) => (
			<div style={{ width: "300px" }}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		placeholder: "Enter text...",
	},
};

export const WithLabel: Story = {
	args: {
		label: "Email Address",
		placeholder: "you@example.com",
		type: "email",
	},
};

export const WithHelperText: Story = {
	args: {
		label: "Username",
		placeholder: "johndoe",
		helperText: "This will be your public display name",
	},
};

export const WithError: Story = {
	args: {
		label: "Email",
		placeholder: "you@example.com",
		value: "invalid-email",
		error: "Please enter a valid email address",
	},
};

export const Disabled: Story = {
	args: {
		label: "Disabled Input",
		placeholder: "Cannot edit",
		disabled: true,
		value: "Read only content",
	},
};

export const Password: Story = {
	args: {
		label: "Password",
		placeholder: "Enter your password",
		type: "password",
		helperText: "Must be at least 8 characters",
	},
};

// Textarea stories
const _textareaMeta = {
	title: "Design System/Textarea",
	component: Textarea,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	decorators: [
		(Story: () => JSX.Element) => (
			<div style={{ width: "300px" }}>
				<Story />
			</div>
		),
	],
};

export const TextareaDefault: StoryObj<typeof Textarea> = {
	render: () => <Textarea placeholder="Enter your message..." rows={4} />,
	name: "Textarea - Default",
};

export const TextareaWithLabel: StoryObj<typeof Textarea> = {
	render: () => (
		<Textarea
			helperText="Maximum 500 characters"
			label="Description"
			placeholder="Tell us about yourself..."
			rows={4}
		/>
	),
	name: "Textarea - With Label",
};

export const TextareaWithError: StoryObj<typeof Textarea> = {
	render: () => (
		<Textarea
			error="Bio must be at least 10 characters"
			label="Bio"
			rows={4}
			value="x"
		/>
	),
	name: "Textarea - With Error",
};

// Select stories
export const SelectDefault: StoryObj<typeof Select> = {
	render: () => {
		const [value, setValue] = createSignal("");
		return (
			<Select
				label="Country"
				onChange={setValue}
				options={[
					{ value: "", label: "Select a country" },
					{ value: "us", label: "United States" },
					{ value: "uk", label: "United Kingdom" },
					{ value: "ca", label: "Canada" },
					{ value: "au", label: "Australia" },
				]}
				value={value()}
			/>
		);
	},
	name: "Select - Default",
};

export const SelectWithHelper: StoryObj<typeof Select> = {
	render: () => {
		const [value, setValue] = createSignal("");
		return (
			<Select
				helperText="This affects when notifications are sent"
				label="Timezone"
				onChange={setValue}
				options={[
					{ value: "", label: "Select your timezone" },
					{ value: "pst", label: "Pacific Time (PST)" },
					{ value: "mst", label: "Mountain Time (MST)" },
					{ value: "cst", label: "Central Time (CST)" },
					{ value: "est", label: "Eastern Time (EST)" },
				]}
				value={value()}
			/>
		);
	},
	name: "Select - With Helper",
};

export const SelectWithError: StoryObj<typeof Select> = {
	render: () => {
		const [value, setValue] = createSignal("");
		return (
			<Select
				error="Please select a plan to continue"
				label="Plan"
				onChange={setValue}
				options={[
					{ value: "", label: "Select a plan" },
					{ value: "free", label: "Free" },
					{ value: "pro", label: "Pro" },
					{ value: "enterprise", label: "Enterprise" },
				]}
				value={value()}
			/>
		);
	},
	name: "Select - With Error",
};

export const AllInputTypes: StoryObj = {
	render: () => {
		const [selectValue, setSelectValue] = createSignal("");
		return (
			<div style={{ display: "flex", "flex-direction": "column", gap: "24px" }}>
				<Input label="Text Input" placeholder="Enter text..." />
				<Textarea
					label="Textarea"
					placeholder="Enter description..."
					rows={3}
				/>
				<Select
					label="Select"
					onChange={setSelectValue}
					options={[
						{ value: "", label: "Choose an option" },
						{ value: "1", label: "Option 1" },
						{ value: "2", label: "Option 2" },
					]}
					value={selectValue()}
				/>
			</div>
		);
	},
	name: "All Input Types",
};
