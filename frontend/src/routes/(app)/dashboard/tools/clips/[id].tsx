import { A, useParams } from "@solidjs/router";
import { Show } from "solid-js";
import Card from "~/design-system/Card";
import { button } from "~/design-system/design-system";
import { useTranslation } from "~/i18n";
import { useBreadcrumbs } from "~/lib/BreadcrumbContext";

// Mock data - in real implementation this would come from an API
const mockClips = [
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
		type: "viewer" as const,
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
		type: "viewer" as const,
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
		type: "viewer" as const,
	},
	{
		id: "ai-1",
		title: "Peak viewership moment",
		description: "AI detected this as the most engaging moment of the stream",
		duration: 60,
		views: 3420,
		likes: 234,
		createdAt: "2026-01-25T22:00:00Z",
		thumbnailColor: "from-green-500 to-emerald-500",
		aiScore: 95,
		type: "ai" as const,
	},
	{
		id: "ai-2",
		title: "Chat explosion reaction",
		description: "Massive chat activity triggered this highlight capture",
		duration: 25,
		views: 1890,
		likes: 123,
		createdAt: "2026-01-23T13:00:00Z",
		thumbnailColor: "from-amber-500 to-yellow-500",
		aiScore: 88,
		type: "ai" as const,
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

export default function ClipDetailPage() {
	const { t } = useTranslation();
	const params = useParams<{ id: string }>();

	const clip = () => mockClips.find((c) => c.id === params.id);

	useBreadcrumbs(() => [
		{ label: t("sidebar.tools"), href: "/dashboard/tools/timers" },
		{ label: t("dashboardNav.streamClips"), href: "/dashboard/tools/clips" },
		{ label: clip()?.title ?? t("clips.title") },
	]);

	return (
		<div class="mx-auto max-w-4xl space-y-4">
			{/* Back link */}
			<A
				class="inline-flex items-center gap-1 text-neutral-400 text-sm hover:text-neutral-200"
				href="/dashboard/tools/clips">
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
							<p class="text-neutral-300">{t("clips.clipNotFound")}</p>
							<A class={`${button.primary} mt-4`} href="/dashboard/tools/clips">
								{t("clips.backToClips")}
							</A>
						</div>
					</Card>
				}
				when={clip()}>
				{(clipData) => (
					<>
						{/* Video Player Area */}
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
								{/* Duration badge */}
								<span class="absolute right-3 bottom-3 rounded bg-black/60 px-2 py-1 font-medium text-sm text-white">
									{formatDuration(clipData().duration)}
								</span>
								{/* Type badge */}
								<Show when={clipData().type === "ai"}>
									<span class="absolute top-3 left-3 flex items-center gap-1 rounded bg-gradient-to-r from-purple-600 to-indigo-600 px-2 py-1 text-sm text-white">
										<svg
											aria-hidden="true"
											class="h-4 w-4"
											fill="currentColor"
											viewBox="0 0 20 20">
											<path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
											<path
												clip-rule="evenodd"
												d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
												fill-rule="evenodd"
											/>
										</svg>
										AI Generated
									</span>
								</Show>
								<Show
									when={
										clipData().type === "viewer" && "platform" in clipData()
									}>
									<span class="absolute top-3 left-3 rounded bg-black/40 px-2 py-1 text-sm text-white capitalize">
										{(clipData() as { platform: string }).platform}
									</span>
								</Show>
							</div>
							<div class="p-4">
								<h1 class="font-bold text-lg text-neutral-100">
									{clipData().title}
								</h1>
								<Show when={clipData().description}>
									<p class="mt-2 text-neutral-400 text-sm">
										{clipData().description}
									</p>
								</Show>
							</div>
						</Card>

						{/* Clip Info */}
						<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
							<Card variant="ghost">
								<div class="p-3 text-center">
									<div class="font-bold text-lg text-neutral-100">
										{formatViews(clipData().views)}
									</div>
									<div class="text-neutral-500 text-xs">{t("clips.views")}</div>
								</div>
							</Card>
							<Card variant="ghost">
								<div class="p-3 text-center">
									<div class="font-bold text-lg text-neutral-100">
										{clipData().likes}
									</div>
									<div class="text-neutral-500 text-xs">{t("clips.likes")}</div>
								</div>
							</Card>
							<Card variant="ghost">
								<div class="p-3 text-center">
									<div class="font-bold text-lg text-neutral-100">
										{formatDuration(clipData().duration)}
									</div>
									<div class="text-neutral-500 text-xs">
										{t("clips.duration")}
									</div>
								</div>
							</Card>
							<Card variant="ghost">
								<div class="p-3 text-center">
									<div class="font-bold text-lg text-neutral-100">
										<Show
											fallback={formatDate(clipData().createdAt)}
											when={
												clipData().type === "ai" && "aiScore" in clipData()
											}>
											{(clipData() as { aiScore: number }).aiScore}%
										</Show>
									</div>
									<div class="text-neutral-500 text-xs">
										<Show
											fallback={t("clips.created")}
											when={clipData().type === "ai"}>
											{t("clips.aiScore")}
										</Show>
									</div>
								</div>
							</Card>
						</div>

						{/* Metadata */}
						<Card variant="ghost">
							<div class="space-y-3 p-4">
								<Show
									when={
										clipData().type === "viewer" && "creator" in clipData()
									}>
									<div class="flex items-center justify-between">
										<span class="text-neutral-400 text-sm">
											{t("clips.createdBy")}
										</span>
										<span class="text-neutral-200 text-sm">
											{(clipData() as { creator: string }).creator}
										</span>
									</div>
								</Show>
								<div class="flex items-center justify-between">
									<span class="text-neutral-400 text-sm">
										{t("clips.createdOn")}
									</span>
									<span class="text-neutral-200 text-sm">
										{formatDate(clipData().createdAt)}
									</span>
								</div>
								<Show
									when={
										clipData().type === "viewer" && "platform" in clipData()
									}>
									<div class="flex items-center justify-between">
										<span class="text-neutral-400 text-sm">
											{t("clips.platform")}
										</span>
										<span class="text-neutral-200 text-sm capitalize">
											{(clipData() as { platform: string }).platform}
										</span>
									</div>
								</Show>
							</div>
						</Card>

						{/* Actions */}
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
