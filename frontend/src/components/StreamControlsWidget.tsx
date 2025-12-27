import { createEffect, createMemo, createSignal, For, onCleanup, Show } from "solid-js";
import { formatAmount, formatTimeAgo, formatTimestamp } from "~/lib/formatters";
import { badge, button, card, input, text } from "~/styles/design-system";

// Maximum number of activities to keep in memory for performance
const MAX_ACTIVITIES = 200;

// Types for stream metadata
export interface StreamMetadata {
	title: string;
	description: string;
	category: string;
	tags: string[];
	thumbnail?: string;
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

// Platform colors
const PLATFORM_COLORS: Record<string, string> = {
	twitch: "bg-purple-600",
	youtube: "bg-red-600",
	kick: "bg-green-600",
	facebook: "bg-blue-600",
};

const PLATFORM_ICONS: Record<string, string> = {
	twitch: "T",
	youtube: "Y",
	kick: "K",
	facebook: "F",
};

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
		case "chat":
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
		case "chat":
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
				<span class={badge.neutral}>OFFLINE</span>
			</div>

			{/* Stream Metadata Form */}
			<div class="space-y-4">
				{/* Title */}
				<div>
					<label class={text.label}>
						Stream Title
						<input
							type="text"
							class={`${input.text} mt-1`}
							placeholder="Enter your stream title..."
							value={props.metadata.title}
							onInput={(e) =>
								props.onMetadataChange({
									...props.metadata,
									title: e.currentTarget.value,
								})
							}
						/>
					</label>
				</div>

				{/* Description */}
				<div>
					<label class={text.label}>
						Description
						<textarea
							class={`${input.textarea} mt-1`}
							rows="3"
							placeholder="Describe your stream..."
							value={props.metadata.description}
							onInput={(e) =>
								props.onMetadataChange({
									...props.metadata,
									description: e.currentTarget.value,
								})
							}
						/>
					</label>
				</div>

				{/* Category */}
				<div>
					<label class={text.label}>
						Category
						<select
							class={`${input.select} mt-1`}
							value={props.metadata.category}
							onChange={(e) =>
								props.onMetadataChange({
									...props.metadata,
									category: e.currentTarget.value,
								})
							}>
							<option value="">Select a category...</option>
							<For each={STREAM_CATEGORIES}>
								{(cat) => <option value={cat}>{cat}</option>}
							</For>
						</select>
					</label>
				</div>

