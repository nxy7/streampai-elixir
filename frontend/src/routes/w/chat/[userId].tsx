import { useParams } from "@solidjs/router";
import { createSignal, onCleanup, onMount, Show } from "solid-js";
import ChatWidget from "~/components/widgets/ChatWidget";
import { getWidgetConfig } from "~/sdk/ash_rpc";

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

interface ChatConfig {
	fontSize: "small" | "medium" | "large";
	showTimestamps: boolean;
	showBadges: boolean;
	showPlatform: boolean;
	showEmotes: boolean;
	maxMessages: number;
}

const DEFAULT_CONFIG: ChatConfig = {
	fontSize: "medium",
	showTimestamps: false,
	showBadges: true,
	showPlatform: true,
	showEmotes: true,
	maxMessages: 25,
};

export default function ChatDisplay() {
	const params = useParams<{ userId: string }>();
	const [config, setConfig] = createSignal<ChatConfig | null>(null);
	const [messages] = createSignal<ChatMessage[]>([]);

	async function loadConfig() {
		const userId = params.userId;
		if (!userId) return;

		const result = await getWidgetConfig({
			input: { userId, type: "chat_widget" },
			fields: ["id", "config"],
			fetchOptions: { credentials: "include" },
		});

		if (result.success && result.data.config) {
			const loadedConfig = result.data.config;
			setConfig({
				fontSize: loadedConfig.font_size || DEFAULT_CONFIG.fontSize,
				showTimestamps:
					loadedConfig.show_timestamps ?? DEFAULT_CONFIG.showTimestamps,
				showBadges: loadedConfig.show_badges ?? DEFAULT_CONFIG.showBadges,
				showPlatform: loadedConfig.show_platform ?? DEFAULT_CONFIG.showPlatform,
				showEmotes: loadedConfig.show_emotes ?? DEFAULT_CONFIG.showEmotes,
				maxMessages: loadedConfig.max_messages || DEFAULT_CONFIG.maxMessages,
			});
		} else {
			setConfig(DEFAULT_CONFIG);
		}
	}

	onMount(() => {
		loadConfig();

		const interval = setInterval(loadConfig, 5000);
		onCleanup(() => clearInterval(interval));
	});

	return (
		<div
			style={{
				background: "transparent",
				width: "100vw",
				height: "100vh",
				display: "flex",
				"align-items": "center",
				"justify-content": "center",
			}}
		>
			<Show when={config()}>
				{(cfg) => (
					<div style={{ width: "100%", height: "100%" }}>
						<ChatWidget config={cfg()} messages={messages()} />
					</div>
				)}
			</Show>
		</div>
	);
}
