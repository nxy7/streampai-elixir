import { A } from "@solidjs/router";
import { For, Show } from "solid-js";
import EventIcon from "~/components/EventIcon";
import Card from "~/design-system/Card";
import { text } from "~/design-system/design-system";
import { useTranslation } from "~/i18n";
import { getEventBgColor } from "~/lib/eventMetadata";
import { formatTimeAgo } from "~/lib/formatters";

interface StreamEvent {
	id: string;
	type: string;
	data: Record<string, unknown>;
	inserted_at: string;
}

interface RecentEventsProps {
	events: StreamEvent[];
}

export default function RecentEvents(props: RecentEventsProps) {
	const { t } = useTranslation();

	return (
		<Card padding="none">
			<div class="flex items-center justify-between border-gray-200 border-b px-6 py-4">
				<h3 class={text.h3}>{t("dashboard.recentEvents")}</h3>
				<A
					class="text-purple-600 text-sm hover:text-purple-700"
					href="/dashboard/stream-history">
					{t("dashboard.viewAll")}
				</A>
			</div>
			<div class="divide-y divide-gray-100">
				<Show
					fallback={
						<div class="px-6 py-8 text-center">
							<svg
								aria-hidden="true"
								class="mx-auto mb-3 h-12 w-12 text-gray-300"
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
							<p class="text-gray-500 text-sm">{t("dashboard.noEventsYet")}</p>
							<p class="mt-1 text-gray-400 text-xs">
								{t("dashboard.eventsWillAppear")}
							</p>
						</div>
					}
					when={props.events.length > 0}>
					<For each={props.events}>
						{(event) => (
							<div class="px-6 py-3 hover:bg-gray-50">
								<div class="flex items-center gap-3">
									<div
										class={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${getEventBgColor(event.type)}`}>
										<EventIcon type={event.type} />
									</div>
									<div class="min-w-0 flex-1">
										<div class="flex items-center gap-2">
											<span class="font-medium text-gray-900 text-sm capitalize">
												{event.type}
											</span>
											<span class="text-gray-400 text-xs">
												{formatTimeAgo(event.inserted_at)}
											</span>
										</div>
										<p class="truncate text-gray-600 text-sm">
											<Show
												fallback={t("dashboard.anonymous")}
												when={event.data?.username}>
												{event.data?.username as string}
											</Show>
											<Show
												when={event.type === "donation" && event.data?.amount}>
												{" - "}${Number(event.data?.amount).toFixed(2)}
											</Show>
										</p>
									</div>
								</div>
							</div>
						)}
					</For>
				</Show>
			</div>
		</Card>
	);
}
