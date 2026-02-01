import { createSignal, onCleanup, onMount } from "solid-js";
import type { Meta, StoryObj } from "storybook-solidjs-vite";
import StreamControlsWidget, { type Platform } from "./StreamControlsWidget";
import { LiveStreamControlCenter } from "./stream/LiveStreamControlCenter";
import { PostStreamSummary } from "./stream/PostStreamSummary";
import { PreStreamSettings } from "./stream/PreStreamSettings";
import type {
  ActivityItem,
  ModerationCallbacks,
  StreamMetadata,
  StreamSummary,
  StreamTimer,
} from "./stream/types";

const meta = {
  title: "Components/StreamControlsWidget",
  component: StreamControlsWidget,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ width: "500px", height: "600px" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StreamControlsWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

// =====================================================
// Sample Data
// =====================================================

const sampleMetadata: StreamMetadata = {
  title: "Epic Gaming Session!",
  description:
    "Join me for an amazing gaming session where we explore new worlds and have fun!",
  category: "Gaming",
  tags: ["gaming", "fun", "interactive"],
};

const sampleStreamKeyData = {
  rtmpsUrl: "rtmps://live.cloudflare.com:443/live",
  rtmpsStreamKey: "example-stream-key-for-storybook",
  srtUrl: "srt://live.cloudflare.com:778?streamid=example",
};

// Generate many activities to test scrolling and virtualization
// Activities are generated in chronological order (oldest first, newest last)
const generateActivities = (count: number): ActivityItem[] => {
  const types: ActivityItem["type"][] = [
    "chat",
    "chat",
    "chat",
    "donation",
    "follow",
    "subscription",
    "raid",
    "cheer",
  ];
  const platforms = ["twitch", "youtube", "kick", "facebook"];
  const usernames = [
    "StreamFan",
    "GamerPro",
    "ChattyKathy",
    "ViewerOne",
    "SuperDonor",
    "TwitchLover",
    "YouTubeFan",
    "KickUser",
  ];
  const messages = [
    "Great stream!",
    "Hello everyone!",
    "This is amazing!",
    "Keep up the good work!",
    "Love this content!",
    "First time here, loving it!",
    "Can you play that song again?",
    "What's your setup?",
    "GG!",
    "Poggers!",
  ];

  // Generate activities from oldest to newest (newest events at end of array)
  return Array.from({ length: count }, (_, i) => {
    const type = types[Math.floor(Math.random() * types.length)];
    const isMonetary = ["donation", "cheer"].includes(type);
    // Oldest events first: subtract more time for lower indices
    const ageMs = (count - 1 - i) * 15000; // i=0 is oldest, i=count-1 is newest
    return {
      id: `activity-${i}`,
      type,
      username: `${usernames[Math.floor(Math.random() * usernames.length)]}${i}`,
      message:
        type !== "follow"
          ? messages[Math.floor(Math.random() * messages.length)]
          : undefined,
      amount: isMonetary ? Math.floor(Math.random() * 100) + 1 : undefined,
      currency: isMonetary ? "$" : undefined,
      platform: platforms[Math.floor(Math.random() * platforms.length)],
      timestamp: new Date(Date.now() - ageMs),
      isImportant: ["donation", "raid", "subscription", "cheer"].includes(type),
    };
  });
};

const sampleActivities: ActivityItem[] = [
  {
    id: "1",
    type: "donation",
    username: "GenerousDonor",
    message: "Great stream! Keep it up!",
    amount: 25.0,
    currency: "$",
    platform: "twitch",
    timestamp: new Date(),
    isImportant: true,
  },
  {
    id: "2",
    type: "chat",
    username: "ChatterBox",
    message: "Hello everyone! Excited to be here!",
    platform: "youtube",
    timestamp: new Date(Date.now() - 30000),
  },
  {
    id: "3",
    type: "follow",
    username: "NewFollower123",
    platform: "twitch",
    timestamp: new Date(Date.now() - 60000),
  },
  {
    id: "4",
    type: "subscription",
    username: "LoyalSubscriber",
    message: "6 months strong!",
    platform: "twitch",
    timestamp: new Date(Date.now() - 90000),
    isImportant: true,
  },
  {
    id: "5",
    type: "chat",
    username: "QuestionAsker",
    message: "What game are you playing next?",
    platform: "kick",
    timestamp: new Date(Date.now() - 120000),
  },
  {
    id: "6",
    type: "raid",
    username: "RaidLeader",
    message: "Incoming with 150 viewers!",
    platform: "twitch",
    timestamp: new Date(Date.now() - 150000),
    isImportant: true,
  },
  {
    id: "7",
    type: "chat",
    username: "ActiveViewer",
    message: "This is so entertaining!",
    platform: "youtube",
    timestamp: new Date(Date.now() - 180000),
  },
  {
    id: "8",
    type: "donation",
    username: "BigTipper",
    message: "Amazing content!",
    amount: 100.0,
    currency: "$",
    platform: "kick",
    timestamp: new Date(Date.now() - 210000),
    isImportant: true,
  },
  {
    id: "9",
    type: "chat",
    username: "RegularViewer",
    message: "Love your streams!",
    platform: "facebook",
    timestamp: new Date(Date.now() - 240000),
  },
  {
    id: "10",
    type: "cheer",
    username: "CheerMaster",
    message: "Cheer100 Let's go!",
    amount: 1.0,
    currency: "$",
    platform: "twitch",
    timestamp: new Date(Date.now() - 270000),
  },
];

// Many activities for scrolling test
const manyActivities = generateActivities(30);

const sampleSummary: StreamSummary = {
  duration: 7200, // 2 hours
  peakViewers: 1250,
  averageViewers: 850,
  totalMessages: 4532,
  totalDonations: 23,
  donationAmount: 342.5,
  newFollowers: 156,
  newSubscribers: 12,
  raids: 3,
  endedAt: new Date(Date.now() - 300000), // 5 minutes ago
};

// =====================================================
// Pre-Stream Stories
// =====================================================

export const PreStream: Story = {
  args: {
    phase: "pre-stream",
    metadata: sampleMetadata,
    onMetadataChange: (metadata: StreamMetadata) =>
      console.log("Metadata changed:", metadata),
    streamKeyData: sampleStreamKeyData,
    showStreamKey: false,
    onShowStreamKey: () => console.log("Toggle stream key"),
    isLoadingStreamKey: false,
    copied: false,
    onCopyStreamKey: () => console.log("Copy stream key"),
  },
};

export const PreStreamEmpty: Story = {
  args: {
    phase: "pre-stream",
    metadata: {
      title: "",
      description: "",
      category: "",
      tags: [],
    },
    onMetadataChange: (metadata: StreamMetadata) =>
      console.log("Metadata changed:", metadata),
    showStreamKey: false,
  },
};

export const PreStreamWithKeyVisible: Story = {
  args: {
    phase: "pre-stream",
    metadata: sampleMetadata,
    onMetadataChange: (metadata: StreamMetadata) =>
      console.log("Metadata changed:", metadata),
    streamKeyData: sampleStreamKeyData,
    showStreamKey: true,
    isLoadingStreamKey: false,
    copied: false,
    onCopyStreamKey: () => console.log("Copy stream key"),
  },
};

export const PreStreamKeyLoading: Story = {
  args: {
    phase: "pre-stream",
    metadata: sampleMetadata,
    onMetadataChange: (metadata: StreamMetadata) =>
      console.log("Metadata changed:", metadata),
    showStreamKey: true,
    isLoadingStreamKey: true,
  },
};

// =====================================================
// Live Stream Stories
// =====================================================

const handleSendMessage = (message: string, platforms: Platform[]) => {
  console.log(`Sending message to ${platforms.join(", ")}: ${message}`);
};

// Stream action handlers for Storybook
const handleStartPoll = (data: {
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  duration: number;
  allowMultipleVotes: boolean;
}) => console.log("Start poll with data:", data);
const handleStartGiveaway = (data: {
  title: string;
  description: string;
  keyword: string;
  duration: number;
  subscriberMultiplier: number;
  subscriberOnly: boolean;
}) => console.log("Start giveaway with data:", data);
const handleModifyTimers = () => console.log("Modify timers clicked");
const handleChangeStreamSettings = () =>
  console.log("Change stream settings clicked");

// Helper to create reactive moderation callbacks with highlight state
function createModerationCallbacks(): {
  callbacks: ModerationCallbacks;
  highlightedMessageId: () => string | undefined;
} {
  const [highlightedMessageId, setHighlightedMessageId] = createSignal<
    string | undefined
  >(undefined);

  const callbacks: ModerationCallbacks = {
    onReplayEvent: (eventId) => {
      console.log(`Replay event: ${eventId}`);
    },
    onBanUser: (userId, platform, _viewerPlatformId, username) => {
      console.log(`Ban user: ${username} (${userId}) on ${platform}`);
    },
    onTimeoutUser: (
      _userId,
      _platform,
      _viewerPlatformId,
      username,
      durationSeconds,
    ) => {
      const durationLabel =
        durationSeconds >= 3600
          ? `${Math.floor(durationSeconds / 3600)}h`
          : `${Math.floor(durationSeconds / 60)}m`;
      console.log(`Timeout user: ${username} for ${durationLabel}`);
    },
    onDeleteMessage: (eventId) => {
      console.log(`Delete message: ${eventId}`);
    },
    onHighlightMessage: (item) => {
      console.log(`Highlight message: ${item.id} - "${item.message}"`);
      setHighlightedMessageId(item.id);
    },
    onClearHighlight: () => {
      console.log("Clear highlight");
      setHighlightedMessageId(undefined);
    },
    get highlightedMessageId() {
      return highlightedMessageId();
    },
  };

  return { callbacks, highlightedMessageId };
}

// Wrapper for Live story with reactive highlight state
function LiveWrapper() {
  const { callbacks } = createModerationCallbacks();
  return (
    <StreamControlsWidget
      activities={manyActivities}
      connectedPlatforms={["twitch", "youtube", "kick"]}
      moderationCallbacks={callbacks}
      onChangeStreamSettings={handleChangeStreamSettings}
      onModifyTimers={handleModifyTimers}
      onSendMessage={handleSendMessage}
      onStartGiveaway={handleStartGiveaway}
      onStartPoll={handleStartPoll}
      phase="live"
      stickyDuration={30000}
      streamDuration={3723}
      viewerCount={1024}
    />
  );
}

export const Live: Story = {
  render: () => <LiveWrapper />,
  args: { phase: "live" },
};

// Wrapper for LiveEmpty story with reactive highlight state
function LiveEmptyWrapper() {
  const { callbacks } = createModerationCallbacks();
  return (
    <StreamControlsWidget
      activities={[]}
      connectedPlatforms={["twitch"]}
      moderationCallbacks={callbacks}
      onChangeStreamSettings={handleChangeStreamSettings}
      onModifyTimers={handleModifyTimers}
      onSendMessage={handleSendMessage}
      onStartGiveaway={handleStartGiveaway}
      onStartPoll={handleStartPoll}
      phase="live"
      streamDuration={60}
      viewerCount={5}
    />
  );
}

export const LiveEmpty: Story = {
  render: () => <LiveEmptyWrapper />,
  args: {
    phase: "live",
  },
};

// Wrapper for LiveBusy story with reactive highlight state
function LiveBusyWrapper() {
  const { callbacks } = createModerationCallbacks();
  const [activities] = createSignal(generateActivities(50));
  return (
    <StreamControlsWidget
      activities={activities()}
      connectedPlatforms={["twitch", "youtube", "kick", "facebook"]}
      moderationCallbacks={callbacks}
      onChangeStreamSettings={handleChangeStreamSettings}
      onModifyTimers={handleModifyTimers}
      onSendMessage={handleSendMessage}
      onStartGiveaway={handleStartGiveaway}
      onStartPoll={handleStartPoll}
      phase="live"
      stickyDuration={30000}
      streamDuration={10800}
      viewerCount={5000}
    />
  );
}

export const LiveBusy: Story = {
  render: () => <LiveBusyWrapper />,
  args: { phase: "live" },
};

// Wrapper for LiveVirtualized story with reactive highlight state
function LiveVirtualizedWrapper() {
  const { callbacks } = createModerationCallbacks();
  const [activities] = createSignal(generateActivities(1000));
  return (
    <StreamControlsWidget
      activities={activities()}
      connectedPlatforms={["twitch", "youtube", "kick", "facebook"]}
      moderationCallbacks={callbacks}
      onChangeStreamSettings={handleChangeStreamSettings}
      onModifyTimers={handleModifyTimers}
      onSendMessage={handleSendMessage}
      onStartGiveaway={handleStartGiveaway}
      onStartPoll={handleStartPoll}
      phase="live"
      stickyDuration={30000}
      streamDuration={36000}
      viewerCount={15000}
    />
  );
}

// Story with 1000+ events to test virtualization performance
export const LiveVirtualized: Story = {
  render: () => <LiveVirtualizedWrapper />,
  args: { phase: "live" },
};

// Wrapper for LiveChatOnly story with reactive highlight state
function LiveChatOnlyWrapper() {
  const { callbacks } = createModerationCallbacks();
  const chatOnlyActivities = sampleActivities.filter((a) => a.type === "chat");
  return (
    <StreamControlsWidget
      activities={chatOnlyActivities}
      connectedPlatforms={["twitch", "youtube"]}
      moderationCallbacks={callbacks}
      onChangeStreamSettings={handleChangeStreamSettings}
      onModifyTimers={handleModifyTimers}
      onSendMessage={handleSendMessage}
      onStartGiveaway={handleStartGiveaway}
      onStartPoll={handleStartPoll}
      phase="live"
      stickyDuration={30000}
      streamDuration={1800}
      viewerCount={150}
    />
  );
}

export const LiveChatOnly: Story = {
  render: () => <LiveChatOnlyWrapper />,
  args: { phase: "live" },
};

// Wrapper for LiveManyDonations story with reactive highlight state
function LiveManyDonationsWrapper() {
  const { callbacks } = createModerationCallbacks();
  const donationActivities: ActivityItem[] = [
    {
      id: "d1",
      type: "donation" as const,
      username: "BigSpender1",
      message: "Amazing stream!",
      amount: 500.0,
      currency: "$",
      platform: "twitch",
      timestamp: new Date(),
      isImportant: true,
    },
    {
      id: "d2",
      type: "donation" as const,
      username: "Generous2",
      message: "Keep up the great work!",
      amount: 250.0,
      currency: "$",
      platform: "youtube",
      timestamp: new Date(Date.now() - 30000),
      isImportant: true,
    },
    {
      id: "d3",
      type: "donation" as const,
      username: "Supporter3",
      message: "Love your content!",
      amount: 100.0,
      currency: "$",
      platform: "kick",
      timestamp: new Date(Date.now() - 60000),
      isImportant: true,
    },
    ...generateActivities(20),
  ];
  return (
    <StreamControlsWidget
      activities={donationActivities}
      connectedPlatforms={["twitch", "youtube", "kick"]}
      moderationCallbacks={callbacks}
      onChangeStreamSettings={handleChangeStreamSettings}
      onModifyTimers={handleModifyTimers}
      onSendMessage={handleSendMessage}
      onStartGiveaway={handleStartGiveaway}
      onStartPoll={handleStartPoll}
      phase="live"
      stickyDuration={30000}
      streamDuration={2400}
      viewerCount={2500}
    />
  );
}

export const LiveManyDonations: Story = {
  render: () => <LiveManyDonationsWrapper />,
  args: { phase: "live" },
};

// =====================================================
// Post-Stream Stories
// =====================================================

export const PostStream: Story = {
  args: {
    phase: "post-stream",
    summary: sampleSummary,
    onStartNewStream: () => console.log("Start new stream"),
  },
};

export const PostStreamShort: Story = {
  args: {
    phase: "post-stream",
    summary: {
      duration: 900, // 15 minutes
      peakViewers: 50,
      averageViewers: 25,
      totalMessages: 120,
      totalDonations: 2,
      donationAmount: 15.0,
      newFollowers: 8,
      newSubscribers: 1,
      raids: 0,
      endedAt: new Date(Date.now() - 120000), // 2 minutes ago
    },
    onStartNewStream: () => console.log("Start new stream"),
  },
};

export const PostStreamSuccessful: Story = {
  args: {
    phase: "post-stream",
    summary: {
      duration: 14400, // 4 hours
      peakViewers: 10000,
      averageViewers: 7500,
      totalMessages: 25000,
      totalDonations: 150,
      donationAmount: 2500.0,
      newFollowers: 1200,
      newSubscribers: 85,
      raids: 8,
      endedAt: new Date(Date.now() - 180000), // 3 minutes ago
    },
    onStartNewStream: () => console.log("Start new stream"),
  },
};

// =====================================================
// Interactive Stories
// =====================================================

function InteractivePreStreamWrapper() {
  const [metadata, setMetadata] = createSignal<StreamMetadata>({
    title: "",
    description: "",
    category: "",
    tags: [],
  });
  const [showKey, setShowKey] = createSignal(false);
  const [copied, setCopied] = createSignal(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <StreamControlsWidget
      copied={copied()}
      metadata={metadata()}
      onCopyStreamKey={handleCopy}
      onMetadataChange={setMetadata}
      onShowStreamKey={() => setShowKey(!showKey())}
      phase="pre-stream"
      showStreamKey={showKey()}
      streamKeyData={sampleStreamKeyData}
    />
  );
}

export const InteractivePreStream: Story = {
  render: () => <InteractivePreStreamWrapper />,
  args: {
    phase: "pre-stream",
  },
};

function InteractiveLiveWrapper() {
  const [activities, setActivities] = createSignal<ActivityItem[]>(
    generateActivities(15),
  );
  const [duration, setDuration] = createSignal(0);
  const [viewers, setViewers] = createSignal(100);

  // Use onMount to set up intervals properly in SolidJS
  onMount(() => {
    // Simulate stream timer
    const timerInterval = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);

    // Simulate random activity - 1 event per second, added at the END (newest at bottom)
    const activityInterval = setInterval(() => {
      const types: ActivityItem["type"][] = [
        "chat",
        "chat",
        "chat",
        "follow",
        "donation",
      ];
      const type = types[Math.floor(Math.random() * types.length)];
      const newActivity: ActivityItem = {
        id: `sim-${Date.now()}`,
        type,
        username: `User${Math.floor(Math.random() * 1000)}`,
        message:
          type === "chat"
            ? "Random chat message!"
            : type === "donation"
              ? "Thanks for the stream!"
              : undefined,
        amount:
          type === "donation" ? Math.floor(Math.random() * 50) + 1 : undefined,
        currency: "$",
        platform: ["twitch", "youtube", "kick"][Math.floor(Math.random() * 3)],
        timestamp: new Date(),
        isImportant: type === "donation",
      };
      // Append to end (newest events at bottom)
      setActivities((a) => [...a, newActivity].slice(-100));
      setViewers((v) => Math.max(0, v + Math.floor(Math.random() * 10) - 3));
    }, 333); // 3 events per second

    // Cleanup intervals when component unmounts
    onCleanup(() => {
      clearInterval(timerInterval);
      clearInterval(activityInterval);
    });
  });

  const handleSendMessage = (message: string, platforms: Platform[]) => {
    // Add the sent message to the activity feed (at the end, since it's newest)
    const newActivity: ActivityItem = {
      id: `sent-${Date.now()}`,
      type: "chat",
      username: "Streamer (You)",
      message: message,
      platform: platforms[0] || "twitch",
      timestamp: new Date(),
    };
    // Append to end (newest events at bottom)
    setActivities((a) => [...a, newActivity].slice(-1000));
    console.log(`Message sent to ${platforms.join(", ")}: ${message}`);
  };

  const { callbacks } = createModerationCallbacks();

  return (
    <StreamControlsWidget
      activities={activities()}
      connectedPlatforms={["twitch", "youtube", "kick"]}
      moderationCallbacks={callbacks}
      onSendMessage={handleSendMessage}
      phase="live"
      stickyDuration={15000}
      streamDuration={duration()}
      viewerCount={viewers()}
    />
  );
}

