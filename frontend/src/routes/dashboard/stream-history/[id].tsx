import { Title } from "@solidjs/meta";
import { createSignal, createMemo, Show, For, Suspense, ErrorBoundary } from "solid-js";
import { useParams, A } from "@solidjs/router";
import { useCurrentUser, getLoginUrl } from "~/lib/auth";
import { createQuery } from "@urql/solid";
import { graphql, type ResultOf } from "~/lib/graphql";
import LoadingIndicator from "~/components/LoadingIndicator";

const LivestreamQuery = graphql(`
  query GetLivestream($id: ID!) {
    livestream(id: $id) {
      id
      title
      description
      startedAt
      endedAt
      category
      subcategory
      language
      tags
      thumbnailUrl
      averageViewers
      peakViewers
      messagesAmount
      durationSeconds
      platforms
      chatMessages {
        id
        message
        senderUsername
        platform
        senderIsModerator
        senderIsPatreon
        insertedAt
        viewerId
      }
      streamEvents {
        id
        type
        data
        authorId
        platform
        insertedAt
      }
    }
  }
`);

type Livestream = NonNullable<ResultOf<typeof LivestreamQuery>["livestream"]>;
type StreamEvent = Livestream['streamEvents'][number];
type ChatMessage = Livestream['chatMessages'][number];

