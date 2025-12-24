import { Title } from "@solidjs/meta";
import { createSignal, Show, createMemo } from "solid-js";
import { graphql } from "~/lib/graphql";
import { client } from "~/lib/urql";
import FollowerCountWidget from "~/components/widgets/FollowerCountWidget";
import { button, card, text, input } from "~/styles/design-system";
import { useCurrentUser } from "~/lib/auth";
import { useWidgetConfig } from "~/lib/useElectric";

interface FollowerCountConfig {
  label: string;
  fontSize: number;
  textColor: string;
  backgroundColor: string;
  showIcon: boolean;
  animateOnChange: boolean;
}

interface BackendFollowerCountConfig {
  label?: string;
  font_size?: number;
  text_color?: string;
  background_color?: string;
  show_icon?: boolean;
  animate_on_change?: boolean;
}

const SAVE_WIDGET_CONFIG = graphql(`
  mutation SaveWidgetConfig($input: SaveWidgetConfigInput!) {
    saveWidgetConfig(input: $input) {
      result {
        id
        config
      }
      errors {
        message
      }
    }
  }
`);

const DEFAULT_CONFIG: FollowerCountConfig = {
  label: "followers",
  fontSize: 32,
  textColor: "#ffffff",
  backgroundColor: "#9333ea",
  showIcon: true,
  animateOnChange: true,
};

function parseBackendConfig(backendConfig: BackendFollowerCountConfig): FollowerCountConfig {
  return {
    label: backendConfig.label || DEFAULT_CONFIG.label,
    fontSize: backendConfig.font_size || DEFAULT_CONFIG.fontSize,
    textColor: backendConfig.text_color || DEFAULT_CONFIG.textColor,
    backgroundColor: backendConfig.background_color || DEFAULT_CONFIG.backgroundColor,
    showIcon: backendConfig.show_icon ?? DEFAULT_CONFIG.showIcon,
    animateOnChange: backendConfig.animate_on_change ?? DEFAULT_CONFIG.animateOnChange,
  };
}

export default function FollowerCountSettings() {
  const { user, isLoading } = useCurrentUser();
  const userId = createMemo(() => user()?.id);

  const widgetConfigQuery = useWidgetConfig<BackendFollowerCountConfig>(
    userId,
    () => "follower_count_widget"
  );

  const [saving, setSaving] = createSignal(false);
  const [saveMessage, setSaveMessage] = createSignal<string | null>(null);
  const [localOverrides, setLocalOverrides] = createSignal<Partial<FollowerCountConfig>>({});

  const config = createMemo(() => {
    const syncedConfig = widgetConfigQuery.data();
    const baseConfig = syncedConfig?.config
      ? parseBackendConfig(syncedConfig.config)
      : DEFAULT_CONFIG;
    return { ...baseConfig, ...localOverrides() };
  });

  const loading = createMemo(() => isLoading());

  async function handleSave() {
    if (!userId()) {
      setSaveMessage("Error: Not logged in");
      return;
    }

    setSaving(true);
    setSaveMessage(null);

    const currentConfig = config();
    const backendConfig = {
      label: currentConfig.label,
      font_size: currentConfig.fontSize,
      text_color: currentConfig.textColor,
      background_color: currentConfig.backgroundColor,
      show_icon: currentConfig.showIcon,
      animate_on_change: currentConfig.animateOnChange,
    };

    const result = await client.mutation(SAVE_WIDGET_CONFIG, {
      input: {
        userId: userId(),
        type: "follower_count_widget",
        config: JSON.stringify(backendConfig),
      },
    }, { fetchOptions: { credentials: "include" } });

    setSaving(false);

    if (result.data?.saveWidgetConfig?.errors?.length > 0) {
      setSaveMessage(`Error: ${result.data.saveWidgetConfig.errors[0].message}`);
    } else if (result.data?.saveWidgetConfig?.result) {
      setSaveMessage("Configuration saved successfully!");
      setLocalOverrides({});
      setTimeout(() => setSaveMessage(null), 3000);
    } else {
      setSaveMessage("Error: Failed to save configuration");
    }
  }

  function updateConfig(field: keyof FollowerCountConfig, value: string | number | boolean) {
    setLocalOverrides((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <>
      <div class="space-y-6">
        <div>
          <h1 class={text.h1}>Follower Count Widget Settings</h1>
          <p class={text.muted}>Configure your follower count widget for OBS</p>
        </div>

        <Show when={!loading()} fallback={<div>Loading...</div>}>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class={card.default}>
              <h2 class={text.h2}>Configuration</h2>
              <div class="mt-4 space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Label
                  </label>
                  <input
                    type="text"
                    class={input.text}
                    value={config().label}
                    onInput={(e) => updateConfig("label", e.currentTarget.value)}
                    placeholder="followers"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Font Size (px)
                  </label>
                  <input
                    type="number"
                    class={input.text}
                    value={config().fontSize}
                    onInput={(e) => updateConfig("fontSize", parseInt(e.currentTarget.value))}
                    min="12"
                    max="96"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Text Color
                  </label>
                  <div class="flex gap-2">
                    <input
                      type="color"
                      class="h-10 w-20 cursor-pointer rounded border border-gray-300"
                      value={config().textColor}
                      onInput={(e) => updateConfig("textColor", e.currentTarget.value)}
                    />
                    <input
                      type="text"
                      class={input.text}
                      value={config().textColor}
                      onInput={(e) => updateConfig("textColor", e.currentTarget.value)}
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Background Color
                  </label>
                  <div class="flex gap-2">
                    <input
                      type="color"
                      class="h-10 w-20 cursor-pointer rounded border border-gray-300"
                      value={config().backgroundColor}
                      onInput={(e) => updateConfig("backgroundColor", e.currentTarget.value)}
                    />
                    <input
                      type="text"
                      class={input.text}
                      value={config().backgroundColor}
                      onInput={(e) => updateConfig("backgroundColor", e.currentTarget.value)}
                    />
                  </div>
                </div>

                <div>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config().showIcon}
                      onChange={(e) => updateConfig("showIcon", e.currentTarget.checked)}
                      class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span class="text-sm font-medium text-gray-700">Show User Icon</span>
                  </label>
                </div>

                <div>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config().animateOnChange}
                      onChange={(e) => updateConfig("animateOnChange", e.currentTarget.checked)}
                      class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span class="text-sm font-medium text-gray-700">Animate on Change</span>
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

                <button
                  class={button.primary}
                  onClick={handleSave}
                  disabled={saving()}
                >
                  {saving() ? "Saving..." : "Save Configuration"}
                </button>
              </div>
            </div>

            <div class={card.default}>
              <h2 class={text.h2}>Preview</h2>
              <div class="mt-4 space-y-4">
                <div class="bg-gray-900 p-8 rounded-lg flex items-center justify-center min-h-[200px]">
                  <FollowerCountWidget config={config()} count={5678} />
                </div>
                <div class="space-y-2">
                  <h3 class={text.h3}>OBS Browser Source URL</h3>
                  <p class={text.helper}>
                    Add this URL to OBS as a Browser Source:
                  </p>
                  <div class="bg-gray-100 p-3 rounded font-mono text-sm break-all">
                    {window.location.origin}/w/follower-count/{userId()}
                  </div>
                  <p class={text.helper}>
                    Recommended Browser Source settings:
                  </p>
                  <ul class={text.helper + " ml-4 list-disc"}>
                    <li>Width: 800</li>
                    <li>Height: 600</li>
                    <li>Enable "Shutdown source when not visible"</li>
                    <li>Enable "Refresh browser when scene becomes active"</li>
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
