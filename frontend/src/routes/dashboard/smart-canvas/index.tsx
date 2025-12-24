import { Title } from "@solidjs/meta";
import { Show, For, createSignal, onMount, createEffect } from "solid-js";
import { useCurrentUser } from "~/lib/auth";
import { card, text, button } from "~/styles/design-system";
import { graphql } from "gql.tada";
import { client } from "~/lib/urql";

interface CanvasWidget {
  id: string;
  widgetType: string;
  x: number;
  y: number;
  width: number;
  height: number;
  config?: any;
}

interface SmartCanvasLayout {
  id?: string;
  userId: string;
  widgets: CanvasWidget[];
}

const AVAILABLE_WIDGETS = [
  { type: "placeholder", name: "Placeholder", icon: "🎨", defaultWidth: 200, defaultHeight: 120 },
  { type: "viewer-count", name: "Viewer Count", icon: "👁️", defaultWidth: 200, defaultHeight: 100 },
  { type: "follower-count", name: "Follower Count", icon: "👥", defaultWidth: 200, defaultHeight: 100 },
  { type: "donation-goal", name: "Donation Goal", icon: "🎯", defaultWidth: 300, defaultHeight: 150 },
  { type: "chat", name: "Chat", icon: "💬", defaultWidth: 400, defaultHeight: 600 },
  { type: "alertbox", name: "Alertbox", icon: "🔔", defaultWidth: 400, defaultHeight: 200 },
  { type: "timer", name: "Timer", icon: "⏱️", defaultWidth: 200, defaultHeight: 100 },
  { type: "poll", name: "Poll", icon: "📊", defaultWidth: 300, defaultHeight: 200 },
  { type: "eventlist", name: "Event List", icon: "📋", defaultWidth: 300, defaultHeight: 400 },
  { type: "topdonors", name: "Top Donors", icon: "🏆", defaultWidth: 300, defaultHeight: 300 },
  { type: "giveaway", name: "Giveaway", icon: "🎁", defaultWidth: 350, defaultHeight: 250 },
  { type: "slider", name: "Slider", icon: "🎠", defaultWidth: 600, defaultHeight: 200 },
];

const GET_SMART_CANVAS_LAYOUT = graphql(`
  query GetSmartCanvasLayout($userId: ID!) {
    smartCanvasLayout(userId: $userId) {
      id
      userId
      widgets
    }
  }
`);

const SAVE_SMART_CANVAS_LAYOUT = graphql(`
  mutation SaveSmartCanvasLayout($input: SaveSmartCanvasLayoutInput!) {
    saveSmartCanvasLayout(input: $input) {
      result {
        id
        widgets
      }
      errors {
        message
      }
    }
  }
`);

const UPDATE_SMART_CANVAS_LAYOUT = graphql(`
  mutation UpdateSmartCanvasLayout($id: ID!, $input: UpdateSmartCanvasLayoutInput!) {
    updateSmartCanvasLayout(id: $id, input: $input) {
      result {
        id
        widgets
      }
      errors {
        message
      }
    }
  }
`);

function PaletteWidgetItem(props: { widgetDef: typeof AVAILABLE_WIDGETS[number] }) {
  return (
    <div
      class="p-3 bg-linear-to-r from-purple-500 to-pink-500 text-white rounded-lg cursor-pointer hover:shadow-lg transition-shadow flex items-center gap-3"
      onClick={() => {
        // This will be handled by the parent component through a callback
        const event = new CustomEvent("add-widget", {
          detail: { widgetType: props.widgetDef.type }
        });
        window.dispatchEvent(event);
      }}
    >
      <span class="text-2xl">{props.widgetDef.icon}</span>
      <span class="font-semibold">{props.widgetDef.name}</span>
    </div>
  );
}