export const InteractiveLive: Story = {
  render: () => <InteractiveLiveWrapper />,
  args: {
    phase: "live",
  },
};

// Story specifically for testing sticky event behavior
function StickyTestWrapper() {
  // Generate activities fresh on each render with current timestamps
  const generateStickyTestActivities = (): ActivityItem[] => {
    const now = Date.now();
    return [
      // Old chat messages (not sticky)
      ...Array.from({ length: 20 }, (_, i) => ({
        id: `chat-${i}`,
        type: "chat" as const,
        username: `Chatter${i}`,
        message: `Old chat message ${i}`,
        platform: "twitch",
        timestamp: new Date(now - (25 - i) * 60000), // 25-5 minutes ago
      })),
      // 3 recent donations (should be sticky - within 2 minute window)
      {
        id: "donation-1",
        type: "donation" as const,
        username: "StickyDonor1",
        message: "First sticky donation!",
        amount: 50,
        currency: "$",
        platform: "twitch",
        timestamp: new Date(now - 90000), // 1.5 min ago - should be sticky
        isImportant: true,
      },
      {
        id: "donation-2",
        type: "donation" as const,
        username: "StickyDonor2",
        message: "Second sticky donation!",
        amount: 100,
        currency: "$",
        platform: "youtube",
        timestamp: new Date(now - 60000), // 1 min ago - should be sticky
        isImportant: true,
      },
      {
        id: "donation-3",
        type: "donation" as const,
        username: "StickyDonor3",
        message: "Third sticky donation!",
        amount: 25,
        currency: "$",
        platform: "kick",
        timestamp: new Date(now - 30000), // 30 sec ago - should be sticky
        isImportant: true,
      },
      // Recent chat messages (not sticky, below the donations)
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `recent-chat-${i}`,
        type: "chat" as const,
        username: `RecentChatter${i}`,
        message: `Recent chat message ${i}`,
        platform: "youtube",
        timestamp: new Date(now - (10 - i) * 1000), // Last 10 seconds
      })),
    ];
  };

  // Use createSignal to store activities - generates fresh on component mount
  const [activities] = createSignal(generateStickyTestActivities());
  const { callbacks } = createModerationCallbacks();

  return (
    <StreamControlsWidget
      activities={activities()}
      connectedPlatforms={["twitch", "youtube", "kick"]}
      moderationCallbacks={callbacks}
      onSendMessage={(msg, platforms) =>
        console.log(`Send to ${platforms}: ${msg}`)
      }
      phase="live"
      stickyDuration={120000}
      streamDuration={300}
      viewerCount={500}
    />
  );
}

