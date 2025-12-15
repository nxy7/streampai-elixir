import { useSearchParams } from "@solidjs/router";
import { createEffect, createSignal, Show } from "solid-js";
import { gql, createSubscription } from "@urql/solid";

const VIEWER_COUNT_SUBSCRIPTION = gql`
  subscription ViewerCountUpdated($userId: ID!) {
    viewerCountUpdated(userId: $userId) {
      count
      timestamp
      platform
    }
  }
`;

export default function ViewerCountOBS() {
  const [params] = useSearchParams();
  const userId = () => (Array.isArray(params.userId) ? params.userId[0] : params.userId);

  const [viewerCount, setViewerCount] = createSignal(0);
  const [isAnimating, setIsAnimating] = createSignal(false);

  const result = createSubscription({
    query: VIEWER_COUNT_SUBSCRIPTION,
    variables: { userId: userId() },
    pause: !userId(),
  });

  createEffect(() => {
    if (result()?.data?.viewerCountUpdated) {
      const newCount = result.data.viewerCountUpdated.count;
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
        <div class="bg-gradient-to-r from-blue-900/80 to-purple-900/80 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
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
