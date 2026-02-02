import { createFileRoute } from "@tanstack/solid-router";
import { For, Show, createSignal } from "solid-js";
import { Card, Skeleton, Toggle } from "~/design-system";
import { button, input } from "~/design-system/design-system";
import { useTranslation } from "~/i18n";
import { useCurrentUser } from "~/lib/auth";
import { useBreadcrumbs } from "~/lib/BreadcrumbContext";
import { createStreamTimersCollection } from "~/lib/electric";
import { useStreamTimers } from "~/lib/useElectric";
import {
	createStreamTimer,
	deleteStreamTimer,
	disableStreamTimer,
	enableStreamTimer,
	updateStreamTimer,
} from "~/sdk/ash_rpc";

// Cache for collections to avoid creating duplicates
const collectionCache = new Map<
	string,
	ReturnType<typeof createStreamTimersCollection>
>();

function getOrCreateCollection(userId: string) {
	let collection = collectionCache.get(userId);
	if (!collection) {
		collection = createStreamTimersCollection(userId);
		collectionCache.set(userId, collection);
	}
	return collection;
}

export const Route = createFileRoute("/dashboard/tools/timers")({
	component: TimersConfigPage,
	pendingComponent: TimersLoadingSkeleton,
	pendingMs: 0, // Show immediately
	pendingMinMs: 200, // Minimum display time to avoid flash
	head: () => ({
		meta: [{ title: "Timers - Streampai" }],
	}),
	// Preload Electric collection using user from router context
	loader: async ({ context }) => {
		// Skip on server side
		if (typeof window === "undefined") return null;
		const userId = context.user?.id;
		if (userId) {
			const collection = getOrCreateCollection(userId);
			await collection.preload();
		}
		return null;
	},
});

function TimersLoadingSkeleton() {
	return (
		<div class="mx-auto max-w-3xl space-y-6">
			<div class="flex items-center justify-between">
				<Skeleton class="h-5 w-64" />
				<Skeleton class="h-10 w-28" />
			</div>
			<div class="space-y-3">
				<Skeleton class="h-24 rounded-lg" />
				<Skeleton class="h-24 rounded-lg" />
				<Skeleton class="h-24 rounded-lg" />
			</div>
		</div>
	);
}

