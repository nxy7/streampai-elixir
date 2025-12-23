import { Title } from "@solidjs/meta";
import { createSignal, Show, createMemo } from "solid-js";
import { graphql } from "gql.tada";
import { client } from "~/lib/urql";
import PollWidget from "~/components/widgets/PollWidget";
import { button, card, text, input } from "~/styles/design-system";
import { useCurrentUser } from "~/lib/auth";
import { useWidgetConfig } from "~/lib/useElectric";

interface PollConfig {
  showTitle: boolean;
  showPercentages: boolean;
  showVoteCounts: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  winnerColor: string;
  animationType: 'none' | 'smooth' | 'bounce';
  highlightWinner: boolean;
  autoHideAfterEnd: boolean;
  hideDelay: number;
}

interface BackendPollConfig {
  show_title?: boolean;
  show_percentages?: boolean;
  show_vote_counts?: boolean;
  font_size?: string;
  primary_color?: string;
  secondary_color?: string;
  background_color?: string;
  text_color?: string;
  winner_color?: string;
  animation_type?: string;
  highlight_winner?: boolean;
  auto_hide_after_end?: boolean;
  hide_delay?: number;
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

const DEFAULT_CONFIG: PollConfig = {
  showTitle: true,
  showPercentages: true,
  showVoteCounts: true,
  fontSize: 'medium',
  primaryColor: '#9333ea',
  secondaryColor: '#3b82f6',
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  winnerColor: '#fbbf24',
  animationType: 'smooth',
  highlightWinner: true,
  autoHideAfterEnd: false,
  hideDelay: 10
};

function parseBackendConfig(backendConfig: BackendPollConfig): PollConfig {
  return {
    showTitle: backendConfig.show_title ?? DEFAULT_CONFIG.showTitle,
    showPercentages: backendConfig.show_percentages ?? DEFAULT_CONFIG.showPercentages,
    showVoteCounts: backendConfig.show_vote_counts ?? DEFAULT_CONFIG.showVoteCounts,
    fontSize: (backendConfig.font_size as PollConfig['fontSize']) ?? DEFAULT_CONFIG.fontSize,
    primaryColor: backendConfig.primary_color ?? DEFAULT_CONFIG.primaryColor,
    secondaryColor: backendConfig.secondary_color ?? DEFAULT_CONFIG.secondaryColor,
    backgroundColor: backendConfig.background_color ?? DEFAULT_CONFIG.backgroundColor,
    textColor: backendConfig.text_color ?? DEFAULT_CONFIG.textColor,
    winnerColor: backendConfig.winner_color ?? DEFAULT_CONFIG.winnerColor,
    animationType: (backendConfig.animation_type as PollConfig['animationType']) ?? DEFAULT_CONFIG.animationType,
    highlightWinner: backendConfig.highlight_winner ?? DEFAULT_CONFIG.highlightWinner,
    autoHideAfterEnd: backendConfig.auto_hide_after_end ?? DEFAULT_CONFIG.autoHideAfterEnd,
    hideDelay: backendConfig.hide_delay ?? DEFAULT_CONFIG.hideDelay
  };
}

const DEMO_POLL_ACTIVE = {
  id: 'demo-1',
  title: 'Which game should we play next?',
  status: 'active' as const,
  options: [
    { id: '1', text: 'League of Legends', votes: 145 },
    { id: '2', text: 'Valorant', votes: 203 },
    { id: '3', text: 'Minecraft', votes: 89 },
    { id: '4', text: 'Among Us', votes: 56 }
  ],
  totalVotes: 493,
  createdAt: new Date(),
  endsAt: new Date(Date.now() + 5 * 60 * 1000)
};

const DEMO_POLL_ENDED = {
  id: 'demo-2',
  title: 'Which game should we play next?',
  status: 'ended' as const,
  options: [
    { id: '1', text: 'League of Legends', votes: 145 },
    { id: '2', text: 'Valorant', votes: 203 },
    { id: '3', text: 'Minecraft', votes: 89 },
    { id: '4', text: 'Among Us', votes: 56 }
  ],
  totalVotes: 493,
  createdAt: new Date()
};

export default function PollWidgetSettings() {
  const { user, isLoading } = useCurrentUser();
  const userId = createMemo(() => user()?.id);

  const widgetConfigQuery = useWidgetConfig<BackendPollConfig>(
    userId,
    () => "poll_widget"
  );

  const [saving, setSaving] = createSignal(false);
  const [saveMessage, setSaveMessage] = createSignal<string | null>(null);
  const [localOverrides, setLocalOverrides] = createSignal<Partial<PollConfig>>({});
  const [demoMode, setDemoMode] = createSignal<'active' | 'ended'>('active');

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
      show_title: currentConfig.showTitle,
      show_percentages: currentConfig.showPercentages,
      show_vote_counts: currentConfig.showVoteCounts,
      font_size: currentConfig.fontSize,
      primary_color: currentConfig.primaryColor,
      secondary_color: currentConfig.secondaryColor,
      background_color: currentConfig.backgroundColor,
      text_color: currentConfig.textColor,
      winner_color: currentConfig.winnerColor,
      animation_type: currentConfig.animationType,
      highlight_winner: currentConfig.highlightWinner,
      auto_hide_after_end: currentConfig.autoHideAfterEnd,
      hide_delay: currentConfig.hideDelay
    };

