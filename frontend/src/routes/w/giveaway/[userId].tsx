import { createSignal, onMount, onCleanup, Show } from "solid-js";
import { useParams } from "@solidjs/router";
import { graphql } from "~/lib/graphql";
import { client } from "~/lib/urql";
import GiveawayWidget from "~/components/widgets/GiveawayWidget";

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

const GET_WIDGET_CONFIG = graphql(`
  query GetWidgetConfig($userId: ID!, $type: String!) {
    widgetConfig(userId: $userId, type: $type) {
      id
      config
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

export default function GiveawayWidgetDisplay() {
  const params = useParams<{ userId: string }>();
  const [config, setConfig] = createSignal<GiveawayConfig | null>(null);

  async function loadConfig() {
    const userId = params.userId;
    if (!userId) return;

    const result = await client.query(GET_WIDGET_CONFIG, {
      userId,
      type: "giveaway_widget",
    });

    if (result.data?.widgetConfig?.config) {
      const loadedConfig = JSON.parse(result.data.widgetConfig.config);
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
    } else {
      setConfig(DEFAULT_CONFIG);
    }
  }

  onMount(() => {
    loadConfig();
    const interval = setInterval(loadConfig, 5000);
    onCleanup(() => clearInterval(interval));
  });

  return (
    <div style={{
      background: "transparent",
      width: "100vw",
      height: "100vh",
      display: "flex",
      "align-items": "center",
      "justify-content": "center",
      padding: "1rem"
    }}>
      <Show when={config()}>
        <div style={{ "max-width": "500px", width: "100%" }}>
          <GiveawayWidget config={config()!} />
        </div>
      </Show>
    </div>
  );
}
