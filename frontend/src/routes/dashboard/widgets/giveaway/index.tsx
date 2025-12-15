import { Title } from "@solidjs/meta";
import { createSignal, onMount, Show } from "solid-js";
import GiveawayWidget from "~/components/widgets/GiveawayWidget";
import { button, card, text, input } from "~/styles/design-system";
import { getCurrentUserId, loadWidgetConfig, saveWidgetConfig } from "~/lib/widget-config";

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

export default function GiveawayWidgetSettings() {
  const [config, setConfig] = createSignal<GiveawayConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = createSignal(true);
  const [saving, setSaving] = createSignal(false);
  const [userId, setUserId] = createSignal<string | null>(null);
  const [saveMessage, setSaveMessage] = createSignal<string | null>(null);
  const [demoMode, setDemoMode] = createSignal<'active' | 'winner'>('active');

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

  onMount(async () => {
    const uid = await getCurrentUserId();
    if (uid) {
      setUserId(uid);
      const loadedConfig = await loadWidgetConfig<any>({ userId: uid, type: "giveaway_widget" });
      if (loadedConfig) {
        setConfig({
          showTitle: loadedConfig.show_title ?? DEFAULT_CONFIG.showTitle,
          title: loadedConfig.title ?? DEFAULT_CONFIG.title,
          showDescription: loadedConfig.show_description ?? DEFAULT_CONFIG.showDescription,
          description: loadedConfig.description ?? DEFAULT_CONFIG.description,
          activeLabel: loadedConfig.active_label ?? DEFAULT_CONFIG.activeLabel,
          inactiveLabel: loadedConfig.inactive_label ?? DEFAULT_CONFIG.inactiveLabel,
          winnerLabel: loadedConfig.winner_label ?? DEFAULT_CONFIG.winnerLabel,
          entryMethodText: loadedConfig.entry_method_text ?? DEFAULT_CONFIG.entryMethodText,
          showEntryMethod: loadedConfig.show_entry_method ?? DEFAULT_CONFIG.showEntryMethod,
          showProgressBar: loadedConfig.show_progress_bar ?? DEFAULT_CONFIG.showProgressBar,
          targetParticipants: loadedConfig.target_participants ?? DEFAULT_CONFIG.targetParticipants,
          patreonMultiplier: loadedConfig.patreon_multiplier ?? DEFAULT_CONFIG.patreonMultiplier,
          patreonBadgeText: loadedConfig.patreon_badge_text ?? DEFAULT_CONFIG.patreonBadgeText,
          winnerAnimation: loadedConfig.winner_animation ?? DEFAULT_CONFIG.winnerAnimation,
          titleColor: loadedConfig.title_color ?? DEFAULT_CONFIG.titleColor,
          textColor: loadedConfig.text_color ?? DEFAULT_CONFIG.textColor,
          backgroundColor: loadedConfig.background_color ?? DEFAULT_CONFIG.backgroundColor,
          accentColor: loadedConfig.accent_color ?? DEFAULT_CONFIG.accentColor,
          fontSize: loadedConfig.font_size ?? DEFAULT_CONFIG.fontSize,
          showPatreonInfo: loadedConfig.show_patreon_info ?? DEFAULT_CONFIG.showPatreonInfo
        });
      }
    }
    setLoading(false);
  });

  async function handleSave() {
    if (!userId()) return;
    setSaving(true);
    setSaveMessage(null);

    const result = await saveWidgetConfig({
      userId: userId()!,
      type: "giveaway_widget",
      config: {
        show_title: config().showTitle,
        title: config().title,
        show_description: config().showDescription,
        description: config().description,
        active_label: config().activeLabel,
        inactive_label: config().inactiveLabel,
        winner_label: config().winnerLabel,
        entry_method_text: config().entryMethodText,
        show_entry_method: config().showEntryMethod,
        show_progress_bar: config().showProgressBar,
        target_participants: config().targetParticipants,
        patreon_multiplier: config().patreonMultiplier,
        patreon_badge_text: config().patreonBadgeText,
        winner_animation: config().winnerAnimation,
        title_color: config().titleColor,
        text_color: config().textColor,
        background_color: config().backgroundColor,
        accent_color: config().accentColor,
        font_size: config().fontSize,
        show_patreon_info: config().showPatreonInfo
      }
    });

    setSaving(false);

    if (result.data?.saveWidgetConfig?.result) {
      setSaveMessage("Configuration saved successfully!");
      setTimeout(() => setSaveMessage(null), 3000);
    } else {
      setSaveMessage("Error saving configuration");
    }
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
                        onChange={(e) => setConfig({ ...config(), showTitle: e.target.checked })}
                        class="mr-2"
                      />
                      <span>Show Title</span>
                    </label>
                    <label class="flex items-center">
                      <input
                        type="checkbox"
                        checked={config().showDescription}
                        onChange={(e) => setConfig({ ...config(), showDescription: e.target.checked })}
                        class="mr-2"
                      />
                      <span>Show Description</span>
                    </label>
                    <label class="flex items-center">
                      <input
                        type="checkbox"
                        checked={config().showEntryMethod}
                        onChange={(e) => setConfig({ ...config(), showEntryMethod: e.target.checked })}
                        class="mr-2"
                      />
                      <span>Show Entry Method</span>
                    </label>
                    <label class="flex items-center">
                      <input
                        type="checkbox"
                        checked={config().showProgressBar}
                        onChange={(e) => setConfig({ ...config(), showProgressBar: e.target.checked })}
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
                      onInput={(e) => setConfig({ ...config(), title: e.target.value })}
                    />
                  </label>
                </div>

                <div>
                  <label class="block mb-2">
                    <span class={text.label}>Description</span>
                    <textarea
                      class={input.text + " mt-1"}
                      value={config().description}
                      onInput={(e) => setConfig({ ...config(), description: e.target.value })}
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
                      onChange={(e) => setConfig({ ...config(), winnerAnimation: e.target.value as any })}
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
