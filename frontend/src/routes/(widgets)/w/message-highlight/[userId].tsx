import { useParams } from "@solidjs/router";
import { Show, createMemo } from "solid-js";
import MessageHighlightWidget, {
	type HighlightedMessageData,
	type MessageHighlightConfig,
} from "~/components/widgets/MessageHighlightWidget";
import { useStreamActor, useWidgetConfig } from "~/lib/useElectric";

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

	const widgetConfig = useWidgetConfig(
		() => params.userId,
		() => "message_highlight_widget",
	);

	const config = createMemo<MessageHighlightConfig>(() => {
		const raw = widgetConfig.data()?.config as
			| Record<string, unknown>
			| undefined;
		if (!raw) return DEFAULT_CONFIG;
		return {
			fontSize: raw.font_size ?? DEFAULT_CONFIG.fontSize,
			showPlatform: raw.show_platform ?? DEFAULT_CONFIG.showPlatform,
			showTimestamp: raw.show_timestamp ?? DEFAULT_CONFIG.showTimestamp,
			animationType: raw.animation_type ?? DEFAULT_CONFIG.animationType,
			backgroundColor: raw.background_color ?? DEFAULT_CONFIG.backgroundColor,
			textColor: raw.text_color ?? DEFAULT_CONFIG.textColor,
			accentColor: raw.accent_color ?? DEFAULT_CONFIG.accentColor,
			borderRadius: raw.border_radius ?? DEFAULT_CONFIG.borderRadius,
		} as MessageHighlightConfig;
	});

	// Electric sync for highlighted_message from CurrentStreamData
	const streamActor = useStreamActor(() => params.userId);

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
			viewerId: m.viewer_id?.toString() ?? undefined,
			highlightedAt: (m.highlighted_at as string) ?? "",
		};
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
