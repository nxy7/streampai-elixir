import { A } from "@solidjs/router";
import { For, Match, Show, Switch, createSignal } from "solid-js";
import Card from "~/design-system/Card";
import { button } from "~/design-system/design-system";
import Input from "~/design-system/Input";
import { useTranslation } from "~/i18n";
import { useAuthenticatedUser } from "~/lib/auth";
import { useBreadcrumbs } from "~/lib/BreadcrumbContext";

type ClipTab = "viewer" | "ai";

const mockViewerClips = [
	{
		id: "1",
		title: "Insane clutch play",
		duration: 30,
		views: 1243,
		createdAt: "2026-01-28T14:30:00Z",
		platform: "twitch",
		thumbnailColor: "from-purple-500 to-indigo-600",
		creator: "ClipMaster42",
	},
	{
		id: "2",
		title: "Funniest moment of the stream",
		duration: 15,
		views: 856,
		createdAt: "2026-01-27T20:15:00Z",
		platform: "youtube",
		thumbnailColor: "from-red-500 to-orange-500",
		creator: "HighlightHunter",
	},
	{
		id: "3",
		title: "New sub hype train",
		duration: 45,
		views: 2100,
		createdAt: "2026-01-26T18:45:00Z",
		platform: "twitch",
		thumbnailColor: "from-blue-500 to-cyan-500",
		creator: "HypeFan99",
	},
];

const mockAiClips = [
	{
		id: "ai-1",
		title: "Peak viewership moment",
		duration: 60,
		views: 3420,
		createdAt: "2026-01-25T22:00:00Z",
		thumbnailColor: "from-green-500 to-emerald-500",
		aiScore: 95,
	},
	{
		id: "ai-2",
		title: "Chat explosion reaction",
		duration: 25,
		views: 1890,
		createdAt: "2026-01-23T13:00:00Z",
		thumbnailColor: "from-amber-500 to-yellow-500",
		aiScore: 88,
	},
];

function formatDuration(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
	});
}

function formatViews(views: number): string {
	if (views >= 1000) {
		return `${(views / 1000).toFixed(1)}K`;
	}
	return String(views);
}