export const StickyEventsTest: Story = {
  render: () => <StickyTestWrapper />,
  args: {
    phase: "live",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Test story for verifying sticky donation events. The 3 donations should have yellow/amber backgrounds and stick to the top when scrolling.",
      },
    },
  },
};

// =====================================================
// Interactive Highlight Test Story
// =====================================================

function InteractiveHighlightWrapper() {
  // Generate many chat messages for testing scrolling and sticky behavior
  const generateHighlightTestActivities = (): ActivityItem[] => {
    const now = Date.now();
    const platforms = ["twitch", "youtube", "kick", "facebook"];
    const usernames = [
      "SuperFan",
      "QuestionAsker",
      "FunnyGuy",
      "NewViewer",
      "RegularChatter",
      "MemeLord",
      "TechExpert",
      "GamerPro",
      "StreamLover",
      "ChattyKathy",
      "SilentWatcher",
      "HypeMan",
      "CoolDude",
      "NightOwl",
      "EarlyBird",
    ];
    const messages = [
      "This is an amazing stream! I love your content so much!",
      "What game are you playing next week?",
      "LOL that was hilarious! 😂",
      "First time here, this is great!",
      "I've been watching for 2 years now!",
      "PogChamp moment right there!",
      "What's your streaming setup? Looks professional!",
      "Can you explain that again?",
      "GG! That was insane!",
      "Hello from Germany! 🇩🇪",
      "Love the vibes here",
      "When is the next stream?",
      "That play was so clean!",
      "Can we get a shoutout?",
      "Best streamer ever!",
      "How long have you been streaming?",
      "The audio quality is perfect",
      "Nice background music!",
      "Greetings from Australia! 🇦🇺",
      "This community is so friendly",
      "Can you do a tutorial?",
      "What's your favorite game?",
      "The graphics look amazing!",
      "I just subscribed!",
      "Keep up the great work!",
    ];

    const activities: ActivityItem[] = [];

    // Generate 25 chat messages spread over time
    for (let i = 0; i < 25; i++) {
      activities.push({
        id: `highlight-chat-${i + 1}`,
        type: "chat" as const,
        username: usernames[i % usernames.length],
        message: messages[i % messages.length],
        platform: platforms[i % platforms.length],
        timestamp: new Date(now - (25 - i) * 5000), // 5 seconds apart
        viewerId: `viewer-${i + 1}`,
        viewerPlatformId: `${platforms[i % platforms.length]}-${i + 100}`,
      });

      // Add a donation every 8 messages to test that highlight doesn't appear on donations
      if (i > 0 && i % 8 === 0) {
        activities.push({
          id: `highlight-donation-${Math.floor(i / 8)}`,
          type: "donation" as const,
          username: `Donor${Math.floor(i / 8)}`,
          message: "Supporting the stream!",
          amount: Math.floor(Math.random() * 100) + 5,
          currency: "$",
          platform: platforms[i % platforms.length],
          timestamp: new Date(now - (25 - i) * 5000 + 1000),
          isImportant: true,
          viewerId: `donor-${Math.floor(i / 8)}`,
          viewerPlatformId: `${platforms[i % platforms.length]}-donor-${i}`,
        });
      }
    }

    return activities;
  };

  const [activities] = createSignal(generateHighlightTestActivities());
  const [highlightedMessageId, setHighlightedMessageId] = createSignal<
    string | undefined
  >(undefined);

  // Create moderation callbacks with working highlight functionality
  const highlightCallbacks: ModerationCallbacks = {
    onReplayEvent: (eventId) => {
      console.log(`Replay event: ${eventId}`);
    },
    onBanUser: (userId, platform, _viewerPlatformId, username) => {
      console.log(`Ban user: ${username} (${userId}) on ${platform}`);
    },
    onTimeoutUser: (
      _userId,
      _platform,
      _viewerPlatformId,
      username,
      durationSeconds,
    ) => {
      const durationLabel =
        durationSeconds >= 3600
          ? `${Math.floor(durationSeconds / 3600)}h`
          : `${Math.floor(durationSeconds / 60)}m`;
      console.log(`Timeout user: ${username} for ${durationLabel}`);
    },
    onDeleteMessage: (eventId) => {
      console.log(`Delete message: ${eventId}`);
    },
    onHighlightMessage: (item) => {
      console.log(`Highlight message: ${item.id} - "${item.message}"`);
      setHighlightedMessageId(item.id);
    },
    onClearHighlight: () => {
      console.log("Clear highlight");
      setHighlightedMessageId(undefined);
    },
    get highlightedMessageId() {
      return highlightedMessageId();
    },
  };

  return (
    <div class="flex h-full flex-col gap-2 overflow-hidden">
      <div class="shrink-0 rounded bg-blue-50 p-2 text-blue-800 text-xs">
        <strong>Instructions:</strong> Hover over chat messages and click ☆ to
        highlight. Click ★ to unhighlight.
        <strong class="ml-2">Highlighted:</strong>{" "}
        {highlightedMessageId() || "None"}
      </div>
      <div class="min-h-0 flex-1">
        <StreamControlsWidget
          activities={activities()}
          connectedPlatforms={["twitch", "youtube", "kick"]}
          moderationCallbacks={highlightCallbacks}
          onSendMessage={(msg, platforms) =>
            console.log(`Send to ${platforms}: ${msg}`)
          }
          phase="live"
          stickyDuration={120000}
          streamDuration={3600}
          viewerCount={500}
        />
      </div>
    </div>
  );
}

