import { createSignal, onMount, onCleanup, Show } from "solid-js";
import { useParams } from "@solidjs/router";
import { gql } from "@urql/solid";
import { client } from "~/lib/urql";
import SliderWidget from "~/components/widgets/SliderWidget";

interface SliderImage {
  id: string;
  url: string;
  alt?: string;
  index: number;
}

interface SliderConfig {
  slideDuration: number;
  transitionDuration: number;
  transitionType: "fade" | "slide" | "slide-up" | "zoom" | "flip";
  fitMode: "contain" | "cover" | "fill";
  backgroundColor: string;
  images?: SliderImage[];
}

const GET_WIDGET_CONFIG = gql`
  query GetWidgetConfig($userId: ID!, $type: String!) {
    widgetConfig(userId: $userId, type: $type) {
      id
      config
    }
  }
`;

const DEFAULT_CONFIG: SliderConfig = {
  slideDuration: 5,
  transitionDuration: 500,
  transitionType: "fade",
  fitMode: "contain",
  backgroundColor: "transparent",
  images: [],
};

export default function SliderDisplay() {
  const params = useParams<{ userId: string }>();
  const [config, setConfig] = createSignal<SliderConfig | null>(null);

  async function loadConfig() {
    const userId = params.userId;
    if (!userId) return;

    const result = await client.query(GET_WIDGET_CONFIG, {
      userId,
      type: "slider_widget",
    });

    if (result.data?.widgetConfig?.config) {
      const loadedConfig = JSON.parse(result.data.widgetConfig.config);
      setConfig({
        slideDuration: loadedConfig.slide_duration || DEFAULT_CONFIG.slideDuration,
        transitionDuration: loadedConfig.transition_duration || DEFAULT_CONFIG.transitionDuration,
        transitionType: loadedConfig.transition_type || DEFAULT_CONFIG.transitionType,
        fitMode: loadedConfig.fit_mode || DEFAULT_CONFIG.fitMode,
        backgroundColor: loadedConfig.background_color || DEFAULT_CONFIG.backgroundColor,
        images: loadedConfig.images || DEFAULT_CONFIG.images,
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
          <div style={{ width: "100%", height: "100%" }}>
            <SliderWidget config={cfg()} />
          </div>
        )}
      </Show>
    </div>
  );
}
