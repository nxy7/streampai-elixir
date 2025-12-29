import { Show, createMemo } from "solid-js";
import { getFontClass } from "~/lib/widgetHelpers";

// Platform icon paths (same as used in other widgets)
const PLATFORM_ICON_PATHS: Record<string, string> = {
	twitch:
		"M11.64 5.93H13.07V10.21H11.64M15.57 5.93H17V10.21H15.57M7 2L3.43 5.57V18.43H7.71V22L11.29 18.43H14.14L20.57 12V2M18.86 11.29L16.71 13.43H14.14L12.29 15.29V13.43H8.57V3.71H18.86Z",
	youtube:
		"M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
	facebook:
		"M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
	kick: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
	tiktok:
		"M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
	trovo:
		"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
	instagram:
		"M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
	rumble:
		"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
};

const PLATFORM_COLORS: Record<string, string> = {
	twitch: "#9146ff",
	youtube: "#ff0000",
	facebook: "#1877f2",
	kick: "#53fc18",
	tiktok: "#000000",
	trovo: "#19d65c",
	instagram: "#e4405f",
	rumble: "#85c742",
};

const PLATFORM_NAMES: Record<string, string> = {
	twitch: "Twitch",
	youtube: "YouTube",
	facebook: "Facebook",
	kick: "Kick",
	tiktok: "TikTok",
	trovo: "Trovo",
	instagram: "Instagram",
	rumble: "Rumble",
};

export interface HighlightedMessageData {
	id: string;
	chatMessageId: string;
	message: string;
	senderUsername: string;
	senderChannelId: string;
	platform: string;
	viewerId?: string;
	highlightedAt: string;
}

export interface MessageHighlightConfig {
	fontSize: "small" | "medium" | "large";
	showPlatform: boolean;
	showTimestamp: boolean;
	animationType: "fade" | "slide" | "bounce";
	backgroundColor: string;
	textColor: string;
	accentColor: string;
	borderRadius: number;
}

interface MessageHighlightWidgetProps {
	config: MessageHighlightConfig;
	message: HighlightedMessageData | null;
}

export default function MessageHighlightWidget(
	props: MessageHighlightWidgetProps,
) {
	const fontClass = createMemo(() =>
		getFontClass(props.config.fontSize, "standard"),
	);

	const platformIconPath = createMemo(() => {
		const platform = props.message?.platform?.toLowerCase() || "";
		return PLATFORM_ICON_PATHS[platform] || PLATFORM_ICON_PATHS.twitch;
	});

	const platformColor = createMemo(() => {
		const platform = props.message?.platform?.toLowerCase() || "";
		return PLATFORM_COLORS[platform] || PLATFORM_COLORS.twitch;
	});

	const platformName = createMemo(() => {
		const platform = props.message?.platform?.toLowerCase() || "";
		return PLATFORM_NAMES[platform] || "Unknown";
	});

	const formattedTime = createMemo(() => {
		if (!props.message?.highlightedAt) return "";
		const date = new Date(props.message.highlightedAt);
		return date.toLocaleTimeString("en-US", {
			hour12: false,
			hour: "2-digit",
			minute: "2-digit",
		});
	});

	return (
		<div class="message-highlight-widget relative h-full w-full overflow-hidden">
			<style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce-in {
          0% { opacity: 0; transform: scale(0.3); }
          50% { opacity: 1; transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(var(--accent-rgb), 0.3); }
          50% { box-shadow: 0 0 30px rgba(var(--accent-rgb), 0.5); }
        }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        .animate-slide-in { animation: slide-in 0.5s ease-out forwards; }
        .animate-bounce-in { animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards; }
        .pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
      `}</style>

			<div class="flex h-full w-full items-center justify-center p-4">
				<Show when={props.message}>
					<div
						class={`highlight-card relative max-w-2xl overflow-hidden ${fontClass()} animate-${props.config.animationType}-in pulse-glow`}
						style={{
							"background-color": props.config.backgroundColor,
							color: props.config.textColor,
							"border-radius": `${props.config.borderRadius}px`,
							"--accent-rgb": hexToRgb(props.config.accentColor),
							border: `2px solid ${props.config.accentColor}`,
						}}>
						{/* Accent bar at top */}
						<div
							class="absolute top-0 right-0 left-0 h-1"
							style={{ "background-color": props.config.accentColor }}
						/>

						<div class="relative z-10 p-6">
							{/* Header with username and platform */}
							<div class="mb-4 flex items-center gap-3">
								{/* Platform icon */}
								<Show when={props.config.showPlatform}>
									<div
										class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
										style={{ "background-color": platformColor() }}>
										<svg
											aria-hidden="true"
											class="h-4 w-4 text-white"
											fill="currentColor"
											viewBox="0 0 24 24">
											<path d={platformIconPath()} />
										</svg>
									</div>
								</Show>

								{/* Username */}
								<div class="flex-1">
									<div
										class="font-bold text-lg"
										style={{ color: props.config.accentColor }}>
										{props.message?.senderUsername}
									</div>
									<Show when={props.config.showPlatform}>
										<div class="text-xs opacity-60">{platformName()}</div>
									</Show>
								</div>

								{/* Timestamp */}
								<Show when={props.config.showTimestamp}>
									<div class="text-sm opacity-60">{formattedTime()}</div>
								</Show>
							</div>

							{/* Message content */}
							<div class="relative">
								{/* Quote mark decoration */}
								<div
									class="absolute -top-2 -left-1 font-serif text-4xl opacity-20"
									style={{ color: props.config.accentColor }}>
									"
								</div>
								<div class="pl-4 text-lg leading-relaxed">
									{props.message?.message}
								</div>
							</div>
						</div>
					</div>
				</Show>

				{/* Empty state - shown when no message is highlighted */}
				<Show when={!props.message}>
					<div class="text-center opacity-50">
						<div
							class="mb-2 font-serif text-4xl"
							style={{ color: props.config.accentColor }}>
							"
						</div>
						<div style={{ color: props.config.textColor }}>
							No message highlighted
						</div>
					</div>
				</Show>
			</div>
		</div>
	);
}

// Helper function to convert hex to RGB for CSS variables
function hexToRgb(hex: string): string {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	if (result) {
		return `${Number.parseInt(result[1], 16)}, ${Number.parseInt(result[2], 16)}, ${Number.parseInt(result[3], 16)}`;
	}
	return "147, 51, 234"; // Default purple
}
