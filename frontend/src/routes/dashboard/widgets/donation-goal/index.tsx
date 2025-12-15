import { Title } from "@solidjs/meta";
import { createSignal, onMount, Show } from "solid-js";
import DonationGoalWidget from "~/components/widgets/DonationGoalWidget";
import { button, card, text, input } from "~/styles/design-system";
import { getCurrentUserId, loadWidgetConfig, saveWidgetConfig } from "~/lib/widget-config";

interface DonationGoalConfig {
  goalAmount: number;
  startingAmount: number;
  currency: string;
  startDate: string;
  endDate: string;
  title: string;
  showPercentage: boolean;
  showAmountRaised: boolean;
  showDaysLeft: boolean;
  theme: 'default' | 'minimal' | 'modern';
  barColor: string;
  backgroundColor: string;
  textColor: string;
  animationEnabled: boolean;
}

const DEFAULT_CONFIG: DonationGoalConfig = {
  goalAmount: 1000,
  startingAmount: 0,
  currency: '$',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  title: 'Donation Goal',
  showPercentage: true,
  showAmountRaised: true,
  showDaysLeft: true,
  theme: 'default',
  barColor: '#10b981',
  backgroundColor: '#e5e7eb',
  textColor: '#1f2937',
  animationEnabled: true
};

