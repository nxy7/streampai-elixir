import { createMemo } from "solid-js";
import { badge, button, card, text } from "~/design-system/design-system";
import { formatDurationShort, formatTimeAgo } from "~/lib/formatters";
import type { StreamSummary } from "./types";

interface PostStreamSummaryProps {
	summary: StreamSummary;
	onStartNewStream?: () => void;
}

export function PostStreamSummary(props: PostStreamSummaryProps) {
	const endedAgo = createMemo(() => {
		const ended = props.summary.endedAt;
		const endedDate = ended instanceof Date ? ended : new Date(ended);
		return formatTimeAgo(endedDate.toISOString());
	});

	return (
		<div class="space-y-6">
			{/* Header */}
			<div class="flex items-center justify-between">
				<div>
					<h2 class={text.h2}>Stream Summary</h2>
					<p class={text.muted}>Stream ended {endedAgo()}</p>
				</div>
				<span class={badge.neutral}>OFFLINE</span>
			</div>

			{/* Summary Stats Grid */}
			<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
				<div class="rounded-lg bg-purple-50 p-4 text-center">
					<div class="font-bold text-2xl text-purple-600">
						{formatDurationShort(props.summary.duration)}
					</div>
					<div class="text-gray-600 text-sm">Duration</div>
				</div>
				<div class="rounded-lg bg-blue-50 p-4 text-center">
					<div class="font-bold text-2xl text-blue-600">
						{props.summary.peakViewers}
					</div>
					<div class="text-gray-600 text-sm">Peak Viewers</div>
				</div>
				<div class="rounded-lg bg-green-50 p-4 text-center">
					<div class="font-bold text-2xl text-green-600">
						{props.summary.averageViewers}
					</div>
					<div class="text-gray-600 text-sm">Avg Viewers</div>
				</div>
				<div class="rounded-lg bg-pink-50 p-4 text-center">
					<div class="font-bold text-2xl text-pink-600">
						{props.summary.totalMessages}
					</div>
					<div class="text-gray-600 text-sm">Messages</div>
				</div>
			</div>

			{/* Engagement Stats */}
			<div class={card.base}>
				<div class="divide-y divide-gray-100">
					<div class="flex items-center justify-between p-4">
						<div class="flex items-center gap-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
								$
							</div>
							<div>
								<div class="font-medium text-gray-900">Donations</div>
								<div class="text-gray-500 text-sm">
									{props.summary.totalDonations} donations
								</div>
							</div>
						</div>
						<div class="font-bold text-green-600 text-xl">
							${props.summary.donationAmount.toFixed(2)}
						</div>
					</div>

					<div class="flex items-center justify-between p-4">
						<div class="flex items-center gap-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
								+
							</div>
							<div>
								<div class="font-medium text-gray-900">New Followers</div>
								<div class="text-gray-500 text-sm">People who followed</div>
							</div>
						</div>
						<div class="font-bold text-blue-600 text-xl">
							+{props.summary.newFollowers}
						</div>
					</div>

					<div class="flex items-center justify-between p-4">
						<div class="flex items-center gap-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
								*
							</div>
							<div>
								<div class="font-medium text-gray-900">New Subscribers</div>
								<div class="text-gray-500 text-sm">Paid subscriptions</div>
							</div>
						</div>
						<div class="font-bold text-purple-600 text-xl">
							+{props.summary.newSubscribers}
						</div>
					</div>

					<div class="flex items-center justify-between p-4">
						<div class="flex items-center gap-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
								{">"}
							</div>
							<div>
								<div class="font-medium text-gray-900">Raids</div>
								<div class="text-gray-500 text-sm">Incoming raids</div>
							</div>
						</div>
						<div class="font-bold text-orange-600 text-xl">
							{props.summary.raids}
						</div>
					</div>
				</div>
			</div>

			{/* Actions */}
			<div class="flex justify-center">
				<button
					class={button.gradient}
					onClick={props.onStartNewStream}
					type="button">
					Start New Stream
				</button>
			</div>
		</div>
	);
}
