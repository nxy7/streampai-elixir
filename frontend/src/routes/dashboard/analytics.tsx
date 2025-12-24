import { Title } from "@solidjs/meta";
import { Show, For, createSignal, createEffect, createMemo, onCleanup } from "solid-js";
import { A } from "@solidjs/router";
import { useCurrentUser, getLoginUrl } from "~/lib/auth";
import { card, text } from "~/styles/design-system";
import { client } from "~/lib/urql";
import { graphql, ResultOf } from "gql.tada";

type Timeframe = "day" | "week" | "month" | "year";

interface ViewerDataPoint {
  time: Date;
  value: number;
}

interface PlatformData {
  label: string;
  value: number;
}

interface StreamData {
  id: string;
  title: string;
  platform: string;
  startTime: Date;
  duration: string;
  viewers: {
    peak: number;
    average: number;
  };
  engagement: {
    chatMessages: number;
  };
}

const StreamHistoryQuery = graphql(`
  query StreamHistory($userId: ID!) {
    streamHistory(userId: $userId) {
      id
      title
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

export default function Analytics() {
  const { user, isLoading } = useCurrentUser();

  const [timeframe, setTimeframe] = createSignal<Timeframe>("week");
  const [streams, setStreams] = createSignal<Livestream[]>([]);
  const [isLoadingStreams, setIsLoadingStreams] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  const loadStreams = async () => {
    const currentUser = user();
    if (!currentUser?.id) return;

    setIsLoadingStreams(true);
    setError(null);

    try {
      const result = await client.query(StreamHistoryQuery, {
        userId: currentUser.id,
      });

      if (result.error) {
        setError("Failed to load analytics data");
        console.error("GraphQL error:", result.error);
      } else if (result.data?.streamHistory) {
        setStreams(result.data.streamHistory);
      } else {
        setStreams([]);
      }
    } catch (err) {
      setError("Failed to load analytics data");
      console.error("Error loading streams:", err);
    } finally {
      setIsLoadingStreams(false);
    }
  };

  createEffect(() => {
    if (user()?.id) {
      loadStreams();

      const updateInterval = setInterval(() => {
        loadStreams();
      }, 5000);

      onCleanup(() => {
        clearInterval(updateInterval);
      });
    }
  });

  const daysForTimeframe = (tf: Timeframe): number => {
    switch (tf) {
      case "day": return 1;
      case "week": return 7;
      case "month": return 30;
      case "year": return 365;
      default: return 7;
    }
  };

  const filteredStreams = createMemo(() => {
    const days = daysForTimeframe(timeframe());
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return streams().filter(stream => {
      const startDate = new Date(stream.startedAt);
      return startDate >= cutoff && stream.endedAt;
    });
  });

  const avgViewers = createMemo(() => {
    const streamList = filteredStreams();
    if (streamList.length === 0) return 0;

    const total = streamList.reduce((sum, s) => sum + (s.averageViewers || 0), 0);
    return Math.round(total / streamList.length);
  });

  const viewerData = createMemo((): ViewerDataPoint[] => {
    const days = daysForTimeframe(timeframe());
    const now = new Date();
    const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0);

    const dataByHour = new Map<number, number[]>();

    filteredStreams().forEach(stream => {
      const startDate = new Date(stream.startedAt);
      const endDate = stream.endedAt ? new Date(stream.endedAt) : now;
      const durationHours = Math.max(1, Math.floor((stream.durationSeconds || 0) / 3600));

      for (let i = 0; i < durationHours; i++) {
        const hour = new Date(startDate.getTime() + i * 3600000);
        const hourKey = Math.floor(hour.getTime() / 3600000) * 3600000;

        if (!dataByHour.has(hourKey)) {
          dataByHour.set(hourKey, []);
        }
        dataByHour.get(hourKey)!.push(stream.averageViewers || 0);
      }
    });

    const points: ViewerDataPoint[] = [];
    for (let i = 0; i < days * 24; i++) {
      const hour = new Date(currentHour.getTime() - i * 3600000);
      const hourKey = Math.floor(hour.getTime() / 3600000) * 3600000;
      const values = dataByHour.get(hourKey) || [];
      const avgValue = values.length > 0
        ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
        : 0;

      points.unshift({ time: hour, value: avgValue });
    }

    return points;
  });

  const platformBreakdown = createMemo((): PlatformData[] => {
    const platformCounts = new Map<string, number>();
    const platformViewers = new Map<string, number>();

    filteredStreams().forEach(stream => {
      (stream.platforms || []).forEach(platform => {
        const platformKey = platform.toLowerCase();
        platformCounts.set(platformKey, (platformCounts.get(platformKey) || 0) + 1);
        platformViewers.set(platformKey, (platformViewers.get(platformKey) || 0) + (stream.averageViewers || 0));
      });
    });

    const total = Array.from(platformViewers.values()).reduce((a, b) => a + b, 0);

    const platforms: PlatformData[] = [];
    ["twitch", "youtube", "facebook", "kick"].forEach(platform => {
      const viewers = platformViewers.get(platform) || 0;
      const percentage = total > 0 ? (viewers / total) * 100 : 0;
      platforms.push({
        label: platform.charAt(0).toUpperCase() + platform.slice(1),
        value: percentage,
      });
    });

    return platforms.sort((a, b) => b.value - a.value);
  });

  const recentStreams = createMemo((): StreamData[] => {
    return filteredStreams()
      .slice(0, 5)
      .map(stream => ({
        id: stream.id,
        title: stream.title || "Untitled Stream",
        platform: formatPlatforms(stream.platforms || []),
        startTime: new Date(stream.startedAt),
        duration: formatDuration(stream.durationSeconds || 0),
        viewers: {
          peak: stream.peakViewers || 0,
          average: stream.averageViewers || 0,
        },
        engagement: {
          chatMessages: stream.messagesAmount || 0,
        },
      }));
  });

  const formatPlatforms = (platforms: string[]): string => {
    if (platforms.length === 0) return "N/A";
    if (platforms.length === 1) return platforms[0].charAt(0).toUpperCase() + platforms[0].slice(1);
    return platforms.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(", ");
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const formatChartDate = (date: Date): string => {
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const getPlatformBadgeClass = (platformName: string): string => {
    const lower = platformName.toLowerCase();
    if (lower.includes("twitch")) return "bg-purple-100 text-purple-800";
    if (lower.includes("youtube")) return "bg-red-100 text-red-800";
    if (lower.includes("facebook")) return "bg-blue-100 text-blue-800";
    if (lower.includes("kick")) return "bg-green-100 text-green-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <>
      <Title>Analytics - Streampai</Title>
      <Show
        when={!isLoading()}
        fallback={
          <div class="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
            <div class="text-white text-xl">Loading...</div>
          </div>
        }
      >
        <Show
          when={user()}
          fallback={
            <div class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
              <div class="text-center py-12">
                <h2 class="text-2xl font-bold text-white mb-4">Not Authenticated</h2>
                <p class="text-gray-300 mb-6">Please sign in to view analytics.</p>
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
            <div class="space-y-6">
              <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 class="text-2xl font-bold text-gray-900">Stream Analytics</h1>
                  <p class="mt-1 text-sm text-gray-500">
                    Track your streaming performance and audience metrics
                  </p>
                </div>

                <select
                  class="rounded-md border-gray-300 text-sm focus:ring-2 focus:ring-purple-600 focus:border-transparent px-4 py-2"
                  value={timeframe()}
                  onChange={(e) => setTimeframe(e.currentTarget.value as Timeframe)}
                >
                  <option value="day">Last 24 Hours</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="year">Last Year</option>
                </select>
              </div>

              <Show when={error()}>
                <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                  {error()}
                </div>
              </Show>

              <Show
                when={!isLoadingStreams()}
                fallback={
                  <div class="text-center py-12">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p class="mt-4 text-gray-600">Loading analytics...</p>
                  </div>
                }
              >
                <div class="grid grid-cols-1 gap-6">
                  <LineChart title="Viewer Trends" data={viewerData()} />
                </div>

                <div class="grid grid-cols-1 gap-6">
                  <BarChart title="Platform Distribution" data={platformBreakdown()} />
                </div>

                <StreamTable streams={recentStreams()} />
              </Show>
            </div>
          </>
        </Show>
      </Show>
    </>
  );
}

interface LineChartProps {
  title: string;
  data: ViewerDataPoint[];
}

function LineChart(props: LineChartProps) {
  const maxValue = createMemo(() => {
    const rawMax = Math.max(...props.data.map(d => d.value), 100);
    const roundingFactor = rawMax < 500 ? 10 : 100;
    return Math.ceil(rawMax / roundingFactor) * roundingFactor;
  });

  const points = createMemo(() => {
    if (props.data.length === 0) return "";

    return props.data
      .map((item, i) => {
        const x = (i / (props.data.length - 1)) * 800;
        const y = 300 - (item.value / maxValue()) * 280;
        return `${x},${y}`;
      })
      .join(" ");
  });

  const formatChartDate = (date: Date): string => {
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const labelIndices = createMemo(() => {
    const len = props.data.length - 1;
    return [0, Math.floor(len / 4), Math.floor(len / 2), Math.floor(3 * len / 4), len];
  });

  return (
    <div class={card.default}>
      <h3 class="text-lg font-medium text-gray-900 mb-4">{props.title}</h3>
      <div class="h-64 relative pl-12">
        <svg class="w-full h-full" viewBox="0 0 800 300" preserveAspectRatio="none">
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:rgb(99, 102, 241);stop-opacity:0.3" />
              <stop offset="100%" style="stop-color:rgb(99, 102, 241);stop-opacity:0" />
            </linearGradient>
          </defs>

          <For each={[0, 1, 2, 3, 4]}>
            {(i) => {
              const y = i * 60 + 10;
              return (
                <line
                  x1="0"
                  y1={y}
                  x2="800"
                  y2={y}
                  stroke="#e5e7eb"
                  stroke-width="1"
                />
              );
            }}
          </For>

          <Show when={points().length > 0}>
            <polyline
              fill="url(#gradient)"
              stroke="none"
              points={`0,300 ${points()} 800,300`}
            />

            <polyline
              fill="none"
              stroke="rgb(99, 102, 241)"
              stroke-width="2"
              points={points()}
            />

            <For each={props.data}>
              {(item, i) => {
                const x = (i() / (props.data.length - 1)) * 800;
                const y = 300 - (item.value / maxValue()) * 280;
                return <circle cx={x} cy={y} r="4" fill="rgb(99, 102, 241)" />;
              }}
            </For>
          </Show>
        </svg>

        <div class="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-xs text-gray-500">
          <For each={[4, 3, 2, 1, 0]}>
            {(i) => (
              <span class="text-right pr-2">{Math.floor((maxValue() * i) / 4)}</span>
            )}
          </For>
        </div>

        <div class="absolute bottom-0 left-12 right-0 flex justify-between text-xs text-gray-500">
          <For each={labelIndices()}>
            {(idx) => (
              <span>{props.data[idx] ? formatChartDate(props.data[idx].time) : ""}</span>
            )}
          </For>
        </div>
      </div>
    </div>
  );
}

interface BarChartProps {
  title: string;
  data: PlatformData[];
}

function BarChart(props: BarChartProps) {
  const maxValue = createMemo(() => {
    return Math.max(...props.data.map(d => d.value), 100);
  });

  const formatValue = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div class={card.default}>
      <h3 class="text-lg font-medium text-gray-900 mb-4">{props.title}</h3>
      <div class="space-y-3">
        <For each={props.data}>
          {(item) => {
            const widthPct = maxValue() > 0 ? (item.value / maxValue()) * 100 : 0;
            return (
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-gray-600">{item.label}</span>
                  <span class="font-medium text-gray-900">{formatValue(item.value)}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div
                    class="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
}

interface StreamTableProps {
  streams: StreamData[];
}

function StreamTable(props: StreamTableProps) {
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getPlatformBadgeClass = (platformName: string): string => {
    const lower = platformName.toLowerCase();
    if (lower.includes("twitch")) return "bg-purple-100 text-purple-800";
    if (lower.includes("youtube")) return "bg-red-100 text-red-800";
    if (lower.includes("facebook")) return "bg-blue-100 text-blue-800";
    if (lower.includes("kick")) return "bg-green-100 text-green-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
      <div class="px-6 py-4 border-b border-gray-200 rounded-t-lg">
        <h3 class="text-lg font-medium text-gray-900">Recent Streams</h3>
      </div>
      <div class="relative rounded-b-lg">
        <Show
          when={props.streams.length > 0}
          fallback={
            <div class="px-6 py-12 text-center">
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
              <h3 class="mt-2 text-sm font-medium text-gray-900">No streams yet</h3>
              <p class="mt-1 text-sm text-gray-500">
                Start streaming to see your analytics and performance data here.
              </p>
            </div>
          }
        >
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                    Stream
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                    Platform
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                    Duration
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                    Peak Viewers
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                    Avg Viewers
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                    Chat Messages
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <For each={props.streams}>
                  {(stream) => (
                    <tr class="hover:bg-gray-50">
                      <td class="px-6 py-4 whitespace-nowrap">
                        <A
                          href={`/dashboard/stream-history/${stream.id}`}
                          class="block hover:text-purple-600"
                        >
                          <div class="text-sm font-medium text-gray-900">
                            {stream.title}
                          </div>
                          <div class="text-xs text-gray-500">
                            {formatDate(stream.startTime)}
                          </div>
                        </A>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class={`px-2 py-1 text-xs rounded-full ${getPlatformBadgeClass(stream.platform)}`}>
                          {stream.platform}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stream.duration}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(stream.viewers.peak)}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(stream.viewers.average)}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(stream.engagement.chatMessages)}
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </Show>
      </div>
    </div>
  );
}
