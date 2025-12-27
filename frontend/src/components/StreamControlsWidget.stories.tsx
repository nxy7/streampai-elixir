import { createSignal, onCleanup, onMount } from "solid-js";
import type { Meta, StoryObj } from "storybook-solidjs-vite";
import StreamControlsWidget, {
	type ActivityItem,
	type StreamMetadata,
	type StreamSummary,
	type Platform,
	PreStreamSettings,
	LiveStreamControlCenter,
	PostStreamSummary,
} from "./StreamControlsWidget";

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
	rtmpsStreamKey: "abc123def456ghi789",
	srtUrl: "srt://live.cloudflare.com:778?streamid=abc123",
};

// Generate many activities to test scrolling and virtualization
// Activities are generated in chronological order (oldest first, newest last)
const generateActivities = (count: number): ActivityItem[] => {
	const types: ActivityItem["type"][] = ["chat", "chat", "chat", "donation", "follow", "subscription", "raid", "cheer"];
	const platforms = ["twitch", "youtube", "kick", "facebook"];
	const usernames = ["StreamFan", "GamerPro", "ChattyKathy", "ViewerOne", "SuperDonor", "TwitchLover", "YouTubeFan", "KickUser"];
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
			message: type !== "follow" ? messages[Math.floor(Math.random() * messages.length)] : undefined,
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

export const Live: Story = {
	args: {
		phase: "live",
		activities: manyActivities,
		streamDuration: 3723, // 1 hour 2 minutes 3 seconds
		viewerCount: 1024,
		stickyDuration: 30000,
		connectedPlatforms: ["twitch", "youtube", "kick"],
		onSendMessage: handleSendMessage,
	},
};

export const LiveEmpty: Story = {
	args: {
		phase: "live",
		activities: [],
		streamDuration: 60,
		viewerCount: 5,
		connectedPlatforms: ["twitch"],
		onSendMessage: handleSendMessage,
	},
};

export const LiveBusy: Story = {
	args: {
		phase: "live",
		activities: generateActivities(50),
		streamDuration: 10800, // 3 hours
		viewerCount: 5000,
		stickyDuration: 30000,
		connectedPlatforms: ["twitch", "youtube", "kick", "facebook"],
		onSendMessage: handleSendMessage,
	},
};

// Story with 1000+ events to test virtualization performance
export const LiveVirtualized: Story = {
	args: {
		phase: "live",
		activities: generateActivities(1000),
		streamDuration: 36000, // 10 hours
		viewerCount: 15000,
		stickyDuration: 30000,
		connectedPlatforms: ["twitch", "youtube", "kick", "facebook"],
		onSendMessage: handleSendMessage,
	},
};

export const LiveChatOnly: Story = {
	args: {
		phase: "live",
		activities: sampleActivities.filter((a) => a.type === "chat"),
		streamDuration: 1800,
		viewerCount: 150,
		connectedPlatforms: ["twitch", "youtube"],
		onSendMessage: handleSendMessage,
	},
};

export const LiveManyDonations: Story = {
	args: {
		phase: "live",
		activities: [
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
		],
		streamDuration: 2400,
		viewerCount: 2500,
		connectedPlatforms: ["twitch", "youtube", "kick"],
		onSendMessage: handleSendMessage,
	},
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
			phase="pre-stream"
			metadata={metadata()}
			onMetadataChange={setMetadata}
			streamKeyData={sampleStreamKeyData}
			showStreamKey={showKey()}
			onShowStreamKey={() => setShowKey(!showKey())}
			copied={copied()}
			onCopyStreamKey={handleCopy}
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
				amount: type === "donation" ? Math.floor(Math.random() * 50) + 1 : undefined,
				currency: "$",
				platform: ["twitch", "youtube", "kick"][Math.floor(Math.random() * 3)],
				timestamp: new Date(),
				isImportant: type === "donation",
			};
			// Append to end (newest events at bottom)
			setActivities((a) => [...a, newActivity].slice(-100));
			setViewers((v) => Math.max(0, v + Math.floor(Math.random() * 10) - 3));
		}, 1000); // 1 event per second

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
		setActivities((a) => [...a, newActivity].slice(-100));
		console.log(`Message sent to ${platforms.join(", ")}: ${message}`);
	};

	return (
		<StreamControlsWidget
			phase="live"
			activities={activities()}
			streamDuration={duration()}
			viewerCount={viewers()}
			stickyDuration={15000}
			connectedPlatforms={["twitch", "youtube", "kick"]}
			onSendMessage={handleSendMessage}
		/>
	);
}

export const InteractiveLive: Story = {
	render: () => <InteractiveLiveWrapper />,
	args: {
		phase: "live",
	},
};

// =====================================================
// Individual Component Stories
// =====================================================

const preStreamMeta = {
	title: "Components/StreamControlsWidget/PreStreamSettings",
	component: PreStreamSettings,
	parameters: {
		layout: "centered",
	},
	decorators: [
		(Story: () => any) => (
			<div
				style={{
					width: "500px",
					background: "white",
					padding: "24px",
					"border-radius": "16px",
				}}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof PreStreamSettings>;

const liveMeta = {
	title: "Components/StreamControlsWidget/LiveStreamControlCenter",
	component: LiveStreamControlCenter,
	parameters: {
		layout: "centered",
	},
	decorators: [
		(Story: () => any) => (
			<div
				style={{
					width: "500px",
					height: "600px",
					background: "white",
					padding: "24px",
					"border-radius": "16px",
				}}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof LiveStreamControlCenter>;

const postStreamMeta = {
	title: "Components/StreamControlsWidget/PostStreamSummary",
	component: PostStreamSummary,
	parameters: {
		layout: "centered",
	},
	decorators: [
		(Story: () => any) => (
			<div
				style={{
					width: "500px",
					background: "white",
					padding: "24px",
					"border-radius": "16px",
				}}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof PostStreamSummary>;
