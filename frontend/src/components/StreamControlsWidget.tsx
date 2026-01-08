import { debounce } from "@solid-primitives/scheduled";
import {
	For,
	Show,
	createEffect,
	createMemo,
	createSignal,
	onCleanup,
	onMount,
} from "solid-js";
import { Portal } from "solid-js/web";
import { z } from "zod";
import PlatformIcon from "~/components/PlatformIcon";
import { AVAILABLE_PLATFORMS, type Platform } from "~/components/stream/types";
import Badge from "~/design-system/Badge";
import Button from "~/design-system/Button";
import Card from "~/design-system/Card";
import { text } from "~/design-system/design-system";
import Input, { Select, Textarea } from "~/design-system/Input";
import { useTranslation } from "~/i18n";
import {
	formatAmount,
	formatDuration,
	formatDurationShort,
	formatTimeAgo,
	formatTimestamp,
} from "~/lib/formatters";
import type { ImageUploadResult } from "~/lib/schema-form/fields";
import {
	type ImageFieldConfig,
	SchemaForm,
} from "~/lib/schema-form/SchemaForm";
import type { FormMeta } from "~/lib/schema-form/types";
import { type ParsedFilters, parseSmartFilters } from "./stream/types";

// Maximum number of activities to keep in memory for performance
const MAX_ACTIVITIES = 200;

// =============================================================================
// Poll Creation Schema
// =============================================================================
const pollCreationSchema = z.object({
	question: z.string().default(""),
	option1: z.string().default(""),
	option2: z.string().default(""),
	option3: z.string().default(""),
	option4: z.string().default(""),
	duration: z.number().min(1).max(60).default(5),
	allowMultipleVotes: z.boolean().default(false),
});

type PollCreationValues = z.infer<typeof pollCreationSchema>;

const pollCreationMeta: FormMeta<typeof pollCreationSchema.shape> = {
	question: {
		label: "Poll Question",
		placeholder: "What should we play next?",
	},
	option1: {
		label: "Option 1",
		placeholder: "First choice",
	},
	option2: {
		label: "Option 2",
		placeholder: "Second choice",
	},
	option3: {
		label: "Option 3 (optional)",
		placeholder: "Third choice",
	},
	option4: {
		label: "Option 4 (optional)",
		placeholder: "Fourth choice",
	},
	duration: {
		label: "Duration",
		unit: "minutes",
	},
	allowMultipleVotes: {
		label: "Allow Multiple Votes",
		description: "Let viewers vote for more than one option",
	},
};

// =============================================================================
// Giveaway Creation Schema
// =============================================================================
const giveawayCreationSchema = z.object({
	title: z.string().default("Stream Giveaway"),
	description: z.string().default(""),
	keyword: z.string().default("!join"),
	duration: z.number().min(1).max(60).default(10),
	subscriberMultiplier: z.number().min(1).max(10).default(2),
	subscriberOnly: z.boolean().default(false),
});

type GiveawayCreationValues = z.infer<typeof giveawayCreationSchema>;

const giveawayCreationMeta: FormMeta<typeof giveawayCreationSchema.shape> = {
	title: {
		label: "Giveaway Title",
		placeholder: "Enter giveaway title",
	},
	description: {
		label: "Description",
		placeholder: "What are you giving away?",
	},
	keyword: {
		label: "Entry Keyword",
		placeholder: "!join",
		description: "Viewers type this in chat to enter",
	},
	duration: {
		label: "Duration",
		unit: "minutes",
	},
	subscriberMultiplier: {
		label: "Subscriber Multiplier",
		description: "Extra entries for subscribers (e.g., 2x = double chance)",
	},
	subscriberOnly: {
		label: "Subscribers Only",
		description: "Only subscribers can enter the giveaway",
	},
};

// =============================================================================
// Stream Settings Schema (with i18n support)
// =============================================================================
const streamSettingsSchema = z.object({
	title: z.string().default(""),
	description: z.string().default(""),
	category: z
		.enum([
			"Gaming",
			"Just Chatting",
			"Music",
			"Art",
			"Software Development",
			"Education",
			"Sports",
			"Other",
		])
		.default("Gaming"),
	thumbnailFileId: z.string().nullable().default(null),
});

type StreamSettingsValues = z.infer<typeof streamSettingsSchema>;

// Localized metadata for stream settings form
const getStreamSettingsMeta = (): FormMeta<
	typeof streamSettingsSchema.shape
> => ({
	title: {
		labelKey: "stream.settings.streamTitle",
		placeholderKey: "stream.settings.streamTitlePlaceholder",
		inputType: "text",
	},
	description: {
		labelKey: "stream.settings.description",
		placeholderKey: "stream.settings.descriptionPlaceholder",
		inputType: "textarea",
	},
	category: {
		labelKey: "stream.settings.category",
		inputType: "select",
		optionKeys: {
			Gaming: "stream.settings.categories.gaming",
			"Just Chatting": "stream.settings.categories.justChatting",
			Music: "stream.settings.categories.music",
			Art: "stream.settings.categories.art",
			"Software Development": "stream.settings.categories.softwareDevelopment",
			Education: "stream.settings.categories.education",
			Sports: "stream.settings.categories.sports",
			Other: "stream.settings.categories.other",
		},
	},
	thumbnailFileId: {
		labelKey: "stream.settings.thumbnail",
		descriptionKey: "stream.settings.thumbnailDescription",
		inputType: "image",
	},
});

// Types for stream metadata
export interface StreamMetadata {
	title: string;
	description: string;
	category: string;
	tags: string[];
	/** URL of the thumbnail image for display */
	thumbnail?: string;
	/** File ID of the uploaded thumbnail (for backend storage) */
	thumbnailFileId?: string | null;
}

// Types for stream key data
export interface StreamKeyData {
	rtmpsUrl: string;
	rtmpsStreamKey: string;
	srtUrl?: string;
	webRtcUrl?: string;
}

// Types for activity feed items
export type ActivityType =
	| "chat"
	| "donation"
	| "follow"
	| "subscription"
	| "raid"
	| "cheer";

export interface ActivityItem {
	id: string;
	type: ActivityType;
	username: string;
	message?: string;
	amount?: number;
	currency?: string;
	platform: string;
	timestamp: Date | string;
	isImportant?: boolean;
	// Additional fields needed for moderation actions
	viewerId?: string;
	viewerPlatformId?: string;
}

// Moderation action callbacks
export interface ModerationCallbacks {
	onReplayEvent?: (eventId: string) => void;
	onBanUser?: (
		userId: string,
		platform: string,
		viewerPlatformId: string,
		username: string,
		reason?: string,
	) => void;
	onTimeoutUser?: (
		userId: string,
		platform: string,
		viewerPlatformId: string,
		username: string,
		durationSeconds: number,
		reason?: string,
	) => void;
	onDeleteMessage?: (eventId: string) => void;
	onHighlightMessage?: (item: ActivityItem) => void;
	onClearHighlight?: () => void;
	highlightedMessageId?: string;
}

// Types for stream summary
export interface StreamSummary {
	duration: number; // in seconds
	peakViewers: number;
	averageViewers: number;
	totalMessages: number;
	totalDonations: number;
	donationAmount: number;
	newFollowers: number;
	newSubscribers: number;
	raids: number;
	endedAt: Date | string;
}

// Stream phase types
export type StreamPhase = "pre-stream" | "live" | "post-stream";

// View mode for live stream (events, actions, or specific action widgets)
export type LiveViewMode =
	| "events"
	| "actions"
	| "poll"
	| "giveaway"
	| "timers"
	| "settings";

// Categories for stream
const STREAM_CATEGORIES = [
	"Gaming",
	"Just Chatting",
	"Music",
	"Art",
	"Software Development",
	"Education",
	"Sports",
	"Other",
];

// Determine importance of events (for sticky behavior)
const isImportantEvent = (type: ActivityType): boolean => {
	return ["donation", "raid", "subscription", "cheer"].includes(type);
};

// Get event icon
const getEventIcon = (type: ActivityType): string => {
	switch (type) {
		case "donation":
			return "$";
		case "follow":
			return "+";
		case "subscription":
			return "*";
		case "raid":
			return ">";
		case "cheer":
			return "~";
		default:
			return "";
	}
};

// Get event color
const getEventColor = (type: ActivityType): string => {
	switch (type) {
		case "donation":
			return "text-green-400";
		case "follow":
			return "text-blue-400";
		case "subscription":
			return "text-purple-400";
		case "raid":
			return "text-orange-400";
		case "cheer":
			return "text-pink-400";
		default:
			return "text-gray-300";
	}
};

// =====================================================
// Pre-Stream Settings Component
// =====================================================
interface PreStreamSettingsProps {
	metadata: StreamMetadata;
	onMetadataChange: (metadata: StreamMetadata) => void;
	streamKeyData?: StreamKeyData;
	onShowStreamKey?: () => void;
	showStreamKey?: boolean;
	isLoadingStreamKey?: boolean;
	onCopyStreamKey?: () => void;
	copied?: boolean;
}

