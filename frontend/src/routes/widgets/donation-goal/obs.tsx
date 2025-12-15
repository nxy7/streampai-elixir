import { useSearchParams } from "@solidjs/router";
import { createEffect, createSignal, Show } from "solid-js";
import { gql, createSubscription } from "@urql/solid";

const GOAL_PROGRESS_SUBSCRIPTION = gql`
  subscription GoalProgress($userId: ID!, $goalId: ID) {
    goalProgress(userId: $userId, goalId: $goalId) {
      goalId
      currentAmount
      targetAmount
      percentage
      timestamp
    }
  }
`;

export default function DonationGoalOBS() {
  const [params] = useSearchParams();
  const userId = () => (Array.isArray(params.userId) ? params.userId[0] : params.userId);
  const goalId = () => params.goalId;

  const [goalData, setGoalData] = createSignal({
    currentAmount: 0,
    targetAmount: 100,
    percentage: 0
  });

  const result = createSubscription({
    query: GOAL_PROGRESS_SUBSCRIPTION,
    variables: { userId: userId(), goalId: goalId() },
    pause: !userId(),
  });

  createEffect(() => {
    if (result()?.data?.goalProgress) {
      const data = result.data.goalProgress;
      setGoalData({
        currentAmount: data.currentAmount,
        targetAmount: data.targetAmount,
        percentage: data.percentage
      });
    }
  });

  return (
    <div class="w-full h-screen bg-transparent overflow-hidden flex items-center justify-center p-8">
      <Show when={userId()} fallback={
        <div class="text-white text-2xl bg-red-500 rounded-lg p-4">
          Error: No userId provided in URL parameters
        </div>
      }>
        <div class="w-full max-w-2xl">
          <div class="bg-gradient-to-r from-purple-900/80 to-pink-900/80 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
            <div class="text-white text-3xl font-bold mb-6 text-center">
              Donation Goal
            </div>

            <div class="relative w-full h-16 bg-gray-800/50 rounded-full overflow-hidden mb-4">
              <div
                class="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000 ease-out flex items-center justify-center"
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
