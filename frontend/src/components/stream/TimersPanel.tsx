import { For, Show, createSignal } from "solid-js";
import { useTranslation } from "~/i18n";
import { button, input } from "~/styles/design-system";
import type { StreamTimer, TimerActionCallbacks } from "./types";

interface TimersPanelProps extends TimerActionCallbacks {
	timers: StreamTimer[];
	onBack: () => void;
}

export function TimersPanel(props: TimersPanelProps) {
	const { t } = useTranslation();
	const [showAddForm, setShowAddForm] = createSignal(false);
	const [newTimerLabel, setNewTimerLabel] = createSignal("");
	const [newTimerContent, setNewTimerContent] = createSignal("");
	const [newTimerMinutes, setNewTimerMinutes] = createSignal(5);

	const formatInterval = (seconds: number): string => {
		const mins = Math.floor(seconds / 60);
		if (mins >= 60) {
			const hrs = Math.floor(mins / 60);
			const remainingMins = mins % 60;
			return remainingMins > 0 ? `${hrs}h ${remainingMins}m` : `${hrs}h`;
		}
		return `${mins}m`;
	};

	const getTimeUntilFire = (nextFireAt: Date | string | null): string => {
		if (!nextFireAt) return "Not scheduled";
		const fireTime =
			nextFireAt instanceof Date ? nextFireAt : new Date(nextFireAt);
		const now = new Date();
		const diffMs = fireTime.getTime() - now.getTime();
		if (diffMs <= 0) return "Firing...";
		const diffSecs = Math.floor(diffMs / 1000);
		const mins = Math.floor(diffSecs / 60);
		const secs = diffSecs % 60;
		return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	};

	const handleAddTimer = () => {
		const label = newTimerLabel().trim() || "Timer";
		const content = newTimerContent().trim();
		if (content && props.onAddTimer) {
			props.onAddTimer(label, content, newTimerMinutes());
		}
		setNewTimerLabel("");
		setNewTimerContent("");
		setNewTimerMinutes(5);
		setShowAddForm(false);
	};

	const getTimerStatusBg = (timer: StreamTimer): string => {
		if (timer.isActive) return "bg-green-50 border-green-200";
		return "bg-gray-50 border-gray-200";
	};

	return (
		<div class="flex h-full flex-col">
			{/* Header with back button */}
			<div class="mb-4 flex items-center gap-3">
				<button
					class="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
					data-testid="timers-back-button"
					onClick={props.onBack}
					type="button">
					{"<"}
				</button>
				<div>
					<h3 class="font-semibold text-gray-900 text-lg">Stream Timers</h3>
					<p class="text-gray-500 text-sm">
						Recurring messages sent at intervals
					</p>
				</div>
			</div>

			{/* Timer List */}
			<div class="min-h-0 flex-1 space-y-3 overflow-y-auto">
				<Show
					fallback={
						<div class="flex flex-col items-center justify-center py-8 text-center text-gray-400">
							<div class="mb-2 text-4xl">[~]</div>
							<div class="text-gray-600">No timers yet</div>
							<p class="mt-1 text-gray-400 text-sm">
								Add a timer to send recurring messages
							</p>
						</div>
					}
					when={props.timers.length > 0}>
					<For each={props.timers}>
						{(timer) => (
							<div
								class={`rounded-lg border p-4 transition-all ${getTimerStatusBg(timer)}`}
								data-testid={`timer-${timer.id}`}>
								<div class="flex items-start justify-between gap-3">
									<div class="min-w-0 flex-1">
										<div class="flex items-center gap-2">
											<div class="font-medium text-gray-900">{timer.label}</div>
											<span
												class={`rounded-full px-2 py-0.5 text-xs ${
													timer.isActive
														? "bg-green-100 text-green-700"
														: "bg-gray-100 text-gray-500"
												}`}>
												{timer.isActive ? "Active" : "Inactive"}
											</span>
										</div>
										<div class="mt-1 text-gray-500 text-sm">
											Every {formatInterval(timer.intervalSeconds)}
										</div>
										<Show when={timer.isActive && timer.nextFireAt}>
											<div class="mt-1 font-mono text-green-600 text-sm">
												Next: {getTimeUntilFire(timer.nextFireAt)}
											</div>
										</Show>
										<div class="mt-2 rounded bg-gray-100 p-2 text-gray-700 text-sm">
											{timer.content.length > 100
												? `${timer.content.slice(0, 100)}...`
												: timer.content}
										</div>
									</div>
									<div class="flex shrink-0 gap-1">
										<Show
											fallback={
												<button
													class="flex h-8 w-8 items-center justify-center rounded border border-yellow-300 bg-yellow-100 text-yellow-700 transition-colors hover:bg-yellow-200"
													data-testid={`stop-timer-${timer.id}`}
													disabled={!props.onStopTimer}
													onClick={() => props.onStopTimer?.(timer.id)}
													title="Stop"
													type="button">
													||
												</button>
											}
											when={!timer.isActive}>
											<button
												class="flex h-8 w-8 items-center justify-center rounded border border-green-300 bg-green-100 text-green-700 transition-colors hover:bg-green-200"
												data-testid={`start-timer-${timer.id}`}
												disabled={!props.onStartTimer}
												onClick={() => props.onStartTimer?.(timer.id)}
												title="Start"
												type="button">
												{">"}
											</button>
										</Show>
										<button
											class="flex h-8 w-8 items-center justify-center rounded border border-red-300 bg-red-100 text-red-600 transition-colors hover:bg-red-200"
											data-testid={`delete-timer-${timer.id}`}
											disabled={!props.onDeleteTimer}
											onClick={() => props.onDeleteTimer?.(timer.id)}
											title="Delete"
											type="button">
											x
										</button>
									</div>
								</div>
							</div>
						)}
					</For>
				</Show>
			</div>

			{/* Add Timer Section */}
			<div class="mt-4 shrink-0 border-gray-200 border-t pt-4">
				<Show
					fallback={
						<button
							class="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-gray-300 border-dashed py-3 text-gray-500 transition-colors hover:border-orange-400 hover:bg-orange-50 hover:text-orange-600"
							data-testid="add-timer-button"
							onClick={() => setShowAddForm(true)}
							type="button">
							<span class="text-xl">+</span>
							<span>Add Timer</span>
						</button>
					}
					when={showAddForm()}>
					<div class="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
						<div>
							<label class="mb-1 block font-medium text-gray-700 text-sm">
								Timer Label
								<input
									class={`${input.text} mt-1 w-full`}
									data-testid="new-timer-label"
									onInput={(e) => setNewTimerLabel(e.currentTarget.value)}
									placeholder={t("stream.timerLabelPlaceholder")}
									type="text"
									value={newTimerLabel()}
								/>
							</label>
						</div>
						<div>
							<label class="mb-1 block font-medium text-gray-700 text-sm">
								Message Content *
								<textarea
									class={`${input.textarea} mt-1 w-full`}
									data-testid="new-timer-content"
									onInput={(e) => setNewTimerContent(e.currentTarget.value)}
									placeholder={t("stream.timerMessagePlaceholder")}
									rows="2"
									value={newTimerContent()}
								/>
							</label>
						</div>
						<div>
							<label class="mb-1 block font-medium text-gray-700 text-sm">
								Interval (minutes)
								<input
									class={`${input.text} mt-1 w-full`}
									data-testid="new-timer-minutes"
									max="180"
									min="1"
									onInput={(e) =>
										setNewTimerMinutes(
											Number.parseInt(e.currentTarget.value, 10) || 5,
										)
									}
									type="number"
									value={newTimerMinutes()}
								/>
							</label>
							<p class="mt-1 text-gray-400 text-xs">
								Message will be sent every {newTimerMinutes()} minute
								{newTimerMinutes() !== 1 ? "s" : ""}
							</p>
						</div>
						<div class="flex gap-2">
							<button
								class={button.primary}
								data-testid="confirm-add-timer"
								disabled={!props.onAddTimer || !newTimerContent().trim()}
								onClick={handleAddTimer}
								type="button">
								Add Timer
							</button>
							<button
								class={button.secondary}
								data-testid="cancel-add-timer"
								onClick={() => setShowAddForm(false)}
								type="button">
								Cancel
							</button>
						</div>
					</div>
				</Show>
			</div>
		</div>
	);
}
