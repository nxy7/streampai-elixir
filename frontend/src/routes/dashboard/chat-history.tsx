import { Title } from "@solidjs/meta";
import {
  Show,
  For,
  createSignal,
  Suspense,
  ErrorBoundary,
  createResource,
  createEffect,
} from "solid-js";
import { useCurrentUser, getLoginUrl } from "~/lib/auth";
import { A } from "@solidjs/router";
import { card, text, input, badge } from "~/styles/design-system";
import { getChatHistory } from "~/sdk/ash_rpc";
import LoadingIndicator from "~/components/LoadingIndicator";

type Platform = "twitch" | "youtube" | "facebook" | "kick" | "";
type DateRange = "7days" | "30days" | "3months" | "";

const chatMessageFields: (
  | "id"
  | "message"
  | "senderUsername"
  | "platform"
  | "senderIsModerator"
  | "senderIsPatreon"
  | "insertedAt"
  | "viewerId"
  | "userId"
)[] = [
  "id",
  "message",
  "senderUsername",
  "platform",
  "senderIsModerator",
  "senderIsPatreon",
  "insertedAt",
  "viewerId",
  "userId",
];

export interface ChatMessage {
  id: string;
  message: string;
  senderUsername: string;
  platform: string;
  senderIsModerator: boolean | null;
  senderIsPatreon: boolean | null;
  insertedAt: string;
  viewerId: string | null;
  userId: string;
}

export default function ChatHistory() {
  const { user } = useCurrentUser();

  const [platform, setPlatform] = createSignal<Platform>("");
  const [dateRange, setDateRange] = createSignal<DateRange>("");
  const [search, setSearch] = createSignal("");
  const [searchInput, setSearchInput] = createSignal("");

  const handleSearch = (e: Event) => {
    e.preventDefault();
    setSearch(searchInput());
  };

  return (
    <>
      <Title>Chat History - Streampai</Title>
      <Show
        when={user()}
        fallback={
                <div class="min-h-screen bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
            <div class="text-center py-12">
              <h2 class="text-2xl font-bold text-white mb-4">
                Not Authenticated
              </h2>
              <p class="text-gray-300 mb-6">
                Please sign in to view chat history.
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
            <div class="max-w-6xl mx-auto mt-8">
              <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                Error loading chat messages: {err.message}
              </div>
            </div>
          )}
        >
          <Suspense fallback={<LoadingIndicator />}>
            <ChatHistoryContent
              userId={user()!.id}
              platform={platform}
              setPlatform={setPlatform}
              dateRange={dateRange}
              setDateRange={setDateRange}
              search={search}
              searchInput={searchInput}
              setSearchInput={setSearchInput}
              handleSearch={handleSearch}
            />
          </Suspense>
        </ErrorBoundary>
      </Show>
    </>
  );
}

