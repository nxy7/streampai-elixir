import { Title } from "@solidjs/meta";
import { createSignal, onMount, Show } from "solid-js";
import { gql } from "@urql/solid";
import { client } from "~/lib/urql";
import PlaceholderWidget from "~/components/widgets/PlaceholderWidget";
import { button, card, text, input } from "~/styles/design-system";

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

const GET_WIDGET_CONFIG = gql`
  query GetWidgetConfig($userId: ID!, $type: String!) {
    widgetConfig(userId: $userId, type: $type) {
      id
      config
    }
  }
`;

const SAVE_WIDGET_CONFIG = gql`
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
`;

const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    currentUser {
      id
    }
  }
`;

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

export default function PlaceholderSettings() {
  const [config, setConfig] = createSignal<PlaceholderConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = createSignal(true);
  const [saving, setSaving] = createSignal(false);
  const [saveMessage, setSaveMessage] = createSignal<string | null>(null);
  const [userId, setUserId] = createSignal<string | null>(null);

  onMount(async () => {
    const userResult = await client.query(GET_CURRENT_USER, {});

    if (userResult.data?.currentUser?.id) {
      const currentUserId = userResult.data.currentUser.id;
      setUserId(currentUserId);

      const result = await client.query(GET_WIDGET_CONFIG, {
        userId: currentUserId,
        type: "placeholder_widget",
      });

      if (result.data?.widgetConfig?.config) {
        const loadedConfig = JSON.parse(result.data.widgetConfig.config);
        setConfig({
          message: loadedConfig.message || DEFAULT_CONFIG.message,
          fontSize: loadedConfig.font_size || DEFAULT_CONFIG.fontSize,
          textColor: loadedConfig.text_color || DEFAULT_CONFIG.textColor,
          backgroundColor: loadedConfig.background_color || DEFAULT_CONFIG.backgroundColor,
          borderColor: loadedConfig.border_color || DEFAULT_CONFIG.borderColor,
          borderWidth: loadedConfig.border_width || DEFAULT_CONFIG.borderWidth,
          padding: loadedConfig.padding || DEFAULT_CONFIG.padding,
          borderRadius: loadedConfig.border_radius || DEFAULT_CONFIG.borderRadius,
        });
      }
    }

    setLoading(false);
  });

  async function handleSave() {
    if (!userId()) {
      setSaveMessage("Error: Not logged in");
      return;
    }

    setSaving(true);
    setSaveMessage(null);

    const backendConfig = {
      message: config().message,
      font_size: config().fontSize,
      text_color: config().textColor,
      background_color: config().backgroundColor,
      border_color: config().borderColor,
      border_width: config().borderWidth,
      padding: config().padding,
      border_radius: config().borderRadius,
    };

    const result = await client.mutation(SAVE_WIDGET_CONFIG, {
      input: {
        type: "placeholder_widget",
        config: JSON.stringify(backendConfig),
      },
    });

    setSaving(false);

    if (result.data?.saveWidgetConfig?.errors?.length > 0) {
      setSaveMessage(`Error: ${result.data.saveWidgetConfig.errors[0].message}`);
    } else if (result.data?.saveWidgetConfig?.result) {
      setSaveMessage("Configuration saved successfully!");
      setTimeout(() => setSaveMessage(null), 3000);
    } else {
      setSaveMessage("Error: Failed to save configuration");
    }
  }

  function updateConfig(field: keyof PlaceholderConfig, value: string | number) {
    setConfig((prev) => ({ ...prev, [field]: value }));
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
