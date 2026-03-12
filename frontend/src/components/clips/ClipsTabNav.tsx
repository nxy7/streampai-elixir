import { A, useLocation } from "@solidjs/router";
import { Show } from "solid-js";
import Card from "~/design-system/Card";
import { useTranslation } from "~/i18n";
import { useAuthenticatedUser } from "~/lib/auth";

export function ClipsTabNav() {
	const { t } = useTranslation();
	const { user } = useAuthenticatedUser();
	const location = useLocation();
	const isPro = () => user().tier === "pro";
	const isViewer = () => location.pathname.includes("/viewer");
	const isAi = () => location.pathname.includes("/ai");

	return (
		<>
			<p class="text-neutral-500 text-sm">{t("clips.description")}</p>

			<div class="flex items-center gap-1">
				<A
					class="relative px-4 py-2 font-medium text-sm transition-colors"
					classList={{
						"text-primary": isViewer(),
						"text-neutral-400 hover:text-neutral-800": !isViewer(),
					}}
					href="/dashboard/tools/clips/viewer">
					{t("clips.viewerClips")}
					<Show when={isViewer()}>
						<div class="absolute right-0 bottom-0 left-0 h-0.5 bg-primary" />
					</Show>
				</A>
				<A
					class="relative flex items-center gap-2 px-4 py-2 font-medium text-sm transition-colors"
					classList={{
						"text-primary": isAi(),
						"text-neutral-400 hover:text-neutral-800": !isAi(),
					}}
					href="/dashboard/tools/clips/ai">
					{t("clips.aiClips")}
					<Show when={!isPro()}>
						<span class="rounded bg-gradient-to-r from-amber-500 to-orange-500 px-1.5 py-0.5 font-semibold text-[10px] text-white">
							{t("clips.proOnly")}
						</span>
					</Show>
					<Show when={isAi()}>
						<div class="absolute right-0 bottom-0 left-0 h-0.5 bg-primary" />
					</Show>
				</A>
			</div>

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
		</>
	);
}
