import { For, Show } from "solid-js";
import { getFontClass } from "~/lib/widgetHelpers";

interface Platform {
	icon: string;
	color: string;
}

interface ChatMessage {
	id: string;
	username: string;
	content: string;
	timestamp: Date | string;
	platform: Platform;
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

interface ChatWidgetProps {
	config: ChatConfig;
	messages: ChatMessage[];
}

export default function ChatWidget(props: ChatWidgetProps) {
	const fontClass = () => getFontClass(props.config.fontSize, "standard");

	const displayMessages = () => {
		const msgs = props.messages || [];
		return msgs.slice(-props.config.maxMessages);
	};

	const formatTimestamp = (timestamp: Date | string) => {
		const ts = timestamp instanceof Date ? timestamp : new Date(timestamp);
		return ts.toLocaleTimeString("en-US", {
			hour12: false,
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getPlatformIcon = (platform: Platform) => {
		const iconPaths: Record<string, string> = {
			twitch:
				"M11.64 5.93H13.07V10.21H11.64M15.57 5.93H17V10.21H15.57M7 2L3.43 5.57V18.43H7.71V22L11.29 18.43H14.14L20.57 12V2M18.86 11.29L16.71 13.43H14.14L12.29 15.29V13.43H8.57V3.71H18.86Z",
			youtube:
				"M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
			facebook:
				"M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
			kick: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
		};

		return (
			iconPaths[platform.icon] ||
			"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
		);
	};

	const processMessageContent = (message: ChatMessage) => {
		if (!props.config.showEmotes) {
			const cleanContent = message.content
				.replace(/:[a-zA-Z0-9_+-]+:/g, "")
				.replace(/[\u{1F600}-\u{1F64F}]/gu, "")
				.replace(/[\u{1F300}-\u{1F5FF}]/gu, "")
				.replace(/[\u{1F680}-\u{1F6FF}]/gu, "")
				.replace(/[\u{1F1E0}-\u{1F1FF}]/gu, "")
				.replace(/[\u{2600}-\u{26FF}]/gu, "")
				.replace(/[\u{2700}-\u{27BF}]/gu, "")
				.replace(/[\u{1F900}-\u{1F9FF}]/gu, "")
				.replace(/[\u{1FA00}-\u{1FA6F}]/gu, "")
				.replace(/[\u{1FA70}-\u{1FAFF}]/gu, "")
				.replace(/[\u{FE00}-\u{FE0F}]/gu, "")
				.replace(/[\u{200D}]/gu, "")
				.trim();
			return cleanContent;
		}

		return message.content;
	};

	return (
		<div
			class="flex h-full w-full flex-col text-white"
			style={{
				"font-family":
					"-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif",
			}}>
			<div class="flex flex-1 flex-col justify-end overflow-y-hidden p-3">
				<div class="flex flex-col gap-2">
					<For each={displayMessages()}>
						{(message) => (
							<div class={`flex items-start space-x-2 ${fontClass()}`}>
								<Show when={props.config.showPlatform}>
									<div
										class={`flex shrink-0 items-center justify-center rounded ${message.platform.color}`}
										style={{ width: "20px", height: "20px" }}>
										<svg
											aria-hidden="true"
											fill="currentColor"
											viewBox="0 0 24 24"
											style={{ width: "12px", height: "12px", color: "white" }}>
											<path d={getPlatformIcon(message.platform)} />
										</svg>
									</div>
								</Show>

								<Show when={props.config.showBadges && message.badge}>
									<div
										class={`shrink-0 rounded px-2 py-1 font-semibold text-xs ${message.badgeColor}`}>
										{message.badge}
									</div>
								</Show>

								<div class="min-w-0 flex-1">
									<Show when={props.config.showTimestamps}>
										<span class="mr-2 text-gray-500 text-xs">
											{formatTimestamp(message.timestamp)}
										</span>
									</Show>
									<span
										class="font-semibold"
										style={{ color: message.usernameColor }}>
										{message.username}:
									</span>
									<span class="ml-1 text-gray-100">
										{processMessageContent(message)}
									</span>
								</div>
							</div>
						)}
					</For>
				</div>
			</div>

			<style>{`
        .overflow-y-hidden::-webkit-scrollbar {
          width: 6px;
        }

        .overflow-y-hidden::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
        }

        .overflow-y-hidden::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }

        .overflow-y-hidden::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
		</div>
	);
}