export function PreStreamSettings(props: PreStreamSettingsProps) {
	const [tagInput, setTagInput] = createSignal("");

	const addTag = () => {
		const tag = tagInput().trim();
		if (tag && !props.metadata.tags.includes(tag)) {
			props.onMetadataChange({
				...props.metadata,
				tags: [...props.metadata.tags, tag],
			});
			setTagInput("");
		}
	};

	const removeTag = (tagToRemove: string) => {
		props.onMetadataChange({
			...props.metadata,
			tags: props.metadata.tags.filter((t) => t !== tagToRemove),
		});
	};

	return (
		<div class="space-y-6">
			{/* Stream Configuration Header */}
			<div class="flex items-center justify-between">
				<div>
					<h2 class={text.h2}>Stream Settings</h2>
					<p class={text.muted}>Configure your stream before going live</p>
				</div>
				<Badge variant="neutral">OFFLINE</Badge>
			</div>

			{/* Stream Metadata Form */}
			<div class="space-y-4">
				{/* Title */}
				<div>
					<label class={text.label}>
						Stream Title
						<Input
							class="mt-1"
							onInput={(e) =>
								props.onMetadataChange({
									...props.metadata,
									title: e.currentTarget.value,
								})
							}
							placeholder="Enter your stream title..."
							type="text"
							value={props.metadata.title}
						/>
					</label>
				</div>

				{/* Description */}
				<div>
					<label class={text.label}>
						Description
						<Textarea
							class="mt-1"
							onInput={(e) =>
								props.onMetadataChange({
									...props.metadata,
									description: e.currentTarget.value,
								})
							}
							placeholder="Describe your stream..."
							rows="3"
							value={props.metadata.description}
						/>
					</label>
				</div>

				{/* Category */}
				<div>
					<label class={text.label}>
						Category
						<Select
							class="mt-1"
							onChange={(e) =>
								props.onMetadataChange({
									...props.metadata,
									category: e.currentTarget.value,
								})
							}
							value={props.metadata.category}>
							<option value="">Select a category...</option>
							<For each={STREAM_CATEGORIES}>
								{(cat) => <option value={cat}>{cat}</option>}
							</For>
						</Select>
					</label>
				</div>

				{/* Tags */}
				<div>
					<label class={text.label}>
						Tags
						<div class="mt-1 flex gap-2">
							<Input
								onInput={(e) => setTagInput(e.currentTarget.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										addTag();
									}
								}}
								placeholder="Add a tag..."
								type="text"
								value={tagInput()}
							/>
							<Button onClick={addTag} type="button" variant="secondary">
								Add
							</Button>
						</div>
					</label>
					<Show when={props.metadata.tags.length > 0}>
						<div class="mt-2 flex flex-wrap gap-2">
							<For each={props.metadata.tags}>
								{(tag) => (
									<span class="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-purple-800 text-sm">
										{tag}
										<Button
											class="hover:text-purple-600"
											onClick={() => removeTag(tag)}
											type="button">
											x
										</Button>
									</span>
								)}
							</For>
						</div>
					</Show>
				</div>

				{/* Thumbnail placeholder */}
				<div>
					<span class={text.label}>Thumbnail</span>
					<div class="mt-1 flex h-32 items-center justify-center rounded-lg border-2 border-gray-300 border-dashed bg-gray-50">
						<div class="text-center text-gray-500">
							<div class="mb-1 text-2xl">[img]</div>
							<div class="text-sm">Click to upload thumbnail</div>
						</div>
					</div>
				</div>
			</div>

			{/* Stream Key Info Box */}
			<div class="rounded-lg border border-amber-200 bg-amber-50 p-4">
				<div class="flex items-start gap-3">
					<div class="text-amber-600 text-xl">[i]</div>
					<div class="flex-1">
						<h4 class="font-medium text-amber-800">
							Ready to start streaming?
						</h4>
						<p class="mt-1 text-amber-700 text-sm">
							Configure your streaming software (OBS, Streamlabs, etc.) with the
							stream key below, then start streaming to go live.
						</p>
						<Button
							class="mt-3"
							onClick={props.onShowStreamKey}
							type="button"
							variant="secondary">
							{props.showStreamKey ? "Hide Stream Key" : "Show Stream Key"}
						</Button>
					</div>
				</div>
			</div>

			{/* Stream Key Display */}
			<Show when={props.showStreamKey}>
				<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
					<Show
						fallback={
							<div class="space-y-3">
								<div class="h-4 w-24 animate-pulse rounded bg-gray-200" />
								<div class="h-5 w-full animate-pulse rounded bg-gray-200" />
								<div class="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
							</div>
						}
						when={!props.isLoadingStreamKey}>
						<Show
							fallback={
								<div class="text-center text-gray-500">
									No stream key available
								</div>
							}
							when={props.streamKeyData}>
							{(data) => (
								<>
									<div class="mb-3 flex items-center justify-between">
										<span class="font-medium text-gray-700 text-sm">
											Stream Key
										</span>
										<Button
											onClick={props.onCopyStreamKey}
											size="sm"
											type="button"
											variant="ghost">
											{props.copied ? "Copied!" : "Copy Key"}
										</Button>
									</div>
									<div class="mb-2">
										<span class="mb-1 block text-gray-500 text-xs">
											RTMP URL
										</span>
										<code class="block rounded bg-white px-2 py-1 font-mono text-gray-900 text-sm">
											{data().rtmpsUrl}
										</code>
									</div>
									<div class="mb-3">
										<span class="mb-1 block text-gray-500 text-xs">
											Stream Key
										</span>
										<code class="block rounded bg-white px-2 py-1 font-mono text-gray-600 text-sm">
											{data().rtmpsStreamKey}
										</code>
									</div>
									<Show when={data().srtUrl}>
										<div class="mb-2 border-gray-200 border-t pt-2">
											<span class="mb-1 block text-gray-500 text-xs">
												SRT URL (Alternative)
											</span>
											<code class="block rounded bg-white px-2 py-1 font-mono text-gray-600 text-xs">
												{data().srtUrl}
											</code>
										</div>
									</Show>
								</>
							)}
						</Show>
					</Show>
				</div>
			</Show>
		</div>
	);
}

// Available platforms for chat

// =====================================================
// Activity Row Component (fixed height for virtualization)
// =====================================================
interface ActivityRowProps {
	item: ActivityItem;
	isSticky?: boolean;
	moderationCallbacks?: ModerationCallbacks;
	onToggleUserFilter?: (username: string) => void;
}

// Row height constant for sticky offset calculations
const ACTIVITY_ROW_HEIGHT = 52; // px - accounts for padding and content

// Timeout duration presets in seconds
const TIMEOUT_PRESETS = [
	{ label: "1m", seconds: 60 },
	{ label: "5m", seconds: 300 },
	{ label: "10m", seconds: 600 },
	{ label: "1h", seconds: 3600 },
	{ label: "24h", seconds: 86400 },
] as const;