export const InteractiveHighlightTest: Story = {
  render: () => <InteractiveHighlightWrapper />,
  args: {
    phase: "live",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Interactive test for message highlighting. Hover over chat messages to see the highlight button (☆). Click to highlight - the message turns purple and sticks to the top. Click the filled star (★) to unhighlight. Note: Only chat messages can be highlighted, not donations or other events.",
      },
    },
  },
};

// =====================================================
// Filter Test Story
// =====================================================

// Generate diverse activities for filter testing
const generateFilterTestActivities = (): ActivityItem[] => {
  const now = Date.now();
  return [
    // Chat messages with searchable content
    {
      id: "chat-1",
      type: "chat" as const,
      username: "ChatFan",
      message: "Great stream! Love the content!",
      platform: "twitch",
      timestamp: new Date(now - 300000),
    },
    {
      id: "chat-2",
      type: "chat" as const,
      username: "ViewerAlice",
      message: "Hello everyone!",
      platform: "youtube",
      timestamp: new Date(now - 280000),
    },
    {
      id: "chat-3",
      type: "chat" as const,
      username: "GamerBob",
      message: "What game is this?",
      platform: "kick",
      timestamp: new Date(now - 260000),
    },
    // Donations
    {
      id: "donation-1",
      type: "donation" as const,
      username: "GenerousDonor",
      message: "Keep up the amazing work!",
      amount: 50,
      currency: "$",
      platform: "twitch",
      timestamp: new Date(now - 240000),
      isImportant: true,
    },
    {
      id: "donation-2",
      type: "donation" as const,
      username: "BigTipper",
      message: "Love your streams!",
      amount: 100,
      currency: "$",
      platform: "youtube",
      timestamp: new Date(now - 220000),
      isImportant: true,
    },
    // Follows
    {
      id: "follow-1",
      type: "follow" as const,
      username: "NewFollower123",
      platform: "twitch",
      timestamp: new Date(now - 200000),
    },
    {
      id: "follow-2",
      type: "follow" as const,
      username: "StreamLover",
      platform: "kick",
      timestamp: new Date(now - 180000),
    },
    // Subscriptions
    {
      id: "sub-1",
      type: "subscription" as const,
      username: "LoyalSub",
      message: "6 months strong!",
      platform: "twitch",
      timestamp: new Date(now - 160000),
      isImportant: true,
    },
    // Raids
    {
      id: "raid-1",
      type: "raid" as const,
      username: "RaidLeader",
      message: "Incoming with 200 viewers!",
      platform: "twitch",
      timestamp: new Date(now - 140000),
      isImportant: true,
    },
    // Cheers
    {
      id: "cheer-1",
      type: "cheer" as const,
      username: "CheerMaster",
      message: "Cheer500 Let's go!",
      amount: 5,
      currency: "$",
      platform: "twitch",
      timestamp: new Date(now - 120000),
      isImportant: true,
    },
    // More recent chats
    {
      id: "chat-4",
      type: "chat" as const,
      username: "ChatFan",
      message: "Thanks for answering my question!",
      platform: "twitch",
      timestamp: new Date(now - 100000),
    },
    {
      id: "chat-5",
      type: "chat" as const,
      username: "RandomViewer",
      message: "GG!",
      platform: "facebook",
      timestamp: new Date(now - 80000),
    },
  ];
};

