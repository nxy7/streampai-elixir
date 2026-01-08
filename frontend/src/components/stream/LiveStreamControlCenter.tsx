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
	type StreamTimer,
	type TimerActionCallbacks,
	giveawayCreationMeta,
	giveawayCreationSchema,
	pollCreationMeta,
	pollCreationSchema,
} from "./types";

interface LiveStreamControlCenterProps
	extends StreamActionCallbacks,
		TimerActionCallbacks {
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
	currentTitle?: string;
	currentDescription?: string;
	currentTags?: string[];
	allConnectedPlatforms?: Platform[];
	platformStatuses?: Record<string, unknown>;
	onTogglePlatform?: (platform: Platform, enabled: boolean) => void;
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
		<div class="flex rounded-lg border border-gray-200 bg-gray-100 p-0.5">
			<button
				class={`rounded-md px-3 py-1 text-xs transition-all ${
					viewMode() === "events"
						? "bg-white font-medium text-gray-900 shadow-sm"
						: "text-gray-500 hover:text-gray-700"
				}`}
				data-testid="view-mode-events"
				onClick={() => setViewMode("events")}
				type="button">
				{t("stream.viewMode.events")}
			</button>
			<button
				class={`rounded-md px-3 py-1 text-xs transition-all ${
					viewMode() === "actions"
						? "bg-white font-medium text-gray-900 shadow-sm"
						: "text-gray-500 hover:text-gray-700"
				}`}
				data-testid="view-mode-actions"
				onClick={() => setViewMode("actions")}
				type="button">
				{t("stream.viewMode.actions")}
			</button>
		</div>
	);

	return (
		<div class="flex h-full flex-col">
			{/* Actions View Toolbar */}
			<Show when={viewMode() === "actions"}>
				<div class="flex shrink-0 items-center gap-2 border-gray-200 border-b py-2">
					<div class="flex-1" />
					{viewModeToggle()}
				</div>
			</Show>

			{/* Events View - Activity Feed + Chat Input */}
			<Show when={viewMode() === "events"}>
				<ActivityFeed
					activities={props.activities}
					moderationCallbacks={props.moderationCallbacks}
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
				<div class="min-h-0 flex-1 overflow-y-auto py-4">
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
				<div class="flex min-h-0 flex-1 flex-col overflow-y-auto py-4">
					<div class="mb-4 flex items-center gap-2">
						<button
							class="flex items-center gap-1 rounded-lg px-2 py-1 text-gray-500 text-sm transition-colors hover:bg-gray-100 hover:text-gray-700"
							data-testid="back-to-actions"
							onClick={() => setViewMode("actions")}
							type="button">
							<span>&lt;</span>
							<span>{t("stream.settings.backToActions")}</span>
						</button>
					</div>
					<div class="mb-4">
						<h3 class="font-semibold text-gray-900 text-lg">
							{t("stream.poll.title")}
						</h3>
						<p class="text-gray-500 text-sm">{t("stream.poll.subtitle")}</p>
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
					<div class="mt-4 flex justify-end gap-2 border-gray-200 border-t pt-4">
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
				<div class="flex min-h-0 flex-1 flex-col overflow-y-auto py-4">
					<div class="mb-4 flex items-center gap-2">
						<button
							class="flex items-center gap-1 rounded-lg px-2 py-1 text-gray-500 text-sm transition-colors hover:bg-gray-100 hover:text-gray-700"
							data-testid="back-to-actions-giveaway"
							onClick={() => setViewMode("actions")}
							type="button">
							<span>&lt;</span>
							<span>{t("stream.settings.backToActions")}</span>
						</button>
					</div>
					<div class="mb-4">
						<h3 class="font-semibold text-gray-900 text-lg">
							{t("stream.giveaway.title")}
						</h3>
						<p class="text-gray-500 text-sm">{t("stream.giveaway.subtitle")}</p>
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
					<div class="mt-4 flex justify-end gap-2 border-gray-200 border-t pt-4">
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
				<div class="min-h-0 flex-1 overflow-y-auto py-4">
					<TimersPanel
						onAddTimer={props.onAddTimer}
						onBack={() => setViewMode("events")}
						onDeleteTimer={props.onDeleteTimer}
						onStartTimer={props.onStartTimer}
						onStopTimer={props.onStopTimer}
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
		<div class="min-h-0 flex-1 overflow-y-auto py-4">
			<div class="mb-4 flex items-center gap-2">
				<button
					aria-label={t("common.back")}
					class="rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
					onClick={props.onBack}
					type="button">
					<svg
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
					<h4 class="mb-2 font-medium text-gray-700 text-sm">
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
												? "bg-purple-50 text-purple-700 ring-1 ring-purple-300"
												: "bg-gray-100 text-gray-400 ring-1 ring-gray-200"
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
