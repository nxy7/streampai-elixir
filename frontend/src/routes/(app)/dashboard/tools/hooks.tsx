import { For, Show, Suspense, createSignal } from "solid-js";
import { Badge, Card, Skeleton, Toggle } from "~/design-system";
import { button } from "~/design-system/design-system";
import Input, { Textarea } from "~/design-system/Input";
import Select from "~/design-system/Select";
import { useTranslation } from "~/i18n";
import { useAuthenticatedUser } from "~/lib/auth";
import { useBreadcrumbs } from "~/lib/BreadcrumbContext";
import type { StreamHookLogRow, StreamHookRow } from "~/lib/useElectric";
import { useStreamHooks } from "~/lib/useElectric";
import {
	createStreamHook,
	deleteStreamHook,
	getHookLogs,
	toggleStreamHook,
	updateStreamHook,
} from "~/sdk/ash_rpc";

type TriggerType =
	| "donation"
	| "follow"
	| "raid"
	| "subscription"
	| "stream_start"
	| "stream_end"
	| "chat_message";

type ActionType = "webhook" | "discord_message" | "chat_message";

const TRIGGER_OPTIONS: { value: TriggerType; labelKey: string }[] = [
	{ value: "donation", labelKey: "hooks.triggerDonation" },
	{ value: "follow", labelKey: "hooks.triggerFollow" },
	{ value: "raid", labelKey: "hooks.triggerRaid" },
	{ value: "subscription", labelKey: "hooks.triggerSubscription" },
	{ value: "stream_start", labelKey: "hooks.triggerStreamStart" },
	{ value: "stream_end", labelKey: "hooks.triggerStreamEnd" },
	{ value: "chat_message", labelKey: "hooks.triggerChatMessage" },
];

const ACTION_OPTIONS: { value: ActionType; labelKey: string }[] = [
	{ value: "webhook", labelKey: "hooks.actionWebhook" },
	{ value: "discord_message", labelKey: "hooks.actionDiscordMessage" },
	{ value: "chat_message", labelKey: "hooks.actionChatMessage" },
];

