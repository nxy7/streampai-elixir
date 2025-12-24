import { Title } from "@solidjs/meta";
import { createSignal, onMount, Show, createMemo } from "solid-js";
import { saveWidgetConfig } from "~/sdk/ash_rpc";
import ChatWidget from "~/components/widgets/ChatWidget";
import { button, card, text, input } from "~/styles/design-system";
import { useCurrentUser } from "~/lib/auth";
import { useWidgetConfig } from "~/lib/useElectric";

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

interface BackendChatConfig {
  font_size?: string;
  show_timestamps?: boolean;
  show_badges?: boolean;
  show_platform?: boolean;
  show_emotes?: boolean;
  max_messages?: number;
}

const DEFAULT_CONFIG: ChatConfig = {
  fontSize: "medium",
  showTimestamps: false,
  showBadges: true,
  showPlatform: true,
  showEmotes: true,
  maxMessages: 25,
};

function parseBackendConfig(backendConfig: BackendChatConfig): ChatConfig {
  return {
    fontSize: (backendConfig.font_size as ChatConfig["fontSize"]) || DEFAULT_CONFIG.fontSize,
    showTimestamps: backendConfig.show_timestamps ?? DEFAULT_CONFIG.showTimestamps,
    showBadges: backendConfig.show_badges ?? DEFAULT_CONFIG.showBadges,
    showPlatform: backendConfig.show_platform ?? DEFAULT_CONFIG.showPlatform,
    showEmotes: backendConfig.show_emotes ?? DEFAULT_CONFIG.showEmotes,
    maxMessages: backendConfig.max_messages || DEFAULT_CONFIG.maxMessages,
  };
}

const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    username: "StreamFan42",
    content: "Great stream! Love the new overlay design 🎉",
    timestamp: new Date(),
    platform: { icon: "twitch", color: "bg-purple-500" },
    badge: "SUB",
    badgeColor: "bg-purple-500 text-white",
    usernameColor: "#9333ea",
  },
  {
    id: "2",
    username: "GamerPro",
    content: "That was an amazing play! 🔥",
    timestamp: new Date(),
    platform: { icon: "youtube", color: "bg-red-500" },
    badge: "MOD",
    badgeColor: "bg-green-500 text-white",
    usernameColor: "#10b981",
  },
  {
    id: "3",
    username: "ChatUser99",
    content: "First time here, really enjoying the stream!",
    timestamp: new Date(),
    platform: { icon: "twitch", color: "bg-purple-500" },
    usernameColor: "#3b82f6",
  },
];