// Wrapper for FilterTest story with reactive highlight state
function FilterTestWrapper() {
  const { callbacks } = createModerationCallbacks();
  const [activities] = createSignal(generateFilterTestActivities());
  return (
    <StreamControlsWidget
      activities={activities()}
      connectedPlatforms={["twitch", "youtube", "kick", "facebook"]}
      moderationCallbacks={callbacks}
      onSendMessage={handleSendMessage}
      phase="live"
      streamDuration={1800}
      viewerCount={500}
    />
  );
}

export const FilterTest: Story = {
  render: () => <FilterTestWrapper />,
  args: {
    phase: "live",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Test story for verifying event filtering. Use the filter button to filter by event type, or the search box to find events by username or message content. Try searching for 'ChatFan' or 'amazing' to test text filtering.",
      },
    },
  },
};

// =====================================================
// Moderation Actions Test Story
// =====================================================

// Generate activities with viewer info for moderation testing
const generateModerationTestActivities = (): ActivityItem[] => {
  const now = Date.now();
  return [
    // Chat messages with viewer info for moderation
    {
      id: "chat-mod-1",
      type: "chat" as const,
      username: "ToxicUser",
      message: "This is a test chat message that can be deleted",
      platform: "twitch",
      timestamp: new Date(now - 60000),
      viewerId: "viewer-123",
      viewerPlatformId: "twitch-user-123",
    },
    {
      id: "chat-mod-2",
      type: "chat" as const,
      username: "AnotherChatter",
      message: "Hello everyone! Hover over me to see moderation options.",
      platform: "youtube",
      timestamp: new Date(now - 50000),
      viewerId: "viewer-456",
      viewerPlatformId: "yt-user-456",
    },
    {
      id: "chat-mod-3",
      type: "chat" as const,
      username: "SpamBot",
      message: "Buy cheap stuff at spam.com!",
      platform: "kick",
      timestamp: new Date(now - 40000),
      viewerId: "viewer-789",
      viewerPlatformId: "kick-user-789",
    },
    // Important events with replay option
    {
      id: "donation-mod-1",
      type: "donation" as const,
      username: "GenerousDonor",
      message: "Hover to replay this donation alert!",
      amount: 50,
      currency: "$",
      platform: "twitch",
      timestamp: new Date(now - 30000),
      isImportant: true,
    },
    {
      id: "sub-mod-1",
      type: "subscription" as const,
      username: "LoyalSubscriber",
      message: "Hover to replay this sub alert!",
      platform: "twitch",
      timestamp: new Date(now - 20000),
      isImportant: true,
    },
    {
      id: "raid-mod-1",
      type: "raid" as const,
      username: "RaidLeader",
      message: "Hover to replay this raid alert!",
      platform: "twitch",
      timestamp: new Date(now - 10000),
      isImportant: true,
    },
    // More recent chat
    {
      id: "chat-mod-4",
      type: "chat" as const,
      username: "NiceViewer",
      message: "Great stream! Love the new moderation features!",
      platform: "twitch",
      timestamp: new Date(now - 5000),
      viewerId: "viewer-abc",
      viewerPlatformId: "twitch-user-abc",
    },
  ];
};