function CanvasWidgetComponent(props: {
  widget: CanvasWidget;
  selectedWidgetId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdatePosition: (id: string, x: number, y: number) => void;
  onUpdateSize: (id: string, width: number, height: number) => void;
  scale: number;
  setIsResizing: (resizing: boolean) => void;
}) {
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let startWidgetX = 0;
  let startWidgetY = 0;

  const widgetDef = () => AVAILABLE_WIDGETS.find(w => w.type === props.widget.widgetType);

  const handleMouseDown = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest(".resize-handle") ||
        (e.target as HTMLElement).closest(".delete-button")) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startWidgetX = props.widget.x;
    startWidgetY = props.widget.y;

    props.onSelect(props.widget.id);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = (moveEvent.clientX - startX) / props.scale;
      const deltaY = (moveEvent.clientY - startY) / props.scale;

      props.onUpdatePosition(
        props.widget.id,
        startWidgetX + deltaX,
        startWidgetY + deltaY
      );
    };

    const handleMouseUp = () => {
      isDragging = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      class="absolute group"
      style={{
        left: `${props.widget.x}px`,
        top: `${props.widget.y}px`,
        width: `${props.widget.width}px`,
        height: `${props.widget.height}px`,
        "z-index": props.selectedWidgetId === props.widget.id ? 20 : 10,
      }}
      onClick={(e) => {
        e.stopPropagation();
        props.onSelect(props.widget.id);
      }}
    >
      <div
        class="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-white/20 rounded-lg shadow-lg p-4 cursor-move"
        classList={{
          "ring-2 ring-yellow-400": props.selectedWidgetId === props.widget.id,
        }}
        onMouseDown={handleMouseDown}
      >
        <div class="flex items-center gap-2 mb-2 text-white">
          <span class="text-xl">{widgetDef()?.icon}</span>
          <span class="font-semibold text-sm">{widgetDef()?.name}</span>
        </div>
        <div class="bg-black/20 rounded p-2 text-xs text-white/80">
          <div>Position: ({Math.round(props.widget.x)}, {Math.round(props.widget.y)})</div>
          <div>Size: {props.widget.width}x{props.widget.height}</div>
        </div>
      </div>

      <button
        class="delete-button absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center border-2 border-white"
        onClick={(e) => {
          e.stopPropagation();
          props.onDelete(props.widget.id);
        }}
      >
        ×
      </button>

      <div
        class="resize-handle absolute -bottom-2 -right-2 w-6 h-6 bg-blue-500 text-white rounded-full cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center border-2 border-white"
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          props.setIsResizing(true);
          const startX = e.clientX;
          const startY = e.clientY;
          const startWidth = props.widget.width;
          const startHeight = props.widget.height;

          const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = (moveEvent.clientX - startX) / props.scale;
            const deltaY = (moveEvent.clientY - startY) / props.scale;
            props.onUpdateSize(
              props.widget.id,
              startWidth + deltaX,
              startHeight + deltaY
            );
          };

          const handleMouseUp = () => {
            props.setIsResizing(false);
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
          };

          document.addEventListener("mousemove", handleMouseMove);
          document.addEventListener("mouseup", handleMouseUp);
        }}
      >
        ⇲
      </div>
    </div>
  );
}

