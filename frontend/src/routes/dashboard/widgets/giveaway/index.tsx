import { Title } from "@solidjs/meta";
import { createSignal, Show, createMemo } from "solid-js";
import { graphql } from "gql.tada";
import { client } from "~/lib/urql";
import GiveawayWidget from "~/components/widgets/GiveawayWidget";
import { button, card, text, input } from "~/styles/design-system";
import { useCurrentUser } from "~/lib/auth";
import { useWidgetConfig } from "~/lib/useElectric";

interface GiveawayConfig {
  showTitle: boolean;
  title: string;
  showDescription: boolean;
  description: string;
  activeLabel: string;
  inactiveLabel: string;
  winnerLabel: string;
  entryMethodText: string;
  showEntryMethod: boolean;
  showProgressBar: boolean;
  targetParticipants: number;
  patreonMultiplier: number;
  patreonBadgeText: string;
  winnerAnimation: 'fade' | 'slide' | 'bounce' | 'confetti';
  titleColor: string;
  textColor: string;
  backgroundColor: string;
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  showPatreonInfo: boolean;
}

interface BackendGiveawayConfig {
  show_title?: boolean;
  title?: string;
  show_description?: boolean;
  description?: string;
  active_label?: string;
  inactive_label?: string;
  winner_label?: string;
  entry_method_text?: string;
  show_entry_method?: boolean;
  show_progress_bar?: boolean;
  target_participants?: number;
  patreon_multiplier?: number;
  patreon_badge_text?: string;
  winner_animation?: string;
  title_color?: string;
  text_color?: string;
  background_color?: string;
  accent_color?: string;
  font_size?: string;
  show_patreon_info?: boolean;
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

const DEFAULT_CONFIG: GiveawayConfig = {
  showTitle: true,
  title: "🎉 Giveaway",
  showDescription: true,
  description: "Join now for a chance to win!",
  activeLabel: "Giveaway Active",
  inactiveLabel: "No Active Giveaway",
  winnerLabel: "Winner!",
  entryMethodText: "Type !join to enter",
  showEntryMethod: true,
  showProgressBar: true,
  targetParticipants: 100,
  patreonMultiplier: 2,
  patreonBadgeText: "Patreon",
  winnerAnimation: 'confetti',
  titleColor: '#9333ea',
  textColor: '#1f2937',
  backgroundColor: '#ffffff',
  accentColor: '#10b981',
  fontSize: 'medium',
  showPatreonInfo: true
};

function parseBackendConfig(backendConfig: BackendGiveawayConfig): GiveawayConfig {
  return {
    showTitle: backendConfig.show_title ?? DEFAULT_CONFIG.showTitle,
    title: backendConfig.title ?? DEFAULT_CONFIG.title,
    showDescription: backendConfig.show_description ?? DEFAULT_CONFIG.showDescription,
    description: backendConfig.description ?? DEFAULT_CONFIG.description,
    activeLabel: backendConfig.active_label ?? DEFAULT_CONFIG.activeLabel,
    inactiveLabel: backendConfig.inactive_label ?? DEFAULT_CONFIG.inactiveLabel,
    winnerLabel: backendConfig.winner_label ?? DEFAULT_CONFIG.winnerLabel,
    entryMethodText: backendConfig.entry_method_text ?? DEFAULT_CONFIG.entryMethodText,
    showEntryMethod: backendConfig.show_entry_method ?? DEFAULT_CONFIG.showEntryMethod,
    showProgressBar: backendConfig.show_progress_bar ?? DEFAULT_CONFIG.showProgressBar,
    targetParticipants: backendConfig.target_participants ?? DEFAULT_CONFIG.targetParticipants,
    patreonMultiplier: backendConfig.patreon_multiplier ?? DEFAULT_CONFIG.patreonMultiplier,
    patreonBadgeText: backendConfig.patreon_badge_text ?? DEFAULT_CONFIG.patreonBadgeText,
    winnerAnimation: (backendConfig.winner_animation as GiveawayConfig['winnerAnimation']) ?? DEFAULT_CONFIG.winnerAnimation,
    titleColor: backendConfig.title_color ?? DEFAULT_CONFIG.titleColor,
    textColor: backendConfig.text_color ?? DEFAULT_CONFIG.textColor,
    backgroundColor: backendConfig.background_color ?? DEFAULT_CONFIG.backgroundColor,
    accentColor: backendConfig.accent_color ?? DEFAULT_CONFIG.accentColor,
    fontSize: (backendConfig.font_size as GiveawayConfig['fontSize']) ?? DEFAULT_CONFIG.fontSize,
    showPatreonInfo: backendConfig.show_patreon_info ?? DEFAULT_CONFIG.showPatreonInfo
  };
}

const DEMO_ACTIVE = {
  type: 'update' as const,
  participants: 47,
  patreons: 12,
  isActive: true
};

const DEMO_WINNER = {
  type: 'result' as const,
  winner: { username: 'StreamLegend42', isPatreon: true },
  totalParticipants: 89,
  patreonParticipants: 15
};

export default function GiveawayWidgetSettings() {
  const { user, isLoading } = useCurrentUser();
  const userId = createMemo(() => user()?.id);

  const widgetConfigQuery = useWidgetConfig<BackendGiveawayConfig>(
    userId,
    () => "giveaway_widget"
  );

  const [saving, setSaving] = createSignal(false);
  const [saveMessage, setSaveMessage] = createSignal<string | null>(null);
  const [localOverrides, setLocalOverrides] = createSignal<Partial<GiveawayConfig>>({});
  const [demoMode, setDemoMode] = createSignal<'active' | 'winner'>('active');

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
      title: currentConfig.title,
      show_description: currentConfig.showDescription,
      description: currentConfig.description,
      active_label: currentConfig.activeLabel,
      inactive_label: currentConfig.inactiveLabel,
      winner_label: currentConfig.winnerLabel,
      entry_method_text: currentConfig.entryMethodText,
      show_entry_method: currentConfig.showEntryMethod,
      show_progress_bar: currentConfig.showProgressBar,
      target_participants: currentConfig.targetParticipants,
      patreon_multiplier: currentConfig.patreonMultiplier,
      patreon_badge_text: currentConfig.patreonBadgeText,
      winner_animation: currentConfig.winnerAnimation,
      title_color: currentConfig.titleColor,
      text_color: currentConfig.textColor,
      background_color: currentConfig.backgroundColor,
      accent_color: currentConfig.accentColor,
      font_size: currentConfig.fontSize,
      show_patreon_info: currentConfig.showPatreonInfo
    };

