import { createSignal, onMount, Show } from "solid-js";
import { Title } from "@solidjs/meta";
import AlertboxWidget from "~/components/widgets/AlertboxWidget";
import { button, card, text, input } from "~/styles/design-system";
import { getCurrentUserId, loadWidgetConfig, saveWidgetConfig } from "~/lib/widget-config";

interface AlertConfig {
  animationType: 'slide' | 'fade' | 'bounce';
  displayDuration: number;
  soundEnabled: boolean;
  soundVolume: number;
  showMessage: boolean;
  showAmount: boolean;
  fontSize: 'small' | 'medium' | 'large';
  alertPosition: 'top' | 'center' | 'bottom';
}

const DEFAULT_CONFIG: AlertConfig = {
  animationType: 'fade',
  displayDuration: 5,
  soundEnabled: true,
  soundVolume: 80,
  showMessage: true,
  showAmount: true,
  fontSize: 'medium',
  alertPosition: 'center'
};

const DEMO_EVENTS = [
  { id: '1', type: 'donation' as const, username: 'GenerosusDono', amount: 25, currency: '$', message: 'Keep up the great streams!', timestamp: new Date(), platform: { icon: 'twitch', color: '#9146ff' } },
  { id: '2', type: 'follow' as const, username: 'NewFan123', timestamp: new Date(), platform: { icon: 'youtube', color: '#ff0000' } },
  { id: '3', type: 'subscription' as const, username: 'LoyalViewer42', timestamp: new Date(), platform: { icon: 'twitch', color: '#9146ff' } },
  { id: '4', type: 'raid' as const, username: 'FriendlyStreamer', amount: 50, timestamp: new Date(), platform: { icon: 'twitch', color: '#9146ff' } }
];

export default function AlertboxWidgetSettings() {
  const [config, setConfig] = createSignal<AlertConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = createSignal(true);
  const [saving, setSaving] = createSignal(false);
  const [userId, setUserId] = createSignal<string | null>(null);
  const [saveMessage, setSaveMessage] = createSignal<string | null>(null);
  const [demoIndex, setDemoIndex] = createSignal(0);

  onMount(async () => {
    const uid = await getCurrentUserId();
    if (uid) {
      setUserId(uid);
      const loadedConfig = await loadWidgetConfig<any>({ userId: uid, type: "alertbox_widget" });
      if (loadedConfig) {
        setConfig({
          animationType: loadedConfig.animation_type ?? DEFAULT_CONFIG.animationType,
          displayDuration: loadedConfig.display_duration ?? DEFAULT_CONFIG.displayDuration,
          soundEnabled: loadedConfig.sound_enabled ?? DEFAULT_CONFIG.soundEnabled,
          soundVolume: loadedConfig.sound_volume ?? DEFAULT_CONFIG.soundVolume,
          showMessage: loadedConfig.show_message ?? DEFAULT_CONFIG.showMessage,
          showAmount: loadedConfig.show_amount ?? DEFAULT_CONFIG.showAmount,
          fontSize: loadedConfig.font_size ?? DEFAULT_CONFIG.fontSize,
          alertPosition: loadedConfig.alert_position ?? DEFAULT_CONFIG.alertPosition
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
      type: "alertbox_widget",
      config: {
        animation_type: config().animationType,
        display_duration: config().displayDuration,
        sound_enabled: config().soundEnabled,
        sound_volume: config().soundVolume,
        show_message: config().showMessage,
        show_amount: config().showAmount,
        font_size: config().fontSize,
        alert_position: config().alertPosition
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

  function cycleDemoEvent() {
    setDemoIndex((demoIndex() + 1) % DEMO_EVENTS.length);
  }

  return (
    <>
      <Title>Alertbox Widget - Streampai</Title>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="mb-8">
          <h1 class={text.h1}>Alertbox Widget Settings</h1>
          <p class={text.body + " mt-2"}>Configure alert notifications for donations, follows, subscriptions, and raids.</p>
        </div>
        <Show when={!loading()} fallback={<div>Loading...</div>}>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class={card.default}>
              <h2 class={text.h2 + " mb-6"}>Configuration</h2>
              <div class="space-y-6">
                <div>
                  <label class="block mb-2">
                    <span class={text.label}>Animation Type</span>
                    <select class={input.select + " mt-1"} value={config().animationType} onChange={(e) => setConfig({ ...config(), animationType: e.target.value as any })}>
                      <option value="fade">Fade</option>
                      <option value="slide">Slide</option>
                      <option value="bounce">Bounce</option>
                    </select>
                  </label>
                </div>
                <div>
                  <label class="block mb-2">
                    <span class={text.label}>Alert Position</span>
                    <select class={input.select + " mt-1"} value={config().alertPosition} onChange={(e) => setConfig({ ...config(), alertPosition: e.target.value as any })}>
                      <option value="top">Top</option>
                      <option value="center">Center</option>
                      <option value="bottom">Bottom</option>
                    </select>
                  </label>
                </div>
                <div>
                  <label class="block mb-2">
                    <span class={text.label}>Display Duration (seconds)</span>
                    <input type="number" class={input.text + " mt-1"} value={config().displayDuration} onInput={(e) => setConfig({ ...config(), displayDuration: parseInt(e.target.value) || 5 })} min="1" max="30" />
                  </label>
                </div>
                <div class="space-y-3">
                  <label class="flex items-center">
                    <input type="checkbox" checked={config().showAmount} onChange={(e) => setConfig({ ...config(), showAmount: e.target.checked })} class="mr-2" />
                    <span>Show Amount (for donations/raids)</span>
                  </label>
                  <label class="flex items-center">
                    <input type="checkbox" checked={config().showMessage} onChange={(e) => setConfig({ ...config(), showMessage: e.target.checked })} class="mr-2" />
                    <span>Show Message</span>
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
                <button class={button.secondary + " mb-4"} onClick={cycleDemoEvent}>
                  Show Next Alert Type
                </button>
                <div class="bg-gray-900 p-8 rounded-lg" style={{ height: "400px" }}>
                  <AlertboxWidget config={config()} event={DEMO_EVENTS[demoIndex()]} />
                </div>
              </div>
              <div class={card.default}>
                <h2 class={text.h3 + " mb-3"}>OBS Browser Source</h2>
                <div class="bg-gray-100 p-3 rounded border border-gray-300">
                  <code class="text-sm break-all">{window.location.origin}/w/alertbox/{userId()}</code>
                </div>
              </div>
            </div>
          </div>
        </Show>
      </div>
    </>
  );
}
