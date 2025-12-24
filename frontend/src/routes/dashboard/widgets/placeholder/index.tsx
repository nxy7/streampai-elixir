import { createSignal, Show, createEffect, createMemo } from "solid-js";
import { graphql } from "~/lib/graphql";
import { client } from "~/lib/urql";
import PlaceholderWidget from "~/components/widgets/PlaceholderWidget";
import { button, card, text, input } from "~/styles/design-system";
import { useCurrentUser } from "~/lib/auth";
import { useWidgetConfig } from "~/lib/useElectric";

interface PlaceholderConfig {
  message: string;
  fontSize: number;
  textColor: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  padding: number;
  borderRadius: number;
}

interface BackendPlaceholderConfig {
  message?: string;
  font_size?: number;
  text_color?: string;
  background_color?: string;
  border_color?: string;
  border_width?: number;
  padding?: number;
  border_radius?: number;
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

const DEFAULT_CONFIG: PlaceholderConfig = {
  message: "Placeholder Widget",
  fontSize: 24,
  textColor: "#ffffff",
  backgroundColor: "#9333ea",
  borderColor: "#ffffff",
  borderWidth: 2,
  padding: 16,
  borderRadius: 8,
};

function parseBackendConfig(backendConfig: BackendPlaceholderConfig): PlaceholderConfig {
  return {
    message: backendConfig.message || DEFAULT_CONFIG.message,
    fontSize: backendConfig.font_size || DEFAULT_CONFIG.fontSize,
    textColor: backendConfig.text_color || DEFAULT_CONFIG.textColor,
    backgroundColor: backendConfig.background_color || DEFAULT_CONFIG.backgroundColor,
    borderColor: backendConfig.border_color || DEFAULT_CONFIG.borderColor,
    borderWidth: backendConfig.border_width || DEFAULT_CONFIG.borderWidth,
    padding: backendConfig.padding || DEFAULT_CONFIG.padding,
    borderRadius: backendConfig.border_radius || DEFAULT_CONFIG.borderRadius,
  };
}

export default function PlaceholderSettings() {
  const { user, isLoading } = useCurrentUser();
  const userId = createMemo(() => user()?.id);

  const widgetConfigQuery = useWidgetConfig<BackendPlaceholderConfig>(
    userId,
    () => "placeholder_widget"
  );

  const [saving, setSaving] = createSignal(false);
  const [saveMessage, setSaveMessage] = createSignal<string | null>(null);
  const [localOverrides, setLocalOverrides] = createSignal<Partial<PlaceholderConfig>>({});

  // Config is synced from Electric, with local overrides applied on top
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
      message: currentConfig.message,
      font_size: currentConfig.fontSize,
      text_color: currentConfig.textColor,
      background_color: currentConfig.backgroundColor,
      border_color: currentConfig.borderColor,
      border_width: currentConfig.borderWidth,
      padding: currentConfig.padding,
      border_radius: currentConfig.borderRadius,
    };

    const result = await client.mutation(SAVE_WIDGET_CONFIG, {
      input: {
        userId: userId(),
        type: "placeholder_widget",
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

  function updateConfig(field: keyof PlaceholderConfig, value: string | number) {
    setLocalOverrides((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <>
      <div class="space-y-6">
        <div>
          <h1 class={text.h1}>Placeholder Widget Settings</h1>
          <p class={text.muted}>Configure your placeholder widget for OBS</p>
        </div>

        <Show when={!loading()} fallback={<div>Loading...</div>}>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class={card.default}>
              <h2 class={text.h2}>Configuration</h2>
              <div class="mt-4 space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <input
                    type="text"
                    class={input.text}
                    value={config().message}
                    onInput={(e) => updateConfig("message", e.currentTarget.value)}
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
                    min="8"
                    max="72"
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
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Border Color
                  </label>
                  <div class="flex gap-2">
                    <input
                      type="color"
                      class="h-10 w-20 cursor-pointer rounded border border-gray-300"
                      value={config().borderColor}
                      onInput={(e) => updateConfig("borderColor", e.currentTarget.value)}
                    />
                    <input
                      type="text"
                      class={input.text}
                      value={config().borderColor}
                      onInput={(e) => updateConfig("borderColor", e.currentTarget.value)}
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Border Width (px)
                  </label>
                  <input
                    type="number"
                    class={input.text}
                    value={config().borderWidth}
                    onInput={(e) => updateConfig("borderWidth", parseInt(e.currentTarget.value))}
                    min="0"
                    max="10"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Padding (px)
                  </label>
                  <input
                    type="number"
                    class={input.text}
                    value={config().padding}
                    onInput={(e) => updateConfig("padding", parseInt(e.currentTarget.value))}
                    min="0"
                    max="50"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Border Radius (px)
                  </label>
                  <input
                    type="number"
                    class={input.text}
                    value={config().borderRadius}
                    onInput={(e) => updateConfig("borderRadius", parseInt(e.currentTarget.value))}
                    min="0"
                    max="50"
                  />
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
                  <PlaceholderWidget config={config()} />
                </div>
                <div class="space-y-2">
                  <h3 class={text.h3}>OBS Browser Source URL</h3>
                  <p class={text.helper}>
                    Add this URL to OBS as a Browser Source:
                  </p>
                  <div class="bg-gray-100 p-3 rounded font-mono text-sm break-all">
                    {window.location.origin}/w/placeholder/{userId()}
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