    const result = await client.mutation(SAVE_WIDGET_CONFIG, {
      input: {
        userId: userId(),
        type: "poll_widget",
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

  function updateConfig<K extends keyof PollConfig>(field: K, value: PollConfig[K]) {
    setLocalOverrides((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="mb-8">
          <h1 class={text.h1}>Poll Widget Settings</h1>
          <p class={text.body + " mt-2"}>Configure your interactive poll widget for live voting on stream.</p>
        </div>

        <Show when={!loading()} fallback={<div>Loading configuration...</div>}>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class={card.default}>
              <h2 class={text.h2 + " mb-6"}>Configuration</h2>

              <div class="space-y-6">
                <div>
                  <h3 class={text.h3 + " mb-3"}>Display Options</h3>
                  <div class="space-y-3">
                    <label class="flex items-center">
                      <input
                        type="checkbox"
                        checked={config().showTitle}
                        onChange={(e) => updateConfig("showTitle", e.target.checked)}
                        class="mr-2"
                      />
                      <span>Show Poll Title</span>
                    </label>

                    <label class="flex items-center">
                      <input
                        type="checkbox"
                        checked={config().showPercentages}
                        onChange={(e) => updateConfig("showPercentages", e.target.checked)}
                        class="mr-2"
                      />
                      <span>Show Percentages</span>
                    </label>

                    <label class="flex items-center">
                      <input
                        type="checkbox"
                        checked={config().showVoteCounts}
                        onChange={(e) => updateConfig("showVoteCounts", e.target.checked)}
                        class="mr-2"
                      />
                      <span>Show Vote Counts</span>
                    </label>

                    <label class="flex items-center">
                      <input
                        type="checkbox"
                        checked={config().highlightWinner}
                        onChange={(e) => updateConfig("highlightWinner", e.target.checked)}
                        class="mr-2"
                      />
                      <span>Highlight Leading Option</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label class="block mb-2">
                    <span class={text.label}>Font Size</span>
                    <select
                      class={input.select + " mt-1"}
                      value={config().fontSize}
                      onChange={(e) => updateConfig("fontSize", e.target.value as any)}
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                      <option value="extra-large">Extra Large</option>
                    </select>
                  </label>
                </div>

                <div>
                  <label class="block mb-2">
                    <span class={text.label}>Animation Type</span>
                    <select
                      class={input.select + " mt-1"}
                      value={config().animationType}
                      onChange={(e) => updateConfig("animationType", e.target.value as any)}
                    >
                      <option value="none">None</option>
                      <option value="smooth">Smooth</option>
                      <option value="bounce">Bounce</option>
                    </select>
                  </label>
                </div>

                <div>
                  <h3 class={text.h3 + " mb-3"}>Colors</h3>
                  <div class="space-y-3">
                    <label class="block">
                      <span class={text.label}>Primary Color (Progress Bars)</span>
                      <input
                        type="color"
                        class={input.text + " mt-1"}
                        value={config().primaryColor}
                        onInput={(e) => updateConfig("primaryColor", e.target.value)}
                      />
                    </label>

                    <label class="block">
                      <span class={text.label}>Secondary Color</span>
                      <input
                        type="color"
                        class={input.text + " mt-1"}
                        value={config().secondaryColor}
                        onInput={(e) => updateConfig("secondaryColor", e.target.value)}
                      />
                    </label>

                    <label class="block">
                      <span class={text.label}>Winner Color (Highlight)</span>
                      <input
                        type="color"
                        class={input.text + " mt-1"}
                        value={config().winnerColor}
                        onInput={(e) => updateConfig("winnerColor", e.target.value)}
                      />
                    </label>

                    <label class="block">
                      <span class={text.label}>Background Color</span>
                      <input
                        type="color"
                        class={input.text + " mt-1"}
                        value={config().backgroundColor}
                        onInput={(e) => updateConfig("backgroundColor", e.target.value)}
                      />
                    </label>

                    <label class="block">
                      <span class={text.label}>Text Color</span>
                      <input
                        type="color"
                        class={input.text + " mt-1"}
                        value={config().textColor}
                        onInput={(e) => updateConfig("textColor", e.target.value)}
                      />
                    </label>
                  </div>
                </div>

                <div class="pt-4 border-t border-gray-200">
                  <button
                    class={button.primary}
                    onClick={handleSave}
                    disabled={saving()}
                  >
                    {saving() ? "Saving..." : "Save Configuration"}
                  </button>

                  <Show when={saveMessage()}>
                    <p class="mt-2 text-sm" classList={{
                      "text-green-600": saveMessage()?.includes("success"),
                      "text-red-600": saveMessage()?.includes("Error")
                    }}>
                      {saveMessage()}
                    </p>
                  </Show>
                </div>
              </div>
            </div>

            <div class="space-y-6">
              <div class={card.default}>
                <h2 class={text.h2 + " mb-4"}>Preview</h2>

                <div class="mb-4">
                  <label class="block mb-2">
                    <span class={text.label}>Preview Mode</span>
                    <select
                      class={input.select + " mt-1"}
                      value={demoMode()}
                      onChange={(e) => setDemoMode(e.target.value as any)}
                    >
                      <option value="active">Active Poll</option>
                      <option value="ended">Ended Poll (Results)</option>
                    </select>
                  </label>
                </div>

                <div class="bg-gray-900 p-8 rounded-lg">
                  <PollWidget
                    config={config()}
                    pollStatus={demoMode() === 'active' ? DEMO_POLL_ACTIVE : DEMO_POLL_ENDED}
                  />
                </div>
              </div>

              <div class={card.default}>
                <h2 class={text.h3 + " mb-3"}>OBS Browser Source</h2>
                <p class={text.helper + " mb-3"}>
                  Add this URL as a Browser Source in OBS:
                </p>
                <div class="bg-gray-100 p-3 rounded border border-gray-300">
                  <code class="text-sm break-all">
                    {window.location.origin}/w/poll/{userId()}
                  </code>
                </div>
                <p class={text.helper + " mt-2"}>
                  Recommended size: 600x400 pixels
                </p>
              </div>
            </div>
          </div>
        </Show>
      </div>
    </>
  );
}
