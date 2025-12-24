import { createSignal, onMount, onCleanup, Show } from "solid-js";
import { useParams } from "@solidjs/router";
import { getWidgetConfig } from "~/sdk/ash_rpc";
import FollowerCountWidget from "~/components/widgets/FollowerCountWidget";
import { Title } from "@solidjs/meta";

interface FollowerCountConfig {
  label: string;
  fontSize: number;
  textColor: string;
  backgroundColor: string;
  showIcon: boolean;
  animateOnChange: boolean;
}

const DEFAULT_CONFIG: FollowerCountConfig = {
  label: "followers",
  fontSize: 32,
  textColor: "#ffffff",
  backgroundColor: "#9333ea",
  showIcon: true,
  animateOnChange: true,
};

export default function FollowerCountDisplay() {
  const params = useParams<{ userId: string }>();
  const [config, setConfig] = createSignal<FollowerCountConfig | null>(null);

  async function loadConfig() {
    const userId = params.userId;
    if (!userId) return;

    const result = await getWidgetConfig({
      input: { userId, type: "follower_count_widget" },
      fields: ["id", "config"],
      fetchOptions: { credentials: "include" },
    });

    if (result.success && result.data.config) {
      const loadedConfig = result.data.config;
      setConfig({
        label: loadedConfig.label || DEFAULT_CONFIG.label,
        fontSize: loadedConfig.font_size || DEFAULT_CONFIG.fontSize,
        textColor: loadedConfig.text_color || DEFAULT_CONFIG.textColor,
        backgroundColor: loadedConfig.background_color || DEFAULT_CONFIG.backgroundColor,
        showIcon: loadedConfig.show_icon ?? DEFAULT_CONFIG.showIcon,
        animateOnChange: loadedConfig.animate_on_change ?? DEFAULT_CONFIG.animateOnChange,
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
    <>
      <Title>Follower Count Widget - Streampai</Title>
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
          <FollowerCountWidget config={config()!} count={0} />
        </Show>
      </div>
    </>
  );
}
