import { A } from "@solidjs/router";
import { For, Show } from "solid-js";
import {
	Badge,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "~/design-system";
import { useTranslation } from "~/i18n";

export interface StreamData {
	id: string;
	title: string;
	platform: string;
	startTime: Date;
	duration: string;
	viewers: {
		peak: number;
		average: number;
	};
	engagement: {
		chatMessages: number;
	};
}

interface StreamTableProps {
	streams: StreamData[];
}

export function StreamTable(props: StreamTableProps) {
	const { t } = useTranslation();
	const formatNumber = (num: number): string => {
		return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	};

	const formatDate = (date: Date): string => {
		return date.toLocaleDateString(undefined, {
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "numeric",
			minute: "2-digit",
		});
	};

	const getPlatformBadgeVariant = (
		platformName: string,
	): "purple" | "error" | "info" | "success" | "neutral" => {
		const lower = platformName.toLowerCase();
		if (lower.includes("twitch")) return "purple";
		if (lower.includes("youtube")) return "error";
		if (lower.includes("facebook")) return "info";
		if (lower.includes("kick")) return "success";
		return "neutral";
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("analytics.recentStreams")}</CardTitle>
			</CardHeader>
			<CardContent>
				<Show
					fallback={
						<div class="py-12 text-center">
							<svg
								aria-hidden="true"
								class="mx-auto h-12 w-12 text-neutral-400"
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
							<h3 class="mt-2 font-medium text-neutral-900 text-sm">
								{t("analytics.noStreamsYet")}
							</h3>
							<p class="mt-1 text-neutral-500 text-sm">
								{t("analytics.startStreaming")}
							</p>
						</div>
					}
					when={props.streams.length > 0}>
					<div class="-mx-6 overflow-x-auto">
						<table class="min-w-full divide-y divide-neutral-200">
							<thead class="bg-neutral-50">
								<tr>
									<th class="px-6 py-3 text-left font-medium text-neutral-500 text-xs tracking-wider">
										{t("analytics.stream")}
									</th>
									<th class="px-6 py-3 text-left font-medium text-neutral-500 text-xs tracking-wider">
										{t("analytics.platform")}
									</th>
									<th class="px-6 py-3 text-left font-medium text-neutral-500 text-xs tracking-wider">
										{t("analytics.duration")}
									</th>
									<th class="px-6 py-3 text-left font-medium text-neutral-500 text-xs tracking-wider">
										{t("analytics.peakViewers")}
									</th>
									<th class="px-6 py-3 text-left font-medium text-neutral-500 text-xs tracking-wider">
										{t("analytics.avgViewers")}
									</th>
									<th class="px-6 py-3 text-left font-medium text-neutral-500 text-xs tracking-wider">
										{t("analytics.chatMessages")}
									</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-neutral-200 bg-white">
								<For each={props.streams}>
									{(stream) => (
										<tr class="hover:bg-neutral-50">
											<td class="whitespace-nowrap px-6 py-4">
												<A
													class="block hover:text-primary"
													href={`/dashboard/stream-history/${stream.id}`}>
													<div class="font-medium text-neutral-900 text-sm">
														{stream.title}
													</div>
													<div class="text-neutral-500 text-xs">
														{formatDate(stream.startTime)}
													</div>
												</A>
											</td>
											<td class="whitespace-nowrap px-6 py-4">
												<Badge
													variant={getPlatformBadgeVariant(stream.platform)}>
													{stream.platform}
												</Badge>
											</td>
											<td class="whitespace-nowrap px-6 py-4 text-neutral-900 text-sm">
												{stream.duration}
											</td>
											<td class="whitespace-nowrap px-6 py-4 text-neutral-900 text-sm">
												{formatNumber(stream.viewers.peak)}
											</td>
											<td class="whitespace-nowrap px-6 py-4 text-neutral-900 text-sm">
												{formatNumber(stream.viewers.average)}
											</td>
											<td class="whitespace-nowrap px-6 py-4 text-neutral-900 text-sm">
												{formatNumber(stream.engagement.chatMessages)}
											</td>
										</tr>
									)}
								</For>
							</tbody>
						</table>
					</div>
				</Show>
			</CardContent>
		</Card>
	);
}
