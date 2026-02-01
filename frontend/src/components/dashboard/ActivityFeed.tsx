import { For, Show, createMemo, createSignal } from "solid-js";
import EventIcon from "~/components/EventIcon";
import Card from "~/design-system/Card";
import { useTranslation } from "~/i18n";
import { getEventBgColor } from "~/lib/eventMetadata";
import { formatTimeAgo } from "~/lib/formatters";

type EventFilter = "all" | "donation" | "follow" | "subscription" | "raid";

interface StreamEvent {
	id: string;
	type: string;
	data: Record<string, unknown>;
	inserted_at: string;
}

interface ActivityFeedProps {
	events: StreamEvent[];
}

export default function ActivityFeed(props: ActivityFeedProps) {
	const { t } = useTranslation();
	const [filter, setFilter] = createSignal<EventFilter>("all");

	const filteredEvents = createMemo(() => {
		const f = filter();
		if (f === "all") return props.events.slice(0, 10);
		return props.events.filter((e) => e.type === f).slice(0, 10);
	});

	const filterButtons = createMemo<{ value: EventFilter; label: string }[]>(
		() => [
			{ value: "all", label: t("dashboard.all") },
			{ value: "donation", label: t("dashboard.donationsFilter") },
			{ value: "follow", label: t("dashboard.follows") },
			{ value: "subscription", label: t("dashboard.subs") },
			{ value: "raid", label: t("dashboard.raids") },
		],
	);

	return (
		<Card data-testid="activity-feed" padding="none">
			<div class="border-neutral-100 border-b px-4 py-3">
				<div class="mb-3 flex items-center justify-between">
					<h3 class="flex items-center gap-2 font-semibold text-neutral-900">
						<svg
							aria-hidden="true"
							class="h-5 w-5 text-primary"
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
						{t("dashboard.activityFeed")}
					</h3>
					<span class="text-neutral-500 text-xs">
						{filteredEvents().length} {t("dashboard.events")}
					</span>
				</div>
				<div class="flex flex-wrap gap-1">
					<For each={filterButtons()}>
						{(btn) => (
							<button
								class={`rounded-full px-2.5 py-1 font-medium text-xs transition-colors ${
									filter() === btn.value
										? "bg-primary text-white"
										: "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
								}`}
								data-testid={`filter-${btn.value}`}
								onClick={() => setFilter(btn.value)}
								type="button">
								{btn.label}
							</button>
						)}
					</For>
				</div>
			</div>
			<div class="max-h-[300px] overflow-y-auto">
				<Show
					fallback={
						<div class="px-4 py-8 text-center">
							<svg
								aria-hidden="true"
								class="mx-auto mb-2 h-10 w-10 text-neutral-300"
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
							<p class="text-neutral-500 text-sm">
								{t("dashboard.noEvents")} {filter() === "all" ? "" : filter()}
							</p>
						</div>
					}
					when={filteredEvents().length > 0}>
					<div class="divide-y divide-neutral-50">
						<For each={filteredEvents()}>
							{(event) => (
								<div class="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50">
									<div
										class={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${getEventBgColor(event.type)}`}>
										<EventIcon type={event.type} />
									</div>
									<div class="min-w-0 flex-1">
										<div class="flex items-center gap-2">
											<span class="font-medium text-neutral-900 text-sm capitalize">
												{event.type}
											</span>
											<span class="text-neutral-400 text-xs">
												{formatTimeAgo(event.inserted_at)}
											</span>
										</div>
										<p class="truncate text-neutral-500 text-xs">
											{(event.data?.username as string) ||
												t("dashboard.anonymous")}
											<Show
												when={event.type === "donation" && event.data?.amount}>
												{" - "}${Number(event.data?.amount).toFixed(2)}
											</Show>
										</p>
									</div>
								</div>
							)}
						</For>
					</div>
				</Show>
			</div>
		</Card>
	);
}
