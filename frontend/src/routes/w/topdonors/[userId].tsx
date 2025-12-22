import { createSignal, onMount, onCleanup, Show } from "solid-js";
import { useParams } from "@solidjs/router";
import { graphql } from "gql.tada";
import { client } from "~/lib/urql";
import TopDonorsWidget from "~/components/widgets/TopDonorsWidget";

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

const GET_WIDGET_CONFIG = graphql(`
  query GetWidgetConfig($userId: ID!, $type: String!) {
    widgetConfig(userId: $userId, type: $type) {
      id
      config
    }
  }
`);

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

export default function TopDonorsDisplay() {
  const params = useParams<{ userId: string }>();
  const [config, setConfig] = createSignal<TopDonorsConfig | null>(null);
  const [donors] = createSignal<Donor[]>([]);

  async function loadConfig() {
    const userId = params.userId;
    if (!userId) return;

    const result = await client.query(GET_WIDGET_CONFIG, {
      userId,
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
    <div
      style={{
        background: "transparent",
        width: "100vw",
        height: "100vh",
        display: "flex",
        "align-items": "center",
        "justify-content": "center",
      }}
    >
      <Show when={config()}>
        {(cfg) => (
          <div style={{ width: "100%", height: "100%", display: "flex", "align-items": "center", "justify-content": "center" }}>
            <TopDonorsWidget config={cfg()} donors={donors()} />
          </div>
        )}
      </Show>
    </div>
  );
}
