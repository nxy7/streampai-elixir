import { Title } from "@solidjs/meta";
import { Show, For, createSignal, onMount, onCleanup } from "solid-js";
import { useParams } from "@solidjs/router";
import { graphql } from "gql.tada";
import { client } from "~/lib/urql";
import SmartCanvasWidgetRenderer from "~/components/SmartCanvasWidgetRenderer";

interface CanvasWidget {
  id: string;
  widgetType: string;
  x: number;
  y: number;
  width: number;
  height: number;
  config?: any;
}

const GET_SMART_CANVAS_LAYOUT = graphql(`
  query GetSmartCanvasLayout($userId: ID!) {
    smartCanvasLayout(userId: $userId) {
      id
      userId
      widgets
    }
  }
`);

export default function SmartCanvasDisplay() {
  const params = useParams();
  const [widgets, setWidgets] = createSignal<CanvasWidget[]>([]);

  async function loadLayout() {
    const result = await client.query(GET_SMART_CANVAS_LAYOUT, {
      userId: params.userId,
    });

    if (result.data?.smartCanvasLayout?.widgets) {
      const parsedWidgets = result.data.smartCanvasLayout.widgets.map((w: any) => {
        const widget = typeof w === 'string' ? JSON.parse(w) : w;
        return {
          id: widget.id,
          widgetType: widget.type || widget.widgetType,
          x: widget.x || 0,
          y: widget.y || 0,
          width: widget.width || 200,
          height: widget.height || 120,
          config: widget.config,
        };
      });
      setWidgets(parsedWidgets);
    }
  }

  onMount(() => {
    loadLayout();

    const interval = setInterval(loadLayout, 5000);

    onCleanup(() => clearInterval(interval));
  });

  return (
    <>
      <Title>Smart Canvas Display - Streampai</Title>
      <div
        style={{
          background: "transparent",
          width: "1920px",
          height: "1080px",
          position: "relative",
          margin: 0,
          padding: 0,
          overflow: "hidden",
        }}
      >
        <For each={widgets()}>
          {(widget) => <SmartCanvasWidgetRenderer widget={widget} />}
        </For>

        <Show when={widgets().length === 0}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              "flex-direction": "column",
              "align-items": "center",
              "justify-content": "center",
              color: "#9ca3af",
            }}
          >
            <div style={{ "font-size": "4rem", "margin-bottom": "1rem" }}>🎨</div>
            <h3 style={{ "font-size": "1.5rem", "font-weight": "600", "margin-bottom": "0.5rem" }}>
              No Widgets Configured
            </h3>
            <p style={{ "font-size": "0.875rem" }}>
              Add widgets to your Smart Canvas to see them here
            </p>
          </div>
        </Show>
      </div>
    </>
  );
}