function HooksLoadingSkeleton() {
	return (
		<div class="mx-auto max-w-4xl space-y-6">
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

export default function HooksPage() {
	return (
		<Suspense fallback={<HooksLoadingSkeleton />}>
			<HooksPageContent />
		</Suspense>
	);
}

function HooksPageContent() {
	const { t } = useTranslation();
	const { user } = useAuthenticatedUser();

	useBreadcrumbs(() => [
		{ label: t("sidebar.tools"), href: "/dashboard/tools/timers" },
		{ label: t("dashboardNav.hooks") },
	]);

	const streamHooks = useStreamHooks(() => user().id);
	const hooks = () =>
		[...(streamHooks.data() ?? [])].sort(
			(a, b) =>
				new Date(b.inserted_at).getTime() - new Date(a.inserted_at).getTime(),
		);

	// Form state
	const [showForm, setShowForm] = createSignal(false);
	const [editingId, setEditingId] = createSignal<string | null>(null);
	const [name, setName] = createSignal("");
	const [triggerType, setTriggerType] = createSignal<TriggerType>("donation");
	const [actionType, setActionType] = createSignal<ActionType>("webhook");

	// Condition fields
	const [minAmount, setMinAmount] = createSignal<number | undefined>();
	const [currency, setCurrency] = createSignal("");
	const [contains, setContains] = createSignal("");
	const [isModerator, setIsModerator] = createSignal(false);
	const [minViewers, setMinViewers] = createSignal<number | undefined>();

	// Action config fields
	const [webhookUrl, setWebhookUrl] = createSignal("");
	const [webhookMethod, setWebhookMethod] = createSignal("POST");
	const [bodyTemplate, setBodyTemplate] = createSignal("");
	const [discordWebhookUrl, setDiscordWebhookUrl] = createSignal("");
	const [messageTemplate, setMessageTemplate] = createSignal("");
	const [chatMessageText, setChatMessageText] = createSignal("");

	// Logs state
	const [expandedLogId, setExpandedLogId] = createSignal<string | null>(null);
	const [logEntries, setLogEntries] = createSignal<StreamHookLogRow[]>([]);
	const [logsLoading, setLogsLoading] = createSignal(false);

	const triggerSelectOptions = () =>
		TRIGGER_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }));

	const actionSelectOptions = () =>
		ACTION_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }));

	const triggerLabel = (type: string) => {
		const opt = TRIGGER_OPTIONS.find((o) => o.value === type);
		return opt ? t(opt.labelKey) : type;
	};

	const actionLabel = (type: string) => {
		const opt = ACTION_OPTIONS.find((o) => o.value === type);
		return opt ? t(opt.labelKey) : type;
	};

	const resetForm = () => {
		setName("");
		setTriggerType("donation");
		setActionType("webhook");
		setMinAmount(undefined);
		setCurrency("");
		setContains("");
		setIsModerator(false);
		setMinViewers(undefined);
		setWebhookUrl("");
		setWebhookMethod("POST");
		setBodyTemplate("");
		setDiscordWebhookUrl("");
		setMessageTemplate("");
		setChatMessageText("");
		setShowForm(false);
		setEditingId(null);
	};

	const buildConditions = (): Record<string, unknown> | undefined => {
		const tt = triggerType();
		if (tt === "donation") {
			const c: Record<string, unknown> = {};
			if (minAmount() !== undefined) c.min_amount = minAmount();
			if (currency()) c.currency = currency();
			return Object.keys(c).length > 0 ? c : undefined;
		}
		if (tt === "chat_message") {
			const c: Record<string, unknown> = {};
			if (contains()) c.contains = contains();
			if (isModerator()) c.is_moderator = true;
			return Object.keys(c).length > 0 ? c : undefined;
		}
		if (tt === "raid") {
			if (minViewers() !== undefined) return { min_viewers: minViewers() };
			return undefined;
		}
		return undefined;
	};

	const buildActionConfig = (): Record<string, unknown> => {
		const at = actionType();
		if (at === "webhook") {
			return {
				url: webhookUrl(),
				method: webhookMethod(),
				...(bodyTemplate() ? { body_template: bodyTemplate() } : {}),
			};
		}
		if (at === "discord_message") {
			return {
				webhook_url: discordWebhookUrl(),
				template: messageTemplate(),
			};
		}
		if (at === "chat_message") {
			return { message: chatMessageText() };
		}
		return {};
	};

	const handleSubmit = async () => {
		const trimmedName = name().trim();
		if (!trimmedName) return;

		const editing = editingId();
		if (editing) {
			await updateStreamHook({
				identity: editing,
				input: {
					name: trimmedName,
					triggerType: triggerType(),
					actionType: actionType(),
					actionConfig: buildActionConfig(),
					conditions: buildConditions() ?? null,
				},
			});
		} else {
			await createStreamHook({
				input: {
					name: trimmedName,
					triggerType: triggerType(),
					actionType: actionType(),
					actionConfig: buildActionConfig(),
					conditions: buildConditions(),
				},
			});
		}
		resetForm();
	};

	const handleEdit = (hook: StreamHookRow) => {
		setEditingId(hook.id);
		setName(hook.name);
		setTriggerType(hook.trigger_type as TriggerType);
		setActionType(hook.action_type as ActionType);

		// Restore conditions
		const cond = hook.conditions ?? {};
		setMinAmount(cond.min_amount != null ? Number(cond.min_amount) : undefined);
		setCurrency(String(cond.currency ?? ""));
		setContains(String(cond.contains ?? ""));
		setIsModerator(cond.is_moderator === true);
		setMinViewers(
			cond.min_viewers != null ? Number(cond.min_viewers) : undefined,
		);

		// Restore action config
		const cfg = hook.action_config ?? {};
		setWebhookUrl(String(cfg.url ?? ""));
		setWebhookMethod(String(cfg.method ?? "POST"));
		setBodyTemplate(String(cfg.body_template ?? ""));
		setDiscordWebhookUrl(String(cfg.webhook_url ?? ""));
		setMessageTemplate(String(cfg.template ?? ""));
		setChatMessageText(String(cfg.message ?? ""));

		setShowForm(true);
	};

	const handleToggle = async (hookId: string, currentlyEnabled: boolean) => {
		await toggleStreamHook({
			identity: hookId,
			input: { enabled: !currentlyEnabled },
		});
	};

	const handleDelete = async (hookId: string) => {
		await deleteStreamHook({ identity: hookId });
	};

	const handleToggleLogs = async (hookId: string) => {
		if (expandedLogId() === hookId) {
			setExpandedLogId(null);
			setLogEntries([]);
			return;
		}

		setExpandedLogId(hookId);
		setLogsLoading(true);
		try {
			const result = await getHookLogs({
				input: { hookId },
				fields: [
					"id",
					"status",
					"triggerType",
					"actionType",
					"errorMessage",
					"executedAt",
					"durationMs",
				],
			});
			if (result.success) {
				setLogEntries(
					(result.data as unknown as StreamHookLogRow[]).slice(0, 10),
				);
			}
		} catch {
			setLogEntries([]);
		} finally {
			setLogsLoading(false);
		}
	};

	const statusBadgeVariant = (
		status: string,
	): "success" | "error" | "warning" | "neutral" => {
		if (status === "success") return "success";
		if (status === "failure") return "error";
		if (status === "skipped_cooldown") return "warning";
		return "neutral";
	};

	const statusLabel = (status: string): string => {
		if (status === "success") return t("hooks.statusSuccess");
		if (status === "failure") return t("hooks.statusFailure");
		if (status === "skipped_cooldown") return t("hooks.statusSkippedCooldown");
		if (status === "skipped_condition")
			return t("hooks.statusSkippedCondition");
		return status;
	};

	const formatTime = (dateStr: string): string => {
		try {
			return new Date(dateStr).toLocaleString();
		} catch {
			return dateStr;
		}
	};

	return (
		<div class="mx-auto max-w-4xl space-y-6">
			{/* Header */}
			<div class="flex items-center justify-between">
				<p class="text-neutral-500 text-sm">{t("hooks.description")}</p>
				<Show when={!showForm()}>
					<button
						class={`${button.primary} whitespace-nowrap`}
						onClick={() => setShowForm(true)}
						type="button">
						{t("hooks.createHook")}
					</button>
				</Show>
			</div>

			{/* Add/Edit Form */}
			<Show when={showForm()}>
				<Card variant="ghost">
					<div class="space-y-3 p-4">
						<h3 class="font-semibold">
							{editingId() ? t("hooks.editHook") : t("hooks.createHook")}
						</h3>

						<Input
							label={t("hooks.name")}
							onInput={(e) => setName(e.currentTarget.value)}
							placeholder={t("hooks.namePlaceholder")}
							type="text"
							value={name()}
						/>

						<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
							<Select
								label={t("hooks.triggerType")}
								onChange={(v) => setTriggerType(v as TriggerType)}
								options={triggerSelectOptions()}
								value={triggerType()}
							/>

							<Select
								label={t("hooks.actionType")}
								onChange={(v) => setActionType(v as ActionType)}
								options={actionSelectOptions()}
								value={actionType()}
							/>
						</div>

						{/* Conditions — dynamic based on trigger type */}
						<Show when={triggerType() === "donation"}>
							<div class="space-y-2 rounded-lg bg-surface-inset p-2">
								<p class="font-medium text-neutral-700 text-xs">
									{t("hooks.conditions")}
								</p>
								<div class="grid grid-cols-2 gap-3">
									<Input
										class="bg-surface"
										label={t("hooks.minAmount")}
										min={0}
										onInput={(e) => {
											const v = e.currentTarget.value;
											setMinAmount(v ? Number(v) : undefined);
										}}
										type="number"
										value={minAmount() ?? ""}
									/>
									<Input
										class="bg-surface"
										label={t("hooks.currency")}
										onInput={(e) => setCurrency(e.currentTarget.value)}
										placeholder="USD"
										type="text"
										value={currency()}
									/>
								</div>
							</div>
						</Show>

						<Show when={triggerType() === "chat_message"}>
							<div class="space-y-2 rounded-lg bg-surface-inset p-2">
								<p class="font-medium text-neutral-700 text-xs">
									{t("hooks.conditions")}
								</p>
								<Input
									class="bg-surface"
									label={t("hooks.contains")}
									onInput={(e) => setContains(e.currentTarget.value)}
									type="text"
									value={contains()}
								/>
								<label class="flex items-center gap-2 text-sm">
									<input
										checked={isModerator()}
										onChange={(e) => setIsModerator(e.currentTarget.checked)}
										type="checkbox"
									/>
									{t("hooks.isModerator")}
								</label>
							</div>
						</Show>

						<Show when={triggerType() === "raid"}>
							<div class="space-y-2 rounded-lg bg-surface-inset p-2">
								<p class="font-medium text-neutral-700 text-xs">
									{t("hooks.conditions")}
								</p>
								<Input
									class="bg-surface"
									label={t("hooks.minViewers")}
									min={0}
									onInput={(e) => {
										const v = e.currentTarget.value;
										setMinViewers(v ? Number(v) : undefined);
									}}
									type="number"
									value={minViewers() ?? ""}
								/>
							</div>
						</Show>

						{/* Action config — dynamic based on action type */}
						<div class="space-y-2 rounded-lg bg-surface-inset p-2">
							<p class="font-medium text-neutral-700 text-xs">
								{t("hooks.actionConfig")}
							</p>

							<Show when={actionType() === "webhook"}>
								<Input
									class="bg-surface"
									label={t("hooks.webhookUrl")}
									onInput={(e) => setWebhookUrl(e.currentTarget.value)}
									placeholder="https://..."
									type="text"
									value={webhookUrl()}
								/>
								<Select
									label={t("hooks.webhookMethod")}
									onChange={setWebhookMethod}
									options={[
										{ value: "GET", label: "GET" },
										{ value: "POST", label: "POST" },
										{ value: "PUT", label: "PUT" },
									]}
									value={webhookMethod()}
								/>
								<Textarea
									class="bg-surface"
									label={t("hooks.bodyTemplate")}
									onInput={(e) => setBodyTemplate(e.currentTarget.value)}
									placeholder='{"event": "{{event_type}}", "user": "{{username}}"}'
									rows={3}
									value={bodyTemplate()}
								/>
							</Show>

							<Show when={actionType() === "discord_message"}>
								<Input
									class="bg-surface"
									label={t("hooks.discordWebhookUrl")}
									onInput={(e) => setDiscordWebhookUrl(e.currentTarget.value)}
									placeholder="https://discord.com/api/webhooks/..."
									type="text"
									value={discordWebhookUrl()}
								/>
								<Textarea
									class="bg-surface"
									label={t("hooks.messageTemplate")}
									onInput={(e) => setMessageTemplate(e.currentTarget.value)}
									placeholder="{{username}} just donated {{amount}}!"
									rows={2}
									value={messageTemplate()}
								/>
							</Show>

							<Show when={actionType() === "chat_message"}>
								<Textarea
									class="bg-surface"
									label={t("hooks.chatMessageText")}
									onInput={(e) => setChatMessageText(e.currentTarget.value)}
									placeholder="Thanks {{username}}!"
									rows={2}
									value={chatMessageText()}
								/>
							</Show>

							<p class="text-neutral-400 text-xs">{t("hooks.templateHelp")}</p>
						</div>

						<div class="flex gap-2">
							<button
								class={button.primary}
								disabled={!name().trim()}
								onClick={handleSubmit}
								type="button">
								{editingId() ? t("hooks.save") : t("hooks.createHook")}
							</button>
							<button
								class={button.secondary}
								onClick={resetForm}
								type="button">
								{t("hooks.cancel")}
							</button>
						</div>
					</div>
				</Card>
			</Show>

			{/* Hook List */}
			<Show
				fallback={
					<Card variant="ghost">
						<div class="flex flex-col items-center justify-center py-12 text-center">
							<div class="mb-3 text-4xl text-neutral-300">⚡</div>
							<p class="text-neutral-600">{t("hooks.empty")}</p>
							<p class="mt-1 text-neutral-400 text-sm">
								{t("hooks.emptyHint")}
							</p>
						</div>
					</Card>
				}
				when={hooks().length > 0}>
				<div class="space-y-3">
					<For each={hooks()}>
						{(hook) => {
							const isEnabled = () => hook.enabled;
							return (
								<Card variant="ghost">
									<div class="flex items-center gap-4 p-4">
										<Toggle
											aria-label={
												isEnabled() ? t("hooks.disabled") : t("hooks.enabled")
											}
											checked={isEnabled()}
											onChange={() => handleToggle(hook.id, isEnabled())}
										/>
										<div class="min-w-0 flex-1">
											<div class="flex items-center gap-2">
												<span
													class={`font-medium ${isEnabled() ? "text-neutral-900" : "text-neutral-400"}`}>
													{hook.name}
												</span>
											</div>
											<div class="mt-1 flex flex-wrap items-center gap-2 text-neutral-500 text-xs">
												<span>{triggerLabel(hook.trigger_type)}</span>
												<span>→</span>
												<span>{actionLabel(hook.action_type)}</span>
											</div>
										</div>
										<div class="flex shrink-0 items-center gap-2">
											<button
												class={`${button.secondary} text-xs`}
												onClick={() => handleToggleLogs(hook.id)}
												type="button">
												{expandedLogId() === hook.id
													? t("hooks.hideLogs")
													: t("hooks.showLogs")}
											</button>
											<button
												class={button.secondary}
												onClick={() => handleEdit(hook)}
												type="button">
												{t("hooks.edit")}
											</button>
											<button
												class={button.secondary}
												onClick={() => handleDelete(hook.id)}
												type="button">
												<span class="text-red-600">{t("hooks.delete")}</span>
											</button>
										</div>
									</div>

									{/* Expandable logs */}
									<Show when={expandedLogId() === hook.id}>
										<div class="border-neutral-200 border-t px-4 py-3">
											<Show
												fallback={
													<p class="text-center text-neutral-400 text-sm">
														{logsLoading() ? "..." : t("hooks.logsEmpty")}
													</p>
												}
												when={logEntries().length > 0}>
												<div class="space-y-2">
													<For each={logEntries()}>
														{(log) => (
															<div class="flex items-center gap-3 rounded bg-surface-inset px-3 py-2 text-xs">
																<Badge
																	size="sm"
																	variant={statusBadgeVariant(log.status)}>
																	{statusLabel(log.status)}
																</Badge>
																<span class="text-neutral-500">
																	{triggerLabel(log.trigger_type)}
																</span>
																<span class="text-neutral-400">→</span>
																<span class="text-neutral-500">
																	{actionLabel(log.action_type)}
																</span>
																<Show when={log.duration_ms != null}>
																	<span class="text-neutral-400">
																		{log.duration_ms}ms
																	</span>
																</Show>
																<span class="ml-auto text-neutral-400">
																	{formatTime(log.executed_at)}
																</span>
																<Show when={log.error_message}>
																	<span
																		class="truncate text-red-500"
																		title={log.error_message ?? ""}>
																		{log.error_message}
																	</span>
																</Show>
															</div>
														)}
													</For>
												</div>
											</Show>
										</div>
									</Show>
								</Card>
							);
						}}
					</For>
				</div>
			</Show>
		</div>
	);
}
