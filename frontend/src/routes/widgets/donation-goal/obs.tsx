import { useLiveQuery } from "@tanstack/solid-db";
import { createFileRoute, useSearch } from "@tanstack/solid-router";
import { type Accessor, Show, createMemo } from "solid-js";
import { streamEventsCollection } from "~/lib/electric";
import { getEventsCollection } from "~/lib/useEventsCollection";

export const Route = createFileRoute("/widgets/donation-goal/obs")({
	component: DonationGoalOBS,
});

function DonationGoalOBS() {
	const params = useSearch({ strict: false }) as Accessor<
		Record<string, string | string[] | undefined>
	>;
	const rawUserId = params().userId;
	const userId = () => (Array.isArray(rawUserId) ? rawUserId[0] : rawUserId);
	const _goalId = () => params().goalId;
	const targetAmount = () => {
		const raw = params().targetAmount;
		const value = Array.isArray(raw) ? raw[0] : raw;
		return parseFloat(value || "100");
	};

	const eventsQuery = useLiveQuery(() => {
		const id = userId();
		if (!id) return streamEventsCollection;
		return getEventsCollection(id);
	});

	const goalData = createMemo(() => {
		const data = eventsQuery.data || [];
		const donations = data.filter((e) => e.type === "donation");

		const currentAmount = donations.reduce((sum, d) => {
			const amount = (d.data?.amount as number) || 0;
			return sum + amount;
		}, 0);

		const target = targetAmount();
		const percentage = target > 0 ? (currentAmount / target) * 100 : 0;

		return {
			currentAmount,
			targetAmount: target,
			percentage,
		};
	});

	return (
		<div class="flex h-screen w-full items-center justify-center overflow-hidden bg-transparent p-8">
			<Show
				fallback={
					<div class="rounded-lg bg-red-500 p-4 text-2xl text-white">
						Error: No userId provided in URL parameters
					</div>
				}
				when={userId()}>
				<div class="w-full max-w-2xl">
					<div class="rounded-2xl bg-linear-to-r from-purple-900/80 to-pink-900/80 p-8 shadow-2xl backdrop-blur-sm">
						<div class="mb-6 text-center font-bold text-3xl text-white">
							Donation Goal
						</div>

						<div class="relative mb-4 h-16 w-full overflow-hidden rounded-full bg-gray-800/50">
							<div
								class="absolute inset-0 flex items-center justify-center bg-linear-to-r from-purple-500 to-pink-500 transition-all duration-1000 ease-out"
								style={{ width: `${Math.min(goalData().percentage, 100)}%` }}>
								<Show when={goalData().percentage > 10}>
									<span class="font-bold text-white text-xl">
										{Math.round(goalData().percentage)}%
									</span>
								</Show>
							</div>
						</div>

						<div class="flex items-center justify-between text-white">
							<div class="font-bold text-2xl">
								${goalData().currentAmount.toFixed(2)}
							</div>
							<div class="text-gray-300 text-xl">
								/ ${goalData().targetAmount.toFixed(2)}
							</div>
						</div>
					</div>
				</div>
			</Show>
		</div>
	);
}
