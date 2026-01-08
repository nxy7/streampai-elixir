import { For, Show, createMemo } from "solid-js";
import Card from "~/design-system/Card";
import { useTranslation } from "~/i18n";

interface StreamGoalsTrackerProps {
	currentFollowers: number;
	currentDonations: number;
	currentMessages: number;
}

export default function StreamGoalsTracker(props: StreamGoalsTrackerProps) {
	const { t } = useTranslation();
	// Example goals - in production these would be configurable
	const goals = createMemo(() => [
		{
			id: "followers",
			label: t("dashboard.dailyFollowers"),
			current: Math.min(props.currentFollowers, 100),
			target: 100,
			icon: "heart",
			color: "pink",
		},
		{
			id: "donations",
			label: t("dashboard.donationGoal"),
			current: Math.min(props.currentDonations, 500),
			target: 500,
			icon: "dollar",
			color: "green",
			prefix: "$",
		},
		{
			id: "chat",
			label: t("dashboard.chatActivity"),
			current: Math.min(props.currentMessages, 1000),
			target: 1000,
			icon: "chat",
			color: "blue",
		},
	]);

	const getColorClasses = (color: string) => {
		switch (color) {
			case "pink":
				return {
					bg: "bg-pink-500",
					light: "bg-pink-100",
					text: "text-pink-600",
				};
			case "green":
				return {
					bg: "bg-green-500",
					light: "bg-green-100",
					text: "text-green-600",
				};
			case "blue":
				return {
					bg: "bg-blue-500",
					light: "bg-blue-100",
					text: "text-blue-600",
				};
			default:
				return {
					bg: "bg-gray-500",
					light: "bg-gray-100",
					text: "text-gray-600",
				};
		}
	};

	return (
		<Card data-testid="stream-goals" padding="none">
			<div class="border-gray-100 border-b px-4 py-3">
				<h3 class="flex items-center gap-2 font-semibold text-gray-900">
					<svg
						aria-hidden="true"
						class="h-5 w-5 text-purple-600"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24">
						<path
							d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
						/>
					</svg>
					{t("dashboard.streamGoals")}
				</h3>
			</div>
			<div class="space-y-4 p-4">
				<For each={goals()}>
					{(goal) => {
						const colors = getColorClasses(goal.color);
						const percentage = Math.round((goal.current / goal.target) * 100);
						return (
							<div class="space-y-2">
								<div class="flex items-center justify-between">
									<span class="font-medium text-gray-700 text-sm">
										{goal.label}
									</span>
									<span class={`font-bold text-sm ${colors.text}`}>
										{goal.prefix || ""}
										{goal.current} / {goal.prefix || ""}
										{goal.target}
									</span>
								</div>
								<div class={`h-2 overflow-hidden rounded-full ${colors.light}`}>
									<div
										class={`h-full rounded-full ${colors.bg} transition-all duration-500`}
										style={{ width: `${Math.min(percentage, 100)}%` }}
									/>
								</div>
								<Show when={percentage >= 100}>
									<div class="flex items-center gap-1 text-green-600 text-xs">
										<svg
											aria-hidden="true"
											class="h-4 w-4"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24">
											<path
												d="M5 13l4 4L19 7"
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
											/>
										</svg>
										{t("dashboard.goalReached")}
									</div>
								</Show>
							</div>
						);
					}}
				</For>
			</div>
		</Card>
	);
}
