import { For, Show, createEffect, createSignal, onCleanup } from "solid-js";
import { button, input } from "~/design-system/design-system";
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
        <button
          class="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
          onClick={props.onBack}
          type="button"
        >
          {"<"}
        </button>
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
          when={props.timers.length > 0}
        >
          <For each={props.timers}>
            {(timer) => {
              const isDisabled = () => timer.disabledAt !== null;
              const timerProgress = () => getTimerProgress(timer);

              return (
                <div
                  class={`rounded-lg border p-4 transition-all ${
                    isDisabled()
                      ? "border-neutral-200 bg-neutral-50"
                      : "border-green-200 bg-green-50"
                  }`}
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-2">
                        <div
                          class={`font-medium ${isDisabled() ? "text-neutral-400" : "text-neutral-900"}`}
                        >
                          {timer.label}
                        </div>
                        <span
                          class={`rounded-full px-2 py-0.5 text-xs ${
                            isDisabled()
                              ? "bg-neutral-100 text-neutral-500"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {isDisabled()
                            ? t("timers.disabled")
                            : t("timers.enabled")}
                        </span>
                      </div>
                      <div class="mt-1 text-neutral-500 text-sm">
                        {t("timers.every")}{" "}
                        {formatInterval(timer.intervalSeconds)}
                      </div>

                      {/* Progress bar - only for enabled timers during stream */}
                      <Show when={!isDisabled() && props.streamStartedAt}>
                        <div class="mt-2">
                          <div class="mb-1 flex items-center justify-between">
                            <span class="font-mono text-green-600 text-xs">
                              {formatRemaining(timerProgress().remaining)}
                            </span>
                          </div>
                          <div class="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
                            <div
                              class="h-full rounded-full bg-green-500 transition-all duration-1000"
                              style={{
                                width: `${timerProgress().progress * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      </Show>

                      <div class="mt-2 rounded bg-neutral-100 p-2 text-neutral-700 text-sm">
                        {timer.content.length > 100
                          ? `${timer.content.slice(0, 100)}...`
                          : timer.content}
                      </div>
                    </div>
                    <div class="flex shrink-0 gap-1">
                      <button
                        class={`flex h-8 items-center justify-center rounded border px-2 text-xs transition-colors ${
                          isDisabled()
                            ? "border-green-300 bg-green-100 text-green-700 hover:bg-green-200"
                            : "border-yellow-300 bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                        }`}
                        onClick={() => handleToggle(timer.id, isDisabled())}
                        type="button"
                      >
                        {isDisabled()
                          ? t("timers.enable")
                          : t("timers.disable")}
                      </button>
                      <button
                        class="flex h-8 w-8 items-center justify-center rounded border border-red-300 bg-red-100 text-red-600 transition-colors hover:bg-red-200"
                        onClick={() => handleDelete(timer.id)}
                        title={t("timers.delete")}
                        type="button"
                      >
                        x
                      </button>
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
              class="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-neutral-300 border-dashed py-3 text-neutral-500 transition-colors hover:border-orange-400 hover:bg-orange-50 hover:text-orange-600"
              onClick={() => setShowAddForm(true)}
              type="button"
            >
              <span class="text-xl">+</span>
              <span>{t("timers.addTimer")}</span>
            </button>
          }
          when={showAddForm()}
        >
          <div class="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
            <div>
              <label class="mb-1 block font-medium text-neutral-700 text-sm">
                {t("timers.label")}
                <input
                  class={`${input.text} mt-1 w-full`}
                  onInput={(e) => setNewTimerLabel(e.currentTarget.value)}
                  placeholder={t("timers.labelPlaceholder")}
                  type="text"
                  value={newTimerLabel()}
                />
              </label>
            </div>
            <div>
              <label class="mb-1 block font-medium text-neutral-700 text-sm">
                {t("timers.message")} *
                <textarea
                  class={`${input.textarea} mt-1 w-full`}
                  onInput={(e) => setNewTimerContent(e.currentTarget.value)}
                  placeholder={t("timers.messagePlaceholder")}
                  rows="2"
                  value={newTimerContent()}
                />
              </label>
            </div>
            <div>
              <label class="mb-1 block font-medium text-neutral-700 text-sm">
                {t("timers.interval")}
                <input
                  class={`${input.text} mt-1 w-full`}
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
              <p class="mt-1 text-neutral-400 text-xs">
                {t("timers.intervalHelp", {
                  minutes: String(newTimerMinutes()),
                })}
              </p>
            </div>
            <div class="flex gap-2">
              <button
                class={button.primary}
                disabled={!newTimerContent().trim()}
                onClick={handleAddTimer}
                type="button"
              >
                {t("timers.addTimer")}
              </button>
              <button
                class={button.secondary}
                onClick={() => setShowAddForm(false)}
                type="button"
              >
                {t("timers.cancel")}
              </button>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
}
