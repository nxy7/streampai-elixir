import {
	For,
	Show,
	createMemo,
	createSignal,
	onCleanup,
	untrack,
} from "solid-js";
import Badge from "~/design-system/Badge";
import Button from "~/design-system/Button";
import Input, { Textarea } from "~/design-system/Input";
import ProgressBar from "~/design-system/ProgressBar";
import Toggle from "~/design-system/Toggle";
import { useTranslation } from "~/i18n";
import {
	createStreamTimer,
	deleteStreamTimer,
	disableStreamTimer,
	enableStreamTimer,
} from "~/sdk/ash_rpc";
import type { StreamTimer } from "./types";

interface TimersPanelProps {
	timers: StreamTimer[];
	streamStartedAt: string | null;
	onBack: () => void;
}

export function TimersPanel(props: TimersPanelProps) {
	const { t } = useTranslation();
	const [showAddForm, setShowAddForm] = createSignal(false);
	const [newTimerLabel, setNewTimerLabel] = createSignal("");
	const [newTimerContent, setNewTimerContent] = createSignal("");
	const [newTimerMinutes, setNewTimerMinutes] = createSignal(5);
	const [now, setNow] = createSignal(Date.now());

	// Tick every second for progress bars
	const interval = setInterval(() => setNow(Date.now()), 1000);
	onCleanup(() => clearInterval(interval));

	const formatInterval = (seconds: number): string => {
		const mins = Math.floor(seconds / 60);
		if (mins >= 60) {
			const hrs = Math.floor(mins / 60);
			const remainingMins = mins % 60;
			return remainingMins > 0 ? `${hrs}h ${remainingMins}m` : `${hrs}h`;
		}
		return `${mins}m`;
	};

	const getTimerProgress = (
		timer: StreamTimer,
	): { remaining: number; progress: number } => {
		const startedAt = props.streamStartedAt;
		if (!startedAt || timer.disabledAt) return { remaining: 0, progress: 0 };

		const elapsedMs = now() - new Date(startedAt).getTime();
		const elapsedS = elapsedMs / 1000;
		const intervalS = timer.intervalSeconds;

		const positionInCycle = elapsedS % intervalS;
		const remaining = Math.max(0, Math.ceil(intervalS - positionInCycle));
		const progress = 1 - positionInCycle / intervalS;

		return { remaining, progress };
	};

	const formatRemaining = (seconds: number): string => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	};

	const handleAddTimer = async () => {
		const label = newTimerLabel().trim() || "Timer";
		const content = newTimerContent().trim();
		if (!content) return;

		await createStreamTimer({
			input: {
				label,
				content,
				intervalSeconds: newTimerMinutes() * 60,
			},
		});

		setNewTimerLabel("");
		setNewTimerContent("");
		setNewTimerMinutes(5);
		setShowAddForm(false);
	};

	const handleToggle = async (timerId: string, currentlyDisabled: boolean) => {
		if (currentlyDisabled) {
			await enableStreamTimer({ identity: timerId, input: { id: timerId } });
		} else {
			await disableStreamTimer({ identity: timerId, input: { id: timerId } });
		}
	};

	const handleDelete = async (timerId: string) => {
		await deleteStreamTimer({ identity: timerId });
	};

	return (
		<div class="flex h-full flex-col">
			{/* Header with back button */}
			<div class="mb-4 flex items-center gap-3">
				<Button onClick={props.onBack} size="sm" variant="ghost">
					<svg
						aria-hidden="true"
						class="h-4 w-4"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						viewBox="0 0 24 24">
						<path
							d="M15 19l-7-7 7-7"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</Button>
				<div>
					<h3 class="font-semibold text-lg text-neutral-900">
						{t("dashboardNav.timers")}
					</h3>
					<p class="text-neutral-500 text-sm">
						{t("timers.streamPanelDescription")}
					</p>
				</div>
			</div>

			{/* Timer List */}
			<div class="min-h-0 flex-1 space-y-3 overflow-y-auto">
				<Show
					fallback={
						<div class="flex flex-col items-center justify-center py-8 text-center text-neutral-400">
							<div class="mb-2 text-4xl">&#9201;</div>
							<div class="text-neutral-600">{t("timers.empty")}</div>
							<p class="mt-1 text-neutral-400 text-sm">
								{t("timers.emptyHint")}
							</p>
						</div>
					}
					when={props.timers.length > 0}>
					<For each={props.timers}>
						{(timer) => {
							const isDisabled = () => timer.disabledAt !== null;
							const timerProgress = () => getTimerProgress(timer);

							// Memo that only changes when the cycle number changes,
							// breaking the reactive chain from the 1-second `now()` tick.
							const cycle = createMemo(() => {
								const startedAt = props.streamStartedAt;
								if (!startedAt || timer.disabledAt) return -1;
								const elapsedS = (now() - new Date(startedAt).getTime()) / 1000;
								return Math.floor(elapsedS / timer.intervalSeconds);
							});

							// Countdown seconds — only recalculated when cycle changes.
							// untrack timerProgress so `now()` doesn't make this memo re-run.
							const countdown = createMemo(() => {
								cycle(); // subscribe to cycle changes only
								return untrack(() => timerProgress().remaining);
							});

							return (
								<div
									class={`rounded-lg border p-4 transition-all ${
										isDisabled()
											? "border-neutral-200 bg-surface"
											: "border-neutral-200 border-l-2 border-l-primary bg-surface"
									}`}>
									<div class="flex items-start justify-between gap-3">
										<div class="min-w-0 flex-1">
											<div class="flex items-center gap-2">
												<span
													class={`font-medium ${isDisabled() ? "text-neutral-400" : "text-neutral-900"}`}>
													{timer.label}
												</span>
												<Badge
													size="sm"
													variant={isDisabled() ? "neutral" : "success"}>
													{isDisabled()
														? t("timers.disabled")
														: t("timers.enabled")}
												</Badge>
												<span class="text-neutral-400 text-xs">
													{t("timers.every")}{" "}
													{formatInterval(timer.intervalSeconds)}
												</span>
											</div>

											{/* Progress bar - only for enabled timers during stream */}
											<Show when={!isDisabled() && props.streamStartedAt}>
												<div class="mt-2">
													<ProgressBar
														countdown={countdown()}
														label={formatRemaining(timerProgress().remaining)}
														max={100}
														size="lg"
														value={timerProgress().progress * 100}
														variant="primary"
													/>
												</div>
											</Show>

											<p
												class={`mt-2 text-sm ${isDisabled() ? "text-neutral-400" : "text-neutral-600"}`}>
												{timer.content.length > 100
													? `${timer.content.slice(0, 100)}...`
													: timer.content}
											</p>
										</div>
										<div class="flex shrink-0 items-center gap-2">
											<Toggle
												aria-label={
													isDisabled()
														? t("timers.enable")
														: t("timers.disable")
												}
												checked={!isDisabled()}
												onChange={() => handleToggle(timer.id, isDisabled())}
												size="sm"
											/>
											<Button
												onClick={() => handleDelete(timer.id)}
												size="sm"
												title={t("timers.delete")}
												variant="ghost">
												<svg
													aria-hidden="true"
													class="h-4 w-4 text-neutral-400 hover:text-red-500"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
													viewBox="0 0 24 24">
													<path
														d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
														stroke-linecap="round"
														stroke-linejoin="round"
													/>
												</svg>
											</Button>
										</div>
									</div>
								</div>
							);
						}}
					</For>
				</Show>
			</div>

			{/* Add Timer Section */}
			<div class="mt-4 shrink-0 border-neutral-200 border-t pt-4">
				<Show
					fallback={
						<button
							class="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-neutral-300 border-dashed py-3 text-neutral-500 transition-colors hover:border-primary hover:bg-primary-50 hover:text-primary"
							onClick={() => setShowAddForm(true)}
							type="button">
							<span class="text-xl">+</span>
							<span>{t("timers.addTimer")}</span>
						</button>
					}
					when={showAddForm()}>
					<div class="space-y-3 rounded-lg border border-neutral-200 bg-surface p-3">
						<Input
							label={t("timers.label")}
							onInput={(e) => setNewTimerLabel(e.currentTarget.value)}
							placeholder={t("timers.labelPlaceholder")}
							type="text"
							value={newTimerLabel()}
						/>
						<Textarea
							label={`${t("timers.message")} *`}
							onInput={(e) => setNewTimerContent(e.currentTarget.value)}
							placeholder={t("timers.messagePlaceholder")}
							rows="2"
							value={newTimerContent()}
						/>
						<Input
							helperText={t("timers.intervalHelp", {
								minutes: String(newTimerMinutes()),
							})}
							label={t("timers.interval")}
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
						<div class="flex gap-2">
							<Button
								disabled={!newTimerContent().trim()}
								onClick={handleAddTimer}
								size="sm">
								{t("timers.addTimer")}
							</Button>
							<Button
								onClick={() => setShowAddForm(false)}
								size="sm"
								variant="secondary">
								{t("timers.cancel")}
							</Button>
						</div>
					</div>
				</Show>
			</div>
		</div>
	);
}
