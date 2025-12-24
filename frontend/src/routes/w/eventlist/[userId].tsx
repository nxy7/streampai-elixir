import { createSignal, onMount, onCleanup, Show } from "solid-js";
import { useParams } from "@solidjs/router";
import { getWidgetConfig } from "~/sdk/ash_rpc";
import EventListWidget from "~/components/widgets/EventListWidget";

interface StreamEvent {
  id: string;
  type: "donation" | "follow" | "subscription" | "raid" | "chat_message";
  username: string;
  message?: string;
  amount?: number;
  currency?: string;
  timestamp: Date;
  platform: { icon: string; color: string };
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

const DEFAULT_CONFIG: EventListConfig = {
  animationType: "fade",
  maxEvents: 10,
  eventTypes: ["donation", "follow", "subscription", "raid"],
  showTimestamps: false,
  showPlatform: false,
  showAmounts: true,
  fontSize: "medium",
  compactMode: true,
};

export default function EventListDisplay() {
  const params = useParams<{ userId: string }>();
  const [config, setConfig] = createSignal<EventListConfig | null>(null);
  const [events] = createSignal<StreamEvent[]>([]);

  async function loadConfig() {
    const userId = params.userId;
    if (!userId) return;

    const result = await getWidgetConfig({
      input: { userId, type: "eventlist_widget" },
      fields: ["id", "config"],
      fetchOptions: { credentials: "include" },
    });

    if (result.success && result.data.config) {
      const loadedConfig = result.data.config;
      setConfig({
        animationType: loadedConfig.animation_type || DEFAULT_CONFIG.animationType,
        maxEvents: loadedConfig.max_events || DEFAULT_CONFIG.maxEvents,
        eventTypes: loadedConfig.event_types || DEFAULT_CONFIG.eventTypes,
        showTimestamps: loadedConfig.show_timestamps ?? DEFAULT_CONFIG.showTimestamps,
        showPlatform: loadedConfig.show_platform ?? DEFAULT_CONFIG.showPlatform,
        showAmounts: loadedConfig.show_amounts ?? DEFAULT_CONFIG.showAmounts,
        fontSize: loadedConfig.font_size || DEFAULT_CONFIG.fontSize,
        compactMode: loadedConfig.compact_mode ?? DEFAULT_CONFIG.compactMode,
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
            <EventListWidget config={cfg()} events={events()} />
          </div>
        )}
      </Show>
    </div>
  );
}