export default function DonationGoalWidgetSettings() {
  const [config, setConfig] = createSignal<DonationGoalConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = createSignal(true);
  const [saving, setSaving] = createSignal(false);
  const [userId, setUserId] = createSignal<string | null>(null);
  const [saveMessage, setSaveMessage] = createSignal<string | null>(null);
  const [demoAmount, setDemoAmount] = createSignal(350);

  onMount(async () => {
    const uid = await getCurrentUserId();
    if (uid) {
      setUserId(uid);
      const loadedConfig = await loadWidgetConfig<any>({ userId: uid, type: "donation_goal_widget" });
      if (loadedConfig) {
        setConfig({
          goalAmount: loadedConfig.goal_amount ?? DEFAULT_CONFIG.goalAmount,
          startingAmount: loadedConfig.starting_amount ?? DEFAULT_CONFIG.startingAmount,
          currency: loadedConfig.currency ?? DEFAULT_CONFIG.currency,
          startDate: loadedConfig.start_date ?? DEFAULT_CONFIG.startDate,
          endDate: loadedConfig.end_date ?? DEFAULT_CONFIG.endDate,
          title: loadedConfig.title ?? DEFAULT_CONFIG.title,
          showPercentage: loadedConfig.show_percentage ?? DEFAULT_CONFIG.showPercentage,
          showAmountRaised: loadedConfig.show_amount_raised ?? DEFAULT_CONFIG.showAmountRaised,
          showDaysLeft: loadedConfig.show_days_left ?? DEFAULT_CONFIG.showDaysLeft,
          theme: loadedConfig.theme ?? DEFAULT_CONFIG.theme,
          barColor: loadedConfig.bar_color ?? DEFAULT_CONFIG.barColor,
          backgroundColor: loadedConfig.background_color ?? DEFAULT_CONFIG.backgroundColor,
          textColor: loadedConfig.text_color ?? DEFAULT_CONFIG.textColor,
          animationEnabled: loadedConfig.animation_enabled ?? DEFAULT_CONFIG.animationEnabled
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
      type: "donation_goal_widget",
      config: {
        goal_amount: config().goalAmount,
        starting_amount: config().startingAmount,
        currency: config().currency,
        start_date: config().startDate,
        end_date: config().endDate,
        title: config().title,
        show_percentage: config().showPercentage,
        show_amount_raised: config().showAmountRaised,
        show_days_left: config().showDaysLeft,
        theme: config().theme,
        bar_color: config().barColor,
        background_color: config().backgroundColor,
        text_color: config().textColor,
        animation_enabled: config().animationEnabled
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
          <h1 class={text.h1}>Donation Goal Widget Settings</h1>
          <p class={text.body + " mt-2"}>Track progress toward your donation goals with animated progress bars.</p>
        </div>
        <Show when={!loading()} fallback={<div>Loading...</div>}>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class={card.default}>
              <h2 class={text.h2 + " mb-6"}>Configuration</h2>
              <div class="space-y-6">
                <div>
                  <label class="block mb-2">
                    <span class={text.label}>Title</span>
                    <input type="text" class={input.text + " mt-1"} value={config().title} onInput={(e) => setConfig({ ...config(), title: e.target.value })} />
                  </label>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <label class="block">
                    <span class={text.label}>Goal Amount</span>
                    <input type="number" class={input.text + " mt-1"} value={config().goalAmount} onInput={(e) => setConfig({ ...config(), goalAmount: parseFloat(e.target.value) || 1000 })} />
                  </label>
                  <label class="block">
                    <span class={text.label}>Currency</span>
                    <input type="text" class={input.text + " mt-1"} value={config().currency} onInput={(e) => setConfig({ ...config(), currency: e.target.value })} />
                  </label>
                </div>
                <div>
                  <label class="block mb-2">
                    <span class={text.label}>Theme</span>
                    <select class={input.select + " mt-1"} value={config().theme} onChange={(e) => setConfig({ ...config(), theme: e.target.value as any })}>
                      <option value="default">Default</option>
                      <option value="minimal">Minimal</option>
                      <option value="modern">Modern</option>
                    </select>
                  </label>
                </div>
                <div class="space-y-3">
                  <label class="flex items-center">
                    <input type="checkbox" checked={config().showPercentage} onChange={(e) => setConfig({ ...config(), showPercentage: e.target.checked })} class="mr-2" />
                    <span>Show Percentage</span>
                  </label>
                  <label class="flex items-center">
                    <input type="checkbox" checked={config().showAmountRaised} onChange={(e) => setConfig({ ...config(), showAmountRaised: e.target.checked })} class="mr-2" />
                    <span>Show Amount Raised</span>
                  </label>
                  <label class="flex items-center">
                    <input type="checkbox" checked={config().showDaysLeft} onChange={(e) => setConfig({ ...config(), showDaysLeft: e.target.checked })} class="mr-2" />
                    <span>Show Days Left</span>
                  </label>
                  <label class="flex items-center">
                    <input type="checkbox" checked={config().animationEnabled} onChange={(e) => setConfig({ ...config(), animationEnabled: e.target.checked })} class="mr-2" />
                    <span>Enable Animations</span>
                  </label>
                </div>
                <div class="space-y-3">
                  <label class="block">
                    <span class={text.label}>Progress Bar Color</span>
                    <input type="color" class={input.text + " mt-1"} value={config().barColor} onInput={(e) => setConfig({ ...config(), barColor: e.target.value })} />
                  </label>
                  <label class="block">
                    <span class={text.label}>Background Color</span>
                    <input type="color" class={input.text + " mt-1"} value={config().backgroundColor} onInput={(e) => setConfig({ ...config(), backgroundColor: e.target.value })} />
                  </label>
                  <label class="block">
                    <span class={text.label}>Text Color</span>
                    <input type="color" class={input.text + " mt-1"} value={config().textColor} onInput={(e) => setConfig({ ...config(), textColor: e.target.value })} />
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
                  <label class="block mb-2">
                    <span class={text.label}>Test Progress: {demoAmount()}/{config().goalAmount}</span>
                    <input type="range" class="w-full" min="0" max={config().goalAmount} value={demoAmount()} onInput={(e) => setDemoAmount(parseInt(e.target.value))} />
                  </label>
                </div>
                <div class="bg-gray-900 p-8 rounded-lg" style={{ height: "300px" }}>
                  <DonationGoalWidget config={config()} currentAmount={demoAmount()} />
                </div>
              </div>
              <div class={card.default}>
                <h2 class={text.h3 + " mb-3"}>OBS Browser Source</h2>
                <div class="bg-gray-100 p-3 rounded border border-gray-300">
                  <code class="text-sm break-all">{window.location.origin}/w/donation-goal/{userId()}</code>
                </div>
              </div>
            </div>
          </div>
        </Show>
      </div>
    </>
  );
}