				{/* Tags */}
				<div>
					<label class={text.label}>Tags</label>
					<div class="mt-1 flex gap-2">
						<input
							type="text"
							class={input.text}
							placeholder="Add a tag..."
							value={tagInput()}
							onInput={(e) => setTagInput(e.currentTarget.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									addTag();
								}
							}}
						/>
						<button type="button" class={button.secondary} onClick={addTag}>
							Add
						</button>
					</div>
					<Show when={props.metadata.tags.length > 0}>
						<div class="mt-2 flex flex-wrap gap-2">
							<For each={props.metadata.tags}>
								{(tag) => (
									<span class="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-purple-800 text-sm">
										{tag}
										<button
											type="button"
											class="hover:text-purple-600"
											onClick={() => removeTag(tag)}>
											x
										</button>
									</span>
								)}
							</For>
						</div>
					</Show>
				</div>

				{/* Thumbnail placeholder */}
				<div>
					<label class={text.label}>Thumbnail</label>
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
						<button
							type="button"
							class={`${button.secondary} mt-3`}
							onClick={props.onShowStreamKey}>
							{props.showStreamKey ? "Hide Stream Key" : "Show Stream Key"}
						</button>
					</div>
				</div>
			</div>

			{/* Stream Key Display */}
			<Show when={props.showStreamKey}>
				<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
					<Show
						when={!props.isLoadingStreamKey}
						fallback={
							<div class="space-y-3">
								<div class="h-4 w-24 animate-pulse rounded bg-gray-200" />
								<div class="h-5 w-full animate-pulse rounded bg-gray-200" />
								<div class="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
							</div>
						}>
						<Show
							when={props.streamKeyData}
							fallback={
								<div class="text-center text-gray-500">
									No stream key available
								</div>
							}>
							{(data) => (
								<>
									<div class="mb-3 flex items-center justify-between">
										<span class="font-medium text-gray-700 text-sm">
											Stream Key
										</span>
										<button
											type="button"
											class={`${button.ghost} text-sm`}
											onClick={props.onCopyStreamKey}>
											{props.copied ? "Copied!" : "Copy Key"}
										</button>
									</div>
									<div class="mb-2">
										<label class="mb-1 block text-gray-500 text-xs">
											RTMP URL
										</label>
										<code class="block rounded bg-white px-2 py-1 font-mono text-gray-900 text-sm">
											{data().rtmpsUrl}
										</code>
									</div>
									<div class="mb-3">
										<label class="mb-1 block text-gray-500 text-xs">
											Stream Key
										</label>
										<code class="block rounded bg-white px-2 py-1 font-mono text-gray-600 text-sm">
											{data().rtmpsStreamKey}
										</code>
									</div>
									<Show when={data().srtUrl}>
										<div class="mb-2 border-gray-200 border-t pt-2">
											<label class="mb-1 block text-gray-500 text-xs">
												SRT URL (Alternative)
											</label>
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
const AVAILABLE_PLATFORMS = ["twitch", "youtube", "kick", "facebook"] as const;
type Platform = (typeof AVAILABLE_PLATFORMS)[number];

// =====================================================
// Activity Row Component (fixed height for virtualization)
// =====================================================
interface ActivityRowProps {
	item: ActivityItem;
	isSticky?: boolean;
}

// Row height constant for sticky offset calculations
const ACTIVITY_ROW_HEIGHT = 52; // px - accounts for padding and content

function ActivityRow(props: ActivityRowProps & { stickyIndex?: number }) {
	// Calculate sticky top offset based on index (for stacking multiple sticky items)
	const stickyStyle = () => {
		if (props.isSticky && props.stickyIndex !== undefined) {
			return { top: `${props.stickyIndex * ACTIVITY_ROW_HEIGHT}px` };
		}
		return {};
	};

	return (
		<div
			class={`flex items-center gap-2 rounded px-2 py-2 transition-colors hover:bg-gray-50 ${
				props.isSticky
					? "sticky z-10 border-amber-200 border-b bg-amber-50 shadow-sm"
					: isImportantEvent(props.item.type)
						? "bg-gray-50/50"
						: ""
			}`}
			style={stickyStyle()}>
			{/* Platform badge */}
			<span
				class={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-white text-xs ${PLATFORM_COLORS[props.item.platform] || "bg-gray-500"}`}>
				{PLATFORM_ICONS[props.item.platform] || "?"}
			</span>

			{/* Content */}
			<div class="min-w-0 flex-1">
				<div class="flex items-center gap-1.5">
					<Show when={props.item.type !== "chat"}>
						<span class={`text-xs ${getEventColor(props.item.type)}`}>
							{getEventIcon(props.item.type)}
						</span>
					</Show>
					<span
						class={`font-medium text-sm ${props.item.type === "chat" ? "text-gray-800" : getEventColor(props.item.type)}`}>
						{props.item.username}
					</span>
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
		</div>
	);
}

// =====================================================
// Live Stream Control Center Component
// =====================================================
interface LiveStreamControlCenterProps {
	activities: ActivityItem[];
	streamDuration: number; // in seconds
	viewerCount: number;
	stickyDuration?: number; // how long important events stay sticky (ms)
	connectedPlatforms?: Platform[]; // platforms the user is connected to
	onSendMessage?: (message: string, platforms: Platform[]) => void;
}

export function LiveStreamControlCenter(props: LiveStreamControlCenterProps) {
	const [chatMessage, setChatMessage] = createSignal("");
	const [selectedPlatforms, setSelectedPlatforms] = createSignal<Set<Platform>>(
		new Set(props.connectedPlatforms || AVAILABLE_PLATFORMS),
	);
	const [showPlatformPicker, setShowPlatformPicker] = createSignal(false);
	const [stickyItemIds, setStickyItemIds] = createSignal<Set<string>>(
		new Set(),
	);

	// Get available platforms (either from props or default to all)
	const availablePlatforms = createMemo(
		() => props.connectedPlatforms || [...AVAILABLE_PLATFORMS],
	);

	// Format duration
	const formatDuration = (seconds: number): string => {
		const hrs = Math.floor(seconds / 3600);
		const mins = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;
		return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	};

	// Sort activities chronologically (oldest first, newest at bottom)
	// With flex-direction: column-reverse, the container naturally anchors to bottom
	// Items are sorted oldest-first so newest appear at visual bottom
	const sortedActivities = createMemo(() => {
		const sorted = [...props.activities].sort((a, b) => {
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

	// Track sticky items based on time (max 3 most recent, 2 minute default duration)
	const MAX_STICKY_ITEMS = 3;
	createEffect(() => {
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
		const newStickyIds = new Set(
			stickyItems.slice(0, MAX_STICKY_ITEMS).map((s) => s.id),
		);
		setStickyItemIds(newStickyIds);

		// Set up cleanup timer
		const timeout = setTimeout(() => {
			setStickyItemIds((current) => {
				const updated = new Set<string>();
				const nowInner = Date.now();
				for (const id of current) {
					const item = props.activities.find((a) => a.id === id);
					if (item) {
						const itemTime =
							item.timestamp instanceof Date
								? item.timestamp.getTime()
								: new Date(item.timestamp).getTime();
						if (nowInner - itemTime < duration) {
							updated.add(id);
						}
					}
				}
				return updated;
			});
		}, duration);

		onCleanup(() => clearTimeout(timeout));
	});

	// Create a map of sticky item id -> index for stacking offset calculation
	// Items are ordered by time (oldest first) to maintain visual consistency
	const stickyIndexMap = createMemo(() => {
		const ids = stickyItemIds();
		if (ids.size === 0) return new Map<string, number>();

		// Get sticky items sorted by timestamp (oldest first for consistent stacking)
		const stickyItems = sortedActivities()
			.filter((item) => ids.has(item.id))
			.sort((a, b) => {
				const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
				const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
				return timeA - timeB;
			});

		const indexMap = new Map<string, number>();
		stickyItems.forEach((item, index) => {
			indexMap.set(item.id, index);
		});
		return indexMap;
	});

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
						<span class={badge.success}>
							<span class="mr-2 animate-pulse">[*]</span> LIVE
						</span>
						<div class="text-gray-600 text-sm">
							<span class="font-medium">
								{formatDuration(props.streamDuration)}
							</span>
						</div>
					</div>
					<div class="flex items-center gap-4">
						<div class="text-center">
							<div class="font-bold text-purple-600 text-xl">
								{props.viewerCount}
							</div>
							<div class="text-gray-500 text-xs">Viewers</div>
						</div>
					</div>
				</div>
			</div>

			{/* Activity Feed - Scrollable with inline sticky items */}
			{/* Uses flex-direction: column-reverse for CSS-based bottom anchoring */}
			<div class="flex min-h-0 flex-1 flex-col-reverse overflow-y-auto">
				<Show
					when={sortedActivities().length > 0}
					fallback={
						<div class="flex h-full items-center justify-center text-gray-400">
							<div class="text-center">
								<div class="mb-2 text-3xl">[chat]</div>
								<div>Waiting for activity...</div>
							</div>
						</div>
					}>
					{/* Inner div un-reverses the content so it reads top-to-bottom */}
					{/* mt-auto pushes content to bottom when there are few items */}
					<div class="mt-auto flex flex-col">
						<For each={sortedActivities()}>
							{(item) => {
								const isSticky = stickyItemIds().has(item.id);
								const stickyIndex = isSticky ? stickyIndexMap().get(item.id) : undefined;
								return (
									<ActivityRow
										item={item}
										isSticky={isSticky}
										stickyIndex={stickyIndex}
									/>
								);
							}}
						</For>
					</div>
				</Show>
			</div>

			{/* Chat Input - Fixed at bottom */}
			<div class="shrink-0 border-gray-200 border-t pt-3">
				{/* Platform Picker */}
				<div class="relative mb-2">
					<button
						type="button"
						class="flex items-center gap-1.5 text-gray-500 text-xs transition-colors hover:text-gray-700"
						onClick={() => setShowPlatformPicker(!showPlatformPicker())}>
						<span>Send to:</span>
						<span class="font-medium text-gray-700">{platformSummary()}</span>
						<span class="text-[10px]">{showPlatformPicker() ? "^" : "v"}</span>
					</button>

					{/* Platform Selection Dropdown */}
					<Show when={showPlatformPicker()}>
						<div class="absolute bottom-full left-0 z-10 mb-1 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
							<div class="mb-2 flex items-center justify-between">
								<span class="font-medium text-gray-700 text-xs">
									Select platforms
								</span>
								<button
									type="button"
									class="text-purple-600 text-xs hover:text-purple-700"
									onClick={selectAllPlatforms}>
									Select all
								</button>
							</div>
							<div class="flex flex-wrap gap-1.5">
								<For each={availablePlatforms()}>
									{(platform) => (
										<button
											type="button"
											class={`flex items-center gap-1 rounded-full px-2 py-1 text-xs transition-all ${
												selectedPlatforms().has(platform)
													? `${PLATFORM_COLORS[platform]} text-white`
													: "bg-gray-100 text-gray-600 hover:bg-gray-200"
											}`}
											onClick={() => togglePlatform(platform)}>
											<span class="font-medium">
												{PLATFORM_ICONS[platform]}
											</span>
											<span class="capitalize">{platform}</span>
										</button>
									)}
								</For>
							</div>
						</div>
					</Show>
				</div>

				{/* Message Input */}
				<div class="flex gap-2">
					<input
						type="text"
						class={`${input.text} flex-1`}
						placeholder="Send a message to chat..."
						value={chatMessage()}
						onInput={(e) => setChatMessage(e.currentTarget.value)}
						onKeyDown={handleKeyDown}
					/>
					<button
						type="button"
						class={button.primary}
						onClick={handleSendMessage}
						disabled={!chatMessage().trim()}>
						Send
					</button>
				</div>
			</div>
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
	const formatDuration = (seconds: number): string => {
		const hrs = Math.floor(seconds / 3600);
		const mins = Math.floor((seconds % 3600) / 60);
		if (hrs > 0) {
			return `${hrs}h ${mins}m`;
		}
		return `${mins}m`;
	};

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
				<span class={badge.neutral}>OFFLINE</span>
			</div>

			{/* Summary Stats Grid */}
			<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
				<div class="rounded-lg bg-purple-50 p-4 text-center">
					<div class="font-bold text-2xl text-purple-600">
						{formatDuration(props.summary.duration)}
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
			<div class={card.base}>
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
			</div>

			{/* Actions */}
			<div class="flex justify-center">
				<button
					type="button"
					class={button.gradient}
					onClick={props.onStartNewStream}>
					Start New Stream
				</button>
			</div>
		</div>
	);
}

// =====================================================
// Main Stream Controls Widget Component
// =====================================================
// Export Platform type for external use
export type { Platform };

interface StreamControlsWidgetProps {
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
	// Post-stream props
	summary?: StreamSummary;
	onStartNewStream?: () => void;
}

export default function StreamControlsWidget(props: StreamControlsWidgetProps) {
	return (
		<div class={`${card.default} h-full`}>
			<Show when={props.phase === "pre-stream"}>
				<PreStreamSettings
					metadata={
						props.metadata || {
							title: "",
							description: "",
							category: "",
							tags: [],
						}
					}
					onMetadataChange={props.onMetadataChange || (() => {})}
					streamKeyData={props.streamKeyData}
					onShowStreamKey={props.onShowStreamKey}
					showStreamKey={props.showStreamKey}
					isLoadingStreamKey={props.isLoadingStreamKey}
					onCopyStreamKey={props.onCopyStreamKey}
					copied={props.copied}
				/>
			</Show>

			<Show when={props.phase === "live"}>
				<LiveStreamControlCenter
					activities={props.activities || []}
					streamDuration={props.streamDuration || 0}
					viewerCount={props.viewerCount || 0}
					stickyDuration={props.stickyDuration}
					connectedPlatforms={props.connectedPlatforms}
					onSendMessage={props.onSendMessage}
				/>
			</Show>

			<Show when={props.phase === "post-stream"}>
				<PostStreamSummary
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
					onStartNewStream={props.onStartNewStream}
				/>
			</Show>
		</div>
	);
}
