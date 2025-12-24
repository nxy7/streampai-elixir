import { Title } from "@solidjs/meta";
import { Show, For, createSignal, createEffect, createMemo, onCleanup } from "solid-js";
import { A } from "@solidjs/router";
import { useCurrentUser, getLoginUrl } from "~/lib/auth";
import { Card, CardHeader, CardTitle, CardContent, Stat, StatGroup, ProgressBar, Badge, Alert } from "~/components/ui";
import { getStreamHistory, type SuccessDataFunc } from "~/sdk/ash_rpc";

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

const analyticsFields: (
  | "id"
  | "title"
  | "startedAt"
  | "endedAt"
  | "durationSeconds"
  | "platforms"
  | "averageViewers"
  | "peakViewers"
  | "messagesAmount"
)[] = [
  "id",
  "title",
  "startedAt",
  "endedAt",
  "durationSeconds",
  "platforms",
  "averageViewers",
  "peakViewers",
  "messagesAmount",
];

type Livestream = SuccessDataFunc<typeof getStreamHistory<typeof analyticsFields>>[number];

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
      const result = await getStreamHistory({
        input: { userId: currentUser.id },
        fields: [...analyticsFields],
        fetchOptions: { credentials: "include" },
      });

      if (!result.success) {
        setError("Failed to load analytics data");
        console.error("RPC error:", result.errors);
      } else {
        setStreams(result.data);
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
                <Alert variant="error">{error()}</Alert>
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

interface DailyStreamData {
  date: Date;
  dateKey: string;
  peakViewers: number;
  avgViewers: number;
  streamCount: number;
  totalHours: number;
}

function LineChart(props: LineChartProps) {
  // Aggregate hourly data into daily summaries
  const dailyData = createMemo((): DailyStreamData[] => {
    const dailyMap = new Map<string, {
      date: Date;
      values: number[];
      hours: number;
    }>();

    props.data.forEach(point => {
      const dateKey = point.time.toISOString().split('T')[0];
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, {
          date: new Date(point.time.getFullYear(), point.time.getMonth(), point.time.getDate()),
          values: [],
          hours: 0
        });
      }
      if (point.value > 0) {
        dailyMap.get(dateKey)!.values.push(point.value);
        dailyMap.get(dateKey)!.hours++;
      }
    });

    const result: DailyStreamData[] = [];
    dailyMap.forEach((data, dateKey) => {
      const values = data.values;
      result.push({
        date: data.date,
        dateKey,
        peakViewers: values.length > 0 ? Math.max(...values) : 0,
        avgViewers: values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0,
        streamCount: values.length > 0 ? 1 : 0, // Simplified - actual count would need stream boundaries
        totalHours: data.hours,
      });
    });

    return result.sort((a, b) => a.date.getTime() - b.date.getTime());
  });

  const daysWithData = createMemo(() => dailyData().filter(d => d.peakViewers > 0));
  const hasAnyData = createMemo(() => daysWithData().length > 0);

  const maxValue = createMemo(() => {
    const rawMax = Math.max(...dailyData().map(d => d.peakViewers), 100);
    const roundingFactor = rawMax < 500 ? 10 : 100;
    return Math.ceil(rawMax / roundingFactor) * roundingFactor;
  });

  const formatChartDate = (date: Date): string => {
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const labelIndices = createMemo(() => {
    const len = dailyData().length;
    if (len <= 5) return dailyData().map((_, i) => i);
    return [0, Math.floor(len / 4), Math.floor(len / 2), Math.floor(3 * len / 4), len - 1];
  });

  const chartColors = {
    primary: "rgb(99, 102, 241)",
    primaryLight: "rgb(165, 180, 252)",
    primaryDark: "rgb(79, 70, 229)",
    gridLine: "#e5e7eb",
    baseline: "#d1d5db",
  };

  return (
    <Card>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-medium text-gray-900">{props.title}</h3>
        <Show when={hasAnyData()}>
          <div class="flex items-center gap-4 text-xs text-gray-500">
            <div class="flex items-center gap-1">
              <div class="w-3 h-3 rounded-full bg-indigo-500" />
              <span>Peak viewers</span>
            </div>
            <div class="flex items-center gap-1">
              <div class="w-3 h-3 rounded-full bg-indigo-300" />
              <span>Avg viewers</span>
            </div>
          </div>
        </Show>
      </div>

      <Show
        when={hasAnyData()}
        fallback={
          <div class="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div class="text-center">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p class="mt-2 text-sm font-medium text-gray-900">No streaming data for this period</p>
              <p class="mt-1 text-xs text-gray-500">Stream to see your viewer trends here</p>
            </div>
          </div>
        }
      >
        <div class="h-64 relative pl-12">
          <svg class="w-full h-full" viewBox="0 0 800 300" preserveAspectRatio="none">
            {/* Grid lines */}
            <For each={[0, 1, 2, 3, 4]}>
              {(i) => {
                const y = i * 60 + 10;
                return (
                  <line
                    x1="0"
                    y1={y}
                    x2="800"
                    y2={y}
                    stroke={chartColors.gridLine}
                    stroke-width="1"
                  />
                );
              }}
            </For>

            {/* Baseline */}
            <line x1="0" y1="290" x2="800" y2="290" stroke={chartColors.baseline} stroke-width="1" />

            {/* Bars for each day */}
            <For each={dailyData()}>
              {(day, i) => {
                const barWidth = Math.max(8, Math.min(40, 780 / dailyData().length - 4));
                const x = (i() / Math.max(dailyData().length - 1, 1)) * (800 - barWidth);
                const peakHeight = (day.peakViewers / maxValue()) * 280;
                const avgHeight = (day.avgViewers / maxValue()) * 280;

                return (
                  <Show when={day.peakViewers > 0}>
                    <g>
                      {/* Peak viewers bar (background) */}
                      <rect
                        x={x}
                        y={290 - peakHeight}
                        width={barWidth}
                        height={peakHeight}
                        fill={chartColors.primary}
                        rx="2"
                        opacity="0.9"
                      />
                      {/* Average viewers bar (overlay) */}
                      <rect
                        x={x}
                        y={290 - avgHeight}
                        width={barWidth}
                        height={avgHeight}
                        fill={chartColors.primaryLight}
                        rx="2"
                      />
                      {/* Peak dot on top */}
                      <circle
                        cx={x + barWidth / 2}
                        cy={290 - peakHeight}
                        r="4"
                        fill={chartColors.primaryDark}
                        stroke="white"
                        stroke-width="2"
                      />
                    </g>
                  </Show>
                );
              }}
            </For>
          </svg>

          {/* Y-axis labels */}
          <div class="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pr-2">
            <For each={[4, 3, 2, 1, 0]}>
              {(i) => (
                <span class="text-right pr-2">{Math.floor((maxValue() * i) / 4)}</span>
              )}
            </For>
          </div>

          {/* X-axis labels */}
          <div class="absolute bottom-0 left-12 right-0 flex justify-between text-xs text-gray-500 transform translate-y-5">
            <For each={labelIndices()}>
              {(idx) => (
                <span>{dailyData()[idx] ? formatChartDate(dailyData()[idx].date) : ""}</span>
              )}
            </For>
          </div>
        </div>

        {/* Summary stats below chart */}
        <div class="mt-8">
          <StatGroup columns={3}>
            <Stat value={String(daysWithData().length)} label="Days streamed" />
            <Stat
              value={String(hasAnyData() ? Math.max(...daysWithData().map(d => d.peakViewers)) : 0)}
              label="Peak viewers"
              highlight
            />
            <Stat
              value={String(hasAnyData()
                ? Math.round(daysWithData().reduce((sum, d) => sum + d.avgViewers, 0) / daysWithData().length)
                : 0)}
              label="Avg viewers"
            />
          </StatGroup>
        </div>
      </Show>
    </Card>
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

  return (
    <Card>
      <h3 class="text-lg font-medium text-gray-900 mb-4">{props.title}</h3>
      <div class="space-y-3">
        <For each={props.data}>
          {(item) => (
            <ProgressBar
              value={item.value}
              max={maxValue()}
              label={item.label}
              showValue
            />
          )}
        </For>
      </div>
    </Card>
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

  const getPlatformBadgeVariant = (platformName: string): "purple" | "error" | "info" | "success" | "neutral" => {
    const lower = platformName.toLowerCase();
    if (lower.includes("twitch")) return "purple";
    if (lower.includes("youtube")) return "error";
    if (lower.includes("facebook")) return "info";
    if (lower.includes("kick")) return "success";
    return "neutral";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Streams</CardTitle>
      </CardHeader>
      <CardContent>
        <Show
          when={props.streams.length > 0}
          fallback={
            <div class="py-12 text-center">
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
          <div class="overflow-x-auto -mx-6">
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
                        <Badge variant={getPlatformBadgeVariant(stream.platform)}>
                          {stream.platform}
                        </Badge>
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
      </CardContent>
    </Card>
  );
}
