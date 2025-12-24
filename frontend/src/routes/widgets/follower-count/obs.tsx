import { useSearchParams } from "@solidjs/router";
import { createEffect, createSignal, Show } from "solid-js";
import { createSubscription } from "@urql/solid";
import { graphql } from "gql.tada";

const FOLLOWER_SUBSCRIPTION = graphql(`
  subscription FollowerAdded($userId: ID!) {
    followerAdded(userId: $userId) {
      id
      username
      timestamp
      platform
    }
  }
`);

export default function FollowerCountOBS() {
  const [params] = useSearchParams();
  const userId = () => (Array.isArray(params.userId) ? params.userId[0] : params.userId);

  const [followerCount, setFollowerCount] = createSignal(0);
  const [isAnimating, setIsAnimating] = createSignal(false);
  const [latestFollower, setLatestFollower] = createSignal<string | null>(null);

  const result = createSubscription({
    query: FOLLOWER_SUBSCRIPTION,
    variables: { userId: userId() },
    pause: !userId(),
  });

  createEffect(() => {
    if (result()?.data?.followerAdded) {
      const follower = result.data.followerAdded;
      setFollowerCount(prev => prev + 1);
      setLatestFollower(follower.username);
      setIsAnimating(true);
      setTimeout(() => {
        setIsAnimating(false);
        setTimeout(() => setLatestFollower(null), 3000);
      }, 300);
    }
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
