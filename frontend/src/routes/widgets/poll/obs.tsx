import { useSearchParams } from "@solidjs/router";
import { For, Show, createSignal } from "solid-js";

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
	const userId = () =>
		Array.isArray(params.userId) ? params.userId[0] : params.userId;

	const [activePoll] = createSignal<Poll | null>(null);

	return (
		<div class="flex h-screen w-full items-center justify-center overflow-hidden bg-transparent p-8">
			<Show
				fallback={
					<div class="rounded-lg bg-red-500 p-4 text-2xl text-white">
						Error: No userId provided in URL parameters
					</div>
				}
				when={userId()}>
				<Show
					fallback={
						<div class="rounded-2xl bg-gray-900/80 p-8 shadow-2xl backdrop-blur-sm">
							<div class="text-center text-2xl text-white">No active poll</div>
						</div>
					}
					when={activePoll()}>
					{(poll) => (
						<div class="w-full max-w-3xl">
							<div class="rounded-2xl bg-linear-to-b from-indigo-900/80 to-purple-900/80 p-8 shadow-2xl backdrop-blur-sm">
								<div class="mb-6 text-center font-bold text-3xl text-white">
									📊 {poll().question}
								</div>

								<div class="space-y-4">
									<For each={poll().options}>
										{(option) => {
											const percentage =
												poll().totalVotes > 0
													? (option.votes / poll().totalVotes) * 100
													: 0;

											return (
												<div class="overflow-hidden rounded-lg bg-white/10 p-4">
													<div class="mb-2 flex items-center justify-between">
														<span class="font-bold text-white text-xl">
															{option.text}
														</span>
														<span class="text-lg text-white">
															{option.votes} votes ({Math.round(percentage)}%)
														</span>
													</div>
													<div class="relative h-4 w-full overflow-hidden rounded-full bg-gray-700">
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

								<div class="mt-6 text-center text-lg text-white">
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
