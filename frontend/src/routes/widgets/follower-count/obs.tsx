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

export default function FollowerCountOBS() {
  const [params] = useSearchParams();
  const userId = () => (Array.isArray(params.userId) ? params.userId[0] : params.userId);

  const [followerCount, setFollowerCount] = createSignal(0);
  const [isAnimating, setIsAnimating] = createSignal(false);
  const [latestFollower, setLatestFollower] = createSignal<string | null>(null);
  const [processedFollowerIds, setProcessedFollowerIds] = createSignal<Set<string>>(new Set());

  const eventsQuery = useLiveQuery(() => {
    const id = userId();
    if (!id) return streamEventsCollection;
    return getEventsCollection(id);
  });

  const followEvents = createMemo(() => {
    const data = eventsQuery.data || [];
    return data.filter((e) => e.type === "follow")
      .sort((a, b) => new Date(a.inserted_at).getTime() - new Date(b.inserted_at).getTime());
  });

  createEffect(() => {
    const events = followEvents();
    const processed = processedFollowerIds();

    events.forEach((event) => {
      if (processed.has(event.id)) return;

      const username = (event.data?.username as string) || event.author_id;
      setFollowerCount(prev => prev + 1);
      setLatestFollower(username);
      setIsAnimating(true);
      setTimeout(() => {
        setIsAnimating(false);
        setTimeout(() => setLatestFollower(null), 3000);
      }, 300);

      setProcessedFollowerIds((prev) => new Set([...prev, event.id]));
    });
  });

  return (
    <div class="w-full h-screen bg-transparent overflow-hidden flex items-center justify-center">
      <Show when={userId()} fallback={
        <div class="text-white text-2xl bg-red-500 rounded-lg p-4">
          Error: No userId provided in URL parameters
        </div>
      }>
        <div class="bg-linear-to-r from-pink-900/80 to-red-900/80 rounded-2xl p-8 shadow-2xl backdrop-blur-sm min-w-[300px]">
          <div class="text-center">
            <div class="text-white text-2xl mb-2">
              ❤️ Followers
            </div>
            <div
              class="text-white text-6xl font-bold transition-all duration-300"
              classList={{
                "scale-125": isAnimating(),
                "scale-100": !isAnimating()
              }}
            >
              {followerCount()}
            </div>
            <Show when={latestFollower()}>
              <div class="text-white text-xl mt-4 animate-fade-in">
                Latest: {latestFollower()}
              </div>
            </Show>
          </div>
        </div>
      </Show>
    </div>
  );
}
