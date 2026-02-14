import { For, Show, createMemo, createSignal } from "solid-js";
import PlatformIcon from "~/components/PlatformIcon";
import { button } from "~/design-system/design-system";
import { useTranslation } from "~/i18n";
import { SchemaForm } from "~/lib/schema-form/SchemaForm";
import { ActivityFeed } from "./ActivityFeed";
import { ChatInput } from "./ChatInput";
import { StreamActionsPanel } from "./StreamActionsPanel";
import { StreamSettingsForm } from "./StreamSettingsForm";
import { TimersPanel } from "./TimersPanel";
import {
	AVAILABLE_PLATFORMS,
	type ActivityItem,
	type GiveawayCreationValues,
	type LiveViewMode,
	type ModerationCallbacks,
	type Platform,
	type PollCreationValues,
	type StreamActionCallbacks,
	type StreamControlsSettings,
	type StreamTimer,
	giveawayCreationMeta,
	giveawayCreationSchema,
	pollCreationMeta,
	pollCreationSchema,
} from "./types";

interface LiveStreamControlCenterProps extends StreamActionCallbacks {
	activities: ActivityItem[];
	streamDuration: number;
	viewerCount: number;
	stickyDuration?: number;
	connectedPlatforms?: Platform[];
	onSendMessage?: (message: string, platforms: Platform[]) => void;
	onStopStream?: () => void;
	onUpdateMetadata?: (metadata: {
		title?: string;
		description?: string;
		tags?: string[];
		thumbnailFileId?: string;
	}) => void;
	currentThumbnailUrl?: string;
	isStopping?: boolean;
	moderationCallbacks?: ModerationCallbacks;
	timers?: StreamTimer[];
	streamStartedAt?: string | null;
	currentTitle?: string;
	currentDescription?: string;
	currentTags?: string[];
	allConnectedPlatforms?: Platform[];
	platformStatuses?: Record<string, unknown>;
	onTogglePlatform?: (platform: Platform, enabled: boolean) => void;
	controlSettings?: StreamControlsSettings;
	onControlSettingsChange?: (
		field: keyof StreamControlsSettings,
		value: boolean,
	) => void;
	nameSaturation?: number;
	nameLightness?: number;
}