function ChatHistoryContent(props: {
  userId: string;
  platform: () => Platform;
  setPlatform: (p: Platform) => void;
  dateRange: () => DateRange;
  setDateRange: (d: DateRange) => void;
  search: () => string;
  searchInput: () => string;
  setSearchInput: (s: string) => void;
  handleSearch: (e: Event) => void;
}) {
  const [messages, setMessages] = createSignal<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = createSignal(true);

  const loadMessages = async () => {
    setIsLoading(true);
    const result = await getChatHistory({
      input: {
        userId: props.userId,
        platform: props.platform() || undefined,
        dateRange: props.dateRange() || undefined,
        search: props.search() || undefined,
      },
      fields: [...chatMessageFields],
      fetchOptions: { credentials: "include" },
    });

    if (result.success && result.data) {
      setMessages(result.data as ChatMessage[]);
    } else {
      setMessages([]);
    }
    setIsLoading(false);
  };

  // Load messages on mount and when filters change
  createEffect(() => {
    // Track reactive dependencies
    props.platform();
    props.dateRange();
    props.search();
    loadMessages();
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const getPlatformBadgeColor = (platformName: string) => {
    const colors = {
      twitch: badge.info,
      youtube: badge.error,
      facebook: badge.info,
      kick: badge.success,
    };
    return (
      colors[platformName.toLowerCase() as keyof typeof colors] || badge.neutral
    );
  };

  return (
    <div class="max-w-6xl mx-auto space-y-6">
      {/* Filters Section */}
      <div class={card.default}>
        <h3 class={text.h3 + " mb-4"}>Filters</h3>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Platform Filter */}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Platform
            </label>
            <select
              class={input.select}
              value={props.platform()}
              onChange={(e) => {
                props.setPlatform(e.currentTarget.value as Platform);
              }}
            >
              <option value="">All Platforms</option>
              <option value="twitch">Twitch</option>
              <option value="youtube">YouTube</option>
              <option value="facebook">Facebook</option>
              <option value="kick">Kick</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              class={input.select}
              value={props.dateRange()}
              onChange={(e) => {
                props.setDateRange(e.currentTarget.value as DateRange);
              }}
            >
              <option value="">All Time</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="3months">Last 3 Months</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <form onSubmit={props.handleSearch}>
              <input
                type="text"
                class={input.text}
                placeholder="Search messages..."
                value={props.searchInput()}
                onInput={(e) => props.setSearchInput(e.currentTarget.value)}
              />
            </form>
          </div>
        </div>

        {/* Active Filters Summary */}
        <Show when={props.platform() || props.dateRange() || props.search()}>
          <div class="flex items-center gap-2 text-sm text-gray-600">
            <span class="font-medium">Active filters:</span>
            <Show when={props.platform()}>
              <span class={badge.info}>{props.platform()}</span>
            </Show>
            <Show when={props.dateRange()}>
              <span class={badge.info}>
                {props.dateRange() === "7days" && "Last 7 Days"}
                {props.dateRange() === "30days" && "Last 30 Days"}
                {props.dateRange() === "3months" && "Last 3 Months"}
              </span>
            </Show>
            <Show when={props.search()}>
              <span class={badge.info}>"{props.search()}"</span>
            </Show>
            <button
              class="text-purple-600 hover:text-purple-700 text-sm font-medium ml-2"
              onClick={() => {
                props.setPlatform("");
                props.setDateRange("");
                props.setSearchInput("");
              }}
            >
              Clear all
            </button>
          </div>
        </Show>
      </div>

      {/* Messages List */}
      <div class={card.default}>
        <h3 class={text.h3 + " mb-4"}>Messages</h3>

        <Show
          when={messages().length > 0}
          fallback={
            <div class="text-center py-12 text-gray-500">
              <svg
                class="w-16 h-16 mx-auto mb-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p class="text-lg font-medium text-gray-700">
                No chat messages found
              </p>
              <p class="text-sm text-gray-500 mt-2">
                {props.platform() || props.dateRange() || props.search()
                  ? "Try adjusting your filters or search criteria"
                  : "Connect your streaming accounts to see chat messages"}
              </p>
            </div>
          }
        >
          <div class="space-y-3">
            <For each={messages()}>
              {(msg) => (
                <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex-1 min-w-0">
                      {/* Message Header */}
                      <div class="flex items-center gap-2 mb-2 flex-wrap">
                        <Show
                          when={msg.viewerId && msg.userId}
                          fallback={
                            <span class="font-semibold text-gray-900">
                              {msg.senderUsername}
                            </span>
                          }
                        >
                          <A
                            href={`/dashboard/viewers/${msg.viewerId}`}
                            class="font-semibold text-purple-600 hover:text-purple-800 hover:underline"
                          >
                            {msg.senderUsername}
                          </A>
                        </Show>
                        <span class={getPlatformBadgeColor(msg.platform)}>
                          {msg.platform}
                        </span>
                        <Show when={msg.senderIsModerator}>
                          <span class={badge.success}>MOD</span>
                        </Show>
                        <Show when={msg.senderIsPatreon}>
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                            Patron
                          </span>
                        </Show>
                        <span class={text.muted}>
                          {formatDate(msg.insertedAt as string)}
                        </span>
                      </div>

                      {/* Message Content */}
                      <p class="text-gray-700 wrap-break-word">{msg.message}</p>
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>
    </div>
  );
}