// Helper functions for formatting
const formatDuration = (seconds: number) => {
  if (!seconds) return "0:00";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(
      secs
    ).padStart(2, "0")}`;
  }
  return `${minutes}:${String(secs).padStart(2, "0")}`;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatTimelineTime = (stream: Livestream, position: number) => {
  const progress = position / 100;
  const seconds = Math.floor((stream.durationSeconds || 0) * progress);
  return formatDuration(seconds);
};

const platformBadgeColor = (platform: string) => {
  const colors: Record<string, string> = {
    twitch: "bg-purple-100 text-purple-800",
    youtube: "bg-red-100 text-red-800",
    facebook: "bg-blue-100 text-blue-800",
    kick: "bg-green-100 text-green-800",
  };
  return colors[platform.toLowerCase()] || "bg-gray-100 text-gray-800";
};

const platformName = (platform: string) => {
  const names: Record<string, string> = {
    twitch: "Twitch",
    youtube: "YouTube",
    facebook: "Facebook",
    kick: "Kick",
  };
  return names[platform.toLowerCase()] || platform;
};

const platformInitial = (platform: string) => {
  const initials: Record<string, string> = {
    twitch: "T",
    youtube: "Y",
    facebook: "F",
    kick: "K",
  };
  return initials[platform.toLowerCase()] || platform[0]?.toUpperCase();
};

const eventColor = (type: string) => {
  const colors: Record<string, string> = {
    donation: "#10b981",
    follow: "#3b82f6",
    subscription: "#8b5cf6",
    raid: "#f59e0b",
  };
  return colors[type] || "#6b7280";
};

const formatCategoryLabel = (category?: string | null) => {
  if (!category) return null;
  return category
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const languageName = (code?: string | null) => {
  if (!code) return null;
  const names: Record<string, string> = {
    en: "English",
    es: "Spanish",
    fr: "French",
    de: "German",
    it: "Italian",
    pt: "Portuguese",
    ru: "Russian",
    ja: "Japanese",
    ko: "Korean",
    zh: "Chinese",
    ar: "Arabic",
    hi: "Hindi",
    pl: "Polish",
    nl: "Dutch",
    tr: "Turkish",
  };
  return names[code] || code;
};

interface StreamInsights {
  peakMoment: {
    time: string;
    timelinePosition: number;
    viewers: number;
    description: string;
  };
  mostActiveChat: {
    startTime?: string;
    messageCount: number;
    timelinePosition: number;
    description?: string;
  };
  totalEvents: number;
  chatActivity: {
    totalMessages: number;
    messagesPerMinute: number;
    activityLevel: string;
  };
}

export default function StreamHistoryDetail() {
  const params = useParams();
  const { user } = useCurrentUser();

  return (
    <>
      <Title>Stream Details - Streampai</Title>
      <Show
        when={user()}
        fallback={
          <div class="min-h-screen bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
            <div class="text-center py-12">
              <h2 class="text-2xl font-bold text-white mb-4">
                Not Authenticated
              </h2>
              <p class="text-gray-300 mb-6">
                Please sign in to view stream details.
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
              <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                Error loading stream: {err.message}
                <br />
                <A
                  href="/dashboard/stream-history"
                  class="mt-2 inline-block text-red-600 hover:text-red-800 underline"
                >
                  ← Back to History
                </A>
              </div>
            </div>
          )}
        >
          <Suspense fallback={<LoadingIndicator />}>
            <StreamDetailContent streamId={params.id!} />
          </Suspense>
        </ErrorBoundary>
      </Show>
    </>
  );
}

function StreamDetailContent(props: { streamId: string }) {
  const [livestreamQuery] = createQuery({
    query: LivestreamQuery,
    variables: () => ({ id: props.streamId }),
  });

  const stream = () => livestreamQuery.data?.livestream;
  const chatMessages = () => stream()?.chatMessages || [];
  const events = () => stream()?.streamEvents || [];
  const [currentTimelinePosition, setCurrentTimelinePosition] = createSignal(0);

  // Generate insights
  const insights = createMemo<StreamInsights>(() => {
    const streamData = stream();
    const messages = chatMessages();
    const streamEvents = events();

    if (!streamData) {
      return {
        peakMoment: {
          time: new Date().toISOString(),
          timelinePosition: 0,
          viewers: 0,
          description: "Viewer data not yet available",
        },
        mostActiveChat: {
          messageCount: 0,
          timelinePosition: 0,
        },
        totalEvents: 0,
        chatActivity: {
          totalMessages: 0,
          messagesPerMinute: 0,
          activityLevel: "Low",
        },
      };
    }

    const chatDensity =
      streamData.durationSeconds && streamData.durationSeconds > 0
        ? messages.length / (streamData.durationSeconds / 60)
        : 0;

    const activityLevel =
      chatDensity > 5
        ? "Very High"
        : chatDensity > 2
        ? "High"
        : chatDensity > 1
        ? "Medium"
        : "Low";

    // Find peak viewer moment
    const peakMoment = {
      time: streamData.startedAt,
      timelinePosition: 0,
      viewers: streamData.peakViewers || 0,
      description: "Peak viewers reached",
    };

    // Find most active chat period (simplified - would need actual time-based analysis)
    const mostActiveChat = {
      messageCount: messages.length,
      timelinePosition: 0,
      description: messages.length > 0 ? "Most active chat period" : undefined,
    };

    return {
      peakMoment,
      mostActiveChat,
      totalEvents: streamEvents.length,
      chatActivity: {
        totalMessages: messages.length,
        messagesPerMinute: Math.round(chatDensity * 10) / 10,
        activityLevel,
      },
    };
  });

  // Filter chat messages up to current timeline position
  const filteredChatMessages = createMemo(() => {
    const streamData = stream();
    const messages = chatMessages();
    const position = currentTimelinePosition();

    if (!streamData || position === 0) {
      return messages.slice(0, 50);
    }

    const progress = position / 100;
    const targetSeconds = (streamData.durationSeconds || 0) * progress;
    const targetTime = new Date(
      new Date(streamData.startedAt).getTime() + targetSeconds * 1000
    );

    const filtered = messages.filter((msg) => {
      return new Date(msg.insertedAt) <= targetTime;
    });

    return filtered.slice(-50);
  });

  // Generate viewer chart points (simplified - would need actual metric data)
  const viewerChartPoints = createMemo(() => {
    const streamData = stream();
    if (!streamData || !streamData.peakViewers) return "";

    // Generate sample points for visualization
    const points: string[] = [];
    const chartWidth = 760;
    const chartHeight = 250;
    const xOffset = 40;
    const numPoints = 20;

    for (let i = 0; i <= numPoints; i++) {
      const x = xOffset + (i / numPoints) * chartWidth;
      // Simple curve that peaks in the middle
      const normalized = Math.sin((i / numPoints) * Math.PI);
      const y = chartHeight - normalized * chartHeight;
      points.push(`${x},${y}`);
    }

    return points.join(" ");
  });

  return (
    <div class="max-w-7xl mx-auto">
      {/* Stream Header */}
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div class="flex items-start space-x-4">
          <Show when={stream()?.thumbnailUrl}>
            <img
              src={stream()!.thumbnailUrl!}
              alt="Stream thumbnail"
              class="w-48 aspect-video object-cover rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </Show>
          <div class="flex-1">
            <h1 class="text-2xl font-bold text-gray-900 mb-2">
              {stream()?.title}
            </h1>
            <div class="flex items-center space-x-2 text-sm text-gray-600 flex-wrap gap-y-2">
              <For each={stream()?.platforms || []}>
                {(platform) => (
                  <span
                    class={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${platformBadgeColor(
                      platform
                    )}`}
                  >
                    {platformName(platform)}
                  </span>
                )}
              </For>
              <span>{formatDate(stream()?.startedAt || "")}</span>
              <span>
                Duration: {formatDuration(stream()?.durationSeconds || 0)}
              </span>
              <span>Peak: {stream()?.peakViewers || 0} viewers</span>
            </div>

            {/* Category, Subcategory, Language, Tags */}
            <div class="mt-3 flex items-center space-x-2 flex-wrap gap-y-2">
              <Show when={stream()?.category}>
                <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800">
                  <svg
                    class="w-3 h-3 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                  {formatCategoryLabel(stream()?.category)}
                </span>
              </Show>

              <Show when={stream()?.subcategory}>
                <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                  {formatCategoryLabel(stream()?.subcategory)}
                </span>
              </Show>

              <Show when={stream()?.language}>
                <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                  <svg
                    class="w-3 h-3 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                    />
                  </svg>
                  {languageName(stream()?.language)}
                </span>
              </Show>

              <For each={stream()?.tags || []}>
                {(tag) => (
                  <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                    #{tag}
                  </span>
                )}
              </For>
            </div>
          </div>
          <A
            href="/dashboard/stream-history"
            class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            ← Back to History
          </A>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div class="lg:col-span-2 space-y-6">
          {/* Viewer Chart */}
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 class="text-lg font-medium text-gray-900 mb-4">
                    Viewer Count Over Time
                  </h3>
                  <Show
                    when={stream()?.peakViewers && stream()!.peakViewers! > 0}
                    fallback={
                      <div class="h-64 bg-gray-50 rounded-lg flex items-center justify-center relative">
                        <div class="text-center text-gray-400">
                          <svg
                            class="mx-auto h-16 w-16 mb-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                          </svg>
                          <p class="text-lg font-medium">
                            Viewer Data Not Yet Available
                          </p>
                          <p class="text-sm">
                            Viewer tracking will be available soon
                          </p>
                        </div>
                      </div>
                    }
                  >
                    <div class="h-64 relative">
                      <svg
                        class="w-full h-full"
                        viewBox="0 0 800 250"
                        preserveAspectRatio="none"
                      >
                        {/* Grid lines */}
                        <g class="grid-lines" stroke="#e5e7eb" stroke-width="1">
                          <For each={[0, 1, 2, 3, 4]}>
                            {(i) => (
                              <line x1="40" y1={50 * i} x2="800" y2={50 * i} />
                            )}
                          </For>
                        </g>
                        {/* Data line */}
                        <polyline
                          fill="none"
                          stroke="#8b5cf6"
                          stroke-width="2"
                          points={viewerChartPoints()}
                        />
                        {/* Y-axis labels */}
                        <g class="y-axis-labels" font-size="12" fill="#6b7280">
                          <For each={[0, 1, 2, 3, 4]}>
                            {(i) => (
                              <text x="5" y={250 - 50 * i} text-anchor="start">
                                {Math.round(
                                  ((stream()?.peakViewers || 0) * i) / 4
                                )}
                              </text>
                            )}
                          </For>
                        </g>
                      </svg>
                      {/* X-axis time labels */}
                      <div class="flex justify-between text-xs text-gray-500 mt-2 px-10">
                        <span>0:00</span>
                        <span>
                          {formatDuration(
                            Math.floor((stream()?.durationSeconds || 0) / 2)
                          )}
                        </span>
                        <span>
                          {formatDuration(stream()?.durationSeconds || 0)}
                        </span>
                      </div>
                    </div>
                  </Show>
                </div>

                {/* Stream Playback Placeholder */}
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 class="text-lg font-medium text-gray-900 mb-4">
                    Stream Playback
                  </h3>
                  <div class="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                    <div class="text-center text-gray-400">
                      <svg
                        class="mx-auto h-16 w-16 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M6 6v6a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2H8a2 2 0 00-2 2z"
                        />
                      </svg>
                      <p class="text-lg font-medium">Stream Playback</p>
                      <p class="text-sm">
                        Video playback will be available here
                      </p>
                    </div>
                  </div>
                </div>

                {/* Timeline with Events */}
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 class="text-lg font-medium text-gray-900 mb-4">
                    Stream Timeline
                  </h3>
                  <div class="relative">
                    {/* Timeline bar */}
                    <div class="h-3 bg-gray-200 rounded-full relative mb-6">
                      <div
                        class="absolute h-full bg-purple-600 rounded-full"
                        style={{
                          width: `${currentTimelinePosition()}%`,
                        }}
                      />
                    </div>

                    {/* Timeline controls */}
                    <div class="flex items-center space-x-4">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={currentTimelinePosition()}
                        onInput={(e) =>
                          setCurrentTimelinePosition(
                            parseInt(e.currentTarget.value)
                          )
                        }
                        class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <span class="text-sm font-medium text-gray-600 min-w-15">
                        <Show when={stream()} fallback="0:00">
                          {formatTimelineTime(
                            stream()!,
                            currentTimelinePosition()
                          )}
                        </Show>
                      </span>
                    </div>

                    {/* Event legend */}
                    <div class="flex items-center space-x-4 mt-4 text-xs">
                      <div class="flex items-center">
                        <div class="w-3 h-3 rounded-full bg-green-500 mr-1" />
                        Donations
                      </div>
                      <div class="flex items-center">
                        <div class="w-3 h-3 rounded-full bg-blue-500 mr-1" />
                        Follows
                      </div>
                      <div class="flex items-center">
                        <div class="w-3 h-3 rounded-full bg-purple-500 mr-1" />
                        Subscriptions
                      </div>
                      <div class="flex items-center">
                        <div class="w-3 h-3 rounded-full bg-orange-500 mr-1" />
                        Raids
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div class="space-y-6">
                {/* Stream Insights */}
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 class="text-lg font-medium text-gray-900 mb-4">
                    Stream Insights
                  </h3>

                  <div class="space-y-4">
                    <div class="bg-purple-50 rounded-lg p-4">
                      <h4 class="font-medium text-purple-900 mb-2">
                        Peak Moment
                      </h4>
                      <p class="text-sm text-purple-700">
                        {insights().peakMoment.description} at{" "}
                        <button
                          type="button"
                          onClick={() =>
                            setCurrentTimelinePosition(
                              insights().peakMoment.timelinePosition
                            )
                          }
                          class="font-medium text-purple-800 hover:text-purple-900 underline"
                        >
                          <Show when={stream()} fallback="0:00">
                            {formatTimelineTime(
                              stream()!,
                              insights().peakMoment.timelinePosition
                            )}
                          </Show>
                        </button>
                      </p>
                      <p class="text-xs text-purple-600 mt-1">
                        {insights().peakMoment.viewers} concurrent viewers
                      </p>
                    </div>

                    <div class="bg-blue-50 rounded-lg p-4">
                      <h4 class="font-medium text-blue-900 mb-2">
                        Chat Activity
                      </h4>
                      <p class="text-sm text-blue-700">
                        {insights().chatActivity.activityLevel} activity level
                      </p>
                      <p class="text-xs text-blue-600 mt-1">
                        {insights().chatActivity.messagesPerMinute} messages/min
                        average
                      </p>
                      <Show when={insights().mostActiveChat.messageCount > 0}>
                        <p class="text-xs text-blue-600 mt-2">
                          {insights().chatActivity.totalMessages} total messages
                        </p>
                      </Show>
                    </div>
                  </div>
                </div>

                {/* Stream Chat */}
                <div class="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div class="px-6 py-4 border-b border-gray-200">
                    <h3 class="text-lg font-medium text-gray-900">
                      Chat Replay
                    </h3>
                    <p class="text-xs text-gray-500 mt-1">
                      Showing messages up to{" "}
                      <Show when={stream()} fallback="0:00">
                        {formatTimelineTime(stream()!, currentTimelinePosition())}
                      </Show>
                    </p>
                  </div>

                  <div class="h-96 overflow-y-auto">
                    <div class="divide-y divide-gray-100">
                      <For each={filteredChatMessages()}>
                        {(message) => (
                          <div class="p-3">
                            <div class="flex items-start space-x-2">
                              <div class="shrink-0">
                                <div
                                  class={`w-6 h-6 rounded-full flex items-center justify-center ${
                                    message.senderIsPatreon
                                      ? "bg-purple-100"
                                      : "bg-gray-100"
                                  }`}
                                >
                                  <span
                                    class={`text-xs font-medium ${
                                      message.senderIsPatreon
                                        ? "text-purple-600"
                                        : "text-gray-600"
                                    }`}
                                  >
                                    {message.senderUsername?.charAt(0) || "?"}
                                  </span>
                                </div>
                              </div>
                              <div class="flex-1 min-w-0">
                                <div class="flex items-center space-x-1">
                                  <span
                                    class={`text-xs font-medium ${
                                      message.senderIsModerator
                                        ? "text-green-600"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {message.senderUsername}
                                  </span>
                                  <Show when={message.platform}>
                                    <span
                                      class={`inline-flex items-center px-1 py-0.5 rounded text-xs font-medium ${platformBadgeColor(
                                        message.platform!
                                      )}`}
                                    >
                                      {platformInitial(message.platform!)}
                                    </span>
                                  </Show>
                                  <Show when={message.senderIsModerator}>
                                    <span class="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                      MOD
                                    </span>
                                  </Show>
                                  <Show when={message.senderIsPatreon}>
                                    <span class="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                      SUB
                                    </span>
                                  </Show>
                                </div>
                                <p class="text-xs text-gray-600 mt-0.5">
                                  {message.message}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </For>
                    </div>
                  </div>
                </div>
              </div>
            </div>
    </div>
  );
}