export function LiveStreamControlCenter(props: LiveStreamControlCenterProps) {
	const { t } = useTranslation();
	const [viewMode, setViewMode] = createSignal<LiveViewMode>("events");

	// Poll creation form state
	const [pollFormValues, setPollFormValues] = createSignal<PollCreationValues>({
		question: "",
		option1: "",
		option2: "",
		option3: "",
		option4: "",
		duration: 5,
		allowMultipleVotes: false,
	});

	// Giveaway creation form state
	const [giveawayFormValues, setGiveawayFormValues] =
		createSignal<GiveawayCreationValues>({
			title: "Stream Giveaway",
			description: "",
			keyword: "!join",
			duration: 10,
			subscriberMultiplier: 2,
			subscriberOnly: false,
		});

	const isPollFormValid = createMemo(() => {
		const values = pollFormValues();
		return (
			values.question.trim().length > 0 &&
			values.option1.trim().length > 0 &&
			values.option2.trim().length > 0
		);
	});

	const isGiveawayFormValid = createMemo(() => {
		return giveawayFormValues().title.trim().length > 0;
	});

	const handleStartPoll = () => {
		if (isPollFormValid() && props.onStartPoll) {
			props.onStartPoll(pollFormValues());
			setPollFormValues({
				question: "",
				option1: "",
				option2: "",
				option3: "",
				option4: "",
				duration: 5,
				allowMultipleVotes: false,
			});
			setViewMode("actions");
		}
	};

	const handleStartGiveaway = () => {
		if (isGiveawayFormValid() && props.onStartGiveaway) {
			props.onStartGiveaway(giveawayFormValues());
			setGiveawayFormValues({
				title: "Stream Giveaway",
				description: "",
				keyword: "!join",
				duration: 10,
				subscriberMultiplier: 2,
				subscriberOnly: false,
			});
			setViewMode("actions");
		}
	};

	const availablePlatforms = createMemo(
		() => props.connectedPlatforms || [...AVAILABLE_PLATFORMS],
	);

	const viewModeToggle = () => (
		<div class="flex items-center gap-1">
			<div class="flex rounded-lg border border-neutral-200 bg-neutral-100 p-0.5">
				<button
					class={`rounded-md px-3 py-1 text-xs transition-all ${
						viewMode() === "events"
							? "bg-surface font-medium text-neutral-900 shadow-sm"
							: "text-neutral-500 hover:text-neutral-700"
					}`}
					data-testid="view-mode-events"
					onClick={() => setViewMode("events")}
					type="button">
					{t("stream.viewMode.events")}
				</button>
				<button
					class={`rounded-md px-3 py-1 text-xs transition-all ${
						viewMode() === "actions"
							? "bg-surface font-medium text-neutral-900 shadow-sm"
							: "text-neutral-500 hover:text-neutral-700"
					}`}
					data-testid="view-mode-actions"
					onClick={() => setViewMode("actions")}
					type="button">
					{t("stream.viewMode.actions")}
				</button>
			</div>
			<button
				class={`rounded-md p-1 transition-colors ${
					viewMode() === "controlSettings"
						? "bg-neutral-200 text-neutral-900"
						: "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
				}`}
				data-testid="view-mode-control-settings"
				onClick={() =>
					setViewMode(
						viewMode() === "controlSettings" ? "events" : "controlSettings",
					)
				}
				title={t("stream.controlSettings.title")}
				type="button">
				<svg
					aria-hidden="true"
					class="h-4 w-4"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					viewBox="0 0 24 24">
					<path
						d="M12 15a3 3 0 100-6 3 3 0 000 6z"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
					<path
						d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>
		</div>
	);

	return (
		<div class="flex h-full flex-col">
			{/* Actions View Toolbar */}
			<Show when={viewMode() === "actions"}>
				<div class="flex shrink-0 items-center gap-2 border-neutral-200 border-b px-6 py-2">
					<div class="flex-1" />
					{viewModeToggle()}
				</div>
			</Show>

			{/* Events View - Activity Feed + Chat Input */}
			<Show when={viewMode() === "events"}>
				<ActivityFeed
					activities={props.activities}
					moderationCallbacks={props.moderationCallbacks}
					nameLightness={props.nameLightness}
					nameSaturation={props.nameSaturation}
					showAvatars={props.controlSettings?.showAvatars ?? true}
					stickyDuration={props.stickyDuration}
					toolbarEnd={viewModeToggle()}
				/>
				<ChatInput
					availablePlatforms={availablePlatforms()}
					onSendMessage={props.onSendMessage}
				/>
			</Show>

			{/* Actions View */}
			<Show when={viewMode() === "actions"}>
				<div class="min-h-0 flex-1 overflow-y-auto px-6 py-4">
					<StreamActionsPanel
						onChangeStreamSettings={() => setViewMode("settings")}
						onModifyTimers={() => setViewMode("timers")}
						onOpenWidget={(widget) => setViewMode(widget)}
						onStartGiveaway={props.onStartGiveaway}
						onStartPoll={props.onStartPoll}
					/>
				</div>
			</Show>

			{/* Poll Creation View */}
			<Show when={viewMode() === "poll"}>
				<div class="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-4">
					<div class="mb-4 flex items-center gap-2">
						<button
							class="flex items-center gap-1 rounded-lg px-2 py-1 text-neutral-500 text-sm transition-colors hover:bg-neutral-100 hover:text-neutral-700"
							data-testid="back-to-actions"
							onClick={() => setViewMode("actions")}
							type="button">
							<span>&lt;</span>
							<span>{t("stream.settings.backToActions")}</span>
						</button>
					</div>
					<div class="mb-4">
						<h3 class="font-semibold text-lg text-neutral-900">
							{t("stream.poll.title")}
						</h3>
						<p class="text-neutral-500 text-sm">{t("stream.poll.subtitle")}</p>
					</div>
					<div class="flex-1">
						<SchemaForm
							meta={pollCreationMeta}
							onChange={(field, value) => {
								setPollFormValues((prev) => ({ ...prev, [field]: value }));
							}}
							schema={pollCreationSchema}
							values={pollFormValues()}
						/>
					</div>
					<div class="mt-4 flex justify-end gap-2 border-neutral-200 border-t pt-4">
						<button
							class={button.secondary}
							data-testid="cancel-poll"
							onClick={() => setViewMode("actions")}
							type="button">
							{t("stream.poll.cancel")}
						</button>
						<button
							class={button.primary}
							data-testid="start-poll-button"
							disabled={!isPollFormValid()}
							onClick={handleStartPoll}
							type="button">
							{t("stream.poll.start")}
						</button>
					</div>
				</div>
			</Show>

			{/* Giveaway Creation View */}
			<Show when={viewMode() === "giveaway"}>
				<div class="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-4">
					<div class="mb-4 flex items-center gap-2">
						<button
							class="flex items-center gap-1 rounded-lg px-2 py-1 text-neutral-500 text-sm transition-colors hover:bg-neutral-100 hover:text-neutral-700"
							data-testid="back-to-actions-giveaway"
							onClick={() => setViewMode("actions")}
							type="button">
							<span>&lt;</span>
							<span>{t("stream.settings.backToActions")}</span>
						</button>
					</div>
					<div class="mb-4">
						<h3 class="font-semibold text-lg text-neutral-900">
							{t("stream.giveaway.title")}
						</h3>
						<p class="text-neutral-500 text-sm">
							{t("stream.giveaway.subtitle")}
						</p>
					</div>
					<div class="flex-1">
						<SchemaForm
							meta={giveawayCreationMeta}
							onChange={(field, value) => {
								setGiveawayFormValues((prev) => ({ ...prev, [field]: value }));
							}}
							schema={giveawayCreationSchema}
							values={giveawayFormValues()}
						/>
					</div>
					<div class="mt-4 flex justify-end gap-2 border-neutral-200 border-t pt-4">
						<button
							class={button.secondary}
							data-testid="cancel-giveaway"
							onClick={() => setViewMode("actions")}
							type="button">
							{t("stream.giveaway.cancel")}
						</button>
						<button
							class={button.primary}
							data-testid="start-giveaway-button"
							disabled={!isGiveawayFormValid()}
							onClick={handleStartGiveaway}
							type="button">
							{t("stream.giveaway.start")}
						</button>
					</div>
				</div>
			</Show>

			{/* Timers View */}
			<Show when={viewMode() === "timers"}>
				<div class="min-h-0 flex-1 overflow-y-auto px-6 py-4">
					<TimersPanel
						onBack={() => setViewMode("events")}
						streamStartedAt={props.streamStartedAt ?? null}
						timers={props.timers || []}
					/>
				</div>
			</Show>

			{/* Settings View */}
			<Show when={viewMode() === "settings"}>
				<StreamSettingsPanel
					allConnectedPlatforms={props.allConnectedPlatforms}
					currentDescription={props.currentDescription}
					currentTags={props.currentTags}
					currentThumbnailUrl={props.currentThumbnailUrl}
					currentTitle={props.currentTitle}
					onBack={() => setViewMode("actions")}
					onSave={(metadata) => {
						props.onUpdateMetadata?.(metadata);
						setViewMode("actions");
					}}
					onTogglePlatform={props.onTogglePlatform}
					platformStatuses={props.platformStatuses}
				/>
			</Show>

			{/* Control Settings View */}
			<Show when={viewMode() === "controlSettings"}>
				<div class="flex shrink-0 items-center gap-2 border-neutral-200 border-b px-6 py-2">
					<div class="flex-1" />
					{viewModeToggle()}
				</div>
				<div class="min-h-0 flex-1 overflow-y-auto px-6 py-4">
					<h3 class="mb-4 font-semibold text-lg text-neutral-900">
						{t("stream.controlSettings.title")}
					</h3>

					{/* Show Avatars toggle */}
					<label class="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3">
						<div>
							<div class="font-medium text-neutral-800 text-sm">
								{t("stream.controlSettings.showAvatars")}
							</div>
							<div class="text-neutral-500 text-xs">
								{t("stream.controlSettings.showAvatarsDescription")}
							</div>
						</div>
						<button
							aria-checked={props.controlSettings?.showAvatars ?? true}
							class={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
								(props.controlSettings?.showAvatars ?? true)
									? "bg-primary"
									: "bg-neutral-300"
							}`}
							onClick={() =>
								props.onControlSettingsChange?.(
									"showAvatars",
									!(props.controlSettings?.showAvatars ?? true),
								)
							}
							role="switch"
							type="button">
							<span
								class={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
									(props.controlSettings?.showAvatars ?? true)
										? "translate-x-4"
										: "translate-x-0.5"
								} mt-0.5`}
							/>
						</button>
					</label>
				</div>
			</Show>
		</div>
	);
}

