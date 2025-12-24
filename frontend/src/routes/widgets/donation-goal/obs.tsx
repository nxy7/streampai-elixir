import { useSearchParams } from "@solidjs/router";
import { createEffect, createSignal, Show, createMemo } from "solid-js";
import { useLiveQuery } from "@tanstack/solid-db";
import { createUserScopedStreamEventsCollection } from "~/lib/electric";

export default function DonationGoalOBS() {
  const [params] = useSearchParams();
  const userId = () => (Array.isArray(params.userId) ? params.userId[0] : params.userId);
  const goalId = () => params.goalId;
  const targetAmount = () => parseFloat(params.targetAmount || "100");

  const eventsQuery = useLiveQuery(() => {
    const id = userId();
    if (!id) return null;
    return createUserScopedStreamEventsCollection(id);
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
      percentage
    };
  });

  return (
    <div class="w-full h-screen bg-transparent overflow-hidden flex items-center justify-center p-8">
      <Show when={userId()} fallback={
        <div class="text-white text-2xl bg-red-500 rounded-lg p-4">
          Error: No userId provided in URL parameters
        </div>
      }>
        <div class="w-full max-w-2xl">
          <div class="bg-linear-to-r from-purple-900/80 to-pink-900/80 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
            <div class="text-white text-3xl font-bold mb-6 text-center">
              Donation Goal
            </div>

            <div class="relative w-full h-16 bg-gray-800/50 rounded-full overflow-hidden mb-4">
              <div
                class="absolute inset-0 bg-linear-to-r from-purple-500 to-pink-500 transition-all duration-1000 ease-out flex items-center justify-center"
                style={{ width: `${Math.min(goalData().percentage, 100)}%` }}
              >
                <Show when={goalData().percentage > 10}>
                  <span class="text-white font-bold text-xl">
                    {Math.round(goalData().percentage)}%
                  </span>
                </Show>
              </div>
            </div>

            <div class="flex justify-between items-center text-white">
              <div class="text-2xl font-bold">
                ${goalData().currentAmount.toFixed(2)}
              </div>
              <div class="text-xl text-gray-300">
                / ${goalData().targetAmount.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
