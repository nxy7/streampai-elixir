import { For, Show } from "solid-js";
import {
	getEventColor,
	getEventIcon,
	getEventLabel,
	getPlatformName,
} from "~/lib/eventMetadata";
import { formatAmount, formatTimestamp } from "~/lib/formatters";
import { getAnimationClass, getFontClass } from "~/lib/widgetHelpers";

interface StreamEvent {
	id: string;
	type: "donation" | "follow" | "subscription" | "raid" | "chat_message";
	username: string;
	message?: string;
	amount?: number;
	currency?: string;
	timestamp: Date | string;
	platform: {
		icon: string;
		color: string;
	};
}

interface EventListConfig {
	animationType: "slide" | "fade" | "bounce";
	maxEvents: number;
	eventTypes: string[];
	showTimestamps: boolean;
	showPlatform: boolean;
	showAmounts: boolean;
	fontSize: "small" | "medium" | "large";
	compactMode: boolean;
}

interface EventListWidgetProps {
	config: EventListConfig;
	events: StreamEvent[];
}

export default function EventListWidget(props: EventListWidgetProps) {
	const fontClass = () => getFontClass(props.config.fontSize, "content");

	const displayedEvents = () => {
		return (props.events || [])
			.filter((event) => props.config.eventTypes.includes(event.type))
			.slice(0, props.config.maxEvents);
	};

	const animationClass = () =>
		getAnimationClass(props.config.animationType, "in");

	return (
		<div
			class="relative h-full w-full overflow-hidden"
			style={{
				"font-family":
					"-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif",
			}}>
			<div
				class={`h-full w-full overflow-y-auto ${props.config.compactMode ? "space-y-2 p-2" : "space-y-3 p-4"}`}>
				<Show
					when={displayedEvents().length > 0}
					fallback={
						<div class="flex h-full items-center justify-center">
							<div class="text-center text-gray-400">
								<div class="mb-4 text-4xl">📋</div>
								<div class={`font-medium ${fontClass()}`}>No events yet</div>
								<div class="mt-2 text-sm">
									Events will appear here as they happen
								</div>
							</div>
						</div>
					}>
					<div class={props.config.compactMode ? "space-y-1" : "space-y-2"}>
						<For each={displayedEvents()}>
							{(event, index) => (
								<div
									class={`relative transition-all duration-300 ${animationClass()} ${
										props.config.compactMode
											? "rounded border border-white/10 bg-gray-900/80 p-2"
											: "rounded-lg border border-white/20 bg-linear-to-br from-gray-900/95 to-gray-800/95 p-4 shadow-lg backdrop-blur-lg"
									}`}
									style={{ "animation-delay": `${index() * 100}ms` }}>
									<Show when={!props.config.compactMode}>
										<div class="absolute inset-0 rounded-lg bg-linear-to-r from-purple-500/20 to-pink-500/20 opacity-30 blur-sm"></div>
									</Show>

									<div class="relative z-10">
										<Show
											when={props.config.compactMode}
											fallback={
												<>
													<div class="mb-2 flex items-center justify-between">
														<div class="flex items-center space-x-2">
															<span class="text-lg">
																{getEventIcon(event.type)}
															</span>
															<div>
																<div
																	class={`font-semibold ${getEventColor(event.type)} ${fontClass()}`}>
																	{event.username}
																</div>
																<div class="text-gray-400 text-xs uppercase tracking-wide">
																	{getEventLabel(event.type)}
																</div>
															</div>
														</div>

														<Show when={props.config.showTimestamps}>
															<div
																class={`text-gray-400 text-xs ${fontClass()}`}>
																{formatTimestamp(event.timestamp)}
															</div>
														</Show>
													</div>

													<Show
														when={
															props.config.showAmounts &&
															event.amount &&
															event.type === "donation"
														}>
														<div class="mb-2">
															<div
																class={`font-bold text-green-400 ${fontClass()}`}>
																{formatAmount(event.amount, event.currency)}
															</div>
														</div>
													</Show>

													<Show
														when={event.message && event.message.trim() !== ""}>
														<div
															class={`text-gray-200 leading-relaxed ${fontClass()}`}>
															{event.message}
														</div>
													</Show>

													<Show when={props.config.showPlatform}>
														<div class="mt-2 flex justify-end">
															<div class="rounded-full border border-white/20 bg-white/10 px-2 py-1 font-semibold text-white text-xs backdrop-blur-sm">
																{getPlatformName(event.platform.icon)}
															</div>
														</div>
													</Show>
												</>
											}>
											<div class="flex items-center justify-between">
												<div class="flex min-w-0 flex-1 items-center space-x-2">
													<span class="text-sm">
														{getEventIcon(event.type)}
													</span>
													<div class="truncate font-medium text-sm text-white">
														{event.username}
													</div>
													<Show
														when={
															props.config.showAmounts &&
															event.amount &&
															event.type === "donation"
														}>
														<div class="font-bold text-green-400 text-sm">
															{formatAmount(event.amount, event.currency)}
														</div>
													</Show>
												</div>
												<Show when={props.config.showTimestamps}>
													<div class="ml-2 text-gray-400 text-xs">
														{formatTimestamp(event.timestamp)}
													</div>
												</Show>
											</div>
										</Show>
									</div>
								</div>
							)}
						</For>
					</div>
				</Show>
			</div>

			<style>{`
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }

        .overflow-y-auto::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
          50% {
            opacity: 1;
            transform: scale(1.05) translateY(-5px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-slide-in {
          animation: slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
		</div>
	);
}
