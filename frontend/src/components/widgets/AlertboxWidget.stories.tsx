import type { Meta, StoryObj } from "storybook-solidjs-vite";
import AlertboxWidget from "./AlertboxWidget";

const meta = {
  title: "Widgets/Alertbox",
  component: AlertboxWidget,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    config: { control: "object" },
    event: { control: "object" },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "500px", height: "400px" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AlertboxWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultConfig = {
  animationType: "fade" as const,
  displayDuration: 5,
  soundEnabled: false,
  soundVolume: 75,
  showMessage: true,
  showAmount: true,
  fontSize: "medium" as const,
  alertPosition: "center" as const,
};

export const Donation: Story = {
  args: {
    config: defaultConfig,
    event: {
      id: "1",
      type: "donation",
      username: "GenerousViewer",
      message: "Great stream! Keep it up!",
      amount: 25,
      currency: "$",
      timestamp: new Date(),
      platform: { icon: "twitch", color: "bg-purple-600" },
    },
  },
};

export const Follow: Story = {
  args: {
    config: defaultConfig,
    event: {
      id: "2",
      type: "follow",
      username: "NewFollower",
      timestamp: new Date(),
      platform: { icon: "youtube", color: "bg-red-600" },
    },
  },
};

export const Subscription: Story = {
  args: {
    config: defaultConfig,
    event: {
      id: "3",
      type: "subscription",
      username: "LoyalSubscriber",
      message: "Happy to support!",
      timestamp: new Date(),
      platform: { icon: "twitch", color: "bg-purple-600" },
    },
  },
};

export const Raid: Story = {
  args: {
    config: defaultConfig,
    event: {
      id: "4",
      type: "raid",
      username: "BigStreamer",
      message: "Raiding with 150 viewers!",
      timestamp: new Date(),
      platform: { icon: "twitch", color: "bg-purple-600" },
    },
  },
};

export const LargeDonation: Story = {
  args: {
    config: { ...defaultConfig, fontSize: "large" as const },
    event: {
      id: "5",
      type: "donation",
      username: "WhaleViewer",
      message: "This is for you!",
      amount: 500,
      currency: "$",
      timestamp: new Date(),
      platform: { icon: "twitch", color: "bg-purple-600" },
    },
  },
};

export const NoEvent: Story = {
  args: {
    config: defaultConfig,
    event: null,
  },
};