    const result = await client.mutation(SAVE_WIDGET_CONFIG, {
      input: {
        userId: userId(),
        type: "giveaway_widget",
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

  function updateConfig<K extends keyof GiveawayConfig>(field: K, value: GiveawayConfig[K]) {
    setLocalOverrides((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="mb-8">
          <h1 class={text.h1}>Giveaway Widget Settings</h1>
          <p class={text.body + " mt-2"}>Configure your giveaway widget for viewer engagement.</p>
        </div>

        <Show when={!loading()} fallback={<div>Loading...</div>}>
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
                      <span>Show Title</span>
                    </label>
                    <label class="flex items-center">
                      <input
                        type="checkbox"
                        checked={config().showDescription}
                        onChange={(e) => updateConfig("showDescription", e.target.checked)}
                        class="mr-2"
                      />
                      <span>Show Description</span>
                    </label>
                    <label class="flex items-center">
                      <input
                        type="checkbox"
                        checked={config().showEntryMethod}
                        onChange={(e) => updateConfig("showEntryMethod", e.target.checked)}
                        class="mr-2"
                      />
                      <span>Show Entry Method</span>
                    </label>
                    <label class="flex items-center">
                      <input
                        type="checkbox"
                        checked={config().showProgressBar}
                        onChange={(e) => updateConfig("showProgressBar", e.target.checked)}
                        class="mr-2"
                      />
                      <span>Show Progress Bar</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label class="block mb-2">
                    <span class={text.label}>Title</span>
                    <input
                      type="text"
                      class={input.text + " mt-1"}
                      value={config().title}
                      onInput={(e) => updateConfig("title", e.target.value)}
                    />
                  </label>
                </div>

                <div>
                  <label class="block mb-2">
                    <span class={text.label}>Description</span>
                    <textarea
                      class={input.text + " mt-1"}
                      value={config().description}
                      onInput={(e) => updateConfig("description", e.target.value)}
                      rows={2}
                    />
                  </label>
                </div>

                <div>
                  <label class="block mb-2">
                    <span class={text.label}>Winner Animation</span>
                    <select
                      class={input.select + " mt-1"}
                      value={config().winnerAnimation}
                      onChange={(e) => updateConfig("winnerAnimation", e.target.value as any)}
                    >
                      <option value="fade">Fade</option>
                      <option value="slide">Slide</option>
                      <option value="bounce">Bounce</option>
                      <option value="confetti">Confetti</option>
                    </select>
                  </label>
                </div>

                <div class="pt-4 border-t border-gray-200">
                  <button class={button.primary} onClick={handleSave} disabled={saving()}>
                    {saving() ? "Saving..." : "Save Configuration"}
                  </button>
                  <Show when={saveMessage()}>
                    <p class="mt-2 text-sm text-green-600">{saveMessage()}</p>
                  </Show>
                </div>
              </div>
            </div>

            <div class="space-y-6">
              <div class={card.default}>
                <h2 class={text.h2 + " mb-4"}>Preview</h2>
                <div class="mb-4">
                  <select
                    class={input.select}
                    value={demoMode()}
                    onChange={(e) => setDemoMode(e.target.value as any)}
                  >
                    <option value="active">Active Giveaway</option>
                    <option value="winner">Winner Announcement</option>
                  </select>
                </div>
                <div class="bg-gray-900 p-8 rounded-lg">
                  <GiveawayWidget
                    config={config()}
                    event={demoMode() === 'active' ? DEMO_ACTIVE : DEMO_WINNER}
                  />
                </div>
              </div>

              <div class={card.default}>
                <h2 class={text.h3 + " mb-3"}>OBS Browser Source</h2>
                <div class="bg-gray-100 p-3 rounded border border-gray-300">
                  <code class="text-sm break-all">
                    {window.location.origin}/w/giveaway/{userId()}
                  </code>
                </div>
              </div>
            </div>
          </div>
        </Show>
      </div>
    </>
  );
}
