import Card from "~/design-system/Card";
import { useTranslation } from "~/i18n";

interface QuickStatsProps {
	totalMessages: number;
	uniqueViewers: number;
	followCount: number;
	totalDonations: number;
}

export default function QuickStats(props: QuickStatsProps) {
	const { t } = useTranslation();

	return (
		<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
			<Card class="p-4" padding="sm">
				<div class="flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
						<svg
							aria-hidden="true"
							class="h-5 w-5 text-blue-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
							/>
						</svg>
					</div>
					<div>
						<p class="font-bold text-2xl text-gray-900">
							{props.totalMessages}
						</p>
						<p class="text-gray-500 text-sm">{t("dashboard.messages")}</p>
					</div>
				</div>
			</Card>

			<Card class="p-4" padding="sm">
				<div class="flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
						<svg
							aria-hidden="true"
							class="h-5 w-5 text-purple-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
							/>
							<path
								d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
							/>
						</svg>
					</div>
					<div>
						<p class="font-bold text-2xl text-gray-900">
							{props.uniqueViewers}
						</p>
						<p class="text-gray-500 text-sm">{t("dashboard.viewers")}</p>
					</div>
				</div>
			</Card>

			<Card class="p-4" padding="sm">
				<div class="flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-100">
						<svg
							aria-hidden="true"
							class="h-5 w-5 text-pink-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
							/>
						</svg>
					</div>
					<div>
						<p class="font-bold text-2xl text-gray-900">{props.followCount}</p>
						<p class="text-gray-500 text-sm">{t("dashboard.followers")}</p>
					</div>
				</div>
			</Card>

			<Card class="p-4" padding="sm">
				<div class="flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
						<svg
							aria-hidden="true"
							class="h-5 w-5 text-green-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
							/>
						</svg>
					</div>
					<div>
						<p class="font-bold text-2xl text-gray-900">
							${props.totalDonations.toFixed(2)}
						</p>
						<p class="text-gray-500 text-sm">{t("dashboard.donations")}</p>
					</div>
				</div>
			</Card>
		</div>
	);
}
