import type { Meta, StoryObj } from "storybook-solidjs-vite";
import PlaceholderWidget from "./PlaceholderWidget";

const meta = {
  title: "Widgets/Placeholder",
  component: PlaceholderWidget,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof PlaceholderWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultConfig = {
  message: "Widget Coming Soon",
  fontSize: 24,
  textColor: "#ffffff",
  backgroundColor: "#374151",
  borderColor: "#6b7280",
  borderWidth: 2,
  padding: 20,
  borderRadius: 12,
};

export const Default: Story = {
  args: {
    config: defaultConfig,
  },
};

export const CustomMessage: Story = {
  args: {
    config: { ...defaultConfig, message: "Under Construction" },
  },
};

export const LargeFont: Story = {
  args: {
    config: { ...defaultConfig, fontSize: 36 },
  },
};

export const SmallFont: Story = {
  args: {
    config: { ...defaultConfig, fontSize: 16 },
  },
};

export const NoBorder: Story = {
  args: {
    config: { ...defaultConfig, borderWidth: 0 },
  },
};

export const ThickBorder: Story = {
  args: {
    config: { ...defaultConfig, borderWidth: 4 },
  },
};

export const RoundedCorners: Story = {
  args: {
    config: { ...defaultConfig, borderRadius: 24 },
  },
};

export const SquareCorners: Story = {
  args: {
    config: { ...defaultConfig, borderRadius: 0 },
  },
};

export const MinimalPadding: Story = {
  args: {
    config: { ...defaultConfig, padding: 8 },
  },
};

export const LargePadding: Story = {
  args: {
    config: { ...defaultConfig, padding: 40 },
  },
};

export const BlueTheme: Story = {
  args: {
    config: {
      ...defaultConfig,
      backgroundColor: "#1e40af",
      textColor: "#dbeafe",
      borderColor: "#3b82f6",
      message: "Feature in Development",
    },
  },
};

export const GreenTheme: Story = {
  args: {
    config: {
      ...defaultConfig,
      backgroundColor: "#166534",
      textColor: "#dcfce7",
      borderColor: "#22c55e",
      message: "Coming Soon!",
    },
  },
};

export const WarningTheme: Story = {
  args: {
    config: {
      ...defaultConfig,
      backgroundColor: "#92400e",
      textColor: "#fef3c7",
      borderColor: "#f59e0b",
      message: "Maintenance Mode",
    },
  },
};

export const ErrorTheme: Story = {
  args: {
    config: {
      ...defaultConfig,
      backgroundColor: "#991b1b",
      textColor: "#fef2f2",
      borderColor: "#ef4444",
      message: "Widget Unavailable",
    },
  },
};
