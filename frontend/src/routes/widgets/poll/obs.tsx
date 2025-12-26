import { useSearchParams } from "@solidjs/router";
import { createSignal, Show, For } from "solid-js";

type PollOption = {
  id: string;
  text: string;
  votes: number;
};

type Poll = {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
};

export default function PollOBS() {
  const [params] = useSearchParams();
  const userId = () => (Array.isArray(params.userId) ? params.userId[0] : params.userId);

  const [activePoll] = createSignal<Poll | null>(null);

  return (
    <div class="w-full h-screen bg-transparent overflow-hidden flex items-center justify-center p-8">
      <Show when={userId()} fallback={
        <div class="text-white text-2xl bg-red-500 rounded-lg p-4">
          Error: No userId provided in URL parameters
        </div>
      }>
        <Show
          when={activePoll()}
          fallback={
            <div class="bg-gray-900/80 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
              <div class="text-white text-2xl text-center">
                No active poll
              </div>
            </div>
          }
        >
          {(poll) => (
            <div class="w-full max-w-3xl">
              <div class="bg-linear-to-b from-indigo-900/80 to-purple-900/80 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
                <div class="text-white text-3xl font-bold mb-6 text-center">
                  📊 {poll().question}
                </div>

                <div class="space-y-4">
                  <For each={poll().options}>
                    {(option) => {
                      const percentage = poll().totalVotes > 0
                        ? (option.votes / poll().totalVotes) * 100
                        : 0;

                      return (
                        <div class="bg-white/10 rounded-lg p-4 overflow-hidden">
                          <div class="flex items-center justify-between mb-2">
                            <span class="text-white font-bold text-xl">
                              {option.text}
                            </span>
                            <span class="text-white text-lg">
                              {option.votes} votes ({Math.round(percentage)}%)
                            </span>
                          </div>
                          <div class="relative w-full h-4 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              class="absolute inset-y-0 left-0 bg-linear-to-r from-purple-500 to-pink-500 transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    }}
                  </For>
                </div>

                <div class="text-white text-center mt-6 text-lg">
                  Total Votes: {poll().totalVotes}
                </div>
              </div>
            </div>
          )}
        </Show>
      </Show>
    </div>
  );
}