export default function SmartCanvas() {
  const { user } = useCurrentUser();
  const [widgets, setWidgets] = createSignal<CanvasWidget[]>([]);
  const [layoutId, setLayoutId] = createSignal<string | null>(null);
  const [layoutSaved, setLayoutSaved] = createSignal(true);
  const [canvasMaximized, setCanvasMaximized] = createSignal(false);
  const [scale, setScale] = createSignal(0.5); // Start with reasonable default, will be updated by ResizeObserver
  const [selectedWidgetId, setSelectedWidgetId] = createSignal<string | null>(null);
  const [isResizing, setIsResizing] = createSignal(false);
  const [canvasRef, setCanvasRef] = createSignal<HTMLDivElement | undefined>();

  async function loadLayout() {
    if (!user()?.id) return;

    const result = await client.query(GET_SMART_CANVAS_LAYOUT, {
      userId: user()!.id,
    });

    if (result.data?.smartCanvasLayout) {
      const layout = result.data.smartCanvasLayout;
      setLayoutId(layout.id);

      if (layout.widgets && Array.isArray(layout.widgets)) {
        const parsedWidgets = layout.widgets.map((w: any) => {
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
      setLayoutSaved(true);
    }
  }

  async function saveLayout() {
    if (!user()?.id) return;

    const widgetsData = widgets().map(w => JSON.stringify({
      id: w.id,
      type: w.widgetType,
      x: w.x,
      y: w.y,
      width: w.width,
      height: w.height,
      config: w.config,
    }));

    if (layoutId()) {
      const result = await client.mutation(UPDATE_SMART_CANVAS_LAYOUT, {
        id: layoutId()!,
        input: { widgets: widgetsData },
      });

      if (result.data?.updateSmartCanvasLayout?.result) {
        setLayoutSaved(true);
      }
    } else {
      const result = await client.mutation(SAVE_SMART_CANVAS_LAYOUT, {
        input: {
          userId: user()!.id,
          widgets: widgetsData,
        },
      });

      if (result.data?.saveSmartCanvasLayout?.result) {
        setLayoutId(result.data.saveSmartCanvasLayout.result.id);
        setLayoutSaved(true);
      }
    }
  }

  function addWidget(widgetType: string, x: number = Math.random() * 400, y: number = Math.random() * 200) {
    const widgetDef = AVAILABLE_WIDGETS.find(w => w.type === widgetType);
    const newWidget: CanvasWidget = {
      id: `widget-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      widgetType,
      x: Math.max(0, Math.min(1920 - (widgetDef?.defaultWidth || 200), x)),
      y: Math.max(0, Math.min(1080 - (widgetDef?.defaultHeight || 120), y)),
      width: widgetDef?.defaultWidth || 200,
      height: widgetDef?.defaultHeight || 120,
    };

    setWidgets([...widgets(), newWidget]);
    setLayoutSaved(false);
  }

  function deleteWidget(widgetId: string) {
    setWidgets(widgets().filter(w => w.id !== widgetId));
    setLayoutSaved(false);
  }

  function updateWidgetPosition(widgetId: string, x: number, y: number) {
    setWidgets(widgets().map(w =>
      w.id === widgetId
        ? { ...w, x: Math.max(0, Math.min(1920 - w.width, x)), y: Math.max(0, Math.min(1080 - w.height, y)) }
        : w
    ));
    setLayoutSaved(false);
  }

  function updateWidgetSize(widgetId: string, width: number, height: number) {
    setWidgets(widgets().map(w =>
      w.id === widgetId
        ? {
            ...w,
            width: Math.max(100, Math.min(1920 - w.x, width)),
            height: Math.max(50, Math.min(1080 - w.y, height)),
          }
        : w
    ));
    setLayoutSaved(false);
  }

  function clearWidgets() {
    setWidgets([]);
    setLayoutSaved(false);
  }

  function updateScale() {
    const canvas = canvasRef();
    if (!canvas) return;

    const container = canvas.parentElement;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Don't calculate if container has no dimensions yet
    if (containerWidth === 0 || containerHeight === 0) return;

    const scaleX = containerWidth / 1920;
    const scaleY = containerHeight / 1080;
    const newScale = Math.min(scaleX, scaleY);

    // Only update if scale actually changed
    if (Math.abs(newScale - scale()) > 0.001) {
      setScale(newScale);
    }
  }

  // Load layout when user becomes available
  createEffect(() => {
    if (user()?.id) {
      loadLayout();
    }
  });

  onMount(() => {
    // Initial scale calculation after mount
    setTimeout(() => {
      updateScale();
    }, 0);

    window.addEventListener("resize", updateScale);

    // Listen for widget add events from palette
    const handleAddWidget = (e: Event) => {
      const customEvent = e as CustomEvent;
      addWidget(customEvent.detail.widgetType);
    };
    window.addEventListener("add-widget", handleAddWidget);

    return () => {
      window.removeEventListener("resize", updateScale);
      window.removeEventListener("add-widget", handleAddWidget);
    };
  });

  // Recalculate scale whenever canvasRef is set or canvasMaximized changes
  createEffect(() => {
    const canvas = canvasRef();
    if (canvas) {
      // Track canvasMaximized to trigger recalculation when it changes
      canvasMaximized();

      const container = canvas.parentElement;
      if (!container) return;

      // Use ResizeObserver to detect when container is sized
      const resizeObserver = new ResizeObserver(() => {
        updateScale();
      });
      resizeObserver.observe(container);

      // Try immediate update
      updateScale();

      // Also try with RAF as fallback
      requestAnimationFrame(() => {
        updateScale();
        requestAnimationFrame(() => {
          updateScale();
        });
      });

      // And setTimeout as additional fallback
      setTimeout(() => {
        updateScale();
      }, 0);

      setTimeout(() => {
        updateScale();
      }, 100);

      // Cleanup
      return () => {
        resizeObserver.disconnect();
      };
    }
  });

  const obsUrl = () => {
    if (!user()?.id) return "";
    return `${window.location.origin}/w/smart-canvas/${user()!.id}`;
  };

  return (
    <>
      <Title>Smart Canvas - Streampai</Title>
      <Show when={user()}>
        <>
          <div class="space-y-6">
            <div class={card.default}>
              <h1 class={text.h1}>Smart Canvas</h1>
              <p class={text.muted + " mt-2"}>
                Compose your stream overlay with interactive widgets. Click widgets from the palette to add them to the canvas.
              </p>
            </div>

            <div class="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <div class="flex items-start gap-3">
                <div class="shrink-0 text-blue-600">ℹ️</div>
                <div class="flex-1">
                  <h3 class="font-semibold text-gray-900 mb-1">OBS Browser Source URL</h3>
                  <p class="text-sm text-gray-600 mb-2">
                    Copy this URL and add it as a Browser Source in OBS (set to 1920x1080):
                  </p>
                  <div class="flex gap-2">
                    <input
                      type="text"
                      readonly
                      value={obsUrl()}
                      class="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white font-mono"
                    />
                    <button
                      class={button.primary}
                      onClick={() => {
                        navigator.clipboard.writeText(obsUrl());
                      }}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class={card.default}>
              <div class="flex items-center justify-between">
                <div class="flex gap-2">
                  <button
                    class={layoutSaved() ? "px-4 py-2 bg-green-600 text-white rounded-lg" : button.primary}
                    onClick={saveLayout}
                  >
                    {layoutSaved() ? "✓ Layout Saved" : "Save Layout"}
                  </button>
                  <button class={button.secondary} onClick={clearWidgets}>
                    Clear All
                  </button>
                  <button
                    class={button.ghost}
                    onClick={() => setCanvasMaximized(!canvasMaximized())}
                  >
                    {canvasMaximized() ? "Exit Fullscreen" : "Fullscreen"}
                  </button>
                </div>
                <div class="text-sm text-gray-600">
                  Widgets: {widgets().length}
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div class="lg:col-span-1">
                <div class={card.default + " overflow-y-auto max-h-[700px]"}>
                  <h3 class={text.h3 + " mb-4"}>Widget Palette</h3>
                  <p class="text-sm text-gray-600 mb-4">Click a widget to add it to the canvas</p>
                  <div class="space-y-2">
                    <For each={AVAILABLE_WIDGETS}>
                      {(widgetDef) => <PaletteWidgetItem widgetDef={widgetDef} />}
                    </For>
                  </div>
                </div>
              </div>

              <div class="lg:col-span-3">
                <div
                  class={card.default + " bg-gray-900 p-4"}
                  classList={{
                    "!fixed !inset-0 !z-50 !m-0 !rounded-none": canvasMaximized(),
                  }}
                >
                  <Show when={canvasMaximized()}>
                    <button
                      class="absolute top-4 right-4 z-50 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white"
                      onClick={() => setCanvasMaximized(false)}
                    >
                      ✕
                    </button>
                  </Show>

                  <div class="text-sm text-gray-400 mb-2" classList={{ "hidden": canvasMaximized() }}>
                    Canvas: 1920x1080 (16:9)
                  </div>

                  <div
                    class="w-full"
                    style={{
                      "aspect-ratio": "16/9",
                      "max-height": canvasMaximized() ? "100vh" : "650px",
                    }}
                  >
                    <div class="relative w-full h-full">
                      <div
                        ref={setCanvasRef}
                        class="absolute bg-gray-950 border-2 border-gray-700 rounded-lg overflow-hidden"
                        style={{
                          width: "1920px",
                          height: "1080px",
                          "transform-origin": "top left",
                          transform: `scale(${scale()})`,
                          background: "linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)",
                          "background-size": "50px 50px",
                        }}
                        onClick={() => setSelectedWidgetId(null)}
                      >
                        <For each={widgets()}>
                          {(widget) => (
                            <CanvasWidgetComponent
                              widget={widget}
                              selectedWidgetId={selectedWidgetId()}
                              onSelect={setSelectedWidgetId}
                              onDelete={deleteWidget}
                              onUpdatePosition={updateWidgetPosition}
                              onUpdateSize={updateWidgetSize}
                              scale={scale()}
                              setIsResizing={setIsResizing}
                            />
                          )}
                        </For>

                        <Show when={widgets().length === 0}>
                          <div class="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                            <div class="text-6xl mb-4">🎨</div>
                            <h3 class="text-xl font-semibold mb-2">No Widgets Yet</h3>
                            <p class="text-sm">Click widgets from the palette to get started</p>
                          </div>
                        </Show>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      </Show>
    </>
  );
}
