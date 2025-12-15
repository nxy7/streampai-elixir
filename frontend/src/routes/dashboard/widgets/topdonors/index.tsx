import { Title } from "@solidjs/meta";
import { createSignal, onMount, Show } from "solid-js";
import { gql } from "@urql/solid";
import { client } from "~/lib/urql";
import TopDonorsWidget from "~/components/widgets/TopDonorsWidget";
import { button, card, text, input } from "~/styles/design-system";

interface Donor {
  id: string;
  username: string;
  amount: number;
  currency: string;
}

interface TopDonorsConfig {
  title: string;
  topCount: number;
  fontSize: number;
  showAmounts: boolean;
  showRanking: boolean;
  backgroundColor: string;
  textColor: string;
  highlightColor: string;
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

const DEFAULT_CONFIG: TopDonorsConfig = {
  title: "🏆 Top Donors",
  topCount: 10,
  fontSize: 16,
  showAmounts: true,
  showRanking: true,
  backgroundColor: "#1f2937",
  textColor: "#ffffff",
  highlightColor: "#ffd700",
};

const MOCK_DONORS: Donor[] = [
  { id: "1", username: "GeneroussUser", amount: 2500.0, currency: "$" },
  { id: "2", username: "MegaDonor", amount: 1800.0, currency: "$" },
  { id: "3", username: "TopSupporter", amount: 1200.0, currency: "$" },
  { id: "4", username: "Contributor", amount: 750.0, currency: "$" },
  { id: "5", username: "FanSupport", amount: 500.0, currency: "$" },
  { id: "6", username: "StreamFan", amount: 350.0, currency: "$" },
  { id: "7", username: "Donor7", amount: 250.0, currency: "$" },
  { id: "8", username: "Supporter8", amount: 150.0, currency: "$" },
  { id: "9", username: "User9", amount: 100.0, currency: "$" },
  { id: "10", username: "Viewer10", amount: 75.0, currency: "$" },
];

export default function TopDonorsSettings() {
  const [config, setConfig] = createSignal<TopDonorsConfig>(DEFAULT_CONFIG);
  const [donors, setDonors] = createSignal<Donor[]>(MOCK_DONORS);
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
        type: "top_donors_widget",
      });

      if (result.data?.widgetConfig?.config) {
        const loadedConfig = JSON.parse(result.data.widgetConfig.config);
        setConfig({
          title: loadedConfig.title || DEFAULT_CONFIG.title,
          topCount: loadedConfig.top_count || DEFAULT_CONFIG.topCount,
          fontSize: loadedConfig.font_size || DEFAULT_CONFIG.fontSize,
          showAmounts: loadedConfig.show_amounts ?? DEFAULT_CONFIG.showAmounts,
          showRanking: loadedConfig.show_ranking ?? DEFAULT_CONFIG.showRanking,
          backgroundColor: loadedConfig.background_color || DEFAULT_CONFIG.backgroundColor,
          textColor: loadedConfig.text_color || DEFAULT_CONFIG.textColor,
          highlightColor: loadedConfig.highlight_color || DEFAULT_CONFIG.highlightColor,
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
      title: config().title,
      top_count: config().topCount,
      font_size: config().fontSize,
      show_amounts: config().showAmounts,
      show_ranking: config().showRanking,
      background_color: config().backgroundColor,
      text_color: config().textColor,
      highlight_color: config().highlightColor,
    };

    const result = await client.mutation(SAVE_WIDGET_CONFIG, {
      input: {
        type: "top_donors_widget",
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

  function updateConfig<K extends keyof TopDonorsConfig>(field: K, value: TopDonorsConfig[K]) {
    setConfig((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <>
      <div class="space-y-6">
        <div>
          <h1 class={text.h1}>Top Donors Widget Settings</h1>
          <p class={text.muted}>Configure your top donors leaderboard widget for OBS</p>
        </div>

        <Show when={!loading()} fallback={<div>Loading...</div>}>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class={card.default}>
              <h2 class={text.h2}>Configuration</h2>
              <div class="mt-4 space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Widget Title</label>
                  <input
                    type="text"
                    class={input.text}
                    value={config().title}
                    onInput={(e) => updateConfig("title", e.currentTarget.value)}
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Top Count</label>
                  <select
                    class={input.select}
                    value={config().topCount}
                    onChange={(e) => updateConfig("topCount", parseInt(e.currentTarget.value))}
                  >
                    <option value="3">Top 3</option>
                    <option value="5">Top 5</option>
                    <option value="10">Top 10</option>
                    <option value="15">Top 15</option>
                    <option value="20">Top 20</option>
                  </select>
                  <p class={text.helper}>Number of top donors to display</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Font Size (px)</label>
                  <input
                    type="number"
                    class={input.text}
                    value={config().fontSize}
                    onInput={(e) => updateConfig("fontSize", parseInt(e.currentTarget.value))}
                    min="10"
                    max="32"
                  />
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
                  <label class="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
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
                    Highlight Color
                  </label>
                  <div class="flex gap-2">
                    <input
                      type="color"
                      class="h-10 w-20 cursor-pointer rounded border border-gray-300"
                      value={config().highlightColor}
                      onInput={(e) => updateConfig("highlightColor", e.currentTarget.value)}
                    />
                    <input
                      type="text"
                      class={input.text}
                      value={config().highlightColor}
                      onInput={(e) => updateConfig("highlightColor", e.currentTarget.value)}
                    />
                  </div>
                  <p class={text.helper}>Used for podium positions (top 3)</p>
                </div>

                <div class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showAmounts"
                    checked={config().showAmounts}
                    onChange={(e) => updateConfig("showAmounts", e.currentTarget.checked)}
                    class="rounded"
                  />
                  <label for="showAmounts" class="text-sm font-medium text-gray-700">
                    Show Donation Amounts
                  </label>
                </div>

                <div class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showRanking"
                    checked={config().showRanking}
                    onChange={(e) => updateConfig("showRanking", e.currentTarget.checked)}
                    class="rounded"
                  />
                  <label for="showRanking" class="text-sm font-medium text-gray-700">
                    Show Ranking Numbers
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
                <div
                  class="bg-gray-900 rounded-lg flex items-center justify-center"
                  style={{ height: "600px" }}
                >
                  <TopDonorsWidget config={config()} donors={donors()} />
                </div>
                <div class="space-y-2">
                  <h3 class={text.h3}>OBS Browser Source URL</h3>
                  <p class={text.helper}>Add this URL to OBS as a Browser Source:</p>
                  <div class="bg-gray-100 p-3 rounded font-mono text-sm break-all">
                    {window.location.origin}/w/topdonors/{userId()}
                  </div>
                  <p class={text.helper}>Recommended Browser Source settings:</p>
                  <ul class={text.helper + " ml-4 list-disc"}>
                    <li>Width: 400</li>
                    <li>Height: 800</li>
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
