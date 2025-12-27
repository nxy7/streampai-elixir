import type { Meta, StoryObj } from "storybook-solidjs-vite";
import StreamingAccountStats, {
	type StreamingAccountData,
} from "./StreamingAccountStats";

const meta = {
	title: "Settings/StreamingAccountStats",
	component: StreamingAccountStats,
	parameters: {
		layout: "padded",
		backgrounds: { default: "light" },
	},
	tags: ["autodocs"],
} satisfies Meta<typeof StreamingAccountStats>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockYouTubeData: StreamingAccountData = {
	platform: "youtube",
	accountName: "StreamerChannel",
	accountImage: null,
	sponsorCount: 1250,
	viewsLast30d: 485000,
	followerCount: 52400,
	subscriberCount: 48750,
	statsLastRefreshedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
};

const mockTwitchData: StreamingAccountData = {
	platform: "twitch",
	accountName: "ProGamerTV",
	accountImage: "https://picsum.photos/48",
	sponsorCount: 3420,
	viewsLast30d: 892000,
	followerCount: 125000,
	subscriberCount: 8750,
	statsLastRefreshedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
};

const mockFacebookData: StreamingAccountData = {
	platform: "facebook",
	accountName: "Gaming Page",
	accountImage: null,
	sponsorCount: 450,
	viewsLast30d: 156000,
	followerCount: 28500,
	subscriberCount: null,
	statsLastRefreshedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
};

const mockKickData: StreamingAccountData = {
	platform: "kick",
	accountName: "KickStreamer",
	accountImage: null,
	sponsorCount: 890,
	viewsLast30d: 234000,
	followerCount: 45600,
	subscriberCount: 2100,
	statsLastRefreshedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
};

const simulateRefresh = () =>
	new Promise<void>((resolve) => setTimeout(resolve, 1500));

const simulateDisconnect = () =>
	new Promise<void>((resolve) => setTimeout(resolve, 1000));

export const YouTube: Story = {
	args: {
		data: mockYouTubeData,
		onRefresh: simulateRefresh,
		onDisconnect: simulateDisconnect,
	},
};

export const Twitch: Story = {
	args: {
		data: mockTwitchData,
		onRefresh: simulateRefresh,
		onDisconnect: simulateDisconnect,
	},
};

export const Facebook: Story = {
	args: {
		data: mockFacebookData,
		onRefresh: simulateRefresh,
		onDisconnect: simulateDisconnect,
	},
};

export const Kick: Story = {
	args: {
		data: mockKickData,
		onRefresh: simulateRefresh,
		onDisconnect: simulateDisconnect,
	},
};

export const TikTok: Story = {
	args: {
		data: {
			platform: "tiktok",
			accountName: "TikTokCreator",
			accountImage: null,
			sponsorCount: null,
			viewsLast30d: 2500000,
			followerCount: 890000,
			subscriberCount: null,
			statsLastRefreshedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
		},
		onRefresh: simulateRefresh,
		onDisconnect: simulateDisconnect,
	},
};

export const Instagram: Story = {
	args: {
		data: {
			platform: "instagram",
			accountName: "InstaStreamer",
			accountImage: "https://picsum.photos/48?random=2",
			sponsorCount: 1500,
			viewsLast30d: 450000,
			followerCount: 95000,
			subscriberCount: null,
			statsLastRefreshedAt: new Date(
				Date.now() - 3 * 60 * 60 * 1000,
			).toISOString(),
		},
		onRefresh: simulateRefresh,
		onDisconnect: simulateDisconnect,
	},
};

export const Rumble: Story = {
	args: {
		data: {
			platform: "rumble",
			accountName: "RumbleChannel",
			accountImage: null,
			sponsorCount: 350,
			viewsLast30d: 125000,
			followerCount: 18500,
			subscriberCount: 4200,
			statsLastRefreshedAt: new Date(
				Date.now() - 8 * 60 * 60 * 1000,
			).toISOString(),
		},
		onRefresh: simulateRefresh,
		onDisconnect: simulateDisconnect,
	},
};

export const Trovo: Story = {
	args: {
		data: {
			platform: "trovo",
			accountName: "TrovoStreamer",
			accountImage: null,
			sponsorCount: 220,
			viewsLast30d: 78000,
			followerCount: 12400,
			subscriberCount: 850,
			statsLastRefreshedAt: new Date(
				Date.now() - 12 * 60 * 60 * 1000,
			).toISOString(),
		},
		onRefresh: simulateRefresh,
		onDisconnect: simulateDisconnect,
	},
};

export const NeverRefreshed: Story = {
	args: {
		data: {
			platform: "youtube",
			accountName: "NewChannel",
			accountImage: null,
			sponsorCount: null,
			viewsLast30d: null,
			followerCount: null,
			subscriberCount: null,
			statsLastRefreshedAt: null,
		},
		onRefresh: simulateRefresh,
		onDisconnect: simulateDisconnect,
	},
};

export const LargeNumbers: Story = {
	args: {
		data: {
			platform: "twitch",
			accountName: "MegaStreamer",
			accountImage: "https://picsum.photos/48?random=3",
			sponsorCount: 125000,
			viewsLast30d: 45000000,
			followerCount: 8500000,
			subscriberCount: 350000,
			statsLastRefreshedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
		},
		onRefresh: simulateRefresh,
		onDisconnect: simulateDisconnect,
	},
};

export const SmallNumbers: Story = {
	args: {
		data: {
			platform: "kick",
			accountName: "NewStreamer",
			accountImage: null,
			sponsorCount: 5,
			viewsLast30d: 250,
			followerCount: 42,
			subscriberCount: 3,
			statsLastRefreshedAt: new Date(Date.now() - 60 * 1000).toISOString(),
		},
		onRefresh: simulateRefresh,
		onDisconnect: simulateDisconnect,
	},
};

export const ReadOnly: Story = {
	args: {
		data: mockYouTubeData,
	},
};
