import { A, useParams } from "@solidjs/router";
import { Show } from "solid-js";
import Card from "~/design-system/Card";
import { button } from "~/design-system/design-system";
import { useTranslation } from "~/i18n";
import { useBreadcrumbs } from "~/lib/BreadcrumbContext";

const mockAiClips = [
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

export default function AiClipDetailPage() {
	const { t } = useTranslation();
	const params = useParams<{ id: string }>();

	const clip = () => mockAiClips.find((c) => c.id === params.id);

	useBreadcrumbs(() => [
		{ label: t("sidebar.tools"), href: "/dashboard/tools/timers" },
		{
			label: t("dashboardNav.streamClips"),
			href: "/dashboard/tools/clips/ai",
		},
		{ label: clip()?.title ?? t("clips.title") },
	]);

	return (
		<div class="mx-auto max-w-4xl space-y-4">
			<A
				class="inline-flex items-center gap-1 text-neutral-400 text-sm hover:text-neutral-800"
				href="/dashboard/tools/clips/ai">
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
							<div class="mb-3 text-4xl">🤖</div>
							<p class="text-neutral-700">{t("clips.clipNotFound")}</p>
							<A
								class={`${button.primary} mt-4`}
								href="/dashboard/tools/clips/ai">
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
										{clipData().aiScore}%
									</div>
									<div class="text-neutral-500 text-xs">
										{t("clips.aiScore")}
									</div>
								</div>
							</Card>
						</div>

						<Card variant="ghost">
							<div class="space-y-3 p-4">
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
										{t("clips.aiScore")}
									</span>
									<div class="flex items-center gap-2">
										<div class="h-2 w-16 overflow-hidden rounded-full bg-neutral-700">
											<div
												class="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
												style={{ width: `${clipData().aiScore}%` }}
											/>
										</div>
										<span class="text-neutral-800 text-sm">
											{clipData().aiScore}%
										</span>
									</div>
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
