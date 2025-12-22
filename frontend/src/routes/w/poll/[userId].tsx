import { createSignal, onMount, onCleanup, Show } from "solid-js";
import { useParams } from "@solidjs/router";
import { graphql } from "gql.tada";
import { client } from "~/lib/urql";
import PollWidget from "~/components/widgets/PollWidget";

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

const GET_WIDGET_CONFIG = graphql(`
  query GetWidgetConfig($userId: ID!, $type: String!) {
    widgetConfig(userId: $userId, type: $type) {
      id
      config
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

export default function PollWidgetDisplay() {
  const params = useParams<{ userId: string }>();
  const [config, setConfig] = createSignal<PollConfig | null>(null);

  async function loadConfig() {
    const userId = params.userId;
    if (!userId) return;

    const result = await client.query(GET_WIDGET_CONFIG, {
      userId,
      type: "poll_widget",
    });

    if (result.data?.widgetConfig?.config) {
      const loadedConfig = JSON.parse(result.data.widgetConfig.config);
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
        <div style={{ "max-width": "600px", width: "100%" }}>
          <PollWidget config={config()!} />
        </div>
      </Show>
    </div>
  );
}
