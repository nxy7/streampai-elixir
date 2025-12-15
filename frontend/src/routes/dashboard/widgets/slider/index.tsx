import { Title } from "@solidjs/meta";
import { createSignal, onMount, Show, For } from "solid-js";
import { gql } from "@urql/solid";
import { client } from "~/lib/urql";
import SliderWidget from "~/components/widgets/SliderWidget";
import { button, card, text, input } from "~/styles/design-system";

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

const SAVE_WIDGET_CONFIG = gql`
  mutation SaveWidgetConfig($input: SaveWidgetConfigInput!) {
    saveWidgetConfig(input: $input) {
      result {
        id
        config
      }
      errors {
        message
      }
    }
  }
`;

const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    currentUser {
      id
    }
  }
`;

const SAMPLE_IMAGES: SliderImage[] = [
  { id: "1", url: "https://picsum.photos/800/450?random=1", alt: "Sample 1", index: 0 },
  { id: "2", url: "https://picsum.photos/800/450?random=2", alt: "Sample 2", index: 1 },
  { id: "3", url: "https://picsum.photos/800/450?random=3", alt: "Sample 3", index: 2 },
];

const DEFAULT_CONFIG: SliderConfig = {
  slideDuration: 5,
  transitionDuration: 500,
  transitionType: "fade",
  fitMode: "contain",
  backgroundColor: "transparent",
  images: SAMPLE_IMAGES,
};

export default function SliderSettings() {
  const [config, setConfig] = createSignal<SliderConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = createSignal(true);
  const [saving, setSaving] = createSignal(false);
  const [saveMessage, setSaveMessage] = createSignal<string | null>(null);
  const [userId, setUserId] = createSignal<string | null>(null);

  onMount(async () => {
    const userResult = await client.query(GET_CURRENT_USER, {});

    if (userResult.data?.currentUser?.id) {
      const currentUserId = userResult.data.currentUser.id;
      setUserId(currentUserId);

      const result = await client.query(GET_WIDGET_CONFIG, {
        userId: currentUserId,
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
      }
    }

    setLoading(false);
  });

  async function handleSave() {
    if (!userId()) {
      setSaveMessage("Error: Not logged in");
      return;
    }

    setSaving(true);
    setSaveMessage(null);

    const backendConfig = {
      slide_duration: config().slideDuration,
      transition_duration: config().transitionDuration,
      transition_type: config().transitionType,
      fit_mode: config().fitMode,
      background_color: config().backgroundColor,
      images: config().images || [],
    };

    const result = await client.mutation(SAVE_WIDGET_CONFIG, {
      input: {
        type: "slider_widget",
        config: JSON.stringify(backendConfig),
      },
    });

    setSaving(false);

    if (result.data?.saveWidgetConfig?.errors?.length > 0) {
      setSaveMessage(`Error: ${result.data.saveWidgetConfig.errors[0].message}`);
    } else if (result.data?.saveWidgetConfig?.result) {
      setSaveMessage("Configuration saved successfully!");
      setTimeout(() => setSaveMessage(null), 3000);
    } else {
      setSaveMessage("Error: Failed to save configuration");
    }
  }

  function updateConfig<K extends keyof SliderConfig>(
    field: K,
    value: SliderConfig[K]
  ) {
    setConfig((prev) => ({ ...prev, [field]: value }));
  }

  function addImageUrl(url: string) {
    const images = config().images || [];
    const newImage: SliderImage = {
      id: `img_${Date.now()}`,
      url,
      alt: `Image ${images.length + 1}`,
      index: images.length,
    };
    updateConfig("images", [...images, newImage]);
  }

  function removeImage(id: string) {
    const images = config().images || [];
    const filtered = images.filter((img) => img.id !== id);
    const reindexed = filtered.map((img, index) => ({ ...img, index }));
    updateConfig("images", reindexed);
  }

  return (
    <>
      <div class="space-y-6">
        <div>
          <h1 class={text.h1}>Slider Widget Settings</h1>
          <p class={text.muted}>Configure your image slider widget for OBS</p>
        </div>

        <Show when={!loading()} fallback={<div>Loading...</div>}>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class={card.default}>
              <h2 class={text.h2}>Configuration</h2>
              <div class="mt-4 space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Slide Duration (seconds)
                  </label>
                  <input
                    type="number"
                    class={input.text}
                    value={config().slideDuration}
                    onInput={(e) =>
                      updateConfig("slideDuration", parseInt(e.currentTarget.value))
                    }
                    min="1"
                    max="60"
                  />
                  <p class={text.helper}>How long each slide is displayed</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Transition Duration (ms)
                  </label>
                  <input
                    type="number"
                    class={input.text}
                    value={config().transitionDuration}
                    onInput={(e) =>
                      updateConfig("transitionDuration", parseInt(e.currentTarget.value))
                    }
                    min="100"
                    max="3000"
                    step="100"
                  />
                  <p class={text.helper}>Speed of the transition animation</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Transition Type
                  </label>
                  <select
                    class={input.select}
                    value={config().transitionType}
                    onChange={(e) =>
                      updateConfig(
                        "transitionType",
                        e.currentTarget.value as SliderConfig["transitionType"]
                      )
                    }
                  >
                    <option value="fade">Fade</option>
                    <option value="slide">Slide Left</option>
                    <option value="slide-up">Slide Up</option>
                    <option value="zoom">Zoom</option>
                    <option value="flip">Flip</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Image Fit Mode
                  </label>
                  <select
                    class={input.select}
                    value={config().fitMode}
                    onChange={(e) =>
                      updateConfig("fitMode", e.currentTarget.value as SliderConfig["fitMode"])
                    }
                  >
                    <option value="contain">Fit (Contain)</option>
                    <option value="cover">Fill (Cover)</option>
                    <option value="fill">Stretch (Fill)</option>
                  </select>
                  <p class={text.helper}>How images are scaled to fit the container</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Background Color
                  </label>
                  <div class="flex gap-2">
                    <input
                      type="color"
                      class="h-10 w-20 cursor-pointer rounded border border-gray-300"
                      value={config().backgroundColor === "transparent" ? "#000000" : config().backgroundColor}
                      onInput={(e) => updateConfig("backgroundColor", e.currentTarget.value)}
                    />
                    <input
                      type="text"
                      class={input.text}
                      value={config().backgroundColor}
                      onInput={(e) => updateConfig("backgroundColor", e.currentTarget.value)}
                      placeholder="transparent or #000000"
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Images ({config().images?.length || 0})
                  </label>
                  <div class="space-y-2">
                    <For each={config().images || []}>
                      {(image) => (
                        <div class="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <img
                            src={image.url}
                            alt={image.alt}
                            class="w-16 h-16 object-cover rounded"
                          />
                          <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium truncate">{image.alt}</p>
                            <p class="text-xs text-gray-500 truncate">{image.url}</p>
                          </div>
                          <button
                            class={button.danger}
                            onClick={() => removeImage(image.id)}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </For>
                  </div>
                  <div class="mt-2">
                    <input
                      type="text"
                      class={input.text}
                      placeholder="Enter image URL and press Enter"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.currentTarget.value.trim()) {
                          addImageUrl(e.currentTarget.value.trim());
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                    <p class={text.helper}>
                      Press Enter to add an image URL. Max 20 images.
                    </p>
                  </div>
                </div>

                <Show when={saveMessage()}>
                  <div
                    class={
                      saveMessage()?.startsWith("Error")
                        ? "p-3 bg-red-50 text-red-700 rounded-lg border border-red-200"
                        : "p-3 bg-green-50 text-green-700 rounded-lg border border-green-200"
                    }
                  >
                    {saveMessage()}
                  </div>
                </Show>

                <button
                  class={button.primary}
                  onClick={handleSave}
                  disabled={saving()}
                >
                  {saving() ? "Saving..." : "Save Configuration"}
                </button>
              </div>
            </div>

            <div class={card.default}>
              <h2 class={text.h2}>Preview</h2>
              <div class="mt-4 space-y-4">
                <div class="bg-gray-900 rounded-lg overflow-hidden" style={{ height: "400px" }}>
                  <SliderWidget config={config()} />
                </div>
                <div class="space-y-2">
                  <h3 class={text.h3}>OBS Browser Source URL</h3>
                  <p class={text.helper}>Add this URL to OBS as a Browser Source:</p>
                  <div class="bg-gray-100 p-3 rounded font-mono text-sm break-all">
                    {window.location.origin}/w/slider/{userId()}
                  </div>
                  <p class={text.helper}>Recommended Browser Source settings:</p>
                  <ul class={text.helper + " ml-4 list-disc"}>
                    <li>Width: 1920</li>
                    <li>Height: 1080</li>
                    <li>Enable "Shutdown source when not visible"</li>
                    <li>Enable "Refresh browser when scene becomes active"</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Show>
      </div>
    </>
  );
}
