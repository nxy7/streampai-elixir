import { useParams } from "@solidjs/router";
import { Show, createSignal, onCleanup, onMount } from "solid-js";
import MessageHighlightWidget, {
	type HighlightedMessageData,
	type MessageHighlightConfig,
} from "~/components/widgets/MessageHighlightWidget";
import { useHighlightedMessage } from "~/lib/useElectric";
import { getWidgetConfig } from "~/sdk/ash_rpc";

const DEFAULT_CONFIG: MessageHighlightConfig = {
	fontSize: "medium",
	showPlatform: true,
	showTimestamp: true,
	animationType: "slide",
	backgroundColor: "rgba(0, 0, 0, 0.9)",
	textColor: "#ffffff",
	accentColor: "#9333ea",
	borderRadius: 12,
};

export default function MessageHighlightWidgetDisplay() {
	const params = useParams<{ userId: string }>();
	const [config, setConfig] = createSignal<MessageHighlightConfig | null>(null);

	// Use Electric SQL for real-time sync of highlighted message
	const highlightedMessageQuery = useHighlightedMessage(() => params.userId);

	// Transform Electric data to widget format
	const highlightedMessage = (): HighlightedMessageData | null => {
		const data = highlightedMessageQuery.data();
		if (!data) return null;

		return {
			id: data.id,
			chatMessageId: data.chat_message_id,
			message: data.message,
			senderUsername: data.sender_username,
			senderChannelId: data.sender_channel_id,
			platform: data.platform,
			viewerId: data.viewer_id ?? undefined,
			highlightedAt: data.highlighted_at,
		};
	};

	async function loadConfig() {
		const userId = params.userId;
		if (!userId) return;

		const result = await getWidgetConfig({
			input: { userId, type: "message_highlight_widget" },
			fields: ["id", "config"],
			fetchOptions: { credentials: "include" },
		});

		if (result.success && result.data?.config) {
			const loadedConfig = result.data.config;
			setConfig({
				fontSize: loadedConfig.font_size ?? DEFAULT_CONFIG.fontSize,
				showPlatform: loadedConfig.show_platform ?? DEFAULT_CONFIG.showPlatform,
				showTimestamp:
					loadedConfig.show_timestamp ?? DEFAULT_CONFIG.showTimestamp,
				animationType:
					loadedConfig.animation_type ?? DEFAULT_CONFIG.animationType,
				backgroundColor:
					loadedConfig.background_color ?? DEFAULT_CONFIG.backgroundColor,
				textColor: loadedConfig.text_color ?? DEFAULT_CONFIG.textColor,
				accentColor: loadedConfig.accent_color ?? DEFAULT_CONFIG.accentColor,
				borderRadius: loadedConfig.border_radius ?? DEFAULT_CONFIG.borderRadius,
			});
		} else {
			setConfig(DEFAULT_CONFIG);
		}
	}

	onMount(() => {
		loadConfig();
		// Poll for config changes (less frequently than data since config rarely changes)
		const interval = setInterval(loadConfig, 10000);
		onCleanup(() => clearInterval(interval));
	});

	return (
		<div style={{ background: "transparent", width: "100vw", height: "100vh" }}>
			<Show when={config()}>
				{(cfg) => (
					<MessageHighlightWidget
						config={cfg()}
						message={highlightedMessage()}
					/>
				)}
			</Show>
		</div>
	);
}
