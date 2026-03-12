import { A } from "@solidjs/router";
import { For, Show, createSignal } from "solid-js";
import { ClipsTabNav } from "~/components/clips/ClipsTabNav";
import Card from "~/design-system/Card";
import Input from "~/design-system/Input";
import { useTranslation } from "~/i18n";
import { useBreadcrumbs } from "~/lib/BreadcrumbContext";

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

export default function ViewerClipsPage() {
	const { t } = useTranslation();
	const [search, setSearch] = createSignal("");

	useBreadcrumbs(() => [
		{ label: t("sidebar.tools"), href: "/dashboard/tools/timers" },
		{ label: t("dashboardNav.streamClips") },
	]);

	const filteredClips = () => {
		const q = search().toLowerCase();
		if (!q) return mockViewerClips;
		return mockViewerClips.filter((c) => c.title.toLowerCase().includes(q));
	};

	return (
		<div class="mx-auto max-w-5xl space-y-4">
			<ClipsTabNav />

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
					class="pl-10"
					onInput={(e) => setSearch(e.currentTarget.value)}
					placeholder={t("clips.searchPlaceholder")}
					type="text"
					value={search()}
				/>
			</div>

			{/* Clips Grid */}
			<Show
				fallback={
					<Card variant="ghost">
						<div class="flex flex-col items-center justify-center py-12 text-center">
							<div class="mb-3 text-4xl">🎬</div>
							<p class="text-neutral-700">{t("clips.noViewerClips")}</p>
							<p class="mt-1 text-neutral-500 text-sm">
								{t("clips.noViewerClipsHint")}
							</p>
						</div>
					</Card>
				}
				when={filteredClips().length > 0}>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<For each={filteredClips()}>
						{(clip) => (
							<A href={`/dashboard/tools/clips/viewer/${clip.id}`}>
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
										<h3 class="truncate font-medium text-neutral-900 text-sm">
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
		</div>
	);
}