function TimersConfigPage() {
	const { t } = useTranslation();
	const { user } = useCurrentUser();

	useBreadcrumbs(() => [
		{ label: t("sidebar.tools"), href: "/dashboard/tools/timers" },
		{ label: t("dashboardNav.timers") },
	]);

	const [showAddForm, setShowAddForm] = createSignal(false);
	const [editingId, setEditingId] = createSignal<string | null>(null);
	const [label, setLabel] = createSignal("");
	const [content, setContent] = createSignal("");
	const [intervalMinutes, setIntervalMinutes] = createSignal(5);

	// Data should be preloaded by the route loader
	const streamTimers = useStreamTimers(() => user()?.id);

	const timers = () =>
		[...(streamTimers.data() ?? [])].sort(
			(a, b) =>
				new Date(b.inserted_at).getTime() - new Date(a.inserted_at).getTime(),
		);

	const formatInterval = (seconds: number | bigint): string => {
		const mins = Math.floor(Number(seconds) / 60);
		if (mins >= 60) {
			const hrs = Math.floor(mins / 60);
			const remainingMins = mins % 60;
			return remainingMins > 0 ? `${hrs}h ${remainingMins}m` : `${hrs}h`;
		}
		return `${mins}m`;
	};

	const resetForm = () => {
		setLabel("");
		setContent("");
		setIntervalMinutes(5);
		setShowAddForm(false);
		setEditingId(null);
	};

	const handleSubmit = async () => {
		const trimmedContent = content().trim();
		if (!trimmedContent) return;

		const editing = editingId();
		if (editing) {
			await updateStreamTimer({
				identity: editing,
				input: {
					label: label().trim() || "Timer",
					content: trimmedContent,
					intervalSeconds: intervalMinutes() * 60,
				},
			});
		} else {
			await createStreamTimer({
				input: {
					label: label().trim() || "Timer",
					content: trimmedContent,
					intervalSeconds: intervalMinutes() * 60,
				},
			});
		}
		resetForm();
	};

	const handleEdit = (timer: {
		id: string;
		label: string;
		content: string;
		interval_seconds: number;
	}) => {
		setEditingId(timer.id);
		setLabel(timer.label);
		setContent(timer.content);
		setIntervalMinutes(Math.round(Number(timer.interval_seconds) / 60));
		setShowAddForm(true);
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
		<div class="mx-auto max-w-3xl space-y-6">
			<div class="flex items-center justify-between">
				<p class="text-neutral-500 text-sm">{t("timers.configDescription")}</p>
				<Show when={!showAddForm()}>
					<button
						class={button.primary}
						onClick={() => setShowAddForm(true)}
						type="button">
						{t("timers.addTimer")}
					</button>
				</Show>
			</div>

			{/* Add/Edit Form */}
			<Show when={showAddForm()}>
				<Card variant="ghost">
					<div class="space-y-4 p-4">
						<h3 class="font-semibold text-lg">
							{editingId() ? t("timers.editTimer") : t("timers.addTimer")}
						</h3>
						<div>
							<label class="mb-1 block font-medium text-neutral-700 text-sm">
								{t("timers.label")}
								<input
									class={`${input.text} mt-1 w-full`}
									onInput={(e) => setLabel(e.currentTarget.value)}
									placeholder={t("timers.labelPlaceholder")}
									type="text"
									value={label()}
								/>
							</label>
						</div>
						<div>
							<label class="mb-1 block font-medium text-neutral-700 text-sm">
								{t("timers.message")} *
								<textarea
									class={`${input.textarea} mt-1 w-full`}
									onInput={(e) => setContent(e.currentTarget.value)}
									placeholder={t("timers.messagePlaceholder")}
									rows="3"
									value={content()}
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
										setIntervalMinutes(
											Number.parseInt(e.currentTarget.value, 10) || 5,
										)
									}
									type="number"
									value={intervalMinutes()}
								/>
							</label>
							<p class="mt-1 text-neutral-400 text-xs">
								{t("timers.intervalHelp", {
									minutes: String(intervalMinutes()),
								})}
							</p>
						</div>
						<div class="flex gap-2">
							<button
								class={button.primary}
								disabled={!content().trim()}
								onClick={handleSubmit}
								type="button">
								{editingId() ? t("timers.save") : t("timers.addTimer")}
							</button>
							<button
								class={button.secondary}
								onClick={resetForm}
								type="button">
								{t("timers.cancel")}
							</button>
						</div>
					</div>
				</Card>
			</Show>

			{/* Timer List */}
			<Show
				fallback={
					<Card variant="ghost">
						<div class="flex flex-col items-center justify-center py-12 text-center">
							<div class="mb-3 text-4xl text-neutral-300">&#9201;</div>
							<p class="text-neutral-600">{t("timers.empty")}</p>
							<p class="mt-1 text-neutral-400 text-sm">
								{t("timers.emptyHint")}
							</p>
						</div>
					</Card>
				}
				when={timers().length > 0}>
				<div class="space-y-3">
					<For each={timers()}>
						{(timer) => {
							const isDisabled = () => timer.disabled_at !== null;
							return (
								<Card variant="ghost">
									<div class="flex items-center gap-4 p-4">
										<Toggle
											aria-label={
												isDisabled() ? t("timers.enable") : t("timers.disable")
											}
											checked={!isDisabled()}
											onChange={() => handleToggle(timer.id, isDisabled())}
										/>
										<div class="min-w-0 flex-1">
											<div class="flex items-center gap-2">
												<span
													class={`font-medium ${isDisabled() ? "text-neutral-400" : "text-neutral-900"}`}>
													{timer.label}
												</span>
												<span class="text-neutral-400 text-sm">
													{t("timers.every")}{" "}
													{formatInterval(timer.interval_seconds)}
												</span>
											</div>
											<p
												class={`mt-1 text-sm ${isDisabled() ? "text-neutral-400" : "text-neutral-600"}`}>
												{timer.content.length > 120
													? `${timer.content.slice(0, 120)}...`
													: timer.content}
											</p>
										</div>
										<div class="flex shrink-0 items-center gap-2">
											<button
												class={button.secondary}
												onClick={() => handleEdit(timer)}
												type="button">
												{t("timers.edit")}
											</button>
											<button
												class={button.secondary}
												onClick={() => handleDelete(timer.id)}
												type="button">
												<span class="text-red-600">{t("timers.delete")}</span>
											</button>
										</div>
									</div>
								</Card>
							);
						}}
					</For>
				</div>
			</Show>
		</div>
	);
}
