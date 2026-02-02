import { Title } from "@solidjs/meta";
import { useNavigate } from "@solidjs/router";
import { For, Show, createEffect, createSignal } from "solid-js";
import { Skeleton } from "~/design-system";
import Badge from "~/design-system/Badge";
import Button from "~/design-system/Button";
import Card from "~/design-system/Card";
import { text } from "~/design-system/design-system";
import Input, { Select } from "~/design-system/Input";
import { useTranslation } from "~/i18n";
import { getLoginUrl, useCurrentUser } from "~/lib/auth";
import { listBannedViewers, listViewers, searchViewers } from "~/sdk/ash_rpc";

type Platform = "twitch" | "youtube" | "facebook" | "kick" | "";
type ViewMode = "viewers" | "banned";

// Skeleton for viewers page
function ViewersPageSkeleton() {
  return (
    <div class="mx-auto max-w-6xl space-y-6">
      {/* View Mode Tabs skeleton */}
      <div class="flex gap-2 border-neutral-200 border-b">
        <Skeleton class="h-10 w-20" />
        <Skeleton class="h-10 w-32" />
      </div>

      {/* Filters skeleton */}
      <Card variant="ghost">
        <Skeleton class="mb-4 h-6 w-16" />
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <For each={[1, 2]}>
            {() => (
              <div>
                <Skeleton class="mb-2 h-4 w-20" />
                <Skeleton class="h-10 w-full rounded-lg" />
              </div>
            )}
          </For>
        </div>
      </Card>

      {/* Viewers list skeleton */}
      <Card>
        <Skeleton class="mb-4 h-6 w-20" />
        <div class="space-y-3">
          <For each={[1, 2, 3, 4, 5, 6]}>
            {() => (
              <div class="rounded-lg border border-neutral-200 p-4">
                <div class="flex items-start gap-3">
                  <Skeleton circle class="h-12 w-12 shrink-0" />
                  <div class="min-w-0 flex-1">
                    <div class="mb-2 flex flex-wrap items-center gap-2">
                      <Skeleton class="h-5 w-28" />
                      <Skeleton class="h-5 w-16 rounded-full" />
                      <Skeleton class="h-5 w-12 rounded" />
                    </div>
                    <Skeleton class="h-3 w-32" />
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      </Card>
    </div>
  );
}

// Skeleton for viewers loading state (used when data is loading)
function ViewersListSkeleton() {
  return (
    <div class="space-y-3">
      <For each={[1, 2, 3, 4, 5, 6]}>
        {() => (
          <div class="rounded-lg border border-neutral-200 p-4">
            <div class="flex items-start gap-3">
              <Skeleton circle class="h-12 w-12 shrink-0" />
              <div class="min-w-0 flex-1">
                <div class="mb-2 flex flex-wrap items-center gap-2">
                  <Skeleton class="h-5 w-28" />
                  <Skeleton class="h-5 w-16 rounded-full" />
                  <Skeleton class="h-5 w-12 rounded" />
                </div>
                <Skeleton class="h-3 w-32" />
              </div>
            </div>
          </div>
        )}
      </For>
    </div>
  );
}

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
  const { t } = useTranslation();

  const [viewMode, setViewMode] = createSignal<ViewMode>("viewers");
  const [viewers, setViewers] = createSignal<Viewer[]>([]);
  const [bannedViewers, setBannedViewers] = createSignal<BannedViewer[]>([]);
  const [isLoadingViewers, setIsLoadingViewers] = createSignal(false);
  const [hasMore, setHasMore] = createSignal(false);
  const [_afterCursor, setAfterCursor] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string | null>(null);

  const [platform, setPlatform] = createSignal<Platform>("");
  const [search, setSearch] = createSignal("");
  const [searchInput, setSearchInput] = createSignal("");

  const _platformColors = {
    twitch: "from-primary to-primary-hover",
    youtube: "from-red-600 to-red-700",
    facebook: "from-blue-600 to-blue-700",
    kick: "from-green-600 to-green-700",
  };

  const viewerFields: (
    | "viewerId"
    | "userId"
    | "platform"
    | "displayName"
    | "avatarUrl"
    | "channelUrl"
    | "isVerified"
    | "isOwner"
    | "isModerator"
    | "isPatreon"
    | "notes"
    | "aiSummary"
    | "firstSeenAt"
    | "lastSeenAt"
  )[] = [
    "viewerId",
    "userId",
    "platform",
    "displayName",
    "avatarUrl",
    "channelUrl",
    "isVerified",
    "isOwner",
    "isModerator",
    "isPatreon",
    "notes",
    "aiSummary",
    "firstSeenAt",
    "lastSeenAt",
  ];

  const bannedViewerFields: (
    | "id"
    | "platform"
    | "viewerUsername"
    | "viewerPlatformId"
    | "reason"
    | "durationSeconds"
    | "expiresAt"
    | "isActive"
    | "platformBanId"
    | "insertedAt"
  )[] = [
    "id",
    "platform",
    "viewerUsername",
    "viewerPlatformId",
    "reason",
    "durationSeconds",
    "expiresAt",
    "isActive",
    "platformBanId",
    "insertedAt",
  ];

  const loadViewers = async (append = false) => {
    const currentUser = user();
    if (!currentUser?.id) return;

    setIsLoadingViewers(true);
    setError(null);

    try {
      const searchTerm = search();

      if (searchTerm?.trim()) {
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

  const getPlatformBadgeVariant = (
    platformName: string,
  ): "info" | "error" | "success" | "neutral" => {
    const variants: Record<string, "info" | "error" | "success" | "neutral"> = {
      twitch: "info",
      youtube: "error",
      facebook: "info",
      kick: "success",
    };
    return variants[platformName.toLowerCase()] || "neutral";
  };

  return (
    <>
      <Title>Viewers - Streampai</Title>
      <Show fallback={<ViewersPageSkeleton />} when={!isLoading()}>
        <Show
          fallback={
            <div class="flex min-h-screen items-center justify-center bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900">
              <div class="py-12 text-center">
                <h2 class="mb-4 font-bold text-2xl text-white">
                  Not Authenticated
                </h2>
                <p class="mb-6 text-neutral-300">
                  Please sign in to view your viewers.
                </p>
                <a
                  class="inline-block rounded-lg bg-linear-to-r from-primary-light to-secondary px-6 py-3 font-semibold text-white transition-all hover:from-primary hover:to-secondary-hover"
                  href={getLoginUrl()}
                >
                  Sign In
                </a>
              </div>
            </div>
          }
          when={user()}
        >
          <div class="mx-auto max-w-6xl space-y-6">
            {/* View Mode Tabs */}
            <div class="flex gap-2 border-neutral-200 border-b">
              <button
                class={`px-4 py-2 font-medium transition-colors ${
                  viewMode() === "viewers"
                    ? "border-primary border-b-2 text-primary"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
                onClick={() => setViewMode("viewers")}
                type="button"
              >
                Viewers
              </button>
              <button
                class={`px-4 py-2 font-medium transition-colors ${
                  viewMode() === "banned"
                    ? "border-primary border-b-2 text-primary"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
                onClick={() => setViewMode("banned")}
                type="button"
              >
                Banned Viewers
              </button>
            </div>

            {/* Viewers View */}
            <Show when={viewMode() === "viewers"}>
              {/* Filters Section */}
              <Card variant="ghost">
                <h3 class={`${text.h3} mb-4`}>Filters</h3>

                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Platform Filter */}
                  <div>
                    <label
                      class="block font-medium text-neutral-700 text-sm"
                      for="platform-filter"
                    >
                      Platform
                    </label>
                    <Select
                      class="mt-2"
                      id="platform-filter"
                      onChange={(e) => {
                        setPlatform(e.currentTarget.value as Platform);
                        handleFilterChange();
                      }}
                      value={platform()}
                    >
                      <option value="">All Platforms</option>
                      <option value="twitch">Twitch</option>
                      <option value="youtube">YouTube</option>
                      <option value="facebook">Facebook</option>
                      <option value="kick">Kick</option>
                    </Select>
                  </div>

                  {/* Search */}
                  <div>
                    <label
                      class="block font-medium text-neutral-700 text-sm"
                      for="search-viewers"
                    >
                      Search
                    </label>
                    <form onSubmit={handleSearch}>
                      <Input
                        class="mt-2"
                        id="search-viewers"
                        onInput={(e) => setSearchInput(e.currentTarget.value)}
                        placeholder={t("viewers.searchPlaceholder")}
                        type="text"
                        value={searchInput()}
                      />
                    </form>
                  </div>
                </div>

                {/* Active Filters Summary */}
                <Show when={platform() || search()}>
                  <div class="mt-4 flex items-center gap-2 text-neutral-600 text-sm">
                    <span class="font-medium">Active filters:</span>
                    <Show when={platform()}>
                      <Badge variant="info">{platform()}</Badge>
                    </Show>
                    <Show when={search()}>
                      <Badge variant="info">"{search()}"</Badge>
                    </Show>
                    <button
                      class="ml-2 font-medium text-primary text-sm hover:text-primary-hover"
                      onClick={() => {
                        setPlatform("");
                        setSearch("");
                        setSearchInput("");
                        handleFilterChange();
                      }}
                      type="button"
                    >
                      Clear all
                    </button>
                  </div>
                </Show>
              </Card>

              {/* Error Message */}
              <Show when={error()}>
                <div class="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
                  {error()}
                </div>
              </Show>

              {/* Viewers List */}
              <Card>
                <h3 class={`${text.h3} mb-4`}>Viewers</h3>

                <Show
                  fallback={<ViewersListSkeleton />}
                  when={!isLoadingViewers() || viewers().length > 0}
                >
                  <Show
                    fallback={
                      <div class="py-12 text-center text-neutral-500">
                        <svg
                          aria-hidden="true"
                          class="mx-auto mb-4 h-16 w-16 text-neutral-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                          />
                        </svg>
                        <p class="font-medium text-lg text-neutral-700">
                          No viewers found
                        </p>
                        <p class="mt-2 text-neutral-500 text-sm">
                          {platform() || search()
                            ? "Try adjusting your filters or search criteria"
                            : "Your viewers will appear here once you start streaming"}
                        </p>
                      </div>
                    }
                    when={viewers().length > 0}
                  >
                    <div class="space-y-3">
                      <For each={viewers()}>
                        {(viewer) => (
                          <button
                            class="w-full cursor-pointer rounded-lg border border-neutral-200 p-4 text-left transition-colors hover:bg-neutral-50"
                            onClick={() =>
                              navigate(
                                `/dashboard/viewers/${viewer.viewerId}:${viewer.userId}`,
                              )
                            }
                            type="button"
                          >
                            <div class="flex items-start gap-3">
                              <Show
                                fallback={
                                  <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-200">
                                    <span class="font-semibold text-lg text-neutral-500">
                                      {viewer.displayName[0].toUpperCase()}
                                    </span>
                                  </div>
                                }
                                when={viewer.avatarUrl}
                              >
                                <img
                                  alt={viewer.displayName}
                                  class="h-12 w-12 shrink-0 rounded-full"
                                  src={viewer.avatarUrl}
                                />
                              </Show>

                              <div class="min-w-0 flex-1">
                                {/* Viewer Name and All Badges */}
                                <div class="mb-2 flex flex-wrap items-center gap-2">
                                  <h4 class="font-semibold text-neutral-900">
                                    {viewer.displayName}
                                  </h4>
                                  <Badge
                                    variant={getPlatformBadgeVariant(
                                      viewer.platform,
                                    )}
                                  >
                                    {viewer.platform}
                                  </Badge>
                                  <Show when={viewer.isOwner}>
                                    <Badge variant="warning">Owner</Badge>
                                  </Show>
                                  <Show when={viewer.isVerified}>
                                    <Badge variant="success">Verified</Badge>
                                  </Show>
                                  <Show when={viewer.isModerator}>
                                    <Badge variant="success">MOD</Badge>
                                  </Show>
                                  <Show when={viewer.isPatreon}>
                                    <span class="inline-flex items-center rounded bg-pink-100 px-2 py-0.5 font-medium text-pink-800 text-xs">
                                      Patron
                                    </span>
                                  </Show>
                                </div>

                                {/* Last Seen */}
                                <p class={`${text.muted} mb-1 text-xs`}>
                                  Last seen: {formatTimeAgo(viewer.lastSeenAt)}
                                </p>

                                {/* Notes */}
                                <Show when={viewer.notes}>
                                  <p class="mt-2 text-neutral-600 text-sm italic">
                                    {viewer.notes}
                                  </p>
                                </Show>
                              </div>
                            </div>
                          </button>
                        )}
                      </For>
                    </div>

                    {/* Load More Button */}
                    <Show when={hasMore()}>
                      <div class="mt-6 text-center">
                        <Button
                          disabled={isLoadingViewers()}
                          onClick={loadMore}
                        >
                          {isLoadingViewers() ? "Loading..." : "Load More"}
                        </Button>
                      </div>
                    </Show>
                  </Show>
                </Show>
              </Card>
            </Show>

            {/* Banned Viewers View */}
            <Show when={viewMode() === "banned"}>
              {/* Error Message */}
              <Show when={error()}>
                <div class="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
                  {error()}
                </div>
              </Show>

              {/* Banned Viewers List */}
              <Card>
                <h3 class={`${text.h3} mb-4`}>Banned Viewers</h3>

                <Show
                  fallback={<ViewersListSkeleton />}
                  when={!isLoadingViewers() || bannedViewers().length > 0}
                >
                  <Show
                    fallback={
                      <div class="py-12 text-center text-neutral-500">
                        <svg
                          aria-hidden="true"
                          class="mx-auto mb-4 h-16 w-16 text-neutral-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                          />
                        </svg>
                        <p class="font-medium text-lg text-neutral-700">
                          No banned viewers
                        </p>
                        <p class="mt-2 text-neutral-500 text-sm">
                          Banned viewers will appear here
                        </p>
                      </div>
                    }
                    when={bannedViewers().length > 0}
                  >
                    <div class="space-y-3">
                      <For each={bannedViewers()}>
                        {(banned) => (
                          <div class="rounded-lg border border-neutral-200 p-4 transition-colors hover:bg-neutral-50">
                            <div class="flex items-start justify-between gap-3">
                              <div class="flex-1">
                                {/* Viewer Info */}
                                <div class="mb-2 flex flex-wrap items-center gap-2">
                                  <span class="font-semibold text-neutral-900">
                                    {banned.viewerUsername}
                                  </span>
                                  <Badge
                                    variant={getPlatformBadgeVariant(
                                      banned.platform,
                                    )}
                                  >
                                    {banned.platform}
                                  </Badge>
                                  <Show when={!banned.durationSeconds}>
                                    <Badge variant="error">Permanent</Badge>
                                  </Show>
                                  <Show when={banned.durationSeconds}>
                                    <Badge variant="warning">
                                      {(banned.durationSeconds ?? 0) < 3600
                                        ? `${Math.floor(
                                            (banned.durationSeconds ?? 0) / 60,
                                          )}m timeout`
                                        : `${Math.floor(
                                            (banned.durationSeconds ?? 0) /
                                              3600,
                                          )}h timeout`}
                                    </Badge>
                                  </Show>
                                </div>

                                {/* Ban Reason */}
                                <Show when={banned.reason}>
                                  <p class="mb-2 text-neutral-600 text-sm">
                                    <span class="font-medium">Reason:</span>{" "}
                                    {banned.reason}
                                  </p>
                                </Show>

                                {/* Ban Info */}
                                <div class="text-neutral-500 text-sm">
                                  <p>Banned: {formatDate(banned.insertedAt)}</p>
                                  <Show when={banned.expiresAt}>
                                    <p>
                                      Expires:{" "}
                                      {formatDate(banned.expiresAt ?? "")}
                                    </p>
                                  </Show>
                                </div>
                              </div>

                              {/* Unban Button */}
                              <Button
                                onClick={() => {
                                  console.log("Unban viewer:", banned.id);
                                }}
                                size="sm"
                                variant="danger"
                              >
                                Unban
                              </Button>
                            </div>
                          </div>
                        )}
                      </For>
                    </div>
                  </Show>
                </Show>
              </Card>
            </Show>
          </div>
        </Show>
      </Show>
    </>
  );
}
