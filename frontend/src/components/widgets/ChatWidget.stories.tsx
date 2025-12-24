import type { Meta, StoryObj } from "storybook-solidjs-vite";
import ChatWidget from "./ChatWidget";

const meta = {
  title: "Widgets/Chat",
  component: ChatWidget,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ width: "400px", height: "500px", background: "rgba(0,0,0,0.5)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChatWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultConfig = {
  fontSize: "medium" as const,
  showTimestamps: true,
  showBadges: true,
  showPlatform: true,
  showEmotes: true,
  maxMessages: 15,
};

const sampleMessages = [
  {
    id: "1",
    username: "GamerPro",
    content: "Hello everyone! PogChamp",
    timestamp: new Date(),
    platform: { icon: "twitch", color: "bg-purple-600" },
    badge: "MOD",
    badgeColor: "bg-green-600 text-white",
    usernameColor: "#ff6b6b",
  },
  {
    id: "2",
    username: "StreamFan",
    content: "Great stream today!",
    timestamp: new Date(),
    platform: { icon: "youtube", color: "bg-red-600" },
    usernameColor: "#4ecdc4",
  },
  {
    id: "3",
    username: "CoolViewer",
    content: "LUL that was hilarious",
    timestamp: new Date(),
    platform: { icon: "twitch", color: "bg-purple-600" },
    badge: "VIP",
    badgeColor: "bg-pink-600 text-white",
    usernameColor: "#45b7d1",
  },
  {
    id: "4",
    username: "HappyDonator",
    content: "First time here, loving it!",
    timestamp: new Date(),
    platform: { icon: "kick", color: "bg-green-600" },
    usernameColor: "#96ceb4",
  },
  {
    id: "5",
    username: "EpicGamer",
    content: "Let's gooo!",
    timestamp: new Date(),
    platform: { icon: "twitch", color: "bg-purple-600" },
    badge: "SUB",
    badgeColor: "bg-purple-600 text-white",
    usernameColor: "#feca57",
  },
];

export const Default: Story = {
  args: {
    config: defaultConfig,
    messages: sampleMessages,
  },
};

export const SmallFont: Story = {
  args: {
    config: { ...defaultConfig, fontSize: "small" as const },
    messages: sampleMessages,
  },
};

export const LargeFont: Story = {
  args: {
    config: { ...defaultConfig, fontSize: "large" as const },
    messages: sampleMessages,
  },
};

export const NoBadges: Story = {
  args: {
    config: { ...defaultConfig, showBadges: false },
    messages: sampleMessages,
  },
};

export const NoTimestamps: Story = {
  args: {
    config: { ...defaultConfig, showTimestamps: false },
    messages: sampleMessages,
  },
};

export const MinimalView: Story = {
  args: {
    config: {
      ...defaultConfig,
      showTimestamps: false,
      showBadges: false,
      showPlatform: false,
    },
    messages: sampleMessages,
  },
};

export const Empty: Story = {
  args: {
    config: defaultConfig,
    messages: [],
  },
};