function ActivityRow(props: ActivityRowProps & { stickyIndex?: number }) {
	const [isHovered, setIsHovered] = createSignal(false);
	const [showTimeoutMenu, setShowTimeoutMenu] = createSignal(false);

	// Check if this message is currently highlighted
	const isHighlighted = () =>
		props.moderationCallbacks?.highlightedMessageId === props.item.id;

	// Calculate sticky top offset based on index (for stacking multiple sticky items)
	// Both highlighted and sticky items use stickyIndex for vertical positioning
	const stickyStyle = () => {
		if (
			(isHighlighted() || props.isSticky) &&
			props.stickyIndex !== undefined
		) {
			return { top: `${props.stickyIndex * ACTIVITY_ROW_HEIGHT}px` };
		}
		return {};
	};

	// Determine if this row should show moderation actions
	const showModerationActions = () => {
		if (!props.moderationCallbacks) return false;
		if (props.item.type === "chat") {
			return !!(
				props.moderationCallbacks.onBanUser ||
				props.moderationCallbacks.onTimeoutUser ||
				props.moderationCallbacks.onDeleteMessage ||
				props.moderationCallbacks.onHighlightMessage
			);
		}
		if (isImportantEvent(props.item.type)) {
			return !!props.moderationCallbacks.onReplayEvent;
		}
		return false;
	};

	// Handle replay action
	const handleReplay = (e: MouseEvent) => {
		e.stopPropagation();
		props.moderationCallbacks?.onReplayEvent?.(props.item.id);
	};

	// Handle ban action
	const handleBan = (e: MouseEvent) => {
		e.stopPropagation();
		if (props.item.viewerId && props.item.viewerPlatformId) {
			props.moderationCallbacks?.onBanUser?.(
				props.item.viewerId,
				props.item.platform,
				props.item.viewerPlatformId,
				props.item.username,
			);
		}
	};

	// Handle timeout action
	const handleTimeout = (e: MouseEvent, seconds: number) => {
		e.stopPropagation();
		setShowTimeoutMenu(false);
		setIsHovered(false); // Close hover state so action buttons hide
		if (props.item.viewerId && props.item.viewerPlatformId) {
			props.moderationCallbacks?.onTimeoutUser?.(
				props.item.viewerId,
				props.item.platform,
				props.item.viewerPlatformId,
				props.item.username,
				seconds,
			);
		}
	};

	// Handle delete action
	const handleDelete = (e: MouseEvent) => {
		e.stopPropagation();
		props.moderationCallbacks?.onDeleteMessage?.(props.item.id);
	};

	// Handle highlight action
	const handleHighlight = (e: MouseEvent) => {
		e.stopPropagation();
		if (isHighlighted()) {
			props.moderationCallbacks?.onClearHighlight?.();
		} else {
			props.moderationCallbacks?.onHighlightMessage?.(props.item);
		}
	};

	// Handle username click to toggle user filter
	const handleUsernameClick = (e: MouseEvent) => {
		e.stopPropagation();
		props.onToggleUserFilter?.(props.item.username);
	};

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: Hover effect for moderation UI
		<div
			class={`group relative flex items-center gap-2 rounded px-2 py-2 transition-colors hover:bg-gray-50 ${
				isHighlighted()
					? "sticky z-20 border-purple-400 border-l-4 bg-purple-50 shadow-md ring-1 ring-purple-200"
					: props.isSticky
						? "sticky z-10 border-amber-200 border-b bg-amber-50 shadow-sm"
						: isImportantEvent(props.item.type)
							? "bg-gray-50/50"
							: ""
			}`}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => {
				// Don't close hover state if timeout menu is open (user might be selecting duration)
				if (!showTimeoutMenu()) {
					setIsHovered(false);
				}
			}}
			style={stickyStyle()}>
			{/* Platform badge */}
			<PlatformIcon platform={props.item.platform} size="sm" />

			{/* Content */}
			<div class="min-w-0 flex-1">
				<div class="flex items-center gap-1.5">
					<Show when={props.item.type !== "chat"}>
						<span class={`text-xs ${getEventColor(props.item.type)}`}>
							{getEventIcon(props.item.type)}
						</span>
					</Show>
					<Button
						class={`cursor-pointer font-medium text-sm hover:underline ${props.item.type === "chat" ? "text-gray-800" : getEventColor(props.item.type)}`}
						onClick={handleUsernameClick}
						title={`Filter by user: ${props.item.username}`}
						type="button">
						{props.item.username}
					</Button>
					<Show when={props.item.amount}>
						<span class="font-bold text-green-600 text-sm">
							{formatAmount(props.item.amount, props.item.currency)}
						</span>
					</Show>
					<span class="ml-auto text-gray-400 text-xs">
						{formatTimestamp(props.item.timestamp)}
					</span>
				</div>
				<Show when={props.item.message}>
					<div class="mt-0.5 truncate text-gray-700 text-sm">
						{props.item.message}
					</div>
				</Show>
			</div>

			{/* Hover Actions - Icon-only buttons with tooltips */}
			<Show when={isHovered() && showModerationActions()}>
				<div class="absolute top-1/2 right-1 flex -translate-y-1/2 items-center gap-0.5 rounded bg-white/95 px-1 py-0.5 shadow-sm ring-1 ring-gray-200">
					{/* Replay button for important events */}
					<Show
						when={
							isImportantEvent(props.item.type) &&
							props.moderationCallbacks?.onReplayEvent
						}>
						<Button
							class="flex h-5 w-5 items-center justify-center rounded text-purple-600 transition-colors hover:bg-purple-50"
							data-testid="replay-button"
							onClick={handleReplay}
							title="Replay alert"
							type="button">
							<span class="text-xs">&#x21bb;</span>
						</Button>
					</Show>

					{/* Chat moderation actions */}
					<Show when={props.item.type === "chat"}>
						{/* Highlight message button */}
						<Show when={props.moderationCallbacks?.onHighlightMessage}>
							<Button
								class={`flex h-5 w-5 items-center justify-center rounded transition-colors ${
									isHighlighted()
										? "bg-purple-600 text-white hover:bg-purple-700"
										: "text-purple-500 hover:bg-purple-50 hover:text-purple-600"
								}`}
								data-testid="highlight-button"
								onClick={handleHighlight}
								title={
									isHighlighted() ? "Remove highlight" : "Highlight message"
								}
								type="button">
								<span class="text-xs">{isHighlighted() ? "★" : "☆"}</span>
							</Button>
						</Show>

						{/* Delete message button */}
						<Show when={props.moderationCallbacks?.onDeleteMessage}>
							<Button
								class="flex h-5 w-5 items-center justify-center rounded text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
								data-testid="delete-button"
								onClick={handleDelete}
								title="Delete message"
								type="button">
								<span class="text-xs">&#x2715;</span>
							</Button>
						</Show>

						{/* Timeout button with dropdown */}
						<Show when={props.moderationCallbacks?.onTimeoutUser}>
							{(() => {
								const [buttonRef, setButtonRef] =
									createSignal<HTMLButtonElement | null>(null);
								const [dropdownPos, setDropdownPos] = createSignal({
									top: 0,
									left: 0,
								});

								// Update dropdown position when menu opens
								createEffect(() => {
									if (showTimeoutMenu() && buttonRef()) {
										const rect = buttonRef()?.getBoundingClientRect();
										if (rect) {
											setDropdownPos({
												top: rect.bottom + 2,
												left: rect.right - 60, // Align right edge with button
											});
										}
									}
								});

								return (
									<>
										<Button
											class="flex h-5 w-5 items-center justify-center rounded text-amber-600 transition-colors hover:bg-amber-50"
											data-testid="timeout-button"
											onClick={(e) => {
												e.stopPropagation();
												setShowTimeoutMenu(!showTimeoutMenu());
											}}
											ref={setButtonRef}
											title="Timeout user"
											type="button">
											<span class="text-xs">&#x23F1;</span>
										</Button>
										<Show when={showTimeoutMenu()}>
											<Portal>
												<div
													class="fixed z-[9999] min-w-[60px] rounded border border-gray-200 bg-white py-0.5 shadow-lg"
													onMouseLeave={() => {
														setShowTimeoutMenu(false);
														setIsHovered(false);
													}}
													role="menu"
													style={{
														top: `${dropdownPos().top}px`,
														left: `${dropdownPos().left}px`,
													}}>
													<For each={TIMEOUT_PRESETS}>
														{(preset) => (
															<Button
																class="block w-full px-2 py-0.5 text-left text-gray-700 text-xs transition-colors hover:bg-amber-50"
																data-testid={`timeout-${preset.label}`}
																onClick={(e) =>
																	handleTimeout(e, preset.seconds)
																}
																role="menuitem"
																type="button">
																{preset.label}
															</Button>
														)}
													</For>
												</div>
											</Portal>
										</Show>
									</>
								);
							})()}
						</Show>

						{/* Ban button */}
						<Show when={props.moderationCallbacks?.onBanUser}>
							<Button
								class="flex h-5 w-5 items-center justify-center rounded text-red-600 transition-colors hover:bg-red-50"
								data-testid="ban-button"
								onClick={handleBan}
								title="Ban user"
								type="button">
								<span class="text-xs">&#x26D4;</span>
							</Button>
						</Show>
					</Show>
				</div>
			</Show>
		</div>
	);
}

// =====================================================
// Stream Actions Panel Component
// =====================================================
export interface StreamActionCallbacks {
	onStartPoll?: (data: PollCreationValues) => void;
	onStartGiveaway?: (data: GiveawayCreationValues) => void;
	onModifyTimers?: () => void;
	onChangeStreamSettings?: () => void;
	onSaveStreamSettings?: (metadata: StreamMetadata) => void;
	/** Handler for uploading a thumbnail image. Should implement 2-step upload. */
	onThumbnailUpload?: (file: File) => Promise<ImageUploadResult>;
}

interface StreamActionsPanelProps extends StreamActionCallbacks {
	onOpenWidget?: (widget: "poll" | "giveaway" | "settings") => void;
}