function StreamSettingsPanel(props: {
	currentTitle?: string;
	currentDescription?: string;
	currentTags?: string[];
	currentThumbnailUrl?: string;
	allConnectedPlatforms?: Platform[];
	platformStatuses?: Record<string, unknown>;
	onBack: () => void;
	onSave: (metadata: {
		title?: string;
		description?: string;
		tags?: string[];
		thumbnailFileId?: string;
	}) => void;
	onTogglePlatform?: (platform: Platform, enabled: boolean) => void;
}) {
	const { t } = useTranslation();

	const isPlatformActive = (platform: Platform) => {
		const statuses = props.platformStatuses ?? {};
		return platform in statuses;
	};

	return (
		<div class="min-h-0 flex-1 overflow-y-auto px-6 py-4">
			<div class="mb-4 flex items-center gap-2">
				<button
					aria-label={t("common.back")}
					class="rounded-lg p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
					onClick={props.onBack}
					type="button">
					<svg
						aria-hidden="true"
						class="h-5 w-5"
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
				</button>
				<h3 class="font-semibold text-lg">{t("stream.settings.title")}</h3>
			</div>

			{/* Platform Toggles */}
			<Show when={(props.allConnectedPlatforms?.length ?? 0) > 0}>
				<div class="mb-6">
					<h4 class="mb-2 font-medium text-neutral-700 text-sm">
						{t("stream.controls.platforms")}
					</h4>
					<div class="flex flex-wrap gap-2">
						<For each={props.allConnectedPlatforms}>
							{(platform) => {
								const active = () => isPlatformActive(platform);
								return (
									<button
										class={`relative flex items-center overflow-hidden rounded-full py-1.5 pr-3 pl-9 text-sm transition-all ${
											active()
												? "bg-primary-50 text-primary-hover ring-1 ring-primary-200"
												: "bg-neutral-100 text-neutral-400 ring-1 ring-neutral-200"
										}`}
										onClick={() =>
											props.onTogglePlatform?.(platform, !active())
										}
										type="button">
										<div class="absolute top-1/2 left-0 -translate-y-1/2">
											<PlatformIcon platform={platform} size="md" />
										</div>
										<span class="capitalize">{platform}</span>
									</button>
								);
							}}
						</For>
					</div>
				</div>
			</Show>

			<StreamSettingsForm
				onSave={(values) =>
					props.onSave({
						title: values.title || undefined,
						description: values.description || undefined,
						tags: values.tags.length ? values.tags : undefined,
						thumbnailFileId: values.thumbnailFileId,
					})
				}
				showSave
				values={{
					title: props.currentTitle ?? "",
					description: props.currentDescription ?? "",
					tags: props.currentTags ?? [],
					thumbnailUrl: props.currentThumbnailUrl,
				}}
			/>
		</div>
	);
}
