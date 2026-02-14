import { useParams } from "@solidjs/router";
import { useLiveQuery } from "@tanstack/solid-db";
import { Show, createMemo } from "solid-js";
import ChatWidget from "~/components/widgets/ChatWidget";
import { useWidgetConfig } from "~/lib/useElectric";
import { getEventsCollection } from "~/lib/useEventsCollection";

interface ChatConfig {
	fontSize: "small" | "medium" | "large";
	showTimestamps: boolean;
	showBadges: boolean;
	showPlatform: boolean;
	showEmotes: boolean;
	maxMessages: number;
	nameSaturation: number;
	nameLightness: number;
}

const DEFAULT_CONFIG: ChatConfig = {
	fontSize: "medium",
	showTimestamps: false,
	showBadges: true,
	showPlatform: true,
	showEmotes: true,
	maxMessages: 25,
	nameSaturation: 70,
	nameLightness: 65,
};

const PLATFORM_COLORS: Record<string, string> = {
	twitch: "bg-purple-600",
	youtube: "bg-red-600",
	facebook: "bg-blue-600",
	kick: "bg-green-600",
};

function toSnakeCase(str: string): string {
	return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function mapConfig(
	loaded: Record<string, unknown>,
	defaults: ChatConfig,
): ChatConfig {
	const result = {} as Record<string, unknown>;
	const defaultsRecord = defaults as unknown as Record<string, unknown>;
	for (const key of Object.keys(defaultsRecord)) {
		const snakeKey = toSnakeCase(key);
		result[key] = loaded[snakeKey] ?? defaultsRecord[key];
	}
	return result as unknown as ChatConfig;
}

export default function ChatDisplay() {
	const params = useParams<{ userId: string }>();

	const widgetConfig = useWidgetConfig(
		() => params.userId,
		() => "chat_widget",
	);

	const config = createMemo<ChatConfig>(() => {
		const raw = widgetConfig.data()?.config as
			| Record<string, unknown>
			| undefined;
		if (!raw) return DEFAULT_CONFIG;
		return mapConfig(raw, DEFAULT_CONFIG);
	});

	const eventsQuery = useLiveQuery(() => getEventsCollection(params.userId));

	const messages = createMemo(() => {
		const data = eventsQuery.data || [];
		return data
			.filter((e) => e.type === "chat_message")
			.map((ev) => {
				const d = ev.data as Record<string, unknown>;
				const platform = (ev.platform ?? "unknown").toLowerCase();
				return {
					id: ev.id,
					username: (d.username as string) ?? "Unknown",
					content: (d.message as string) ?? "",
					timestamp: ev.inserted_at,
					platform: {
						icon: platform,
						color: PLATFORM_COLORS[platform] ?? "bg-gray-600",
					},
					badge: d.is_moderator ? "MOD" : d.is_patreon ? "SUB" : undefined,
					badgeColor: d.is_moderator
						? "bg-green-600 text-white"
						: d.is_patreon
							? "bg-purple-600 text-white"
							: undefined,
				};
			})
			.sort(
				(a, b) =>
					new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
			);
	});

	return (
		<div style={{ width: "100%", height: "100%" }}>
			<Show when={config()}>
				{(cfg) => <ChatWidget config={cfg()} messages={messages()} />}
			</Show>
		</div>
	);
}
