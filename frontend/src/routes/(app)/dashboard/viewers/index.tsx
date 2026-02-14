import { useNavigate } from "@solidjs/router";
import { For, Show, createResource, createSignal } from "solid-js";
import { Alert, Select, Skeleton } from "~/design-system";
import Badge from "~/design-system/Badge";
import Button from "~/design-system/Button";
import Card from "~/design-system/Card";
import { text } from "~/design-system/design-system";
import Input from "~/design-system/Input";
import { useTranslation } from "~/i18n";
import { useAuthenticatedUser } from "~/lib/auth";
import { useBreadcrumbs } from "~/lib/BreadcrumbContext";
import { listBannedViewers, listViewers, searchViewers } from "~/sdk/ash_rpc";

type Platform = "twitch" | "youtube" | "facebook" | "kick" | "";
type ViewMode = "viewers" | "banned";

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
	const { user } = useAuthenticatedUser();
	const navigate = useNavigate();
	const { t } = useTranslation();

	useBreadcrumbs(() => [
		{ label: t("sidebar.streaming"), href: "/dashboard/stream" },
		{ label: t("dashboardNav.viewers") },
	]);

	const [viewMode, setViewMode] = createSignal<ViewMode>("viewers");
	const [platform, setPlatform] = createSignal<Platform>("");
	const [search, setSearch] = createSignal("");
	const [searchInput, setSearchInput] = createSignal("");

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

	const [viewers, { mutate: mutateViewers }] = createResource(
		() => {
			const u = user();
			if (!u?.id || viewMode() !== "viewers") return null;
			return { userId: u.id, search: search() } as const;
		},
		async (params) => {
			const searchTerm = params.search;

			if (searchTerm?.trim()) {
				const result = await searchViewers({
					input: { userId: params.userId, displayName: searchTerm },
					fields: [...viewerFields],
					fetchOptions: { credentials: "include" },
				});
				if (!result.success) throw new Error("Failed to search viewers");
				return (result.data ?? []) as Viewer[];
			}

			const result = await listViewers({
				input: { userId: params.userId },
				fields: [...viewerFields],
				fetchOptions: { credentials: "include" },
			});
			if (!result.success) throw new Error("Failed to load viewers");
			return (result.data ?? []) as Viewer[];
		},
	);

	const [bannedViewers] = createResource(
		() => {
			const u = user();
			if (!u?.id || viewMode() !== "banned") return null;
			return u.id;
		},
		async (userId) => {
			const result = await listBannedViewers({
				input: { userId },
				fields: [...bannedViewerFields],
				fetchOptions: { credentials: "include" },
			});
			if (!result.success) throw new Error("Failed to load banned viewers");
			return (result.data ?? []) as BannedViewer[];
		},
	);

	const handleSearch = (e: Event) => {
		e.preventDefault();
		setSearch(searchInput());
	};

	const _loadMore = async () => {
		const u = user();
		if (!u?.id) return;

		const result = await listViewers({
			input: { userId: u.id },
			fields: [...viewerFields],
			fetchOptions: { credentials: "include" },
		});

		if (result.success && result.data) {
			mutateViewers((prev) => [...(prev ?? []), ...(result.data as Viewer[])]);
		}
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

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleString();
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
					type="button">
					Viewers
				</button>
				<button
					class={`px-4 py-2 font-medium transition-colors ${
						viewMode() === "banned"
							? "border-primary border-b-2 text-primary"
							: "text-neutral-600 hover:text-neutral-900"
					}`}
					onClick={() => setViewMode("banned")}
					type="button">
					Banned Viewers
				</button>
			</div>

			{/* Viewers View */}
			<Show when={viewMode() === "viewers"}>
				{/* Filters Section */}
				<Card variant="ghost">
					<h3 class={`${text.h3} mb-4`}>{t("chatHistory.filters.title")}</h3>

					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						{/* Platform Filter */}
						<Select
							label={t("viewers.platform")}
							onChange={(value) => {
								setPlatform(value as Platform);
							}}
							options={[
								{ value: "", label: t("viewers.allPlatforms") },
								{ value: "twitch", label: "Twitch" },
								{ value: "youtube", label: "YouTube" },
								{ value: "facebook", label: "Facebook" },
								{ value: "kick", label: "Kick" },
							]}
							value={platform()}
						/>

						{/* Search */}
						<form onSubmit={handleSearch}>
							<Input
								label={t("viewers.search")}
								onInput={(e) => setSearchInput(e.currentTarget.value)}
								placeholder={t("viewers.searchPlaceholder")}
								type="text"
								value={searchInput()}
							/>
						</form>
					</div>

					{/* Active Filters Summary */}
					<Show when={platform() || search()}>
						<div class="mt-4 flex items-center gap-2 text-neutral-600 text-sm">
							<span class="font-medium">{t("viewers.activeFilters")}</span>
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
								}}
								type="button">
								{t("viewers.clearAll")}
							</button>
						</div>
					</Show>
				</Card>

				{/* Error Message */}
				<Show when={viewers.error}>
					<Alert variant="error">{viewers.error?.message}</Alert>
				</Show>

				{/* Viewers List */}
				<Card>
					<h3 class={`${text.h3} mb-4`}>{t("viewers.title")}</h3>

					<Show
						fallback={<ViewersListSkeleton />}
						when={!viewers.loading || (viewers() ?? []).length > 0}>
						<Show
							fallback={
								<div class="py-12 text-center text-neutral-500">
									<svg
										aria-hidden="true"
										class="mx-auto mb-4 h-16 w-16 text-neutral-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24">
										<path
											d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
										/>
									</svg>
									<p class="font-medium text-lg text-neutral-700">
										{t("viewers.noViewers")}
									</p>
									<p class="mt-2 text-neutral-500 text-sm">
										{platform() || search()
											? t("viewers.adjustFilters")
											: t("viewers.viewersWillAppear")}
									</p>
								</div>
							}
							when={(viewers() ?? []).length > 0}>
							<div class="space-y-3">
								<For each={viewers() ?? []}>
									{(viewer) => (
										<button
											class="w-full cursor-pointer rounded-lg border border-neutral-200 p-4 text-left transition-colors"
											onClick={() =>
												navigate(`/dashboard/viewers/${viewer.viewerId}`)
											}
											type="button">
											<div class="flex items-start gap-3">
												<Show
													fallback={
														<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-200">
															<span class="font-semibold text-lg text-neutral-500">
																{viewer.displayName[0].toUpperCase()}
															</span>
														</div>
													}
													when={viewer.avatarUrl}>
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
															)}>
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
						</Show>
					</Show>
				</Card>
			</Show>

			{/* Banned Viewers View */}
			<Show when={viewMode() === "banned"}>
				{/* Error Message */}
				<Show when={bannedViewers.error}>
					<Alert variant="error">{bannedViewers.error?.message}</Alert>
				</Show>

				{/* Banned Viewers List */}
				<Card>
					<h3 class={`${text.h3} mb-4`}>Banned Viewers</h3>

					<Show
						fallback={<ViewersListSkeleton />}
						when={!bannedViewers.loading || (bannedViewers() ?? []).length > 0}>
						<Show
							fallback={
								<div class="py-12 text-center text-neutral-500">
									<svg
										aria-hidden="true"
										class="mx-auto mb-4 h-16 w-16 text-neutral-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24">
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
							when={(bannedViewers() ?? []).length > 0}>
							<div class="space-y-3">
								<For each={bannedViewers() ?? []}>
									{(banned) => (
										<div class="rounded-lg border border-neutral-200 p-4 transition-colors">
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
															)}>
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
																			(banned.durationSeconds ?? 0) / 3600,
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
																Expires: {formatDate(banned.expiresAt ?? "")}
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
													variant="danger">
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
	);
}
