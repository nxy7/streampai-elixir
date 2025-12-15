import { Title } from "@solidjs/meta";
import { createSignal, onMount, Show } from "solid-js";
import PollWidget from "~/components/widgets/PollWidget";
import { button, card, text, input } from "~/styles/design-system";
import { getCurrentUserId, loadWidgetConfig, saveWidgetConfig } from "~/lib/widget-config";

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
  const [config, setConfig] = createSignal<PollConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = createSignal(true);
  const [saving, setSaving] = createSignal(false);
  const [userId, setUserId] = createSignal<string | null>(null);
  const [saveMessage, setSaveMessage] = createSignal<string | null>(null);
  const [demoMode, setDemoMode] = createSignal<'active' | 'ended'>('active');

  onMount(async () => {
    const uid = await getCurrentUserId();
    if (uid) {
      setUserId(uid);
      const loadedConfig = await loadWidgetConfig<any>({ userId: uid, type: "poll_widget" });
      if (loadedConfig) {
        setConfig({
          showTitle: loadedConfig.show_title ?? DEFAULT_CONFIG.showTitle,
          showPercentages: loadedConfig.show_percentages ?? DEFAULT_CONFIG.showPercentages,
          showVoteCounts: loadedConfig.show_vote_counts ?? DEFAULT_CONFIG.showVoteCounts,
          fontSize: loadedConfig.font_size ?? DEFAULT_CONFIG.fontSize,
          primaryColor: loadedConfig.primary_color ?? DEFAULT_CONFIG.primaryColor,
          secondaryColor: loadedConfig.secondary_color ?? DEFAULT_CONFIG.secondaryColor,
          backgroundColor: loadedConfig.background_color ?? DEFAULT_CONFIG.backgroundColor,
          textColor: loadedConfig.text_color ?? DEFAULT_CONFIG.textColor,
          winnerColor: loadedConfig.winner_color ?? DEFAULT_CONFIG.winnerColor,
          animationType: loadedConfig.animation_type ?? DEFAULT_CONFIG.animationType,
          highlightWinner: loadedConfig.highlight_winner ?? DEFAULT_CONFIG.highlightWinner,
          autoHideAfterEnd: loadedConfig.auto_hide_after_end ?? DEFAULT_CONFIG.autoHideAfterEnd,
          hideDelay: loadedConfig.hide_delay ?? DEFAULT_CONFIG.hideDelay
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
      type: "poll_widget",
      config: {
        show_title: config().showTitle,
        show_percentages: config().showPercentages,
        show_vote_counts: config().showVoteCounts,
        font_size: config().fontSize,
        primary_color: config().primaryColor,
        secondary_color: config().secondaryColor,
        background_color: config().backgroundColor,
        text_color: config().textColor,
        winner_color: config().winnerColor,
        animation_type: config().animationType,
        highlight_winner: config().highlightWinner,
        auto_hide_after_end: config().autoHideAfterEnd,
        hide_delay: config().hideDelay
      }
    });

    setSaving(false);

    if (result.data?.saveWidgetConfig?.result) {
      setSaveMessage("Configuration saved successfully!");
      setTimeout(() => setSaveMessage(null), 3000);
    } else if (result.data?.saveWidgetConfig?.errors) {
      setSaveMessage(`Error: ${result.data.saveWidgetConfig.errors[0]?.message}`);
    } else {
      setSaveMessage("Error saving configuration");
    }
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
            {/* Left Column: Configuration */}
            <div class={card.default}>
              <h2 class={text.h2 + " mb-6"}>Configuration</h2>

              <div class="space-y-6">
                {/* Display Options */}
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
                      <span>Show Poll Title</span>
                    </label>

                    <label class="flex items-center">
                      <input
                        type="checkbox"
                        checked={config().showPercentages}
                        onChange={(e) => setConfig({ ...config(), showPercentages: e.target.checked })}
                        class="mr-2"
                      />
                      <span>Show Percentages</span>
                    </label>

                    <label class="flex items-center">
                      <input
                        type="checkbox"
                        checked={config().showVoteCounts}
                        onChange={(e) => setConfig({ ...config(), showVoteCounts: e.target.checked })}
                        class="mr-2"
                      />
                      <span>Show Vote Counts</span>
                    </label>

                    <label class="flex items-center">
                      <input
                        type="checkbox"
                        checked={config().highlightWinner}
                        onChange={(e) => setConfig({ ...config(), highlightWinner: e.target.checked })}
                        class="mr-2"
                      />
                      <span>Highlight Leading Option</span>
                    </label>
                  </div>
                </div>

                {/* Font Size */}
                <div>
                  <label class="block mb-2">
                    <span class={text.label}>Font Size</span>
                    <select
                      class={input.select + " mt-1"}
                      value={config().fontSize}
                      onChange={(e) => setConfig({ ...config(), fontSize: e.target.value as any })}
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                      <option value="extra-large">Extra Large</option>
                    </select>
                  </label>
                </div>

                {/* Animation Type */}
                <div>
                  <label class="block mb-2">
                    <span class={text.label}>Animation Type</span>
                    <select
                      class={input.select + " mt-1"}
                      value={config().animationType}
                      onChange={(e) => setConfig({ ...config(), animationType: e.target.value as any })}
                    >
                      <option value="none">None</option>
                      <option value="smooth">Smooth</option>
                      <option value="bounce">Bounce</option>
                    </select>
                  </label>
                </div>

                {/* Colors */}
                <div>
                  <h3 class={text.h3 + " mb-3"}>Colors</h3>
                  <div class="space-y-3">
                    <label class="block">
                      <span class={text.label}>Primary Color (Progress Bars)</span>
                      <input
                        type="color"
                        class={input.text + " mt-1"}
                        value={config().primaryColor}
                        onInput={(e) => setConfig({ ...config(), primaryColor: e.target.value })}
                      />
                    </label>

                    <label class="block">
                      <span class={text.label}>Secondary Color</span>
                      <input
                        type="color"
                        class={input.text + " mt-1"}
                        value={config().secondaryColor}
                        onInput={(e) => setConfig({ ...config(), secondaryColor: e.target.value })}
                      />
                    </label>

                    <label class="block">
                      <span class={text.label}>Winner Color (Highlight)</span>
                      <input
                        type="color"
                        class={input.text + " mt-1"}
                        value={config().winnerColor}
                        onInput={(e) => setConfig({ ...config(), winnerColor: e.target.value })}
                      />
                    </label>

                    <label class="block">
                      <span class={text.label}>Background Color</span>
                      <input
                        type="color"
                        class={input.text + " mt-1"}
                        value={config().backgroundColor}
                        onInput={(e) => setConfig({ ...config(), backgroundColor: e.target.value })}
                      />
                    </label>

                    <label class="block">
                      <span class={text.label}>Text Color</span>
                      <input
                        type="color"
                        class={input.text + " mt-1"}
                        value={config().textColor}
                        onInput={(e) => setConfig({ ...config(), textColor: e.target.value })}
                      />
                    </label>
                  </div>
                </div>

                {/* Save Button */}
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

            {/* Right Column: Preview */}
            <div class="space-y-6">
              <div class={card.default}>
                <h2 class={text.h2 + " mb-4"}>Preview</h2>

                {/* Demo Mode Toggle */}
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
