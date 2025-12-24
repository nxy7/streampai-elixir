import { For, Show } from "solid-js";

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
  const fontClass = () => {
    switch (props.config.fontSize) {
      case "small":
        return "text-sm";
      case "large":
        return "text-lg";
      default:
        return "text-base";
    }
  };

  const getEventColor = (type: string) => {
    const colors: Record<string, string> = {
      donation: "text-green-400",
      follow: "text-blue-400",
      subscription: "text-purple-400",
      raid: "text-yellow-400",
      chat_message: "text-gray-300",
    };
    return colors[type] || colors.chat_message;
  };

  const getEventIcon = (type: string) => {
    const icons: Record<string, string> = {
      donation: "💰",
      follow: "❤️",
      subscription: "⭐",
      raid: "⚡",
      chat_message: "💬",
    };
    return icons[type] || icons.chat_message;
  };

  const getEventLabel = (type: string) => {
    const labels: Record<string, string> = {
      donation: "Donation",
      follow: "Follow",
      subscription: "Sub",
      raid: "Raid",
      chat_message: "Chat",
    };
    return labels[type] || "Event";
  };

  const getPlatformName = (icon: string) => {
    const platformNames: Record<string, string> = {
      twitch: "Twitch",
      youtube: "YouTube",
      facebook: "Facebook",
      kick: "Kick",
    };
    return platformNames[icon] || icon;
  };

  const formatAmount = (amount?: number, currency?: string) => {
    if (!amount) return "";
    return `${currency || "$"}${amount.toFixed(2)}`;
  };

  const formatTimestamp = (timestamp: Date | string) => {
    const ts = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return ts.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const displayedEvents = () => {
    return (props.events || [])
      .filter((event) => props.config.eventTypes.includes(event.type))
      .slice(0, props.config.maxEvents);
  };

  const getAnimationClass = () => {
    switch (props.config.animationType) {
      case "slide":
        return "animate-slide-in";
      case "bounce":
        return "animate-bounce-in";
      default:
        return "animate-fade-in";
    }
  };

  return (
    <div
      class="h-full w-full relative overflow-hidden"
      style={{
        "font-family":
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif",
      }}
    >
      <div
        class={`h-full w-full overflow-y-auto ${props.config.compactMode ? "p-2 space-y-2" : "p-4 space-y-3"}`}
      >
        <Show
          when={displayedEvents().length > 0}
          fallback={
            <div class="flex items-center justify-center h-full">
              <div class="text-center text-gray-400">
                <div class="text-4xl mb-4">📋</div>
                <div class={`font-medium ${fontClass()}`}>No events yet</div>
                <div class="text-sm mt-2">Events will appear here as they happen</div>
              </div>
            </div>
          }
        >
          <div class={props.config.compactMode ? "space-y-1" : "space-y-2"}>
            <For each={displayedEvents()}>
              {(event, index) => (
                <div
                  class={`relative transition-all duration-300 ${getAnimationClass()} ${
                    props.config.compactMode
                      ? "p-2 bg-gray-900/80 rounded border border-white/10"
                      : "p-4 bg-gradient-to-br from-gray-900/95 to-gray-800/95 rounded-lg border border-white/20 backdrop-blur-lg shadow-lg"
                  }`}
                  style={{ "animation-delay": `${index() * 100}ms` }}
                >
                  <Show when={!props.config.compactMode}>
                    <div class="absolute inset-0 rounded-lg bg-linear-to-r from-purple-500/20 to-pink-500/20 opacity-30 blur-sm"></div>
                  </Show>

                  <div class="relative z-10">
                    <Show
                      when={props.config.compactMode}
                      fallback={
                        <>
                          <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center space-x-2">
                              <span class="text-lg">{getEventIcon(event.type)}</span>
                              <div>
                                <div class={`font-semibold ${getEventColor(event.type)} ${fontClass()}`}>
                                  {event.username}
                                </div>
                                <div class="text-xs text-gray-400 uppercase tracking-wide">
                                  {getEventLabel(event.type)}
                                </div>
                              </div>
                            </div>

                            <Show when={props.config.showTimestamps}>
                              <div class={`text-xs text-gray-400 ${fontClass()}`}>
                                {formatTimestamp(event.timestamp)}
                              </div>
                            </Show>
                          </div>

                          <Show
                            when={props.config.showAmounts && event.amount && event.type === "donation"}
                          >
                            <div class="mb-2">
                              <div class={`font-bold text-green-400 ${fontClass()}`}>
                                {formatAmount(event.amount, event.currency)}
                              </div>
                            </div>
                          </Show>

                          <Show when={event.message && event.message.trim() !== ""}>
                            <div class={`text-gray-200 leading-relaxed ${fontClass()}`}>
                              {event.message}
                            </div>
                          </Show>

                          <Show when={props.config.showPlatform}>
                            <div class="flex justify-end mt-2">
                              <div class="px-2 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-sm border border-white/20 text-white">
                                {getPlatformName(event.platform.icon)}
                              </div>
                            </div>
                          </Show>
                        </>
                      }
                    >
                      <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2 flex-1 min-w-0">
                          <span class="text-sm">{getEventIcon(event.type)}</span>
                          <div class="text-sm font-medium text-white truncate">{event.username}</div>
                          <Show
                            when={props.config.showAmounts && event.amount && event.type === "donation"}
                          >
                            <div class="text-sm font-bold text-green-400">
                              {formatAmount(event.amount, event.currency)}
                            </div>
                          </Show>
                        </div>
                        <Show when={props.config.showTimestamps}>
                          <div class="text-xs text-gray-400 ml-2">{formatTimestamp(event.timestamp)}</div>
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
