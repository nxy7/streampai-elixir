import { Title } from "@solidjs/meta";
import { Show, createSignal, createEffect, For } from "solid-js";
import { useCurrentUser, getLoginUrl } from "~/lib/auth";
import { card, text, button, badge } from "~/styles/design-system";

type PlatformConnection = {
  platform: string;
  connected: boolean;
  username?: string;
};

type StreamStatus = "offline" | "starting" | "live" | "stopping";

export default function Stream() {
  const { user, isLoading } = useCurrentUser();
  const [streamStatus, setStreamStatus] = createSignal<StreamStatus>("offline");
  const [showStreamKey, setShowStreamKey] = createSignal(false);
  const [platformConnections, setPlatformConnections] = createSignal<
    PlatformConnection[]
  >([
    { platform: "Twitch", connected: false },
    { platform: "YouTube", connected: false },
    { platform: "Facebook", connected: false },
    { platform: "Kick", connected: false },
  ]);

  const [streamMetadata, setStreamMetadata] = createSignal({
    title: "",
    description: "",
  });

  const handleStartStream = () => {
    setStreamStatus("starting");
    setTimeout(() => setStreamStatus("live"), 1500);
  };

  const handleStopStream = () => {
    setStreamStatus("stopping");
    setTimeout(() => setStreamStatus("offline"), 1500);
  };

  const togglePlatformConnection = (platform: string) => {
    setPlatformConnections((prev) =>
      prev.map((conn) =>
        conn.platform === platform
          ? { ...conn, connected: !conn.connected }
          : conn
      )
    );
  };

  return (
    <>
      <Title>Stream - Streampai</Title>
      <Show
        when={!isLoading()}
        fallback={
          <div class="flex items-center justify-center min-h-screen bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900">
            <div class="text-white text-xl">Loading...</div>
          </div>
        }
      >
        <Show
          when={user()}
          fallback={
            <div class="min-h-screen bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
              <div class="text-center py-12">
                <h2 class="text-2xl font-bold text-white mb-4">
                  Not Authenticated
                </h2>
                <p class="text-gray-300 mb-6">
                  Please sign in to access the stream page.
                </p>
                <a
                  href={getLoginUrl()}
                  class="inline-block px-6 py-3 bg-linear-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                >
                  Sign In
                </a>
              </div>
            </div>
          }
        >
          <>
            <div class="space-y-6 max-w-7xl mx-auto">
              {/* Stream Status Card */}
              <div class={card.default}>
                <div class="flex items-center justify-between mb-6">
                  <div>
                    <h2 class={text.h2}>Stream Controls</h2>
                    <p class={text.muted}>
                      Manage your multi-platform stream
                    </p>
                  </div>
                  <Show
                    when={streamStatus() === "live"}
                    fallback={
                      <span class={badge.neutral}>
                        {streamStatus().toUpperCase()}
                      </span>
                    }
                  >
                    <span class={badge.success}>
                      <span class="animate-pulse mr-2">●</span> LIVE
                    </span>
                  </Show>
                </div>

                {/* Stream Metadata */}
                <div class="space-y-4 mb-6">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Stream Title
                    </label>
                    <input
                      type="text"
                      class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter your stream title..."
                      value={streamMetadata().title}
                      onInput={(e) =>
                        setStreamMetadata((prev) => ({
                          ...prev,
                          title: e.currentTarget.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      rows="3"
                      placeholder="Describe your stream..."
                      value={streamMetadata().description}
                      onInput={(e) =>
                        setStreamMetadata((prev) => ({
                          ...prev,
                          description: e.currentTarget.value,
                        }))
                      }
                    />
                  </div>
                </div>

                {/* Stream Controls */}
                <div class="flex items-center space-x-3">
                  <Show
                    when={streamStatus() === "offline"}
                    fallback={
                      <button
                        class={button.danger}
                        onClick={handleStopStream}
                        disabled={streamStatus() === "stopping"}
                      >
                        {streamStatus() === "stopping" ? "Stopping..." : "Stop Stream"}
                      </button>
                    }
                  >
                    <button
                      class={button.success}
                      onClick={handleStartStream}
                      disabled={streamStatus() === "starting"}
                    >
                      {streamStatus() === "starting" ? "Starting..." : "Go Live"}
                    </button>
                  </Show>
                  <button
                    class={button.secondary}
                    onClick={() => setShowStreamKey(!showStreamKey())}
                  >
                    {showStreamKey() ? "Hide" : "Show"} Stream Key
                  </button>
                </div>

                {/* Stream Key Display */}
                <Show when={showStreamKey()}>
                  <div class="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-sm font-medium text-gray-700">
                        Stream Key
                      </span>
                      <button class={button.ghost + " text-sm"}>
                        Copy
                      </button>
                    </div>
                    <code class="text-sm text-gray-900 font-mono">
                      rtmps://live.streampai.com/live
                    </code>
                    <div class="mt-2">
                      <code class="text-sm text-gray-600 font-mono">
                        sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
                      </code>
                    </div>
                    <p class="text-xs text-gray-500 mt-2">
                      Use this RTMP URL and stream key in your streaming software (OBS, Streamlabs, etc.)
                    </p>
                  </div>
                </Show>
              </div>

              {/* Platform Connections */}
              <div class={card.default}>
                <div class="mb-6">
                  <h3 class={text.h3}>Platform Connections</h3>
                  <p class={text.muted}>
                    Connect your streaming platforms to multicast
                  </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <For each={platformConnections()}>
                    {(conn) => (
                      <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div class="flex items-center space-x-3">
                          <div
                            class={
                              "w-10 h-10 rounded-lg flex items-center justify-center " +
                              (conn.platform === "Twitch"
                                ? "bg-purple-100"
                                : conn.platform === "YouTube"
                                ? "bg-red-100"
                                : conn.platform === "Facebook"
                                ? "bg-blue-100"
                                : "bg-green-100")
                            }
                          >
                            <svg
                              class={
                                "w-5 h-5 " +
                                (conn.platform === "Twitch"
                                  ? "text-purple-600"
                                  : conn.platform === "YouTube"
                                  ? "text-red-600"
                                  : conn.platform === "Facebook"
                                  ? "text-blue-600"
                                  : "text-green-600")
                              }
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                            </svg>
                          </div>
                          <div>
                            <div class="font-medium text-gray-900">
                              {conn.platform}
                            </div>
                            <Show
                              when={conn.connected}
                              fallback={
                                <span class="text-xs text-gray-500">
                                  Not connected
                                </span>
                              }
                            >
                              <span class="text-xs text-green-600">
                                Connected
                              </span>
                            </Show>
                          </div>
                        </div>
                        <Show
                          when={conn.connected}
                          fallback={
                            <button
                              class={button.primary + " text-sm"}
                              onClick={() =>
                                togglePlatformConnection(conn.platform)
                              }
                            >
                              Connect
                            </button>
                          }
                        >
                          <button
                            class={button.secondary + " text-sm"}
                            onClick={() =>
                              togglePlatformConnection(conn.platform)
                            }
                          >
                            Disconnect
                          </button>
                        </Show>
                      </div>
                    )}
                  </For>
                </div>
              </div>

              {/* Stream Statistics (Placeholder) */}
              <Show when={streamStatus() === "live"}>
                <div class={card.default}>
                  <h3 class={text.h3 + " mb-4"}>Live Statistics</h3>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="text-center p-4 bg-purple-50 rounded-lg">
                      <div class="text-2xl font-bold text-purple-600">
                        0
                      </div>
                      <div class="text-sm text-gray-600">Viewers</div>
                    </div>
                    <div class="text-center p-4 bg-blue-50 rounded-lg">
                      <div class="text-2xl font-bold text-blue-600">0</div>
                      <div class="text-sm text-gray-600">Chat Messages</div>
                    </div>
                    <div class="text-center p-4 bg-green-50 rounded-lg">
                      <div class="text-2xl font-bold text-green-600">
                        00:00
                      </div>
                      <div class="text-sm text-gray-600">Stream Duration</div>
                    </div>
                  </div>
                </div>
              </Show>
            </div>
          </>
        </Show>
      </Show>
    </>
  );
}
