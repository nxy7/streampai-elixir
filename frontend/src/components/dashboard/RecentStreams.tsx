import { Link } from "@tanstack/solid-router";
import { For, Show } from "solid-js";
import Badge from "~/design-system/Badge";
import Card from "~/design-system/Card";
import { text } from "~/design-system/design-system";
import { useTranslation } from "~/i18n";

interface Stream {
	id: string;
	title: string | null;
	status: string;
	started_at: string | null;
	thumbnail_url: string | null;
}

interface RecentStreamsProps {
	streams: Stream[];
}

function getStreamStatusBadgeVariant(
	status: string,
): "success" | "neutral" | "warning" {
	switch (status) {
		case "live":
			return "success";
		case "ended":
			return "neutral";
		default:
			return "warning";
	}
}

export default function RecentStreams(props: RecentStreamsProps) {
	const { t } = useTranslation();

	return (
		<Card padding="none">
			<div class="flex items-center justify-between border-neutral-200 border-b px-6 py-4">
				<h3 class={text.h3}>{t("dashboard.recentStreams")}</h3>
				<Link
					class="text-primary text-sm hover:text-primary-hover"
					to="/dashboard/stream-history">
					{t("dashboard.viewAll")}
				</Link>
			</div>
			<Show
				fallback={
					<div class="px-6 py-8 text-center">
						<svg
							aria-hidden="true"
							class="mx-auto mb-3 h-12 w-12 text-neutral-300"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
							/>
						</svg>
						<p class="text-neutral-500 text-sm">
							{t("dashboard.noStreamsYet")}
						</p>
						<p class="mt-1 text-neutral-400 text-xs">
							{t("dashboard.streamsWillAppear")}
						</p>
					</div>
				}
				when={props.streams?.length > 0}>
				<div class="divide-y divide-neutral-100">
					<For each={props.streams}>
						{(stream) => (
							<Link
								class="block px-6 py-4"
								params={{ id: stream.id }}
								to="/dashboard/stream-history/$id">
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-4">
										<Show
											fallback={
												<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
													<svg
														aria-hidden="true"
														class="h-6 w-6 text-primary"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24">
														<path
															d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
														/>
													</svg>
												</div>
											}
											when={stream.thumbnail_url}>
											<img
												alt=""
												class="h-12 w-12 rounded-lg object-cover"
												src={stream.thumbnail_url as string}
											/>
										</Show>
										<div>
											<h4 class="font-medium text-neutral-900">
												{stream.title || t("dashboard.untitledStream")}
											</h4>
											<p class="text-neutral-500 text-sm">
												{stream.started_at
													? new Date(stream.started_at).toLocaleDateString()
													: t("dashboard.notStarted")}
											</p>
										</div>
									</div>
									<Badge variant={getStreamStatusBadgeVariant(stream.status)}>
										{stream.status}
									</Badge>
								</div>
							</Link>
						)}
					</For>
				</div>
			</Show>
		</Card>
	);
}