function StreamActionsPanel(props: StreamActionsPanelProps) {
	const handlePollClick = () => {
		props.onOpenWidget?.("poll");
	};

	const handleGiveawayClick = () => {
		props.onOpenWidget?.("giveaway");
	};

	const handleSettingsClick = () => {
		props.onOpenWidget?.("settings");
	};

	const actions = [
		{
			id: "poll",
			icon: "[?]",
			title: "Start Poll",
			description: "Create an interactive poll for viewers",
			color: "bg-blue-500",
			hoverColor: "hover:bg-blue-600",
			onClick: handlePollClick,
			enabled: true,
		},
		{
			id: "giveaway",
			icon: "[*]",
			title: "Start Giveaway",
			description: "Launch a giveaway for your audience",
			color: "bg-green-500",
			hoverColor: "hover:bg-green-600",
			onClick: handleGiveawayClick,
			enabled: true,
		},
		{
			id: "timers",
			icon: "[~]",
			title: "Modify Timers",
			description: "Adjust stream timers and countdowns",
			color: "bg-orange-500",
			hoverColor: "hover:bg-orange-600",
			onClick: props.onModifyTimers,
			enabled: !!props.onModifyTimers,
		},
		{
			id: "settings",
			icon: "[=]",
			title: "Stream Settings",
			description: "Change title, category, and tags",
			color: "bg-purple-500",
			hoverColor: "hover:bg-purple-600",
			onClick: handleSettingsClick,
			enabled: true,
		},
	];

	return (
		<div class="flex h-full flex-col">
			<div class="mb-4">
				<h3 class="font-semibold text-gray-900 text-lg">Stream Actions</h3>
				<p class="text-gray-500 text-sm">
					Control your stream with quick actions
				</p>
			</div>

			<div class="grid gap-3">
				<For each={actions}>
					{(action) => (
						<Button
							class={`flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 text-left transition-all hover:border-gray-300 hover:shadow-md ${
								action.enabled
									? "cursor-pointer"
									: "cursor-not-allowed opacity-60"
							}`}
							data-testid={`action-${action.id}`}
							disabled={!action.enabled}
							onClick={action.onClick}
							type="button">
							<div
								class={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-white text-xl ${action.color} ${action.enabled ? action.hoverColor : ""}`}>
								{action.icon}
							</div>
							<div class="min-w-0 flex-1">
								<div class="font-medium text-gray-900">{action.title}</div>
								<div class="text-gray-500 text-sm">{action.description}</div>
							</div>
							<div class="shrink-0 text-gray-400">&gt;</div>
						</Button>
					)}
				</For>
			</div>

			<div class="mt-auto pt-4">
				<div class="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center text-gray-500 text-sm">
					More actions coming soon
				</div>
			</div>
		</div>
	);
}

// =====================================================
// Stream Timer Item Interface
// =====================================================
export interface StreamTimer {
	id: string;
	label: string;
	content: string; // Message to send when timer fires
	intervalSeconds: number; // How often to send the message
	isActive: boolean; // Whether the timer is currently running
	nextFireAt: Date | string | null; // When the next message will be sent
}

// =====================================================
// Timers Panel Component
// =====================================================
interface TimersPanelProps {
	timers: StreamTimer[];
	onBack: () => void;
	onAddTimer?: (
		label: string,
		content: string,
		intervalMinutes: number,
	) => void;
	onStartTimer?: (timerId: string) => void;
	onStopTimer?: (timerId: string) => void;
	onDeleteTimer?: (timerId: string) => void;
}

function TimersPanel(props: TimersPanelProps) {
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
				<Button
					class="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
					data-testid="timers-back-button"
					onClick={props.onBack}
					type="button">
					{"<"}
				</Button>
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
												<Button
													class="flex h-8 w-8 items-center justify-center rounded border border-yellow-300 bg-yellow-100 text-yellow-700 transition-colors hover:bg-yellow-200"
													data-testid={`stop-timer-${timer.id}`}
													disabled={!props.onStopTimer}
													onClick={() => props.onStopTimer?.(timer.id)}
													title="Stop"
													type="button">
													||
												</Button>
											}
											when={!timer.isActive}>
											<Button
												class="flex h-8 w-8 items-center justify-center rounded border border-green-300 bg-green-100 text-green-700 transition-colors hover:bg-green-200"
												data-testid={`start-timer-${timer.id}`}
												disabled={!props.onStartTimer}
												onClick={() => props.onStartTimer?.(timer.id)}
												title="Start"
												type="button">
												{">"}
											</Button>
										</Show>
										<Button
											class="flex h-8 w-8 items-center justify-center rounded border border-red-300 bg-red-100 text-red-600 transition-colors hover:bg-red-200"
											data-testid={`delete-timer-${timer.id}`}
											disabled={!props.onDeleteTimer}
											onClick={() => props.onDeleteTimer?.(timer.id)}
											title="Delete"
											type="button">
											x
										</Button>
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
						<Button
							class="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-gray-300 border-dashed py-3 text-gray-500 transition-colors hover:border-orange-400 hover:bg-orange-50 hover:text-orange-600"
							data-testid="add-timer-button"
							onClick={() => setShowAddForm(true)}
							type="button">
							<span class="text-xl">+</span>
							<span>Add Timer</span>
						</Button>
					}
					when={showAddForm()}>
					<div class="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
						<div>
							<label class="mb-1 block font-medium text-gray-700 text-sm">
								Timer Label
								<Input
									class="mt-1 w-full"
									data-testid="new-timer-label"
									onInput={(e) => setNewTimerLabel(e.currentTarget.value)}
									placeholder="e.g., Social Links, Discord, etc."
									type="text"
									value={newTimerLabel()}
								/>
							</label>
						</div>
						<div>
							<label class="mb-1 block font-medium text-gray-700 text-sm">
								Message Content *
								<Textarea
									class="mt-1 w-full"
									data-testid="new-timer-content"
									onInput={(e) => setNewTimerContent(e.currentTarget.value)}
									placeholder="Message to send at each interval..."
									rows="2"
									value={newTimerContent()}
								/>
							</label>
						</div>
						<div>
							<label class="mb-1 block font-medium text-gray-700 text-sm">
								Interval (minutes)
								<Input
									class="mt-1 w-full"
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
							<Button
								data-testid="confirm-add-timer"
								disabled={!props.onAddTimer || !newTimerContent().trim()}
								onClick={handleAddTimer}
								type="button"
								variant="primary">
								Add Timer
							</Button>
							<Button
								data-testid="cancel-add-timer"
								onClick={() => setShowAddForm(false)}
								type="button"
								variant="secondary">
								Cancel
							</Button>
						</div>
					</div>
				</Show>
			</div>
		</div>
	);
}

// =====================================================
// Timer Action Callbacks
// =====================================================
export interface TimerActionCallbacks {
	onAddTimer?: (
		label: string,
		content: string,
		intervalMinutes: number,
	) => void;
	onStartTimer?: (timerId: string) => void;
	onStopTimer?: (timerId: string) => void;
	onDeleteTimer?: (timerId: string) => void;
}

// =====================================================
// Live Stream Control Center Component
// =====================================================
interface LiveStreamControlCenterProps
	extends StreamActionCallbacks,
		TimerActionCallbacks {
	activities: ActivityItem[];
	streamDuration: number; // in seconds
	viewerCount: number;
	stickyDuration?: number; // how long important events stay sticky (ms)
	connectedPlatforms?: Platform[]; // platforms the user is connected to
	onSendMessage?: (message: string, platforms: Platform[]) => void;
	moderationCallbacks?: ModerationCallbacks;
	timers?: StreamTimer[];
	// Stream settings
	metadata?: StreamMetadata;
}

// All available activity types for filtering
const ALL_ACTIVITY_TYPES: ActivityType[] = [
	"chat",
	"donation",
	"follow",
	"subscription",
	"raid",
	"cheer",
];

// Labels for activity types in filter UI
const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
	chat: "Chat",
	donation: "Donations",
	follow: "Follows",
	subscription: "Subs",
	raid: "Raids",
	cheer: "Cheers",
};

export function LiveStreamControlCenter(props: LiveStreamControlCenterProps) {
	const [chatMessage, setChatMessage] = createSignal("");
	const [selectedPlatforms, setSelectedPlatforms] = createSignal<Set<Platform>>(
		new Set(props.connectedPlatforms || AVAILABLE_PLATFORMS),
	);
	const [showPlatformPicker, setShowPlatformPicker] = createSignal(false);
	const [stickyItemIds, setStickyItemIds] = createSignal<Set<string>>(
		new Set(),
	);
	const [shouldAutoScroll, setShouldAutoScroll] = createSignal(true);
	// Filter state
	const [selectedTypeFilters, setSelectedTypeFilters] = createSignal<
		Set<ActivityType>
	>(new Set(ALL_ACTIVITY_TYPES));
	const [searchText, setSearchText] = createSignal("");
	const [showFilters, setShowFilters] = createSignal(false);
	const [viewMode, setViewMode] = createSignal<LiveViewMode>("events");
	// Filter chips state - stores completed filter chips
	const [filterChips, setFilterChips] = createSignal<
		Array<{ type: "user" | "message" | "platform"; value: string }>
	>([]);
	// Current input text (excluding completed chips)
	const [inputText, setInputText] = createSignal("");
	// Track if we're currently editing a filter prefix
	const [editingPrefix, setEditingPrefix] = createSignal<
		"user:" | "message:" | "platform:" | null
	>(null);
	let scrollContainerRef: HTMLDivElement | undefined;
	let filterPanelRef: HTMLDivElement | undefined;
	let searchInputRef: HTMLInputElement | undefined;

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

	// Check if poll form is valid (has question and at least 2 options)
	const isPollFormValid = createMemo(() => {
		const values = pollFormValues();
		return (
			values.question.trim().length > 0 &&
			values.option1.trim().length > 0 &&
			values.option2.trim().length > 0
		);
	});

	// Check if giveaway form is valid (has title)
	const isGiveawayFormValid = createMemo(() => {
		const values = giveawayFormValues();
		return values.title.trim().length > 0;
	});

	// Handle starting a poll
	const handleStartPoll = () => {
		if (isPollFormValid() && props.onStartPoll) {
			props.onStartPoll(pollFormValues());
			// Reset form and go back to actions
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

	// Handle starting a giveaway
	const handleStartGiveaway = () => {
		if (isGiveawayFormValid() && props.onStartGiveaway) {
			props.onStartGiveaway(giveawayFormValues());
			// Reset form and go back to actions
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

	// Stream settings form state and handlers
	const { t } = useTranslation();
	const [tagInput, setTagInput] = createSignal("");
	const [settingsFormValues, setSettingsFormValues] =
		createSignal<StreamSettingsValues>({
			title: props.metadata?.title || "",
			description: props.metadata?.description || "",
			category:
				(props.metadata?.category as StreamSettingsValues["category"]) ||
				"Gaming",
			thumbnailFileId: props.metadata?.thumbnailFileId || null,
		});
	const [settingsTags, setSettingsTags] = createSignal<string[]>(
		props.metadata?.tags || [],
	);
	const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = createSignal<
		string | null
	>(props.metadata?.thumbnail || null);
	const [isSavingSettings, setIsSavingSettings] = createSignal(false);

	// Sync settings form with props.metadata when it changes
	createEffect(() => {
		if (props.metadata) {
			setSettingsFormValues({
				title: props.metadata.title || "",
				description: props.metadata.description || "",
				category:
					(props.metadata.category as StreamSettingsValues["category"]) ||
					"Gaming",
				thumbnailFileId: props.metadata.thumbnailFileId || null,
			});
			setSettingsTags(props.metadata.tags || []);
			setThumbnailPreviewUrl(props.metadata.thumbnail || null);
		}
	});

	const addTag = () => {
		const tag = tagInput().trim();
		if (tag && !settingsTags().includes(tag)) {
			setSettingsTags([...settingsTags(), tag]);
			setTagInput("");
		}
	};

	const removeTag = (tagToRemove: string) => {
		setSettingsTags(settingsTags().filter((t) => t !== tagToRemove));
	};

	const handleSaveSettings = () => {
		if (props.onSaveStreamSettings) {
			setIsSavingSettings(true);
			const metadata: StreamMetadata = {
				title: settingsFormValues().title,
				description: settingsFormValues().description,
				category: settingsFormValues().category,
				tags: settingsTags(),
				thumbnail: thumbnailPreviewUrl() || undefined,
				thumbnailFileId: settingsFormValues().thumbnailFileId,
			};
			props.onSaveStreamSettings(metadata);
			// Simulate save delay for UX feedback
			setTimeout(() => {
				setIsSavingSettings(false);
				setViewMode("actions");
			}, 500);
		}
	};

	// Image upload configuration for thumbnail field
	// The upload handler should be provided via props.onThumbnailUpload
	// For now, we create a mock handler that simulates the upload process
	const thumbnailImageFieldConfig: ImageFieldConfig = {
		onUpload: async (file: File) => {
			// If the parent provides an upload handler, use it
			if (props.onThumbnailUpload) {
				return props.onThumbnailUpload(file);
			}
			// Otherwise, create a local preview (for demo/storybook purposes)
			const previewUrl = URL.createObjectURL(file);
			// Generate a mock file ID for demo purposes
			const mockFileId = `mock-${Date.now()}-${file.name}`;
			return { fileId: mockFileId, previewUrl };
		},
		previewUrl: thumbnailPreviewUrl(),
		onPreviewChange: (url) => setThumbnailPreviewUrl(url),
		maxSize: 2 * 1024 * 1024, // 2MB limit for thumbnails
	};

	// Get available platforms (either from props or default to all)
	const availablePlatforms = createMemo(
		() => props.connectedPlatforms || [...AVAILABLE_PLATFORMS],
	);

	// Parse smart filters from search text (memoized to avoid re-parsing per item)
	const parsedSearchFilters = createMemo(() => parseSmartFilters(searchText()));

	// Filter activities by type and search text (with smart filter support)
	const matchesFilters = (
		item: ActivityItem,
		filters: ParsedFilters,
	): boolean => {
		// Check type filter
		if (!selectedTypeFilters().has(item.type)) {
			return false;
		}

		// Check text search with smart filter support
		const hasAnyFilter =
			filters.user.length > 0 ||
			filters.message.length > 0 ||
			filters.platform.length > 0 ||
			filters.freeText.length > 0;

		if (hasAnyFilter) {
			// Check user filters (any user filter must match)
			if (filters.user.length > 0) {
				const usernameMatch = filters.user.some((u) =>
					item.username.toLowerCase().includes(u),
				);
				if (!usernameMatch) return false;
			}

			// Check message filters (any message filter must match)
			if (filters.message.length > 0) {
				const messageMatch = filters.message.some(
					(m) => item.message?.toLowerCase().includes(m) ?? false,
				);
				if (!messageMatch) return false;
			}

			// Check platform filters (any platform filter must match)
			if (filters.platform.length > 0) {
				const platformMatch = filters.platform.some((p) =>
					item.platform.toLowerCase().includes(p),
				);
				if (!platformMatch) return false;
			}

			// Check free text (searches both username and message)
			if (filters.freeText.length > 0) {
				const freeTextMatch = filters.freeText.some((text) => {
					const lowerText = text.toLowerCase();
					const usernameMatch = item.username.toLowerCase().includes(lowerText);
					const messageMatch =
						item.message?.toLowerCase().includes(lowerText) ?? false;
					return usernameMatch || messageMatch;
				});
				if (!freeTextMatch) return false;
			}
		}

		return true;
	};

	// Sort activities chronologically (oldest first, newest at bottom)
	// With flex-direction: column-reverse, the container naturally anchors to bottom
	// Items are sorted oldest-first so newest appear at visual bottom
	const sortedActivities = createMemo(() => {
		const filters = parsedSearchFilters();
		const filtered = props.activities.filter((item) =>
			matchesFilters(item, filters),
		);
		const sorted = filtered.sort((a, b) => {
			const timeA =
				a.timestamp instanceof Date
					? a.timestamp.getTime()
					: new Date(a.timestamp).getTime();
			const timeB =
				b.timestamp instanceof Date
					? b.timestamp.getTime()
					: new Date(b.timestamp).getTime();
			return timeA - timeB; // Ascending order: oldest first
		});
		// Limit to MAX_ACTIVITIES for performance
		return sorted.slice(-MAX_ACTIVITIES);
	});

	// Check if filters are active (not showing all)
	const hasActiveFilters = createMemo(() => {
		const allTypesSelected =
			selectedTypeFilters().size === ALL_ACTIVITY_TYPES.length;
		const hasSearchText = searchText().trim().length > 0;
		return !allTypesSelected || hasSearchText;
	});

	// Format active smart filters for display
	const formatActiveFilters = createMemo(() => {
		const filters = parsedSearchFilters();
		const parts: string[] = [];

		if (filters.user.length > 0) {
			parts.push(`user: ${filters.user.join(", ")}`);
		}
		if (filters.message.length > 0) {
			parts.push(`message: ${filters.message.join(", ")}`);
		}
		if (filters.platform.length > 0) {
			parts.push(`platform: ${filters.platform.join(", ")}`);
		}
		if (filters.freeText.length > 0) {
			parts.push(`"${filters.freeText.join(", ")}"`);
		}

		return parts.join(" + ");
	});

	// Toggle a type filter
	const toggleTypeFilter = (type: ActivityType) => {
		setSelectedTypeFilters((current) => {
			const newSet = new Set(current);
			if (newSet.has(type)) {
				// Don't allow deselecting all types
				if (newSet.size > 1) {
					newSet.delete(type);
				}
			} else {
				newSet.add(type);
			}
			return newSet;
		});
	};

	// Select all types
	const selectAllTypes = () => {
		setSelectedTypeFilters(new Set(ALL_ACTIVITY_TYPES));
	};

	// Clear all filters
	const clearFilters = () => {
		setSelectedTypeFilters(new Set(ALL_ACTIVITY_TYPES));
		setFilterChips([]);
		setInputText("");
		setEditingPrefix(null);
	};

	// Toggle a user filter - add chip if not present, remove if present
	const toggleUserFilter = (username: string) => {
		const existingIndex = filterChips().findIndex(
			(c) =>
				c.type === "user" && c.value.toLowerCase() === username.toLowerCase(),
		);
		if (existingIndex >= 0) {
			// Remove the existing chip
			removeChip(existingIndex);
		} else {
			// Add a new chip
			setFilterChips((chips) => [...chips, { type: "user", value: username }]);
		}
	};

	// Track sticky items based on time (max 3 most recent, 2 minute default duration)
	const MAX_STICKY_ITEMS = 3;

	// Compute sticky items as a memo that updates when activities change
	// This runs immediately on mount and whenever activities change
	const computeStickyItems = () => {
		const duration = props.stickyDuration || 120000; // 2 minutes default
		const now = Date.now();

		// Find important items that are within the sticky duration
		const stickyItems: { id: string; time: number }[] = [];
		for (const item of props.activities) {
			if (isImportantEvent(item.type) && item.isImportant !== false) {
				const itemTime =
					item.timestamp instanceof Date
						? item.timestamp.getTime()
						: new Date(item.timestamp).getTime();
				if (now - itemTime < duration) {
					stickyItems.push({ id: item.id, time: itemTime });
				}
			}
		}
		// Sort by time descending (most recent first) and take top 3
		stickyItems.sort((a, b) => b.time - a.time);
		return new Set(stickyItems.slice(0, MAX_STICKY_ITEMS).map((s) => s.id));
	};

	// Update sticky items from current activities
	const updateStickyItems = () => setStickyItemIds(computeStickyItems());

	// Run on mount to set initial sticky items
	onMount(updateStickyItems);

	// Re-compute sticky items when activities change (debounced to avoid excessive computation)
	// Note: debounce() auto-registers cleanup when called within a reactive owner
	const debouncedUpdate = debounce(updateStickyItems, 100);
	createEffect(() => {
		props.activities; // Track activities
		debouncedUpdate();
	});

	// Periodic refresh to remove expired sticky items (based on stickyDuration)
	onMount(() => {
		const interval = setInterval(updateStickyItems, 10000);
		onCleanup(() => clearInterval(interval));
	});

	// Click outside handler for filter panel
	onMount(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				showFilters() &&
				filterPanelRef &&
				!filterPanelRef.contains(e.target as Node)
			) {
				setShowFilters(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		onCleanup(() =>
			document.removeEventListener("mousedown", handleClickOutside),
		);
	});

	// Combine filter chips and input text into searchText for filtering
	createEffect(() => {
		const chips = filterChips();
		const text = inputText();
		const prefix = editingPrefix();

		// Build search query from chips
		const chipParts = chips.map((chip) => `${chip.type}:${chip.value}`);
		// Add current input (might include an incomplete filter prefix)
		const allParts = [...chipParts];
		if (prefix && text) {
			allParts.push(`${prefix}${text}`);
		} else if (text) {
			// When there are chips, text without a prefix should filter message content
			// (prevents the text from being parsed as extending the previous chip's value)
			// When there are no chips, keep it as freeText to search both username and message
			if (chips.length > 0) {
				allParts.push(`message:${text}`);
			} else {
				allParts.push(text);
			}
		}

		setSearchText(allParts.join(" "));
	});

	// Refocus input when editingPrefix changes (input element switches between modes)
	createEffect(() => {
		// Track the editingPrefix value to trigger effect on change
		editingPrefix();
		// Use queueMicrotask to ensure the new input element is mounted
		queueMicrotask(() => {
			if (searchInputRef) {
				searchInputRef.focus();
			}
		});
	});

	// Handle input changes - detect filter prefixes
	const handleInputChange = (value: string) => {
		// If we're already editing a prefix, just update the input text
		// (don't re-process for prefixes)
		if (editingPrefix()) {
			setInputText(value);
			return;
		}

		const prefixes = ["user:", "message:", "platform:"] as const;

		// Check if input starts with a prefix
		for (const prefix of prefixes) {
			if (value.toLowerCase().startsWith(prefix)) {
				setEditingPrefix(prefix);
				setInputText(value.slice(prefix.length));
				return;
			}
		}

		// No prefix - just free text
		setInputText(value);
	};

	// Handle keydown in search input
	const handleSearchKeyDown = (e: KeyboardEvent) => {
		const prefix = editingPrefix();
		const text = inputText().trim();

		if (e.key === "Enter" && prefix && text) {
			// Create a chip from the current filter
			e.preventDefault();
			const type = prefix.replace(":", "") as "user" | "message" | "platform";
			setFilterChips((chips) => [...chips, { type, value: text }]);
			setInputText("");
			setEditingPrefix(null);
		} else if (e.key === "Escape" && prefix) {
			// Cancel the current filter prefix
			e.preventDefault();
			setInputText("");
			setEditingPrefix(null);
		} else if (
			e.key === "Backspace" &&
			!prefix &&
			!inputText() &&
			filterChips().length > 0
		) {
			// Remove the last chip when backspacing on empty input
			e.preventDefault();
			setFilterChips((chips) => chips.slice(0, -1));
		}
	};

	// Remove a specific chip
	const removeChip = (index: number) => {
		setFilterChips((chips) => chips.filter((_, i) => i !== index));
	};

	// Create a map of sticky item id -> index for stacking offset calculation
	// Items are ordered by time (oldest first) to maintain visual consistency
	// Highlighted messages always come first (index 0), then sticky items
	const stickyIndexMap = createMemo(() => {
		const ids = stickyItemIds();
		const highlightedId = props.moderationCallbacks?.highlightedMessageId;

		// If nothing is sticky and nothing is highlighted, return empty map
		if (ids.size === 0 && !highlightedId) return new Map<string, number>();

		// Get sticky items sorted by timestamp (oldest first for consistent stacking)
		const stickyItems = sortedActivities()
			.filter((item) => ids.has(item.id))
			.sort((a, b) => {
				const timeA =
					a.timestamp instanceof Date
						? a.timestamp.getTime()
						: new Date(a.timestamp).getTime();
				const timeB =
					b.timestamp instanceof Date
						? b.timestamp.getTime()
						: new Date(b.timestamp).getTime();
				return timeA - timeB;
			});

		const indexMap = new Map<string, number>();

		// Highlighted message always gets index 0 if present
		let startIndex = 0;
		if (highlightedId) {
			indexMap.set(highlightedId, 0);
			startIndex = 1;
		}

		// Filter out highlighted item from sticky items to avoid index gaps
		// (a highlighted donation would otherwise leave a gap in indices)
		const nonHighlightedStickyItems = stickyItems.filter(
			(item) => item.id !== highlightedId,
		);
		nonHighlightedStickyItems.forEach((item, index) => {
			indexMap.set(item.id, index + startIndex);
		});
		return indexMap;
	});

	// Auto-scroll to bottom when new activities arrive (if user hasn't scrolled up)
	createEffect(() => {
		// Track activities to trigger effect on changes
		const activities = sortedActivities();
		if (shouldAutoScroll() && scrollContainerRef && activities.length > 0) {
			// Use requestAnimationFrame to ensure DOM is updated
			requestAnimationFrame(() => {
				if (scrollContainerRef) {
					scrollContainerRef.scrollTop = scrollContainerRef.scrollHeight;
				}
			});
		}
	});

	// Handle scroll to detect if user has scrolled up (disable auto-scroll)
	const handleScroll = () => {
		if (!scrollContainerRef) return;
		const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef;
		// If user is near bottom (within 100px), enable auto-scroll
		const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
		setShouldAutoScroll(isNearBottom);
	};

	// Toggle platform selection
	const togglePlatform = (platform: Platform) => {
		setSelectedPlatforms((current) => {
			const newSet = new Set(current);
			if (newSet.has(platform)) {
				// Don't allow deselecting all platforms
				if (newSet.size > 1) {
					newSet.delete(platform);
				}
			} else {
				newSet.add(platform);
			}
			return newSet;
		});
	};

	// Select all platforms
	const selectAllPlatforms = () => {
		setSelectedPlatforms(new Set(availablePlatforms()));
	};

	// Send message handler
	const handleSendMessage = () => {
		const message = chatMessage().trim();
		if (message && props.onSendMessage) {
			props.onSendMessage(message, [...selectedPlatforms()]);
			setChatMessage("");
		}
	};

	// Handle key press in chat input
	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	// Get platform selection summary text
	const platformSummary = createMemo(() => {
		const selected = selectedPlatforms();
		const available = availablePlatforms();
		if (selected.size === available.length) {
			return "All";
		}
		if (selected.size === 1) {
			const platform = [...selected][0];
			return platform.charAt(0).toUpperCase() + platform.slice(1);
		}
		return `${selected.size} platforms`;
	});

	return (
		<div class="flex h-full flex-col">
			{/* Header with live stats - Fixed at top */}
			<div class="shrink-0 border-gray-200 border-b pb-4">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-4">
						<Badge variant="success">
							<span class="mr-2 animate-pulse">[*]</span> LIVE
						</Badge>
						<div class="text-gray-600 text-sm">
							<span class="font-medium">
								{formatDuration(props.streamDuration)}
							</span>
						</div>
					</div>
					<div class="flex items-center gap-4">
						{/* View Mode Toggle */}
						<div class="flex rounded-lg border border-gray-200 bg-gray-100 p-0.5">
							<Button
								class={`flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-all ${
									viewMode() === "events"
										? "bg-white font-medium text-gray-900 shadow-sm"
										: "text-gray-500 hover:text-gray-700"
								}`}
								data-testid="view-mode-events"
								onClick={() => setViewMode("events")}
								type="button">
								<span>[#]</span>
								<span>Events</span>
							</Button>
							<Button
								class={`flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-all ${
									viewMode() === "actions"
										? "bg-white font-medium text-gray-900 shadow-sm"
										: "text-gray-500 hover:text-gray-700"
								}`}
								data-testid="view-mode-actions"
								onClick={() => setViewMode("actions")}
								type="button">
								<span>[&gt;]</span>
								<span>Actions</span>
							</Button>
						</div>
						<div class="text-center">
							<div class="font-bold text-purple-600 text-xl">
								{props.viewerCount}
							</div>
							<div class="text-gray-500 text-xs">Viewers</div>
						</div>
					</div>
				</div>
			</div>

			{/* Events View - Filter Controls, Activity Feed, Chat Input */}
			<Show when={viewMode() === "events"}>
				{/* Filter Controls */}
				<div class="relative shrink-0 border-gray-200 border-b py-2">
					{/* Filter toggle button and search */}
					<div class="flex items-center gap-2">
						<Button
							class={`flex items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors ${
								hasActiveFilters()
									? "bg-purple-100 text-purple-700"
									: "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
							}`}
							data-testid="filter-toggle"
							onClick={() => setShowFilters(!showFilters())}
							type="button">
							<span>[=]</span>
							<span>Filter</span>
							<Show when={hasActiveFilters()}>
								<span class="ml-0.5 rounded-full bg-purple-600 px-1.5 text-[10px] text-white">
									{ALL_ACTIVITY_TYPES.length -
										selectedTypeFilters().size +
										(searchText().trim() ? 1 : 0)}
								</span>
							</Show>
							<span class="text-[10px]">{showFilters() ? "^" : "v"}</span>
						</Button>

						{/* Quick search input with chips - always visible */}
						{/* biome-ignore lint/a11y/useKeyWithClickEvents: focus delegation to input */}
						{/* biome-ignore lint/a11y/noStaticElementInteractions: focus delegation to input */}
						<div
							class="relative flex flex-1 flex-wrap items-center gap-1 rounded border border-gray-200 bg-gray-50 px-2 py-1 focus-within:border-purple-300 focus-within:bg-white"
							onClick={() => searchInputRef?.focus()}>
							{/* Render filter chips */}
							<For each={filterChips()}>
								{(chip, index) => (
									<span
										class={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs ${
											chip.type === "user"
												? "bg-blue-100 text-blue-700"
												: chip.type === "platform"
													? "bg-purple-100 text-purple-700"
													: "bg-green-100 text-green-700"
										}`}
										data-testid={`filter-chip-${chip.type}`}>
										<span class="font-medium">{chip.type}:</span>
										<span>{chip.value}</span>
										<Button
											aria-label={`Remove ${chip.type} filter`}
											class="ml-0.5 rounded-full hover:bg-black/10"
											data-testid={`remove-chip-${index()}`}
											onClick={(e) => {
												e.stopPropagation();
												removeChip(index());
											}}
											type="button">
											×
										</Button>
									</span>
								)}
							</For>
							{/* Show editing prefix as partial chip with input inside */}
							<Show
								fallback={
									<Input
										class="min-w-[100px] flex-1 border-none bg-transparent text-xs outline-none placeholder:text-gray-400"
										data-testid="search-input"
										onInput={(e) => handleInputChange(e.currentTarget.value)}
										onKeyDown={handleSearchKeyDown}
										placeholder={
											filterChips().length > 0
												? ""
												: "Search or type user: platform: message:"
										}
										ref={searchInputRef}
										type="text"
										value={inputText()}
									/>
								}
								when={editingPrefix()}>
								<span
									class={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
										editingPrefix() === "user:"
											? "bg-blue-100 text-blue-700"
											: editingPrefix() === "platform:"
												? "bg-purple-100 text-purple-700"
												: "bg-green-100 text-green-700"
									}`}>
									<span class="font-medium">{editingPrefix()}</span>
									<Input
										class="ml-0.5 w-auto min-w-[60px] border-none bg-transparent text-xs outline-none"
										data-testid="search-input"
										onInput={(e) => handleInputChange(e.currentTarget.value)}
										onKeyDown={handleSearchKeyDown}
										ref={searchInputRef}
										style={{
											width: `${Math.max(60, inputText().length * 8)}px`,
										}}
										type="text"
										value={inputText()}
									/>
								</span>
							</Show>
							<Show when={searchText()}>
								<Button
									class="text-gray-400 text-xs hover:text-gray-600"
									data-testid="clear-search"
									onClick={() => {
										setFilterChips([]);
										setInputText("");
										setEditingPrefix(null);
									}}
									type="button">
									×
								</Button>
							</Show>
						</div>
					</div>

					{/* Expandable filter panel - absolute positioned to prevent layout shift */}
					<Show when={showFilters()}>
						<div
							class="absolute top-full right-0 left-0 z-20 mt-1 rounded-lg border border-gray-200 bg-white p-2 shadow-lg"
							ref={filterPanelRef}>
							<div class="mb-1.5 flex items-center justify-between">
								<span class="font-medium text-gray-600 text-xs">
									Event Types
								</span>
								<div class="flex gap-2">
									<Button
										class="text-purple-600 text-xs hover:text-purple-700"
										data-testid="select-all-types"
										onClick={selectAllTypes}
										type="button">
										All
									</Button>
									<Show when={hasActiveFilters()}>
										<Button
											class="text-gray-500 text-xs hover:text-gray-700"
											data-testid="clear-filters"
											onClick={clearFilters}
											type="button">
											Clear
										</Button>
									</Show>
								</div>
							</div>
							<div class="flex flex-wrap gap-1">
								<For each={ALL_ACTIVITY_TYPES}>
									{(type) => (
										<Button
											class={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-all ${
												selectedTypeFilters().has(type)
													? `${getEventColor(type)} bg-gray-800`
													: "bg-gray-200 text-gray-500 hover:bg-gray-300"
											}`}
											data-testid={`filter-type-${type}`}
											onClick={() => toggleTypeFilter(type)}
											type="button">
											<span>{getEventIcon(type) || "..."}</span>
											<span>{ACTIVITY_TYPE_LABELS[type]}</span>
										</Button>
									)}
								</For>
							</div>
						</div>
					</Show>

					{/* Active filter indicator */}
					<Show when={hasActiveFilters() && !showFilters()}>
						<div class="mt-1.5 flex items-center gap-1 text-gray-500 text-xs">
							<span>Showing:</span>
							<Show
								when={selectedTypeFilters().size < ALL_ACTIVITY_TYPES.length}>
								<span class="font-medium text-gray-700">
									{[...selectedTypeFilters()]
										.map((t) => ACTIVITY_TYPE_LABELS[t])
										.join(", ")}
								</span>
							</Show>
							<Show
								when={
									searchText().trim() &&
									selectedTypeFilters().size === ALL_ACTIVITY_TYPES.length
								}>
								<span class="font-medium text-gray-700">
									matching {formatActiveFilters()}
								</span>
							</Show>
							<Show
								when={
									searchText().trim() &&
									selectedTypeFilters().size < ALL_ACTIVITY_TYPES.length
								}>
								<span class="text-gray-400">•</span>
								<span class="font-medium text-gray-700">
									matching {formatActiveFilters()}
								</span>
							</Show>
							<span class="text-gray-400">
								({sortedActivities().length} events)
							</span>
						</div>
					</Show>
				</div>

				{/* Activity Feed - Scrollable with inline sticky items */}
				{/* Uses normal flex-col (not reversed) to allow CSS sticky to work */}
				<div
					class="min-h-0 flex-1 overflow-y-auto"
					onScroll={handleScroll}
					ref={scrollContainerRef}>
					<Show
						fallback={
							<div class="flex h-full items-center justify-center text-gray-400">
								<div class="text-center">
									<Show
										fallback={
											<>
												<div class="mb-2 text-3xl">[chat]</div>
												<div>Waiting for activity...</div>
											</>
										}
										when={hasActiveFilters()}>
										<div class="mb-2 text-3xl">[?]</div>
										<div>No events match your filters</div>
										<Button
											class="mt-2 text-purple-600 text-sm hover:text-purple-700"
											data-testid="clear-filters-empty"
											onClick={clearFilters}
											type="button">
											Clear filters
										</Button>
									</Show>
								</div>
							</div>
						}
						when={sortedActivities().length > 0}>
						{/* Activity items - sorted oldest first, newest at bottom */}
						<For each={sortedActivities()}>
							{(item) => {
								// Use reactive getters so sticky state updates when stickyItemIds changes
								const isSticky = () => stickyItemIds().has(item.id);
								// Get stickyIndex for both sticky items and highlighted items
								const stickyIndex = () => stickyIndexMap().get(item.id);
								return (
									<ActivityRow
										isSticky={isSticky()}
										item={item}
										moderationCallbacks={props.moderationCallbacks}
										onToggleUserFilter={toggleUserFilter}
										stickyIndex={stickyIndex()}
									/>
								);
							}}
						</For>
					</Show>
				</div>

				{/* Chat Input - Fixed at bottom */}
				<div class="shrink-0 border-gray-200 border-t pt-3">
					{/* Platform Picker */}
					<div class="relative mb-2">
						<Button
							class="flex items-center gap-1.5 text-gray-500 text-xs transition-colors hover:text-gray-700"
							onClick={() => setShowPlatformPicker(!showPlatformPicker())}
							type="button">
							<span>Send to:</span>
							<span class="font-medium text-gray-700">{platformSummary()}</span>
							<span class="text-[10px]">
								{showPlatformPicker() ? "^" : "v"}
							</span>
						</Button>

						{/* Platform Selection Dropdown */}
						<Show when={showPlatformPicker()}>
							<div class="absolute bottom-full left-0 z-10 mb-1 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
								<div class="mb-2 flex items-center justify-between">
									<span class="font-medium text-gray-700 text-xs">
										Select platforms
									</span>
									<Button
										class="text-purple-600 text-xs hover:text-purple-700"
										onClick={selectAllPlatforms}
										type="button">
										Select all
									</Button>
								</div>
								<div class="flex flex-wrap gap-1.5">
									<For each={availablePlatforms()}>
										{(platform) => (
											<Button
												class={`flex items-center gap-1 rounded-full px-2 py-1 text-xs transition-all ${
													selectedPlatforms().has(platform)
														? "bg-gray-800 text-white"
														: "bg-gray-100 text-gray-600 hover:bg-gray-200"
												}`}
												onClick={() => togglePlatform(platform)}
												type="button">
												<PlatformIcon
													class="h-4 w-4"
													platform={platform}
													size="sm"
												/>
												<span class="capitalize">{platform}</span>
											</Button>
										)}
									</For>
								</div>
							</div>
						</Show>
					</div>

					{/* Message Input */}
					<div class="flex gap-2">
						<Input
							class="flex-1"
							onInput={(e) => setChatMessage(e.currentTarget.value)}
							onKeyDown={handleKeyDown}
							placeholder="Send a message to chat..."
							type="text"
							value={chatMessage()}
						/>
						<Button
							disabled={!chatMessage().trim()}
							onClick={handleSendMessage}
							type="button"
							variant="primary">
							Send
						</Button>
					</div>
				</div>
			</Show>

			{/* Actions View - Stream Actions Panel */}
			<Show when={viewMode() === "actions"}>
				<div class="min-h-0 flex-1 overflow-y-auto py-4">
					<StreamActionsPanel
						onChangeStreamSettings={props.onChangeStreamSettings}
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
						<Button
							class="flex items-center gap-1 rounded-lg px-2 py-1 text-gray-500 text-sm transition-colors hover:bg-gray-100 hover:text-gray-700"
							data-testid="back-to-actions"
							onClick={() => setViewMode("actions")}
							type="button">
							<span>&lt;</span>
							<span>Back to Actions</span>
						</Button>
					</div>
					<div class="mb-4">
						<h3 class="font-semibold text-gray-900 text-lg">Create Poll</h3>
						<p class="text-gray-500 text-sm">
							Set up an interactive poll for your viewers
						</p>
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
						<Button
							data-testid="cancel-poll"
							onClick={() => setViewMode("actions")}
							type="button"
							variant="secondary">
							Cancel
						</Button>
						<Button
							data-testid="start-poll-button"
							disabled={!isPollFormValid()}
							onClick={handleStartPoll}
							type="button"
							variant="primary">
							Start Poll
						</Button>
					</div>
				</div>
			</Show>

			{/* Giveaway Creation View */}
			<Show when={viewMode() === "giveaway"}>
				<div class="flex min-h-0 flex-1 flex-col overflow-y-auto py-4">
					<div class="mb-4 flex items-center gap-2">
						<Button
							class="flex items-center gap-1 rounded-lg px-2 py-1 text-gray-500 text-sm transition-colors hover:bg-gray-100 hover:text-gray-700"
							data-testid="back-to-actions-giveaway"
							onClick={() => setViewMode("actions")}
							type="button">
							<span>&lt;</span>
							<span>Back to Actions</span>
						</Button>
					</div>
					<div class="mb-4">
						<h3 class="font-semibold text-gray-900 text-lg">Create Giveaway</h3>
						<p class="text-gray-500 text-sm">
							Set up a giveaway for your audience
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
					<div class="mt-4 flex justify-end gap-2 border-gray-200 border-t pt-4">
						<Button
							data-testid="cancel-giveaway"
							onClick={() => setViewMode("actions")}
							type="button"
							variant="secondary">
							Cancel
						</Button>
						<Button
							data-testid="start-giveaway-button"
							disabled={!isGiveawayFormValid()}
							onClick={handleStartGiveaway}
							type="button"
							variant="primary">
							Start Giveaway
						</Button>
					</div>
				</div>
			</Show>

			{/* Timers View - Timers Panel */}
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

			{/* Stream Settings View */}
			<Show when={viewMode() === "settings"}>
				<div class="flex min-h-0 flex-1 flex-col overflow-y-auto py-4">
					<div class="mb-4 flex items-center gap-2">
						<Button
							class="flex items-center gap-1 rounded-lg px-2 py-1 text-gray-500 text-sm transition-colors hover:bg-gray-100 hover:text-gray-700"
							data-testid="back-to-actions-settings"
							onClick={() => setViewMode("actions")}
							type="button">
							<span>&lt;</span>
							<span>{t("stream.settings.backToActions")}</span>
						</Button>
					</div>
					<div class="mb-4">
						<h3 class="font-semibold text-gray-900 text-lg">
							{t("stream.settings.title")}
						</h3>
						<p class="text-gray-500 text-sm">
							{t("stream.settings.liveSubtitle")}
						</p>
					</div>
					<div class="flex-1 space-y-4">
						{/* SchemaForm for title, description, category */}
						<SchemaForm
							imageFields={{
								thumbnailFileId: thumbnailImageFieldConfig,
							}}
							meta={getStreamSettingsMeta()}
							onChange={(field, value) => {
								setSettingsFormValues((prev) => ({ ...prev, [field]: value }));
							}}
							schema={streamSettingsSchema}
							t={t}
							values={settingsFormValues()}
						/>

						{/* Tags section (custom, not part of SchemaForm) */}
						<div>
							<label class={text.label}>
								{t("stream.settings.tags")}
								<div class="mt-1 flex gap-2">
									<Input
										data-testid="settings-tag-input"
										onInput={(e) => setTagInput(e.currentTarget.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												e.preventDefault();
												addTag();
											}
										}}
										placeholder={t("stream.addTagPlaceholder")}
										type="text"
										value={tagInput()}
									/>
									<Button
										data-testid="settings-add-tag"
										onClick={addTag}
										type="button"
										variant="secondary">
										{t("stream.settings.addTag")}
									</Button>
								</div>
							</label>
							<p class="mt-1 text-gray-500 text-xs">
								{t("stream.settings.tagsDescription")}
							</p>
							<Show when={settingsTags().length > 0}>
								<div class="mt-2 flex flex-wrap gap-2">
									<For each={settingsTags()}>
										{(tag) => (
											<span class="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-purple-800 text-sm">
												{tag}
												<Button
													class="hover:text-purple-600"
													data-testid={`remove-tag-${tag}`}
													onClick={() => removeTag(tag)}
													type="button">
													x
												</Button>
											</span>
										)}
									</For>
								</div>
							</Show>
						</div>
					</div>
					<div class="mt-4 flex justify-end gap-2 border-gray-200 border-t pt-4">
						<Button
							data-testid="cancel-settings"
							onClick={() => setViewMode("actions")}
							type="button"
							variant="secondary">
							{t("stream.settings.cancel")}
						</Button>
						<Button
							data-testid="save-settings-button"
							disabled={isSavingSettings()}
							onClick={handleSaveSettings}
							type="button"
							variant="primary">
							{isSavingSettings()
								? t("stream.settings.saving")
								: t("stream.settings.save")}
						</Button>
					</div>
				</div>
			</Show>
		</div>
	);
}