// Moderation callbacks with alerts for testing (more visible feedback)
const alertModerationCallbacks: ModerationCallbacks = {
  onReplayEvent: (eventId) => {
    console.log(`Replay event: ${eventId}`);
    alert(`Replaying alert for event: ${eventId}`);
  },
  onBanUser: (userId, platform, viewerPlatformId, username) => {
    console.log(`Ban user: ${username} (${userId}) on ${platform}`);
    alert(
      `Banning user: ${username} on ${platform}\nViewer ID: ${viewerPlatformId}`,
    );
  },
  onTimeoutUser: (
    _userId,
    platform,
    _viewerPlatformId,
    username,
    durationSeconds,
  ) => {
    const durationLabel =
      durationSeconds >= 3600
        ? `${Math.floor(durationSeconds / 3600)}h`
        : `${Math.floor(durationSeconds / 60)}m`;
    console.log(`Timeout user: ${username} for ${durationLabel}`);
    alert(`Timing out: ${username} for ${durationLabel} on ${platform}`);
  },
  onDeleteMessage: (eventId) => {
    console.log(`Delete message: ${eventId}`);
    alert(`Deleting message: ${eventId}`);
  },
};

export const ModerationActionsTest: Story = {
  args: {
    phase: "live",
    activities: generateModerationTestActivities(),
    streamDuration: 1800,
    viewerCount: 500,
    stickyDuration: 120000,
    connectedPlatforms: ["twitch", "youtube", "kick"],
    onSendMessage: handleSendMessage,
    moderationCallbacks: alertModerationCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Test story for moderation actions on hover. Hover over chat messages to see Ban, Timeout, and Delete options. Hover over important events (donations, subscriptions, raids) to see the Replay option.",
      },
    },
  },
};

