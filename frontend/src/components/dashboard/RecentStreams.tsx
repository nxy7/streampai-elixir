import { A } from "@solidjs/router";
import { For, Show } from "solid-js";
import Badge from "~/components/ui/Badge";
import Card from "~/components/ui/Card";
import { useTranslation } from "~/i18n";
import { text } from "~/styles/design-system";

interface Stream {
	id: string;
	title: string | null;
	status: string;
	started_at: string | null;
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
			<div class="flex items-center justify-between border-gray-200 border-b px-6 py-4">
				<h3 class={text.h3}>{t("dashboard.recentStreams")}</h3>
				<A
					class="text-purple-600 text-sm hover:text-purple-700"
					href="/dashboard/stream-history">
					{t("dashboard.viewAll")}
				</A>
			</div>
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
								d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
							/>
						</svg>
						<p class="text-gray-500 text-sm">{t("dashboard.noStreamsYet")}</p>
						<p class="mt-1 text-gray-400 text-xs">
							{t("dashboard.streamsWillAppear")}
						</p>
					</div>
				}
				when={props.streams.length > 0}>
				<div class="divide-y divide-gray-100">
					<For each={props.streams}>
						{(stream) => (
							<A
								class="block px-6 py-4 hover:bg-gray-50"
								href={`/dashboard/stream-history/${stream.id}`}>
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-4">
										<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
											<svg
												aria-hidden="true"
												class="h-6 w-6 text-purple-600"
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
										<div>
											<h4 class="font-medium text-gray-900">
												{stream.title || t("dashboard.untitledStream")}
											</h4>
											<p class="text-gray-500 text-sm">
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
							</A>
						)}
					</For>
				</div>
			</Show>
		</Card>
	);
}
