import { Title } from "@solidjs/meta";
import { Show, For, createSignal, createMemo, Suspense, ErrorBoundary } from "solid-js";
import { A } from "@solidjs/router";
import { useCurrentUser, getLoginUrl } from "~/lib/auth";
import { button, card, text, badge } from "~/styles/design-system";
import { createQuery } from "@urql/solid"; // Use createQuery instead of client.query
import { graphql, ResultOf } from "~/lib/graphql";
import LoadingIndicator from "~/components/LoadingIndicator";

type Platform = "twitch" | "youtube" | "facebook" | "kick" | "all";
type DateRange = "7days" | "30days" | "all";
type SortBy = "recent" | "duration" | "viewers";

const StreamHistoryQuery = graphql(`
  query StreamHistory($userId: ID!) {
    streamHistory(userId: $userId) {
      id
      title
      startedAt
      endedAt
      durationSeconds
      platforms
      peakViewers
      averageViewers
      messagesAmount
      thumbnailUrl
    }
  }
`);

type Livestream = NonNullable<
  ResultOf<typeof StreamHistoryQuery>
>["streamHistory"][number];

export default function StreamHistory() {
  const { user } = useCurrentUser();

  // Filters as signals (these don't need Suspense)
  const [platform, setPlatform] = createSignal<Platform>("all");
  const [dateRange, setDateRange] = createSignal<DateRange>("30days");
  const [sortBy, setSortBy] = createSignal<SortBy>("recent");

  // Use createQuery with Suspense support
  // This will automatically suspend while loading!
  const [streamsQuery] = createQuery({
    query: StreamHistoryQuery,
    variables: () => ({ userId: user()!.id }),
    pause: () => !user()?.id, // Don't query if no user
  });

  // Derived data (filtering and sorting)
  const filteredAndSortedStreams = createMemo(() => {
    const streams = streamsQuery.data?.streamHistory || [];
    let result = [...streams];

    // Filter by platform
    if (platform() !== "all") {
      result = result.filter((s) =>
        s.platforms?.some((p) => p.toLowerCase() === platform())
      );
    }

    // Filter by date range
    const now = new Date();
    if (dateRange() === "7days") {
      const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      result = result.filter((s) => new Date(s.startedAt as Date) > cutoff);
    } else if (dateRange() === "30days") {
      const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      result = result.filter((s) => new Date(s.startedAt as Date) > cutoff);
    }

    // Sort
    if (sortBy() === "recent") {
      result.sort(
        (a, b) =>
          new Date(b.startedAt as Date).getTime() -
          new Date(a.startedAt as Date).getTime()
      );
    } else if (sortBy() === "duration") {
      result.sort(
        (a, b) => (b.durationSeconds || 0) - (a.durationSeconds || 0)
      );
    } else if (sortBy() === "viewers") {
      result.sort((a, b) => (b.peakViewers || 0) - (a.peakViewers || 0));
    }

    return result;
  });

  return (
    <>
      <Title>Stream History - Streampai</Title>

      <Show
        when={user()}
        fallback={
          <div class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
            <div class="text-center py-12">
              <h2 class="text-2xl font-bold text-white mb-4">
                Not Authenticated
              </h2>
              <p class="text-gray-300 mb-6">
                Please sign in to view stream history.
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
        {/* Wrap content in ErrorBoundary and Suspense */}
        <ErrorBoundary
          fallback={(err) => (
            <div class="max-w-6xl mx-auto mt-8">
              <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                Error loading streams: {err.message}
              </div>
            </div>
          )}
        >
          <Suspense fallback={<LoadingIndicator />}>
            <StreamHistoryContent
              streams={filteredAndSortedStreams}
              platform={platform}
              setPlatform={setPlatform}
              dateRange={dateRange}
              setDateRange={setDateRange}
              sortBy={sortBy}
              setSortBy={setSortBy}
            />
          </Suspense>
        </ErrorBoundary>
      </Show>
    </>
  );
}

// Separate component for the actual content
// This allows the Suspense boundary to work properly
function StreamHistoryContent(props: {
  streams: () => Livestream[];
  platform: () => Platform;
  setPlatform: (p: Platform) => void;
  dateRange: () => DateRange;
  setDateRange: (d: DateRange) => void;
  sortBy: () => SortBy;
  setSortBy: (s: SortBy) => void;
}) {
  return (
    <div class="max-w-6xl mx-auto space-y-6">
      {/* Filters */}
      <div class={card.default}>
        <h3 class={text.h3 + " mb-4"}>Filters</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Platform filter */}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Platform
            </label>
            <select
              class="w-full rounded-md border-gray-300"
              value={props.platform()}
              onChange={(e) => props.setPlatform(e.currentTarget.value as Platform)}
            >
              <option value="all">All Platforms</option>
              <option value="twitch">Twitch</option>
              <option value="youtube">YouTube</option>
              <option value="facebook">Facebook</option>
              <option value="kick">Kick</option>
            </select>
          </div>

          {/* Similar for other filters... */}
        </div>
      </div>

      {/* Stream List */}
      <div class={card.default}>
        <Show
          when={props.streams().length > 0}
          fallback={
            <div class="text-center py-12 text-gray-500">
              No streams found
            </div>
          }
        >
          <div class="divide-y divide-gray-200">
            <For each={props.streams()}>
              {(stream) => (
                <A
                  href={`/dashboard/stream-history/${stream.id}`}
                  class="block p-6 hover:bg-gray-50 transition-colors"
                >
                  {/* Stream card content */}
                  <div class="text-sm font-medium text-gray-900">
                    {stream.title || "Untitled Stream"}
                  </div>
                </A>
              )}
            </For>
          </div>
        </Show>
      </div>
    </div>
  );
}
