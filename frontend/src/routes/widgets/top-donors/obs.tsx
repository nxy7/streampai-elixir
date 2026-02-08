import { useSearchParams } from "@solidjs/router";
import { useLiveQuery } from "@tanstack/solid-db";
import { For, Show, createMemo } from "solid-js";
import { streamEventsCollection } from "~/lib/electric";
import { getEventsCollection } from "~/lib/useEventsCollection";

type Donor = {
	username: string;
	totalAmount: number;
	currency: string;
	donationCount: number;
};

export default function TopDonorsOBS() {
	const [params] = useSearchParams();
	const rawUserId = params.userId;
	const userId = () => (Array.isArray(rawUserId) ? rawUserId[0] : rawUserId);
	const maxDonors = () => {
		const raw = params.maxDonors;
		const value = Array.isArray(raw) ? raw[0] : raw;
		return parseInt(value || "5", 10);
	};

	const eventsQuery = useLiveQuery(() => {
		const id = userId();
		if (!id) return streamEventsCollection;
		return getEventsCollection(id);
	});

	const donors = createMemo(() => {
		const data = eventsQuery.data || [];
		const donations = data.filter((e) => e.type === "donation");
		const donationsByUser = new Map<string, Donor>();

		donations.forEach((donation) => {
			const username =
				(donation.data?.username as string) || donation.author_id;
			const amount = (donation.data?.amount as number) || 0;
			const currency = (donation.data?.currency as string) || "$";

			const existing = donationsByUser.get(username);
			if (existing) {
				existing.totalAmount += amount;
				existing.donationCount += 1;
			} else {
				donationsByUser.set(username, {
					username,
					totalAmount: amount,
					currency,
					donationCount: 1,
				});
			}
		});

		return Array.from(donationsByUser.values())
			.sort((a, b) => b.totalAmount - a.totalAmount)
			.slice(0, maxDonors());
	});

	function getMedalEmoji(index: number) {
		switch (index) {
			case 0:
				return "🥇";
			case 1:
				return "🥈";
			case 2:
				return "🥉";
			default:
				return "🏅";
		}
	}

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
					<div class="rounded-2xl bg-linear-to-b from-purple-900/80 to-pink-900/80 p-8 shadow-2xl backdrop-blur-sm">
						<div class="mb-6 text-center font-bold text-3xl text-white">
							🏆 Top Donors
						</div>

						<div class="space-y-3">
							<For
								each={donors()}
								fallback={
									<div class="py-8 text-center text-white text-xl">
										Waiting for donations...
									</div>
								}>
								{(donor, index) => (
									<div class="flex items-center gap-4 rounded-lg bg-white/10 p-4 transition-all duration-300 hover:bg-white/20">
										<div class="text-4xl">{getMedalEmoji(index())}</div>
										<div class="flex-1">
											<div class="font-bold text-white text-xl">
												{donor.username}
											</div>
											<div class="text-gray-300 text-sm">
												{donor.donationCount} donation
												{donor.donationCount > 1 ? "s" : ""}
											</div>
										</div>
										<div class="font-bold text-2xl text-white">
											{donor.currency}
											{donor.totalAmount.toFixed(2)}
										</div>
									</div>
								)}
							</For>
						</div>
					</div>
				</div>
			</Show>
		</div>
	);
}
