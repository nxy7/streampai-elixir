import { Title } from "@solidjs/meta";
import { Show, For, createSignal, createEffect } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { useCurrentUser, getLoginUrl } from "~/lib/auth";
import { button, card, text, input, badge } from "~/styles/design-system";
import { listViewers, searchViewers, listBannedViewers } from "~/sdk/ash_rpc";

type Platform = "twitch" | "youtube" | "facebook" | "kick" | "";
type ViewMode = "viewers" | "banned";

interface Viewer {
  viewerId: string;
  userId: string;
  platform: string;
  displayName: string;
  avatarUrl?: string;
  channelUrl?: string;
  isVerified: boolean;
  isOwner: boolean;
  isModerator: boolean;
  isPatreon: boolean;
  notes?: string;
  aiSummary?: string;
  firstSeenAt: string;
  lastSeenAt: string;
}

interface BannedViewer {
  id: string;
  platform: string;
  viewerUsername: string;
  viewerPlatformId: string;
  reason?: string;
  durationSeconds?: number;
  expiresAt?: string;
  isActive: boolean;
  platformBanId?: string;
  insertedAt: string;
}


export default function Viewers() {
  const { user, isLoading } = useCurrentUser();
  const navigate = useNavigate();

  const [viewMode, setViewMode] = createSignal<ViewMode>("viewers");
  const [viewers, setViewers] = createSignal<Viewer[]>([]);
  const [bannedViewers, setBannedViewers] = createSignal<BannedViewer[]>([]);
  const [isLoadingViewers, setIsLoadingViewers] = createSignal(false);
  const [hasMore, setHasMore] = createSignal(false);
  const [afterCursor, setAfterCursor] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string | null>(null);

  const [platform, setPlatform] = createSignal<Platform>("");
  const [search, setSearch] = createSignal("");
  const [searchInput, setSearchInput] = createSignal("");

  const platformColors = {
    twitch: "from-purple-600 to-purple-700",
    youtube: "from-red-600 to-red-700",
    facebook: "from-blue-600 to-blue-700",
    kick: "from-green-600 to-green-700",
  };

  const viewerFields: (
    | "viewerId" | "userId" | "platform" | "displayName" | "avatarUrl"
    | "channelUrl" | "isVerified" | "isOwner" | "isModerator" | "isPatreon"
    | "notes" | "aiSummary" | "firstSeenAt" | "lastSeenAt"
  )[] = [
    "viewerId", "userId", "platform", "displayName", "avatarUrl",
    "channelUrl", "isVerified", "isOwner", "isModerator", "isPatreon",
    "notes", "aiSummary", "firstSeenAt", "lastSeenAt",
  ];

  const bannedViewerFields: (
    | "id" | "platform" | "viewerUsername" | "viewerPlatformId" | "reason"
    | "durationSeconds" | "expiresAt" | "isActive" | "platformBanId" | "insertedAt"
  )[] = [
    "id", "platform", "viewerUsername", "viewerPlatformId", "reason",
    "durationSeconds", "expiresAt", "isActive", "platformBanId", "insertedAt",
  ];

  const loadViewers = async (append = false) => {
    const currentUser = user();
    if (!currentUser?.id) return;

    setIsLoadingViewers(true);
    setError(null);

    try {
      const searchTerm = search();

      if (searchTerm && searchTerm.trim()) {
        const result = await searchViewers({
          input: { userId: currentUser.id, displayName: searchTerm },
          fields: [...viewerFields],
          fetchOptions: { credentials: "include" },
        });

        if (!result.success) {
          setError("Failed to search viewers");
          console.error("RPC error:", result.errors);
        } else if (result.data) {
          setViewers(result.data as Viewer[]);
          setHasMore(false);
        } else {
          setViewers([]);
        }
      } else {
        const result = await listViewers({
          input: { userId: currentUser.id },
          fields: [...viewerFields],
          fetchOptions: { credentials: "include" },
        });

        if (!result.success) {
          setError("Failed to load viewers");
          console.error("RPC error:", result.errors);
        } else if (result.data) {
          const newViewers = result.data as Viewer[];
          setViewers(append ? [...viewers(), ...newViewers] : newViewers);
        } else {
          setViewers([]);
        }
      }
    } catch (err) {
      setError("Failed to load viewers");
      console.error("Error loading viewers:", err);
    } finally {
      setIsLoadingViewers(false);
    }
  };

  const loadBannedViewers = async () => {
    const currentUser = user();
    if (!currentUser?.id) return;

    setIsLoadingViewers(true);
    setError(null);

    try {
      const result = await listBannedViewers({
        input: { userId: currentUser.id },
        fields: [...bannedViewerFields],
        fetchOptions: { credentials: "include" },
      });

      if (!result.success) {
        setError("Failed to load banned viewers");
        console.error("RPC error:", result.errors);
      } else if (result.data) {
        setBannedViewers(result.data as BannedViewer[]);
      } else {
        setBannedViewers([]);
      }
    } catch (err) {
      setError("Failed to load banned viewers");
      console.error("Error loading banned viewers:", err);
    } finally {
      setIsLoadingViewers(false);
    }
  };

  createEffect(() => {
    if (user()?.id) {
      if (viewMode() === "viewers") {
        loadViewers();
      } else {
        loadBannedViewers();
      }
    }
  });

  const handleFilterChange = () => {
    setAfterCursor(null);
    loadViewers();
  };

  const handleSearch = (e: Event) => {
    e.preventDefault();
    setSearch(searchInput());
    handleFilterChange();
  };

  const loadMore = () => {
    loadViewers(true);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
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
    <>
      <Title>Viewers - Streampai</Title>
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
                <h2 class="text-2xl font-bold text-white mb-4">
                  Not Authenticated
                </h2>
                <p class="text-gray-300 mb-6">
                  Please sign in to view your viewers.
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
          <>
            <div class="max-w-6xl mx-auto space-y-6">
              {/* View Mode Tabs */}
              <div class="flex gap-2 border-b border-gray-200">
                <button
                  class={`px-4 py-2 font-medium transition-colors ${
                    viewMode() === "viewers"
                      ? "text-purple-600 border-b-2 border-purple-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  onClick={() => setViewMode("viewers")}
                >
                  Viewers
                </button>
                <button
                  class={`px-4 py-2 font-medium transition-colors ${
                    viewMode() === "banned"
                      ? "text-purple-600 border-b-2 border-purple-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  onClick={() => setViewMode("banned")}
                >
                  Banned Viewers
                </button>
              </div>

              {/* Viewers View */}
              <Show when={viewMode() === "viewers"}>
                {/* Filters Section */}
                <div class={card.default}>
                  <h3 class={text.h3 + " mb-4"}>Filters</h3>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Platform Filter */}
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        Platform
                      </label>
                      <select
                        class={input.select}
                        value={platform()}
                        onChange={(e) => {
                          setPlatform(e.currentTarget.value as Platform);
                          handleFilterChange();
                        }}
                      >
                        <option value="">All Platforms</option>
                        <option value="twitch">Twitch</option>
                        <option value="youtube">YouTube</option>
                        <option value="facebook">Facebook</option>
                        <option value="kick">Kick</option>
                      </select>
                    </div>

                    {/* Search */}
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        Search
                      </label>
                      <form onSubmit={handleSearch}>
                        <input
                          type="text"
                          class={input.text}
                          placeholder="Search by display name..."
                          value={searchInput()}
                          onInput={(e) => setSearchInput(e.currentTarget.value)}
                        />
                      </form>
                    </div>
                  </div>

                  {/* Active Filters Summary */}
                  <Show when={platform() || search()}>
                    <div class="flex items-center gap-2 text-sm text-gray-600 mt-4">
                      <span class="font-medium">Active filters:</span>
                      <Show when={platform()}>
                        <span class={badge.info}>{platform()}</span>
                      </Show>
                      <Show when={search()}>
                        <span class={badge.info}>"{search()}"</span>
                      </Show>
                      <button
                        class="text-purple-600 hover:text-purple-700 text-sm font-medium ml-2"
                        onClick={() => {
                          setPlatform("");
                          setSearch("");
                          setSearchInput("");
                          handleFilterChange();
                        }}
                      >
                        Clear all
                      </button>
                    </div>
                  </Show>
                </div>

                {/* Error Message */}
                <Show when={error()}>
                  <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                    {error()}
                  </div>
                </Show>

                {/* Viewers List */}
                <div class={card.default}>
                  <h3 class={text.h3 + " mb-4"}>Viewers</h3>

                  <Show
                    when={!isLoadingViewers() || viewers().length > 0}
                    fallback={
                      <div class="text-center py-12">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                        <p class="mt-4 text-gray-600">Loading viewers...</p>
                      </div>
                    }
                  >
                    <Show
                      when={viewers().length > 0}
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
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                          <p class="text-lg font-medium text-gray-700">
                            No viewers found
                          </p>
                          <p class="text-sm text-gray-500 mt-2">
                            {platform() || search()
                              ? "Try adjusting your filters or search criteria"
                              : "Your viewers will appear here once you start streaming"}
                          </p>
                        </div>
                      }
                    >
                      <div class="space-y-3">
                        <For each={viewers()}>
                          {(viewer) => (
                            <div
                              class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                              onClick={() =>
                                navigate(
                                  `/dashboard/viewers/${viewer.viewerId}:${viewer.userId}`
                                )
                              }
                            >
                              <div class="flex items-start gap-3">
                                <Show
                                  when={viewer.avatarUrl}
                                  fallback={
                                    <div class="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                                      <span class="text-gray-500 text-lg font-semibold">
                                        {viewer.displayName[0].toUpperCase()}
                                      </span>
                                    </div>
                                  }
                                >
                                  <img
                                    src={viewer.avatarUrl}
                                    alt={viewer.displayName}
                                    class="w-12 h-12 rounded-full shrink-0"
                                  />
                                </Show>

                                <div class="flex-1 min-w-0">
                                  {/* Viewer Name and All Badges */}
                                  <div class="flex items-center gap-2 mb-2 flex-wrap">
                                    <h4 class="font-semibold text-gray-900">
                                      {viewer.displayName}
                                    </h4>
                                    <span
                                      class={getPlatformBadgeColor(
                                        viewer.platform
                                      )}
                                    >
                                      {viewer.platform}
                                    </span>
                                    <Show when={viewer.isOwner}>
                                      <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                        Owner
                                      </span>
                                    </Show>
                                    <Show when={viewer.isVerified}>
                                      <span class={badge.success}>
                                        Verified
                                      </span>
                                    </Show>
                                    <Show when={viewer.isModerator}>
                                      <span class={badge.success}>MOD</span>
                                    </Show>
                                    <Show when={viewer.isPatreon}>
                                      <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-pink-100 text-pink-800">
                                        Patron
                                      </span>
                                    </Show>
                                  </div>

                                  {/* Last Seen */}
                                  <p class={text.muted + " text-xs mb-1"}>
                                    Last seen:{" "}
                                    {formatTimeAgo(viewer.lastSeenAt)}
                                  </p>

                                  {/* Notes */}
                                  <Show when={viewer.notes}>
                                    <p class="text-sm text-gray-600 mt-2 italic">
                                      {viewer.notes}
                                    </p>
                                  </Show>
                                </div>
                              </div>
                            </div>
                          )}
                        </For>
                      </div>

                      {/* Load More Button */}
                      <Show when={hasMore()}>
                        <div class="mt-6 text-center">
                          <button
                            class={button.primary}
                            onClick={loadMore}
                            disabled={isLoadingViewers()}
                          >
                            {isLoadingViewers() ? "Loading..." : "Load More"}
                          </button>
                        </div>
                      </Show>
                    </Show>
                  </Show>
                </div>
              </Show>

              {/* Banned Viewers View */}
              <Show when={viewMode() === "banned"}>
                {/* Error Message */}
                <Show when={error()}>
                  <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                    {error()}
                  </div>
                </Show>

                {/* Banned Viewers List */}
                <div class={card.default}>
                  <h3 class={text.h3 + " mb-4"}>Banned Viewers</h3>

                  <Show
                    when={!isLoadingViewers() || bannedViewers().length > 0}
                    fallback={
                      <div class="text-center py-12">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                        <p class="mt-4 text-gray-600">
                          Loading banned viewers...
                        </p>
                      </div>
                    }
                  >
                    <Show
                      when={bannedViewers().length > 0}
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
                              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                            />
                          </svg>
                          <p class="text-lg font-medium text-gray-700">
                            No banned viewers
                          </p>
                          <p class="text-sm text-gray-500 mt-2">
                            Banned viewers will appear here
                          </p>
                        </div>
                      }
                    >
                      <div class="space-y-3">
                        <For each={bannedViewers()}>
                          {(banned) => (
                            <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                              <div class="flex items-start justify-between gap-3">
                                <div class="flex-1">
                                  {/* Viewer Info */}
                                  <div class="flex items-center gap-2 mb-2 flex-wrap">
                                    <span class="font-semibold text-gray-900">
                                      {banned.viewerUsername}
                                    </span>
                                    <span
                                      class={getPlatformBadgeColor(
                                        banned.platform
                                      )}
                                    >
                                      {banned.platform}
                                    </span>
                                    <Show when={!banned.durationSeconds}>
                                      <span class={badge.error}>Permanent</span>
                                    </Show>
                                    <Show when={banned.durationSeconds}>
                                      <span class={badge.warning}>
                                        {banned.durationSeconds! < 3600
                                          ? `${Math.floor(
                                              banned.durationSeconds! / 60
                                            )}m timeout`
                                          : `${Math.floor(
                                              banned.durationSeconds! / 3600
                                            )}h timeout`}
                                      </span>
                                    </Show>
                                  </div>

                                  {/* Ban Reason */}
                                  <Show when={banned.reason}>
                                    <p class="text-sm text-gray-600 mb-2">
                                      <span class="font-medium">Reason:</span>{" "}
                                      {banned.reason}
                                    </p>
                                  </Show>

                                  {/* Ban Info */}
                                  <div class="text-sm text-gray-500">
                                    <p>
                                      Banned: {formatDate(banned.insertedAt)}
                                    </p>
                                    <Show when={banned.expiresAt}>
                                      <p>
                                        Expires: {formatDate(banned.expiresAt!)}
                                      </p>
                                    </Show>
                                  </div>
                                </div>

                                {/* Unban Button */}
                                <button
                                  class="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                  onClick={() => {
                                    console.log("Unban viewer:", banned.id);
                                  }}
                                >
                                  Unban
                                </button>
                              </div>
                            </div>
                          )}
                        </For>
                      </div>
                    </Show>
                  </Show>
                </div>
              </Show>
            </div>
          </>
        </Show>
      </Show>
    </>
  );
}