export default function ChatSettings() {
  const { user, isLoading } = useCurrentUser();
  const userId = createMemo(() => user()?.id);

  const widgetConfigQuery = useWidgetConfig<BackendChatConfig>(
    userId,
    () => "chat_widget"
  );

  const [messages, setMessages] = createSignal<ChatMessage[]>(MOCK_MESSAGES);
  const [saving, setSaving] = createSignal(false);
  const [saveMessage, setSaveMessage] = createSignal<string | null>(null);
  const [localOverrides, setLocalOverrides] = createSignal<Partial<ChatConfig>>({});

  const config = createMemo(() => {
    const syncedConfig = widgetConfigQuery.data();
    const baseConfig = syncedConfig?.config
      ? parseBackendConfig(syncedConfig.config)
      : DEFAULT_CONFIG;
    return { ...baseConfig, ...localOverrides() };
  });

  const loading = createMemo(() => isLoading());

  onMount(() => {
    const interval = setInterval(() => {
      const newMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        username: ["StreamFan", "GamerPro", "ChatUser", "NewViewer"][Math.floor(Math.random() * 4)] + Math.floor(Math.random() * 100),
        content: [
          "This is awesome!",
          "Love the stream! 💖",
          "Amazing content!",
          "Keep it up! 🔥",
          "You're the best!",
        ][Math.floor(Math.random() * 5)],
        timestamp: new Date(),
        platform: { icon: ["twitch", "youtube"][Math.floor(Math.random() * 2)], color: ["bg-purple-500", "bg-red-500"][Math.floor(Math.random() * 2)] },
        badge: Math.random() > 0.5 ? ["SUB", "MOD", "VIP"][Math.floor(Math.random() * 3)] : undefined,
        badgeColor: Math.random() > 0.5 ? "bg-purple-500 text-white" : undefined,
        usernameColor: ["#9333ea", "#10b981", "#3b82f6", "#ef4444"][Math.floor(Math.random() * 4)],
      };
      setMessages((prev) => [...prev, newMessage]);
    }, 3000);

    return () => clearInterval(interval);
  });

  async function handleSave() {
    if (!userId()) {
      setSaveMessage("Error: Not logged in");
      return;
    }

    setSaving(true);
    setSaveMessage(null);

    const currentConfig = config();
    const backendConfig = {
      font_size: currentConfig.fontSize,
      show_timestamps: currentConfig.showTimestamps,
      show_badges: currentConfig.showBadges,
      show_platform: currentConfig.showPlatform,
      show_emotes: currentConfig.showEmotes,
      max_messages: currentConfig.maxMessages,
    };

    const result = await saveWidgetConfig({
      input: {
        userId: userId()!,
        type: "chat_widget",
        config: backendConfig,
      },
      fields: ["id", "config"],
      fetchOptions: { credentials: "include" },
    });

    setSaving(false);

    if (!result.success) {
      setSaveMessage(`Error: ${result.errors[0]?.message || "Failed to save"}`);
    } else {
      setSaveMessage("Configuration saved successfully!");
      setLocalOverrides({});
      setTimeout(() => setSaveMessage(null), 3000);
    }
  }

  function updateConfig<K extends keyof ChatConfig>(field: K, value: ChatConfig[K]) {
    setLocalOverrides((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <>
      <div class="space-y-6">
        <div>
          <h1 class={text.h1}>Chat Widget Settings</h1>
          <p class={text.muted}>Configure your chat overlay widget for OBS</p>
        </div>

        <Show when={!loading()} fallback={<div>Loading...</div>}>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class={card.default}>
              <h2 class={text.h2}>Configuration</h2>
              <div class="mt-4 space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
                  <select
                    class={input.select}
                    value={config().fontSize}
                    onChange={(e) => updateConfig("fontSize", e.currentTarget.value as ChatConfig["fontSize"])}
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Max Messages</label>
                  <input
                    type="number"
                    class={input.text}
                    value={config().maxMessages}
                    onInput={(e) => updateConfig("maxMessages", parseInt(e.currentTarget.value))}
                    min="5"
                    max="100"
                  />
                  <p class={text.helper}>Maximum number of messages to display</p>
                </div>

                <div class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showTimestamps"
                    checked={config().showTimestamps}
                    onChange={(e) => updateConfig("showTimestamps", e.currentTarget.checked)}
                    class="rounded"
                  />
                  <label for="showTimestamps" class="text-sm font-medium text-gray-700">
                    Show Timestamps
                  </label>
                </div>

                <div class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showBadges"
                    checked={config().showBadges}
                    onChange={(e) => updateConfig("showBadges", e.currentTarget.checked)}
                    class="rounded"
                  />
                  <label for="showBadges" class="text-sm font-medium text-gray-700">
                    Show User Badges
                  </label>
                </div>

                <div class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showPlatform"
                    checked={config().showPlatform}
                    onChange={(e) => updateConfig("showPlatform", e.currentTarget.checked)}
                    class="rounded"
                  />
                  <label for="showPlatform" class="text-sm font-medium text-gray-700">
                    Show Platform Icons
                  </label>
                </div>

                <div class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showEmotes"
                    checked={config().showEmotes}
                    onChange={(e) => updateConfig("showEmotes", e.currentTarget.checked)}
                    class="rounded"
                  />
                  <label for="showEmotes" class="text-sm font-medium text-gray-700">
                    Show Emotes
                  </label>
                </div>

                <Show when={saveMessage()}>
                  <div
                    class={
                      saveMessage()?.startsWith("Error")
                        ? "p-3 bg-red-50 text-red-700 rounded-lg border border-red-200"
                        : "p-3 bg-green-50 text-green-700 rounded-lg border border-green-200"
                    }
                  >
                    {saveMessage()}
                  </div>
                </Show>

                <button class={button.primary} onClick={handleSave} disabled={saving()}>
                  {saving() ? "Saving..." : "Save Configuration"}
                </button>
              </div>
            </div>

            <div class={card.default}>
              <h2 class={text.h2}>Preview</h2>
              <div class="mt-4 space-y-4">
                <div class="bg-gray-900 rounded-lg overflow-hidden" style={{ height: "400px" }}>
                  <ChatWidget config={config()} messages={messages()} />
                </div>
                <div class="space-y-2">
                  <h3 class={text.h3}>OBS Browser Source URL</h3>
                  <p class={text.helper}>Add this URL to OBS as a Browser Source:</p>
                  <div class="bg-gray-100 p-3 rounded font-mono text-sm break-all">
                    {window.location.origin}/w/chat/{userId()}
                  </div>
                  <p class={text.helper}>Recommended Browser Source settings:</p>
                  <ul class={text.helper + " ml-4 list-disc"}>
                    <li>Width: 400</li>
                    <li>Height: 600</li>
                    <li>Enable "Shutdown source when not visible"</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Show>
      </div>
    </>
  );
}