// =====================================================
// Timer Panel Stories
// =====================================================

const sampleTimers: StreamTimer[] = [
  {
    id: "timer-1",
    label: "Social Links",
    content:
      "Follow me on Twitter @streamer! Join the Discord: discord.gg/stream",
    intervalSeconds: 300, // Every 5 minutes
    disabledAt: null,
  },
  {
    id: "timer-2",
    label: "Giveaway Reminder",
    content:
      "Don't forget to type !enter to join today's giveaway! Winner announced at the end of stream!",
    intervalSeconds: 600, // Every 10 minutes
    disabledAt: new Date().toISOString(),
  },
  {
    id: "timer-3",
    label: "Subscribe Reminder",
    content:
      "Enjoying the stream? Consider subscribing! Subs get custom emotes and ad-free viewing!",
    intervalSeconds: 900, // Every 15 minutes
    disabledAt: null,
  },
];

// Interactive timer story with state management
function InteractiveTimersWrapper() {
  const [timers] = createSignal<StreamTimer[]>(sampleTimers);
  const [activities] = createSignal<ActivityItem[]>(generateActivities(10));

  return (
    <StreamControlsWidget
      activities={activities()}
      connectedPlatforms={["twitch", "youtube"]}
      onChangeStreamSettings={handleChangeStreamSettings}
      onSendMessage={handleSendMessage}
      onStartGiveaway={handleStartGiveaway}
      onStartPoll={handleStartPoll}
      phase="live"
      streamDuration={1800}
      streamStartedAt={new Date(Date.now() - 1800000).toISOString()}
      timers={timers()}
      viewerCount={500}
    />
  );
}

