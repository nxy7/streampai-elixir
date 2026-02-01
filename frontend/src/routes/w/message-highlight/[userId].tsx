import { useParams } from "@solidjs/router";
import { Show, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import MessageHighlightWidget, {
	type HighlightedMessageData,
	type MessageHighlightConfig,
} from "~/components/widgets/MessageHighlightWidget";
import { useStreamActor } from "~/lib/useElectric";
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

	// Electric sync for highlighted_message from CurrentStreamData
	const streamActor = useStreamActor(() => params.userId);

	// Transform CurrentStreamData highlighted_message to widget format
	const highlightedMessage = createMemo((): HighlightedMessageData | null => {
		const data = streamActor.data();
		if (!data) return null;
		const msg = data.highlighted_message;
		if (!msg || typeof msg !== "object") return null;

		const m = msg as Record<string, unknown>;
		return {
			id: (m.chat_message_id as string) ?? "",
			chatMessageId: (m.chat_message_id as string) ?? "",
			message: (m.message as string) ?? "",
			senderUsername: (m.sender_username as string) ?? "",
			senderChannelId: (m.sender_channel_id as string) ?? undefined,
			platform: (m.platform as string) ?? "",
			viewerId: (m.viewer_id as string) ?? undefined,
			highlightedAt: (m.highlighted_at as string) ?? "",
		};
	});

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
