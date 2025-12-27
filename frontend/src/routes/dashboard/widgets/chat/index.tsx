import { createSignal, onMount, type JSX } from "solid-js";
import { z } from "zod";
import ChatWidget from "~/components/widgets/ChatWidget";
import { WidgetSettingsPage } from "~/components/WidgetSettingsPage";
import type { FormMeta } from "~/lib/schema-form";

/**
 * Chat message type for preview
 */
interface ChatMessage {
	id: string;
	username: string;
	content: string;
	timestamp: Date;
	platform: { icon: string; color: string };
	badge?: string;
	badgeColor?: string;
	usernameColor?: string;
}

/**
 * Chat widget configuration schema.
 */
export const chatSchema = z.object({
	fontSize: z.enum(["small", "medium", "large"]).default("medium"),
	maxMessages: z.number().min(1).max(45).default(15),
	showTimestamps: z.boolean().default(false),
	showBadges: z.boolean().default(true),
	showPlatform: z.boolean().default(true),
	showEmotes: z.boolean().default(true),
});

export type ChatConfig = z.infer<typeof chatSchema>;

/**
 * Chat widget form metadata.
 */
export const chatMeta: FormMeta<typeof chatSchema.shape> = {
	fontSize: { label: "Font Size" },
	maxMessages: {
		label: "Max Messages",
		description: "Maximum number of messages to display",
	},
	showTimestamps: { label: "Show Timestamps" },
	showBadges: {
		label: "Show User Badges",
		description: "Display subscriber, moderator, and VIP badges",
	},
	showPlatform: {
		label: "Show Platform Icons",
		description: "Display Twitch/YouTube icons next to messages",
	},
	showEmotes: {
		label: "Show Emotes",
		description: "Render emotes as images",
	},
};

/**
 * Initial mock messages
 */
const MOCK_MESSAGES: ChatMessage[] = [
	{
		id: "1",
		username: "StreamFan42",
		content: "Great stream! Love the new overlay design",
		timestamp: new Date(),
		platform: { icon: "twitch", color: "bg-purple-500" },
		badge: "SUB",
		badgeColor: "bg-purple-500 text-white",
		usernameColor: "#9333ea",
	},
	{
		id: "2",
		username: "GamerPro",
		content: "That was an amazing play!",
		timestamp: new Date(),
		platform: { icon: "youtube", color: "bg-red-500" },
		badge: "MOD",
		badgeColor: "bg-green-500 text-white",
		usernameColor: "#10b981",
	},
	{
		id: "3",
		username: "ChatUser99",
		content: "First time here, really enjoying the stream!",
		timestamp: new Date(),
		platform: { icon: "twitch", color: "bg-purple-500" },
		usernameColor: "#3b82f6",
	},
];

/**
 * Preview wrapper with animated chat messages
 */
function ChatPreviewWrapper(props: {
	config: ChatConfig;
	children: JSX.Element;
}): JSX.Element {
	const [messages, setMessages] = createSignal<ChatMessage[]>(MOCK_MESSAGES);

	onMount(() => {
		const interval = setInterval(() => {
			const newMessage: ChatMessage = {
				id: `msg_${Date.now()}`,
				username:
					["StreamFan", "GamerPro", "ChatUser", "NewViewer"][
						Math.floor(Math.random() * 4)
					] + Math.floor(Math.random() * 100),
				content: [
					"This is awesome!",
					"Love the stream!",
					"Amazing content!",
					"Keep it up!",
					"You're the best!",
				][Math.floor(Math.random() * 5)],
				timestamp: new Date(),
				platform: {
					icon: ["twitch", "youtube"][Math.floor(Math.random() * 2)],
					color: ["bg-purple-500", "bg-red-500"][Math.floor(Math.random() * 2)],
				},
				badge:
					Math.random() > 0.5
						? ["SUB", "MOD", "VIP"][Math.floor(Math.random() * 3)]
						: undefined,
				badgeColor:
					Math.random() > 0.5 ? "bg-purple-500 text-white" : undefined,
				usernameColor: ["#9333ea", "#10b981", "#3b82f6", "#ef4444"][
					Math.floor(Math.random() * 4)
				],
			};
			setMessages((prev) => [...prev, newMessage]);
		}, 3000);

		return () => clearInterval(interval);
	});

	return (
		<div
			class="overflow-hidden rounded-lg bg-gray-900"
			style={{ height: "400px" }}
		>
			<ChatWidget config={props.config} messages={messages()} />
		</div>
	);
}

export default function ChatSettings() {
	return (
		<WidgetSettingsPage
			title="Chat Widget Settings"
			description="Configure your chat overlay widget for OBS"
			widgetType="chat_widget"
			widgetUrlPath="chat"
			schema={chatSchema}
			meta={chatMeta}
			PreviewComponent={ChatWidget}
			previewWrapper={ChatPreviewWrapper}
			obsSettings={{
				width: 400,
				height: 600,
			}}
		/>
	);
}