export const WithTimers: Story = {
  render: () => <InteractiveTimersWrapper />,
  args: {
    phase: "live",
  },
  parameters: {
    docs: {
      description: {
        story:
          'Test story for the Timers panel. Click the "Actions" tab, then "Modify Timers" to open the timers panel. The timers are fully interactive - you can start, pause, reset, delete timers and add new ones. Click the back button to return to the Events view.',
      },
    },
  },
};

export const LiveWithTimers: Story = {
  args: {
    phase: "live",
    activities: manyActivities,
    streamDuration: 3723,
    viewerCount: 1024,
    stickyDuration: 30000,
    connectedPlatforms: ["twitch", "youtube", "kick"],
    onSendMessage: handleSendMessage,
    onStartPoll: handleStartPoll,
    onStartGiveaway: handleStartGiveaway,
    onChangeStreamSettings: handleChangeStreamSettings,
    timers: sampleTimers,
    onAddTimer: (label: string, content: string, minutes: number) =>
      console.log(
        `Add timer: ${label} with content "${content}" every ${minutes} minutes`,
      ),
    onStartTimer: (id: string) => console.log(`Start timer: ${id}`),
    onStopTimer: (id: string) => console.log(`Stop timer: ${id}`),
    onDeleteTimer: (id: string) => console.log(`Delete timer: ${id}`),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Live stream with pre-configured timers. Click "Actions" tab then "Modify Timers" to see the timers panel.',
      },
    },
  },
};

export const EmptyTimers: Story = {
  args: {
    phase: "live",
    activities: sampleActivities,
    streamDuration: 600,
    viewerCount: 100,
    connectedPlatforms: ["twitch"],
    onSendMessage: handleSendMessage,
    onStartPoll: handleStartPoll,
    onStartGiveaway: handleStartGiveaway,
    onChangeStreamSettings: handleChangeStreamSettings,
    timers: [],
    onAddTimer: (label: string, content: string, minutes: number) =>
      console.log(
        `Add timer: ${label} with content "${content}" for ${minutes} minutes`,
      ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Live stream with no timers configured. Click "Actions" tab then "Modify Timers" to see the empty state with the add timer button.',
      },
    },
  },
};

// =====================================================
// Individual Component Stories
// =====================================================

const _preStreamMeta = {
  title: "Components/StreamControlsWidget/PreStreamSettings",
  component: PreStreamSettings,
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: "500px",
          background: "white",
          padding: "24px",
          "border-radius": "16px",
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PreStreamSettings>;

const _liveMeta = {
  title: "Components/StreamControlsWidget/LiveStreamControlCenter",
  component: LiveStreamControlCenter,
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: "500px",
          height: "600px",
          background: "white",
          padding: "24px",
          "border-radius": "16px",
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LiveStreamControlCenter>;

const _postStreamMeta = {
  title: "Components/StreamControlsWidget/PostStreamSummary",
  component: PostStreamSummary,
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: "500px",
          background: "white",
          padding: "24px",
          "border-radius": "16px",
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PostStreamSummary>;

// =====================================================
// Stream Settings Story
// =====================================================

// Interactive stream settings story with state management
function InteractiveStreamSettingsWrapper() {
  const [activities] = createSignal<ActivityItem[]>(generateActivities(10));

  const handleUpdateMetadata = (metadata: {
    title?: string;
    description?: string;
    tags?: string[];
  }) => {
    console.log("Update stream metadata:", metadata);
    alert(
      `Settings saved!\n${metadata.title ? `Title: ${metadata.title}\n` : ""}${metadata.description ? `Description: ${metadata.description}\n` : ""}${metadata.tags ? `Tags: ${metadata.tags.join(", ")}` : ""}`,
    );
  };

  return (
    <LiveStreamControlCenter
      activities={activities()}
      connectedPlatforms={["twitch", "youtube", "kick"]}
      currentDescription="Playing games and having fun!"
      currentTags={["gaming", "fun"]}
      currentTitle="My Awesome Stream"
      onSendMessage={handleSendMessage}
      onStartGiveaway={handleStartGiveaway}
      onStartPoll={handleStartPoll}
      onUpdateMetadata={handleUpdateMetadata}
      streamDuration={1800}
      viewerCount={500}
    />
  );
}

export const StreamSettings: Story = {
  render: () => <InteractiveStreamSettingsWrapper />,
  args: {
    phase: "live",
  },
  parameters: {
    docs: {
      description: {
        story:
          'Test story for Stream Settings. Click the "Actions" tab, then "Stream Settings" to open the settings panel. You can edit the stream title, description, category, and tags. Changes will be saved when you click "Save Settings".',
      },
    },
  },
};
