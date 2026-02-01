import { createMemo } from "solid-js";
import Card from "~/design-system/Card";
import { useTranslation } from "~/i18n";

interface ViewerEngagementScoreProps {
	chatMessages: number;
	follows: number;
	donations: number;
	totalDonationAmount: number;
}

export default function ViewerEngagementScore(
	props: ViewerEngagementScoreProps,
) {
	const { t } = useTranslation();
	const engagementScore = createMemo(() => {
		// Calculate engagement score based on various metrics
		// Weighted formula: chat activity (30%), follows (30%), donations count (20%), donation value (20%)
		const chatScore = Math.min(props.chatMessages / 100, 1) * 30;
		const followScore = Math.min(props.follows / 50, 1) * 30;
		const donationCountScore = Math.min(props.donations / 20, 1) * 20;
		const donationValueScore =
			Math.min(props.totalDonationAmount / 500, 1) * 20;
		return Math.round(
			chatScore + followScore + donationCountScore + donationValueScore,
		);
	});

	const scoreColor = () => {
		const score = engagementScore();
		if (score >= 80) return "text-green-600";
		if (score >= 60) return "text-blue-600";
		if (score >= 40) return "text-yellow-600";
		return "text-neutral-600";
	};

	const scoreGradient = () => {
		const score = engagementScore();
		if (score >= 80) return "from-green-500 to-emerald-500";
		if (score >= 60) return "from-blue-500 to-cyan-500";
		if (score >= 40) return "from-yellow-500 to-orange-500";
		return "from-neutral-400 to-neutral-500";
	};

	const scoreLabel = () => {
		const score = engagementScore();
		if (score >= 80) return t("dashboard.excellent");
		if (score >= 60) return t("dashboard.good");
		if (score >= 40) return t("dashboard.growing");
		return t("dashboard.building");
	};

	return (
		<Card
			class="flex h-full flex-col justify-between"
			data-testid="engagement-score"
			padding="sm">
			<div class="mb-3 flex items-center justify-between">
				<h3 class="flex items-center gap-2 font-semibold text-neutral-900">
					<svg
						aria-hidden="true"
						class="h-5 w-5 text-primary"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24">
						<path
							d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
						/>
					</svg>
					{t("dashboard.engagementScore")}
				</h3>
				<span
					class={`rounded-full bg-neutral-100 px-2 py-1 font-medium text-xs ${scoreColor()}`}>
					{scoreLabel()}
				</span>
			</div>
			<div class="flex items-center gap-4">
				<div
					class={`relative h-16 w-16 rounded-full bg-linear-to-r ${scoreGradient()} p-1`}>
					<div class="flex h-full w-full items-center justify-center rounded-full bg-white">
						<span class={`font-bold text-xl ${scoreColor()}`}>
							{engagementScore()}
						</span>
					</div>
				</div>
				<div class="flex-1">
					<div class="h-2 overflow-hidden rounded-full bg-neutral-200">
						<div
							class={`h-full bg-linear-to-r ${scoreGradient()} transition-all duration-500`}
							style={{ width: `${engagementScore()}%` }}
						/>
					</div>
					<div class="mt-2 flex justify-between text-neutral-500 text-xs">
						<span>0</span>
						<span>50</span>
						<span>100</span>
					</div>
				</div>
			</div>
			<div class="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
				<div class="flex justify-between">
					<span class="text-neutral-400">{t("dashboard.chat")}</span>
					<span class="font-medium text-neutral-600">{props.chatMessages}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-neutral-400">{t("dashboard.followers")}</span>
					<span class="font-medium text-neutral-600">{props.follows}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-neutral-400">{t("dashboard.donations")}</span>
					<span class="font-medium text-neutral-600">{props.donations}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-neutral-400">{t("dashboard.totalValue")}</span>
					<span class="font-medium text-neutral-600">
						${props.totalDonationAmount.toFixed(0)}
					</span>
				</div>
			</div>
		</Card>
	);
}