export default function ClipsPage() {
	const { t } = useTranslation();
	const { user } = useAuthenticatedUser();
	const [tab, setTab] = createSignal<ClipTab>("viewer");
	const [search, setSearch] = createSignal("");

	useBreadcrumbs(() => [
		{ label: t("sidebar.tools"), href: "/dashboard/tools/timers" },
		{ label: t("dashboardNav.streamClips") },
	]);

	const isPro = () => user().tier === "pro";

	const filteredViewerClips = () => {
		const q = search().toLowerCase();
		if (!q) return mockViewerClips;
		return mockViewerClips.filter((c) => c.title.toLowerCase().includes(q));
	};

	const filteredAiClips = () => {
		const q = search().toLowerCase();
		if (!q) return mockAiClips;
		return mockAiClips.filter((c) => c.title.toLowerCase().includes(q));
	};

	return (
		<div class="mx-auto max-w-5xl space-y-4">
			{/* Description */}
			<p class="text-neutral-500 text-sm">{t("clips.description")}</p>

			{/* Tabs */}
			<div class="flex items-center gap-1">
				<button
					class="relative px-4 py-2 font-medium text-sm transition-colors"
					classList={{
						"text-primary": tab() === "viewer",
						"text-neutral-400 hover:text-neutral-200": tab() !== "viewer",
					}}
					onClick={() => setTab("viewer")}
					type="button">
					{t("clips.viewerClips")}
					<Show when={tab() === "viewer"}>
						<div class="absolute right-0 bottom-0 left-0 h-0.5 bg-primary" />
					</Show>
				</button>
				<button
					class="relative flex items-center gap-2 px-4 py-2 font-medium text-sm transition-colors"
					classList={{
						"text-primary": tab() === "ai",
						"text-neutral-400 hover:text-neutral-200": tab() !== "ai",
					}}
					onClick={() => setTab("ai")}
					type="button">
					{t("clips.aiClips")}
					<Show when={!isPro()}>
						<span class="rounded bg-gradient-to-r from-amber-500 to-orange-500 px-1.5 py-0.5 font-semibold text-[10px] text-white">
							{t("clips.proOnly")}
						</span>
					</Show>
					<Show when={tab() === "ai"}>
						<div class="absolute right-0 bottom-0 left-0 h-0.5 bg-primary" />
					</Show>
				</button>
			</div>

			<Switch>
				{/* Viewer Clips Tab */}
				<Match when={tab() === "viewer"}>
					<p class="text-neutral-400 text-sm">
						{t("clips.viewerClipsDescription")}
					</p>

					{/* Search */}
					<div class="relative">
						<svg
							aria-hidden="true"
							class="pointer-events-none absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 text-neutral-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
							/>
						</svg>
						<Input
							class="bg-surface-inset pl-10"
							onInput={(e) => setSearch(e.currentTarget.value)}
							placeholder={t("clips.searchPlaceholder")}
							type="text"
							value={search()}
						/>
					</div>

					{/* Viewer Clips Grid */}
					<Show
						fallback={
							<Card variant="ghost">
								<div class="flex flex-col items-center justify-center py-12 text-center">
									<div class="mb-3 text-4xl">🎬</div>
									<p class="text-neutral-300">{t("clips.noViewerClips")}</p>
									<p class="mt-1 text-neutral-500 text-sm">
										{t("clips.noViewerClipsHint")}
									</p>
								</div>
							</Card>
						}
						when={filteredViewerClips().length > 0}>
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
							<For each={filteredViewerClips()}>
								{(clip) => (
									<A href={`/dashboard/tools/clips/${clip.id}`}>
										<Card
											class="transition-transform hover:scale-[1.02]"
											variant="ghost">
											<div class="overflow-hidden rounded-t-xl">
												<div
													class={`relative flex h-32 items-center justify-center bg-gradient-to-br ${clip.thumbnailColor}`}>
													<div class="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm">
														<svg
															aria-hidden="true"
															class="ml-0.5 h-5 w-5 text-white"
															fill="currentColor"
															viewBox="0 0 24 24">
															<path d="M8 5v14l11-7z" />
														</svg>
													</div>
													<span class="absolute right-2 bottom-2 rounded bg-black/60 px-1.5 py-0.5 font-medium text-white text-xs">
														{formatDuration(clip.duration)}
													</span>
													<span class="absolute top-2 left-2 rounded bg-black/40 px-1.5 py-0.5 text-white text-xs capitalize">
														{clip.platform}
													</span>
												</div>
											</div>
											<div class="p-3">
												<h3 class="truncate font-medium text-neutral-200 text-sm">
													{clip.title}
												</h3>
												<p class="mt-1 text-neutral-500 text-xs">
													by {clip.creator}
												</p>
												<div class="mt-2 flex items-center justify-between text-neutral-400 text-xs">
													<span>
														{formatViews(clip.views)} {t("clips.views")}
													</span>
													<span>{formatDate(clip.createdAt)}</span>
												</div>
											</div>
										</Card>
									</A>
								)}
							</For>
						</div>
					</Show>
				</Match>

				{/* AI Clips Tab */}
				<Match when={tab() === "ai"}>
					<Show
						fallback={
							/* Pro Upgrade Prompt for free users */
							<Card variant="ghost">
								<div class="flex flex-col items-center justify-center px-6 py-16 text-center">
									<div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20">
										<svg
											aria-hidden="true"
											class="h-8 w-8 text-amber-400"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24">
											<path
												d="M13 10V3L4 14h7v7l9-11h-7z"
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
											/>
										</svg>
									</div>
									<h2 class="font-bold text-lg text-neutral-100">
										{t("clips.aiClipsProTitle")}
									</h2>
									<p class="mx-auto mt-2 max-w-md text-neutral-400 text-sm">
										{t("clips.aiClipsProDescription")}
									</p>
									<a class={`${button.primary} mt-6`} href="/pricing">
										{t("clips.upgradeNow")}
									</a>
								</div>
							</Card>
						}
						when={isPro()}>
						{/* AI Clips content for Pro users */}
						<p class="text-neutral-400 text-sm">
							{t("clips.aiClipsDescription")}
						</p>

						{/* Search */}
						<div class="relative">
							<svg
								aria-hidden="true"
								class="pointer-events-none absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 text-neutral-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
								/>
							</svg>
							<Input
								class="bg-surface-inset pl-10"
								onInput={(e) => setSearch(e.currentTarget.value)}
								placeholder={t("clips.searchPlaceholder")}
								type="text"
								value={search()}
							/>
						</div>

						{/* AI Clips Grid */}
						<Show
							fallback={
								<Card variant="ghost">
									<div class="flex flex-col items-center justify-center py-12 text-center">
										<div class="mb-3 text-4xl">🤖</div>
										<p class="text-neutral-300">{t("clips.noAiClips")}</p>
										<p class="mt-1 text-neutral-500 text-sm">
											{t("clips.noAiClipsHint")}
										</p>
									</div>
								</Card>
							}
							when={filteredAiClips().length > 0}>
							<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
								<For each={filteredAiClips()}>
									{(clip) => (
										<A href={`/dashboard/tools/clips/${clip.id}`}>
											<Card
												class="transition-transform hover:scale-[1.02]"
												variant="ghost">
												<div class="overflow-hidden rounded-t-xl">
													<div
														class={`relative flex h-32 items-center justify-center bg-gradient-to-br ${clip.thumbnailColor}`}>
														<div class="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm">
															<svg
																aria-hidden="true"
																class="ml-0.5 h-5 w-5 text-white"
																fill="currentColor"
																viewBox="0 0 24 24">
																<path d="M8 5v14l11-7z" />
															</svg>
														</div>
														<span class="absolute right-2 bottom-2 rounded bg-black/60 px-1.5 py-0.5 font-medium text-white text-xs">
															{formatDuration(clip.duration)}
														</span>
														<span class="absolute top-2 left-2 flex items-center gap-1 rounded bg-gradient-to-r from-purple-600 to-indigo-600 px-1.5 py-0.5 text-white text-xs">
															<svg
																aria-hidden="true"
																class="h-3 w-3"
																fill="currentColor"
																viewBox="0 0 20 20">
																<path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
																<path
																	clip-rule="evenodd"
																	d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
																	fill-rule="evenodd"
																/>
															</svg>
															AI
														</span>
													</div>
												</div>
												<div class="p-3">
													<h3 class="truncate font-medium text-neutral-200 text-sm">
														{clip.title}
													</h3>
													<div class="mt-1 flex items-center gap-1">
														<div class="h-1.5 w-12 overflow-hidden rounded-full bg-neutral-700">
															<div
																class="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
																style={{ width: `${clip.aiScore}%` }}
															/>
														</div>
														<span class="text-neutral-500 text-xs">
															{clip.aiScore}% score
														</span>
													</div>
													<div class="mt-2 flex items-center justify-between text-neutral-400 text-xs">
														<span>
															{formatViews(clip.views)} {t("clips.views")}
														</span>
														<span>{formatDate(clip.createdAt)}</span>
													</div>
												</div>
											</Card>
										</A>
									)}
								</For>
							</div>
						</Show>
					</Show>
				</Match>
			</Switch>

			{/* Coming soon notice */}
			<Card variant="ghost">
				<div class="flex items-center gap-3 p-3">
					<span class="shrink-0 whitespace-nowrap rounded-full bg-primary/10 px-2.5 py-0.5 font-semibold text-primary text-xs">
						{t("clips.comingSoonBadge")}
					</span>
					<p class="text-neutral-500 text-sm">
						{t("clips.comingSoonDescription")}
					</p>
				</div>
			</Card>
		</div>
	);
}