// =====================================================
// Post-Stream Summary Component
// =====================================================
interface PostStreamSummaryProps {
	summary: StreamSummary;
	onStartNewStream?: () => void;
}

export function PostStreamSummary(props: PostStreamSummaryProps) {
	const endedAgo = createMemo(() => {
		const ended = props.summary.endedAt;
		const endedDate = ended instanceof Date ? ended : new Date(ended);
		return formatTimeAgo(endedDate.toISOString());
	});

	return (
		<div class="space-y-6">
			{/* Header */}
			<div class="flex items-center justify-between">
				<div>
					<h2 class={text.h2}>Stream Summary</h2>
					<p class={text.muted}>Stream ended {endedAgo()}</p>
				</div>
				<Badge variant="neutral">OFFLINE</Badge>
			</div>

			{/* Summary Stats Grid */}
			<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
				<div class="rounded-lg bg-purple-50 p-4 text-center">
					<div class="font-bold text-2xl text-purple-600">
						{formatDurationShort(props.summary.duration)}
					</div>
					<div class="text-gray-600 text-sm">Duration</div>
				</div>
				<div class="rounded-lg bg-blue-50 p-4 text-center">
					<div class="font-bold text-2xl text-blue-600">
						{props.summary.peakViewers}
					</div>
					<div class="text-gray-600 text-sm">Peak Viewers</div>
				</div>
				<div class="rounded-lg bg-green-50 p-4 text-center">
					<div class="font-bold text-2xl text-green-600">
						{props.summary.averageViewers}
					</div>
					<div class="text-gray-600 text-sm">Avg Viewers</div>
				</div>
				<div class="rounded-lg bg-pink-50 p-4 text-center">
					<div class="font-bold text-2xl text-pink-600">
						{props.summary.totalMessages}
					</div>
					<div class="text-gray-600 text-sm">Messages</div>
				</div>
			</div>

			{/* Engagement Stats */}
			<Card>
				<div class="divide-y divide-gray-100">
					<div class="flex items-center justify-between p-4">
						<div class="flex items-center gap-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
								$
							</div>
							<div>
								<div class="font-medium text-gray-900">Donations</div>
								<div class="text-gray-500 text-sm">
									{props.summary.totalDonations} donations
								</div>
							</div>
						</div>
						<div class="font-bold text-green-600 text-xl">
							${props.summary.donationAmount.toFixed(2)}
						</div>
					</div>

					<div class="flex items-center justify-between p-4">
						<div class="flex items-center gap-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
								+
							</div>
							<div>
								<div class="font-medium text-gray-900">New Followers</div>
								<div class="text-gray-500 text-sm">People who followed</div>
							</div>
						</div>
						<div class="font-bold text-blue-600 text-xl">
							+{props.summary.newFollowers}
						</div>
					</div>

					<div class="flex items-center justify-between p-4">
						<div class="flex items-center gap-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
								*
							</div>
							<div>
								<div class="font-medium text-gray-900">New Subscribers</div>
								<div class="text-gray-500 text-sm">Paid subscriptions</div>
							</div>
						</div>
						<div class="font-bold text-purple-600 text-xl">
							+{props.summary.newSubscribers}
						</div>
					</div>

					<div class="flex items-center justify-between p-4">
						<div class="flex items-center gap-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
								{">"}
							</div>
							<div>
								<div class="font-medium text-gray-900">Raids</div>
								<div class="text-gray-500 text-sm">Incoming raids</div>
							</div>
						</div>
						<div class="font-bold text-orange-600 text-xl">
							{props.summary.raids}
						</div>
					</div>
				</div>
			</Card>

			{/* Actions */}
			<div class="flex justify-center">
				<Button
					onClick={props.onStartNewStream}
					type="button"
					variant="gradient">
					Start New Stream
				</Button>
			</div>
		</div>
	);
}

