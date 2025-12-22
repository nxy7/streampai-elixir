import { Title } from "@solidjs/meta";
import { createSignal, onMount, onCleanup, Show } from "solid-js";
import { graphql } from "gql.tada";
import { client } from "~/lib/urql";
import ViewerCountWidget from "~/components/widgets/ViewerCountWidget";
import { button, card, text, input as designInput } from "~/styles/design-system";
import { defaultConfig, generateViewerData, generateViewerUpdate, type ViewerCountConfig, type ViewerData } from "~/lib/fake/viewer-count";

const GET_WIDGET_CONFIG = graphql(`
  query GetWidgetConfig($userId: ID!, $type: String!) {
    widgetConfig(userId: $userId, type: $type) {
      id
      config
    }
  }
`);

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

const GET_CURRENT_USER = graphql(`
  query GetCurrentUser {
    currentUser {
      id
    }
  }
`);

export default function ViewerCountSettings() {
  const [config, setConfig] = createSignal<ViewerCountConfig>(defaultConfig());
  const [currentData, setCurrentData] = createSignal<ViewerData>(generateViewerData());
  const [loading, setLoading] = createSignal(true);
  const [saving, setSaving] = createSignal(false);
  const [saveMessage, setSaveMessage] = createSignal<string | null>(null);
  const [userId, setUserId] = createSignal<string | null>(null);

  let demoInterval: number | undefined;

  onMount(async () => {
    const userResult = await client.query(GET_CURRENT_USER, {});

    if (userResult.data?.currentUser?.id) {
      const currentUserId = userResult.data.currentUser.id;
      setUserId(currentUserId);

      const result = await client.query(GET_WIDGET_CONFIG, {
        userId: currentUserId,
        type: "viewer_count_widget",
      });

      if (result.data?.widgetConfig?.config) {
        const loadedConfig = JSON.parse(result.data.widgetConfig.config);
        setConfig(loadedConfig);
      }
    }

    setLoading(false);

    demoInterval = window.setInterval(() => {
      const current = currentData();
      setCurrentData(generateViewerUpdate(current));
    }, 3000);
  });

  onCleanup(() => {
    if (demoInterval) {
      clearInterval(demoInterval);
    }
  });

  async function handleSave() {
    if (!userId()) {
      setSaveMessage("Error: Not logged in");
      return;
    }

    setSaving(true);
    setSaveMessage(null);

    const result = await client.mutation(SAVE_WIDGET_CONFIG, {
      input: {
        userId: userId()!,
        type: "viewer_count_widget",
        config: JSON.stringify(config()),
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

  function updateConfig(updates: Partial<ViewerCountConfig>) {
    setConfig((prev) => ({ ...prev, ...updates }));
  }

  function copyUrlToClipboard() {
    const url = `${window.location.origin}/w/viewer-count/${userId()}`;
    navigator.clipboard.writeText(url);
    alert("URL copied to clipboard!");
  }

  return (
    <>
      <div class="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 class={text.h1}>Viewer Count Widget</h1>
          <p class={text.muted}>Configure your viewer count widget and OBS browser source URL generation</p>
        </div>

        <Show when={!loading()} fallback={<div>Loading...</div>}>
          <div class={card.default}>
            <h2 class={text.h2}>Live Preview</h2>
            <p class={text.muted}>Preview updates every 3 seconds with mock data</p>
            <div class="mt-4 bg-gray-900 border border-gray-200 rounded p-4 min-h-64 overflow-hidden relative">
              <ViewerCountWidget config={config()} data={currentData()} id="preview-viewer-count-widget" />
            </div>

            <div class="mt-4 space-y-2">
              <h3 class={text.h3}>OBS Browser Source URL</h3>
              <div class="flex gap-2">
                <input
                  type="text"
                  readonly
                  class={designInput.text}
                  value={`${window.location.origin}/w/viewer-count/${userId() || "USER_ID"}`}
                />
                <button
                  class={button.secondary}
                  onClick={copyUrlToClipboard}
                  disabled={!userId()}
                >
                  Copy URL
                </button>
              </div>
              <p class={text.helper}>
                Recommended settings: 800x200 pixels
              </p>
            </div>
          </div>

          <div class={card.default}>
            <h2 class={text.h2}>Configuration Options</h2>

            <div class="mt-6 space-y-6">
              <div>
                <h3 class={text.h3}>Display Options</h3>
                <div class="mt-4 space-y-4">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config().show_total}
                      onChange={(e) => updateConfig({ show_total: e.currentTarget.checked })}
                      class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span class="text-sm font-medium text-gray-700">Show total viewer count</span>
                  </label>

                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config().show_platforms}
                      onChange={(e) => updateConfig({ show_platforms: e.currentTarget.checked })}
                      class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span class="text-sm font-medium text-gray-700">Show platform breakdown</span>
                  </label>

                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config().animation_enabled}
                      onChange={(e) => updateConfig({ animation_enabled: e.currentTarget.checked })}
                      class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span class="text-sm font-medium text-gray-700">Enable smooth number animations</span>
                  </label>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Viewer label
                    </label>
                    <input
                      type="text"
                      class={designInput.text}
                      value={config().viewer_label}
                      onInput={(e) => updateConfig({ viewer_label: e.currentTarget.value })}
                      placeholder="viewers"
                    />
                    <p class={text.helper}>Text displayed next to the viewer count</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 class={text.h3}>Appearance</h3>
                <div class="mt-4 space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Display style
                    </label>
                    <select
                      class={designInput.text}
                      value={config().display_style}
                      onChange={(e) => updateConfig({ display_style: e.currentTarget.value as any })}
                    >
                      <option value="minimal">Minimal (total only)</option>
                      <option value="detailed">Detailed (list view)</option>
                      <option value="cards">Cards (grid view)</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Font size
                    </label>
                    <select
                      class={designInput.text}
                      value={config().font_size}
                      onChange={(e) => updateConfig({ font_size: e.currentTarget.value as any })}
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Icon Color
                    </label>
                    <div class="flex gap-2">
                      <input
                        type="color"
                        class="h-10 w-20 cursor-pointer rounded border border-gray-300"
                        value={config().icon_color}
                        onInput={(e) => updateConfig({ icon_color: e.currentTarget.value })}
                      />
                      <input
                        type="text"
                        class={designInput.text}
                        value={config().icon_color}
                        onInput={(e) => updateConfig({ icon_color: e.currentTarget.value })}
                      />
                    </div>
                  </div>
                </div>
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
            <h2 class={text.h2}>Usage Instructions</h2>
            <div class="mt-4 space-y-4">
              <ol class="list-decimal list-inside space-y-2 text-gray-700">
                <li>Copy the OBS Browser Source URL above</li>
                <li>In OBS, add a new "Browser" source</li>
                <li>Paste the URL into the URL field</li>
                <li>Set Width to 800 and Height to 200</li>
                <li>Click OK to add the widget to your scene</li>
              </ol>
              <p class={text.helper}>
                Viewer counts update automatically based on your stream platforms
              </p>
            </div>
          </div>
        </Show>
      </div>
    </>
  );
}
