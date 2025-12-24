import { createSignal, onMount, onCleanup, Show } from "solid-js";
import { useParams } from "@solidjs/router";
import { graphql } from "~/lib/graphql";
import { client } from "~/lib/urql";
import ViewerCountWidget from "~/components/widgets/ViewerCountWidget";
import { Title } from "@solidjs/meta";
import { defaultConfig, generateViewerData, generateViewerUpdate, type ViewerCountConfig, type ViewerData } from "~/lib/fake/viewer-count";

const GET_WIDGET_CONFIG = graphql(`
  query GetWidgetConfig($userId: ID!, $type: String!) {
    widgetConfig(userId: $userId, type: $type) {
      id
      config
    }
  }
`);

export default function ViewerCountDisplay() {
  const params = useParams<{ userId: string }>();
  const [config, setConfig] = createSignal<ViewerCountConfig>(defaultConfig());
  const [viewerData, setViewerData] = createSignal<ViewerData>(generateViewerData());

  let configInterval: number | undefined;
  let dataInterval: number | undefined;

  async function loadConfig() {
    const userId = params.userId;
    if (!userId) return;

    const result = await client.query(GET_WIDGET_CONFIG, {
      userId,
      type: "viewer_count_widget",
    });

    if (result.data?.widgetConfig?.config) {
      const loadedConfig = JSON.parse(result.data.widgetConfig.config);
      setConfig(loadedConfig);
    } else {
      setConfig(defaultConfig());
    }
  }

  onMount(() => {
    loadConfig();

    configInterval = window.setInterval(() => {
      loadConfig();
    }, 5000);

    dataInterval = window.setInterval(() => {
      const current = viewerData();
      setViewerData(generateViewerUpdate(current));
    }, 3000);
  });

  onCleanup(() => {
    if (configInterval) {
      clearInterval(configInterval);
    }
    if (dataInterval) {
      clearInterval(dataInterval);
    }
  });

  return (
    <>
      <Title>Viewer Count Widget - Streampai</Title>
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
        <ViewerCountWidget config={config()} data={viewerData()} />
      </div>
    </>
  );
}