// =====================================================
// Main Stream Controls Widget Component
// =====================================================
// Export Platform type for external use
export type { Platform };

interface StreamControlsWidgetProps
	extends StreamActionCallbacks,
		TimerActionCallbacks {
	phase: StreamPhase;
	// Pre-stream props
	metadata?: StreamMetadata;
	onMetadataChange?: (metadata: StreamMetadata) => void;
	streamKeyData?: StreamKeyData;
	onShowStreamKey?: () => void;
	showStreamKey?: boolean;
	isLoadingStreamKey?: boolean;
	onCopyStreamKey?: () => void;
	copied?: boolean;
	// Live props
	activities?: ActivityItem[];
	streamDuration?: number;
	viewerCount?: number;
	stickyDuration?: number;
	connectedPlatforms?: Platform[];
	onSendMessage?: (message: string, platforms: Platform[]) => void;
	moderationCallbacks?: ModerationCallbacks;
	timers?: StreamTimer[];
	// Post-stream props
	summary?: StreamSummary;
	onStartNewStream?: () => void;
}

export default function StreamControlsWidget(props: StreamControlsWidgetProps) {
	return (
		<Card class="h-full">
			<Show when={props.phase === "pre-stream"}>
				<PreStreamSettings
					copied={props.copied}
					isLoadingStreamKey={props.isLoadingStreamKey}
					metadata={
						props.metadata || {
							title: "",
							description: "",
							category: "",
							tags: [],
						}
					}
					onCopyStreamKey={props.onCopyStreamKey}
					onMetadataChange={props.onMetadataChange || (() => {})}
					onShowStreamKey={props.onShowStreamKey}
					showStreamKey={props.showStreamKey}
					streamKeyData={props.streamKeyData}
				/>
			</Show>

			<Show when={props.phase === "live"}>
				<LiveStreamControlCenter
					activities={props.activities || []}
					connectedPlatforms={props.connectedPlatforms}
					metadata={props.metadata}
					moderationCallbacks={props.moderationCallbacks}
					onAddTimer={props.onAddTimer}
					onChangeStreamSettings={props.onChangeStreamSettings}
					onDeleteTimer={props.onDeleteTimer}
					onModifyTimers={props.onModifyTimers}
					onSaveStreamSettings={props.onSaveStreamSettings}
					onSendMessage={props.onSendMessage}
					onStartGiveaway={props.onStartGiveaway}
					onStartPoll={props.onStartPoll}
					onStartTimer={props.onStartTimer}
					onStopTimer={props.onStopTimer}
					stickyDuration={props.stickyDuration}
					streamDuration={props.streamDuration || 0}
					timers={props.timers}
					viewerCount={props.viewerCount || 0}
				/>
			</Show>

			<Show when={props.phase === "post-stream"}>
				<PostStreamSummary
					onStartNewStream={props.onStartNewStream}
					summary={
						props.summary || {
							duration: 0,
							peakViewers: 0,
							averageViewers: 0,
							totalMessages: 0,
							totalDonations: 0,
							donationAmount: 0,
							newFollowers: 0,
							newSubscribers: 0,
							raids: 0,
							endedAt: new Date(),
						}
					}
				/>
			</Show>
		</Card>
	);
}
