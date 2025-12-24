import type { Meta, StoryObj } from "storybook-solidjs-vite";
import Input, { Textarea, Select } from "./Input";

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
const textareaMeta = {
  title: "Design System/Textarea",
  component: Textarea,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story: any) => (
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
      label="Description"
      placeholder="Tell us about yourself..."
      rows={4}
      helperText="Maximum 500 characters"
    />
  ),
  name: "Textarea - With Label",
};

export const TextareaWithError: StoryObj<typeof Textarea> = {
  render: () => (
    <Textarea
      label="Bio"
      value="x"
      rows={4}
      error="Bio must be at least 10 characters"
    />
  ),
  name: "Textarea - With Error",
};

// Select stories
export const SelectDefault: StoryObj<typeof Select> = {
  render: () => (
    <Select label="Country">
      <option value="">Select a country</option>
      <option value="us">United States</option>
      <option value="uk">United Kingdom</option>
      <option value="ca">Canada</option>
      <option value="au">Australia</option>
    </Select>
  ),
  name: "Select - Default",
};

export const SelectWithHelper: StoryObj<typeof Select> = {
  render: () => (
    <Select label="Timezone" helperText="This affects when notifications are sent">
      <option value="">Select your timezone</option>
      <option value="pst">Pacific Time (PST)</option>
      <option value="mst">Mountain Time (MST)</option>
      <option value="cst">Central Time (CST)</option>
      <option value="est">Eastern Time (EST)</option>
    </Select>
  ),
  name: "Select - With Helper",
};

export const SelectWithError: StoryObj<typeof Select> = {
  render: () => (
    <Select label="Plan" error="Please select a plan to continue">
      <option value="">Select a plan</option>
      <option value="free">Free</option>
      <option value="pro">Pro</option>
      <option value="enterprise">Enterprise</option>
    </Select>
  ),
  name: "Select - With Error",
};

export const AllInputTypes: StoryObj = {
  render: () => (
    <div style={{ display: "flex", "flex-direction": "column", gap: "24px" }}>
      <Input label="Text Input" placeholder="Enter text..." />
      <Textarea label="Textarea" placeholder="Enter description..." rows={3} />
      <Select label="Select">
        <option value="">Choose an option</option>
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
      </Select>
    </div>
  ),
  name: "All Input Types",
};
