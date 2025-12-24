import type { Meta, StoryObj } from "storybook-solidjs-vite";
import ViewerCountWidget from "./ViewerCountWidget";

const meta = {
  title: "Widgets/ViewerCount",
  component: ViewerCountWidget,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ width: "400px", height: "200px" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ViewerCountWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultConfig = {
  display_style: "minimal" as const,
  font_size: "medium" as const,
  viewer_label: "Viewers",
  show_total: true,
  show_platforms: true,
  animation_enabled: true,
  icon_color: "#ef4444",
};

const sampleData = {
  total_viewers: 1234,
  platform_breakdown: {
    twitch: { viewers: 800, color: "bg-purple-600" },
    youtube: { viewers: 350, color: "bg-red-600" },
    kick: { viewers: 84, color: "bg-green-600" },
  },
};

export const MinimalStyle: Story = {
  args: {
    config: defaultConfig,
    data: sampleData,
  },
};

export const DetailedStyle: Story = {
  args: {
    config: { ...defaultConfig, display_style: "detailed" as const },
    data: sampleData,
  },
};

export const CardsStyle: Story = {
  args: {
    config: { ...defaultConfig, display_style: "cards" as const },
    data: sampleData,
  },
};

export const SmallFont: Story = {
  args: {
    config: { ...defaultConfig, font_size: "small" as const },
    data: sampleData,
  },
};

export const LargeFont: Story = {
  args: {
    config: { ...defaultConfig, font_size: "large" as const },
    data: sampleData,
  },
};

export const NoPlatforms: Story = {
  args: {
    config: { ...defaultConfig, show_platforms: false, display_style: "detailed" as const },
    data: sampleData,
  },
};

export const NoLabel: Story = {
  args: {
    config: { ...defaultConfig, viewer_label: "" },
    data: sampleData,
  },
};

export const NoAnimation: Story = {
  args: {
    config: { ...defaultConfig, animation_enabled: false },
    data: sampleData,
  },
};

export const CustomIconColor: Story = {
  args: {
    config: { ...defaultConfig, icon_color: "#10b981" },
    data: sampleData,
  },
};

export const HighViewerCount: Story = {
  args: {
    config: defaultConfig,
    data: {
      total_viewers: 50000,
      platform_breakdown: {
        twitch: { viewers: 30000, color: "bg-purple-600" },
        youtube: { viewers: 15000, color: "bg-red-600" },
        kick: { viewers: 5000, color: "bg-green-600" },
      },
    },
  },
};

export const LowViewerCount: Story = {
  args: {
    config: defaultConfig,
    data: {
      total_viewers: 12,
      platform_breakdown: {
        twitch: { viewers: 8, color: "bg-purple-600" },
        youtube: { viewers: 4, color: "bg-red-600" },
      },
    },
  },
};

export const SinglePlatform: Story = {
  args: {
    config: { ...defaultConfig, display_style: "detailed" as const },
    data: {
      total_viewers: 500,
      platform_breakdown: {
        twitch: { viewers: 500, color: "bg-purple-600" },
      },
    },
  },
};

export const Loading: Story = {
  args: {
    config: defaultConfig,
    data: null,
  },
};
