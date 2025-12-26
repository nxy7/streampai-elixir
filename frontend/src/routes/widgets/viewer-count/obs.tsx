import { useSearchParams } from "@solidjs/router";
import { createEffect, createSignal, Show, createMemo } from "solid-js";
import { useLiveQuery } from "@tanstack/solid-db";
import { createUserScopedStreamEventsCollection, streamEventsCollection } from "~/lib/electric";

// Cache for user-scoped event collections
const eventCollections = new Map<string, ReturnType<typeof createUserScopedStreamEventsCollection>>();
function getEventsCollection(userId: string) {
  let collection = eventCollections.get(userId);
  if (!collection) {
    collection = createUserScopedStreamEventsCollection(userId);
    eventCollections.set(userId, collection);
  }
  return collection;
}

export default function ViewerCountOBS() {
  const [params] = useSearchParams();
  const userId = () => (Array.isArray(params.userId) ? params.userId[0] : params.userId);

  const [viewerCount, setViewerCount] = createSignal(0);
  const [isAnimating, setIsAnimating] = createSignal(false);

  const eventsQuery = useLiveQuery(() => {
    const id = userId();
    if (!id) return streamEventsCollection;
    return getEventsCollection(id);
  });

  const viewerEvents = createMemo(() => {
    const data = eventsQuery.data || [];
    return data.filter((e) => e.type === "viewer_count_update");
  });

  createEffect(() => {
    const events = viewerEvents();
    if (events.length > 0) {
      const latestEvent = events[events.length - 1];
      const newCount = (latestEvent.data?.count as number) || 0;
      setIsAnimating(true);
      setViewerCount(newCount);
      setTimeout(() => setIsAnimating(false), 300);
    }
  });

  return (
    <div class="w-full h-screen bg-transparent overflow-hidden flex items-center justify-center">
      <Show when={userId()} fallback={
        <div class="text-white text-2xl bg-red-500 rounded-lg p-4">
          Error: No userId provided in URL parameters
        </div>
      }>
        <div class="bg-linear-to-r from-blue-900/80 to-purple-900/80 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
          <div class="text-center">
            <div class="text-white text-2xl mb-2">
              👥 Viewers
            </div>
            <div
              class="text-white text-6xl font-bold transition-all duration-300"
              classList={{
                "scale-125": isAnimating(),
                "scale-100": !isAnimating()
              }}
            >
              {viewerCount()}
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
