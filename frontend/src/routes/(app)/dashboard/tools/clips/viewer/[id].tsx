import { A, useParams } from "@solidjs/router";
import { Show } from "solid-js";
import Card from "~/design-system/Card";
import { button } from "~/design-system/design-system";
import { useTranslation } from "~/i18n";
import { useBreadcrumbs } from "~/lib/BreadcrumbContext";

const mockViewerClips = [
	{
		id: "1",
		title: "Insane clutch play",
		description: "An amazing clutch moment during the competitive match",
		duration: 30,
		views: 1243,
		likes: 89,
		createdAt: "2026-01-28T14:30:00Z",
		platform: "twitch",
		thumbnailColor: "from-purple-500 to-indigo-600",
		creator: "ClipMaster42",
	},
	{
		id: "2",
		title: "Funniest moment of the stream",
		description: "Chat couldn't stop laughing at this one",
		duration: 15,
		views: 856,
		likes: 45,
		createdAt: "2026-01-27T20:15:00Z",
		platform: "youtube",
		thumbnailColor: "from-red-500 to-orange-500",
		creator: "HighlightHunter",
	},
	{
		id: "3",
		title: "New sub hype train",
		description: "The community came together for an epic hype train",
		duration: 45,
		views: 2100,
		likes: 156,
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
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

function formatViews(views: number): string {
	if (views >= 1000) {
		return `${(views / 1000).toFixed(1)}K`;
	}
	return String(views);
}

export default function ViewerClipDetailPage() {
	const { t } = useTranslation();
	const params = useParams<{ id: string }>();

	const clip = () => mockViewerClips.find((c) => c.id === params.id);

	useBreadcrumbs(() => [
		{ label: t("sidebar.tools"), href: "/dashboard/tools/timers" },
		{
			label: t("dashboardNav.streamClips"),
			href: "/dashboard/tools/clips/viewer",
		},
		{ label: clip()?.title ?? t("clips.title") },
	]);

	return (
		<div class="mx-auto max-w-4xl space-y-4">
			<A
				class="inline-flex items-center gap-1 text-neutral-400 text-sm hover:text-neutral-800"
				href="/dashboard/tools/clips/viewer">
				<svg
					aria-hidden="true"
					class="h-4 w-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24">
					<path
						d="M15 19l-7-7 7-7"
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
					/>
				</svg>
				{t("clips.backToClips")}
			</A>

			<Show
				fallback={
					<Card variant="ghost">
						<div class="flex flex-col items-center justify-center py-16 text-center">
							<div class="mb-3 text-4xl">🎬</div>
							<p class="text-neutral-700">{t("clips.clipNotFound")}</p>
							<A
								class={`${button.primary} mt-4`}
								href="/dashboard/tools/clips/viewer">
								{t("clips.backToClips")}
							</A>
						</div>
					</Card>
				}
				when={clip()}>
				{(clipData) => (
					<>
						<Card variant="ghost">
							<div
								class={`relative flex aspect-video items-center justify-center rounded-t-xl bg-gradient-to-br ${clipData().thumbnailColor}`}>
								<div class="flex h-16 w-16 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm">
									<svg
										aria-hidden="true"
										class="ml-1 h-8 w-8 text-white"
										fill="currentColor"
										viewBox="0 0 24 24">
										<path d="M8 5v14l11-7z" />
									</svg>
								</div>
								<span class="absolute right-3 bottom-3 rounded bg-black/60 px-2 py-1 font-medium text-sm text-white">
									{formatDuration(clipData().duration)}
								</span>
								<span class="absolute top-3 left-3 rounded bg-black/40 px-2 py-1 text-sm text-white capitalize">
									{clipData().platform}
								</span>
							</div>
							<div class="p-4">
								<h1 class="font-bold text-lg text-neutral-900">
									{clipData().title}
								</h1>
								<Show when={clipData().description}>
									<p class="mt-2 text-neutral-400 text-sm">
										{clipData().description}
									</p>
								</Show>
							</div>
						</Card>

						<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
							<Card variant="ghost">
								<div class="p-3 text-center">
									<div class="font-bold text-lg text-neutral-900">
										{formatViews(clipData().views)}
									</div>
									<div class="text-neutral-500 text-xs">{t("clips.views")}</div>
								</div>
							</Card>
							<Card variant="ghost">
								<div class="p-3 text-center">
									<div class="font-bold text-lg text-neutral-900">
										{clipData().likes}
									</div>
									<div class="text-neutral-500 text-xs">{t("clips.likes")}</div>
								</div>
							</Card>
							<Card variant="ghost">
								<div class="p-3 text-center">
									<div class="font-bold text-lg text-neutral-900">
										{formatDuration(clipData().duration)}
									</div>
									<div class="text-neutral-500 text-xs">
										{t("clips.duration")}
									</div>
								</div>
							</Card>
							<Card variant="ghost">
								<div class="p-3 text-center">
									<div class="font-bold text-lg text-neutral-900">
										{formatDate(clipData().createdAt)}
									</div>
									<div class="text-neutral-500 text-xs">
										{t("clips.created")}
									</div>
								</div>
							</Card>
						</div>

						<Card variant="ghost">
							<div class="space-y-3 p-4">
								<div class="flex items-center justify-between">
									<span class="text-neutral-400 text-sm">
										{t("clips.createdBy")}
									</span>
									<span class="text-neutral-800 text-sm">
										{clipData().creator}
									</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-neutral-400 text-sm">
										{t("clips.createdOn")}
									</span>
									<span class="text-neutral-800 text-sm">
										{formatDate(clipData().createdAt)}
									</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-neutral-400 text-sm">
										{t("clips.platform")}
									</span>
									<span class="text-neutral-800 text-sm capitalize">
										{clipData().platform}
									</span>
								</div>
							</div>
						</Card>

						<div class="flex gap-3">
							<button class={button.primary} disabled type="button">
								{t("clips.share")}
							</button>
							<button class={button.secondary} disabled type="button">
								{t("clips.download")}
							</button>
							<button
								class={`${button.ghost} text-red-400`}
								disabled
								type="button">
								{t("clips.delete")}
							</button>
						</div>
					</>
				)}
			</Show>
		</div>
	);
}
