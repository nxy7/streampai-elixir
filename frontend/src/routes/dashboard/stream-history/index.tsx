import { Title } from "@solidjs/meta";
import { Show, For, createSignal, createMemo, Suspense, ErrorBoundary } from "solid-js";
import { A } from "@solidjs/router";
import { useCurrentUser, getLoginUrl } from "~/lib/auth";
import { Card, CardHeader, CardTitle, CardContent, Badge, Alert, Stat } from "~/components/ui";
import { createQuery } from "@urql/solid";
import { graphql, ResultOf } from "~/lib/graphql";
import LoadingIndicator from "~/components/LoadingIndicator";

type Platform = "twitch" | "youtube" | "facebook" | "kick" | "all";
type DateRange = "7days" | "30days" | "all";
type SortBy = "recent" | "duration" | "viewers";

interface StreamStats {
  totalStreams: number;
  totalTime: string;
  avgViewers: number;
  dateRangeLabel: string;
}

const StreamHistoryQuery = graphql(`
  query StreamHistory($userId: ID!) {
    streamHistory(userId: $userId) {
      id
      title
      thumbnailUrl
      startedAt
      endedAt
      durationSeconds
      platforms
      averageViewers
      peakViewers
      messagesAmount
    }
  }
`);

type Livestream = NonNullable<
  ResultOf<typeof StreamHistoryQuery>
>["streamHistory"][number];

