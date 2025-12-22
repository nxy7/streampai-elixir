import { useSearchParams } from "@solidjs/router";
import { createEffect, createSignal, Show, For } from "solid-js";
import { createSubscription } from "@urql/solid";
import { graphql } from "gql.tada";

const DONATION_SUBSCRIPTION = graphql(`
  subscription DonationReceived($userId: ID!) {
    donationReceived(userId: $userId) {
      id
      amount
      currency
      username
      message
      timestamp
      platform
    }
  }
`);

type Donor = {
  username: string;
  totalAmount: number;
  currency: string;
  donationCount: number;
};

export default function TopDonorsOBS() {
  const [params] = useSearchParams();
  const userId = () => (Array.isArray(params.userId) ? params.userId[0] : params.userId);
  const maxDonors = () => parseInt(params.maxDonors || "5");

  const [donors, setDonors] = createSignal<Donor[]>([]);

  const result = createSubscription({
    query: DONATION_SUBSCRIPTION,
    variables: { userId: userId() },
    pause: !userId(),
  });

  createEffect(() => {
    if (result()?.data?.donationReceived) {
      const data = result.data.donationReceived;

      setDonors(prev => {
        const existingIndex = prev.findIndex(d => d.username === data.username);

        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            totalAmount: updated[existingIndex].totalAmount + data.amount,
            donationCount: updated[existingIndex].donationCount + 1
          };
          return updated.sort((a, b) => b.totalAmount - a.totalAmount).slice(0, maxDonors());
        } else {
          const newDonors = [
            ...prev,
            {
              username: data.username,
              totalAmount: data.amount,
              currency: data.currency,
              donationCount: 1
            }
          ];
          return newDonors.sort((a, b) => b.totalAmount - a.totalAmount).slice(0, maxDonors());
        }
      });
    }
  });

  function getMedalEmoji(index: number) {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return '🏅';
    }
  }

  return (
    <div class="w-full h-screen bg-transparent overflow-hidden flex items-center justify-center p-8">
      <Show when={userId()} fallback={
        <div class="text-white text-2xl bg-red-500 rounded-lg p-4">
          Error: No userId provided in URL parameters
        </div>
      }>
        <div class="w-full max-w-2xl">
          <div class="bg-gradient-to-b from-purple-900/80 to-pink-900/80 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
            <div class="text-white text-3xl font-bold mb-6 text-center">
              🏆 Top Donors
            </div>

            <div class="space-y-3">
              <For each={donors()} fallback={
                <div class="text-white text-center text-xl py-8">
                  Waiting for donations...
                </div>
              }>
                {(donor, index) => (
                  <div class="bg-white/10 rounded-lg p-4 flex items-center gap-4 transition-all duration-300 hover:bg-white/20">
                    <div class="text-4xl">
                      {getMedalEmoji(index())}
                    </div>
                    <div class="flex-1">
                      <div class="text-white font-bold text-xl">
                        {donor.username}
                      </div>
                      <div class="text-gray-300 text-sm">
                        {donor.donationCount} donation{donor.donationCount > 1 ? 's' : ''}
                      </div>
                    </div>
                    <div class="text-white text-2xl font-bold">
                      {donor.currency}{donor.totalAmount.toFixed(2)}
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