export default function StreamHistory() {
  const { user } = useCurrentUser();

  const [platform, setPlatform] = createSignal<Platform>("all");
  const [dateRange, setDateRange] = createSignal<DateRange>("30days");
  const [sortBy, setSortBy] = createSignal<SortBy>("recent");

  return (
    <>
      <Title>Stream History - Streampai</Title>
      <Show
        when={user()}
        fallback={
          <div class="min-h-screen bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
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
        <ErrorBoundary
          fallback={(err) => (
            <div class="max-w-7xl mx-auto mt-8">
              <Alert variant="error">
                Error loading streams: {err.message}
              </Alert>
            </div>
          )}
        >
          <Suspense fallback={<LoadingIndicator />}>
            <StreamHistoryContent
              userId={user()!.id}
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

function StreamHistoryContent(props: {
  userId: string;
  platform: () => Platform;
  setPlatform: (p: Platform) => void;
  dateRange: () => DateRange;
  setDateRange: (d: DateRange) => void;
  sortBy: () => SortBy;
  setSortBy: (s: SortBy) => void;
}) {
  const [streamsQuery] = createQuery({
    query: StreamHistoryQuery,
    variables: () => ({ userId: props.userId }),
  });

  const streams = () => streamsQuery.data?.streamHistory ?? [];

  const filteredAndSortedStreams = createMemo(() => {
    let result = [...streams()];

    if (props.platform() !== "all") {
      result = result.filter((s) =>
        s.platforms?.some((p) => p.toLowerCase() === props.platform())
      );
    }

    const now = new Date();
    if (props.dateRange() === "7days") {
      const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      result = result.filter((s) => new Date(s.startedAt) > cutoff);
    } else if (props.dateRange() === "30days") {
      const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      result = result.filter((s) => new Date(s.startedAt) > cutoff);
    }

    if (props.sortBy() === "recent") {
      result.sort(
        (a, b) =>
          new Date(b.startedAt).getTime() -
          new Date(a.startedAt).getTime()
      );
    } else if (props.sortBy() === "duration") {
      result.sort(
        (a, b) => (b.durationSeconds || 0) - (a.durationSeconds || 0)
      );
    } else if (props.sortBy() === "viewers") {
      result.sort((a, b) => (b.peakViewers || 0) - (a.peakViewers || 0));
    }

    return result;
  });

  const stats = createMemo<StreamStats>(() => {
    const streamList = filteredAndSortedStreams();
    const totalSeconds = streamList.reduce(
      (sum, s) => sum + (s.durationSeconds || 0),
      0
    );
    const totalHours = Math.floor(totalSeconds / 3600);
    const totalMinutes = Math.floor((totalSeconds % 3600) / 60);

    const avgViewers =
      streamList.length > 0
        ? Math.round(
            streamList.reduce((sum, s) => sum + (s.averageViewers || 0), 0) /
              streamList.length
          )
        : 0;

    const dateRangeLabel =
      props.dateRange() === "7days"
        ? "7 days"
        : props.dateRange() === "30days"
        ? "30 days"
        : "all time";

    return {
      totalStreams: streamList.length,
      totalTime: `${totalHours}h ${totalMinutes}m`,
      avgViewers,
      dateRangeLabel,
    };
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDuration = (seconds: number | undefined) => {
    if (!seconds) return "0m";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getPlatformBadgeVariant = (platformName: string): "purple" | "error" | "info" | "success" | "neutral" => {
    const variants: Record<string, "purple" | "error" | "info" | "success" | "neutral"> = {
      twitch: "purple",
      youtube: "error",
      facebook: "info",
      kick: "success",
    };
    return variants[platformName.toLowerCase()] || "neutral";
  };

  return (
    <div class="max-w-7xl mx-auto space-y-6">
      {/* Filters */}
      <Card>
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Filter Streams</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Platform
            </label>
            <select
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              value={props.platform()}
              onChange={(e) =>
                props.setPlatform(e.currentTarget.value as Platform)
              }
            >
              <option value="all">All Platforms</option>
              <option value="twitch">Twitch</option>
              <option value="youtube">YouTube</option>
              <option value="facebook">Facebook</option>
              <option value="kick">Kick</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              value={props.dateRange()}
              onChange={(e) =>
                props.setDateRange(e.currentTarget.value as DateRange)
              }
            >
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="all">All time</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              value={props.sortBy()}
              onChange={(e) =>
                props.setSortBy(e.currentTarget.value as SortBy)
              }
            >
              <option value="recent">Most Recent</option>
              <option value="duration">Longest Duration</option>
              <option value="viewers">Most Viewers</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Stats Overview - only show when data is loaded */}
      <Show when={!streamsQuery.fetching && streams().length >= 0}>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <Stat
              value={String(stats().totalStreams)}
              label={`Streams (${stats().dateRangeLabel})`}
              icon={
                <svg
                  class="w-8 h-8 text-purple-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              }
            />
          </Card>

          <Card>
            <Stat
              value={stats().totalTime}
              label="Total Stream Time"
              icon={
                <svg
                  class="w-8 h-8 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            />
          </Card>

          <Card>
            <Stat
              value={String(stats().avgViewers)}
              label="Avg Viewers"
              icon={
                <svg
                  class="w-8 h-8 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              }
            />
          </Card>
        </div>
      </Show>

      {/* Stream History List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Streams</CardTitle>
        </CardHeader>
        <CardContent>
          <Show
            when={filteredAndSortedStreams().length > 0}
            fallback={
              <div class="text-center py-12">
                <svg
                  class="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900">
                  No streams found
                </h3>
                <p class="mt-1 text-sm text-gray-500">
                  No streams match your current filters.
                </p>
              </div>
            }
          >
            <div class="divide-y divide-gray-200 -mx-6">
              <For each={filteredAndSortedStreams()}>
                {(stream) => (
                  <A
                    href={`/dashboard/stream-history/${stream.id}`}
                    class="block p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div class="flex items-center space-x-4">
                      <Show when={stream.thumbnailUrl}>
                        <div class="shrink-0">
                          <img
                            src={stream.thumbnailUrl!}
                            alt="Stream thumbnail"
                            class="w-32 aspect-video object-cover rounded-lg"
                            onError={(e) =>
                              (e.currentTarget.style.display = "none")
                            }
                          />
                        </div>
                      </Show>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-start justify-between">
                          <div>
                            <h4 class="text-sm font-medium text-gray-900 truncate">
                              {stream.title || "Untitled Stream"}
                            </h4>
                            <div class="flex items-center space-x-2 mt-1 flex-wrap gap-1">
                              <For each={stream.platforms || []}>
                                {(platform) => (
                                  <Badge variant={getPlatformBadgeVariant(platform)}>
                                    {platform.charAt(0).toUpperCase() +
                                      platform.slice(1)}
                                  </Badge>
                                )}
                              </For>
                              <span class="text-xs text-gray-500">
                                {formatDate(stream.startedAt)}
                              </span>
                              <span class="text-xs text-gray-500">
                                {formatDuration(
                                  stream.durationSeconds!
                                )}
                              </span>
                            </div>
                          </div>
                          <div class="text-right ml-4">
                            <div class="text-sm font-medium text-gray-900">
                              {stream.peakViewers || 0} peak viewers
                            </div>
                            <div class="text-xs text-gray-500">
                              {stream.averageViewers || 0} avg •{" "}
                              {stream.messagesAmount || 0} messages
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="shrink-0">
                        <svg
                          class="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </A>
                )}
              </For>
            </div>
          </Show>
        </CardContent>
      </Card>
    </div>
  );
}
