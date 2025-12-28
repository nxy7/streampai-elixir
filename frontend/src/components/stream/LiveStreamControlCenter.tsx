import {
	For,
	Show,
	createEffect,
	createMemo,
	createSignal,
	onCleanup,
	onMount,
} from "solid-js";
import { SchemaForm } from "~/lib/schema-form/SchemaForm";
import { badge, button, input } from "~/styles/design-system";
import { ActivityRow } from "./ActivityRow";
import { StreamActionsPanel } from "./StreamActionsPanel";
import { TimersPanel } from "./TimersPanel";
import {
	ACTIVITY_TYPE_LABELS,
	ALL_ACTIVITY_TYPES,
	AVAILABLE_PLATFORMS,
	type ActivityItem,
	type ActivityType,
	type GiveawayCreationValues,
	type LiveViewMode,
	MAX_ACTIVITIES,
	MAX_STICKY_ITEMS,
	type ModerationCallbacks,
	PLATFORM_COLORS,
	PLATFORM_ICONS,
	type Platform,
	type PollCreationValues,
	type StreamActionCallbacks,
	type StreamTimer,
	type TimerActionCallbacks,
	getEventColor,
	getEventIcon,
	giveawayCreationMeta,
	giveawayCreationSchema,
	isImportantEvent,
	pollCreationMeta,
	pollCreationSchema,
} from "./types";

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
	const [shouldAutoScroll, setShouldAutoScroll] = createSignal(true);
	// Filter state
	const [selectedTypeFilters, setSelectedTypeFilters] = createSignal<
		Set<ActivityType>
	>(new Set(ALL_ACTIVITY_TYPES));
	const [searchText, setSearchText] = createSignal("");
	const [showFilters, setShowFilters] = createSignal(false);
	const [viewMode, setViewMode] = createSignal<LiveViewMode>("events");
	let scrollContainerRef: HTMLDivElement | undefined;

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

	// Filter activities by type and search text
	const matchesFilters = (item: ActivityItem): boolean => {
		// Check type filter
		if (!selectedTypeFilters().has(item.type)) {
			return false;
		}

		// Check text search
		const query = searchText().toLowerCase().trim();
		if (query) {
			const usernameMatch = item.username.toLowerCase().includes(query);
			const messageMatch = item.message?.toLowerCase().includes(query) ?? false;
			if (!usernameMatch && !messageMatch) {
				return false;
			}
		}

		return true;
	};

	// Sort activities chronologically (oldest first, newest at bottom)
	// With flex-direction: column-reverse, the container naturally anchors to bottom
	// Items are sorted oldest-first so newest appear at visual bottom
	const sortedActivities = createMemo(() => {
		const filtered = props.activities.filter(matchesFilters);
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
		setSearchText("");
	};

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

	// Run on mount to set initial sticky items
	onMount(() => {
		setStickyItemIds(computeStickyItems());
	});

	// Re-compute sticky items when activities change
	createEffect(() => {
		// Track the activities array (triggers on new activities)
		const activities = props.activities;
		if (activities.length > 0) {
			setStickyItemIds(computeStickyItems());
		}
	});

	// Set up periodic refresh to remove expired sticky items
	onMount(() => {
		const _duration = props.stickyDuration || 120000;
		const interval = setInterval(() => {
			setStickyItemIds(computeStickyItems());
		}, 10000); // Refresh every 10 seconds

		onCleanup(() => clearInterval(interval));
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
		stickyItems.forEach((item, index) => {
			indexMap.set(item.id, index);
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
						{/* View Mode Toggle */}
						<div class="flex rounded-lg border border-gray-200 bg-gray-100 p-0.5">
							<button
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
							</button>
							<button
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
							</button>
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
						<button
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
						</button>

						{/* Quick search input - always visible */}
						<div class="relative flex-1">
							<input
								class="w-full rounded border border-gray-200 bg-gray-50 px-2 py-1 pr-6 text-xs placeholder:text-gray-400 focus:border-purple-300 focus:bg-white focus:outline-none"
								data-testid="search-input"
								onInput={(e) => setSearchText(e.currentTarget.value)}
								placeholder="Search by name or message..."
								type="text"
								value={searchText()}
							/>
							<Show when={searchText()}>
								<button
									class="absolute top-1/2 right-1.5 -translate-y-1/2 text-gray-400 text-xs hover:text-gray-600"
									data-testid="clear-search"
									onClick={() => setSearchText("")}
									type="button">
									x
								</button>
							</Show>
						</div>
					</div>

					{/* Expandable filter panel - absolute positioned to prevent layout shift */}
					<Show when={showFilters()}>
						<div class="absolute top-full right-0 left-0 z-20 mt-1 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
							<div class="mb-1.5 flex items-center justify-between">
								<span class="font-medium text-gray-600 text-xs">
									Event Types
								</span>
								<div class="flex gap-2">
									<button
										class="text-purple-600 text-xs hover:text-purple-700"
										data-testid="select-all-types"
										onClick={selectAllTypes}
										type="button">
										All
									</button>
									<Show when={hasActiveFilters()}>
										<button
											class="text-gray-500 text-xs hover:text-gray-700"
											data-testid="clear-filters"
											onClick={clearFilters}
											type="button">
											Clear
										</button>
									</Show>
								</div>
							</div>
							<div class="flex flex-wrap gap-1">
								<For each={ALL_ACTIVITY_TYPES}>
									{(type) => (
										<button
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
										</button>
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
									matching "{searchText().trim()}"
								</span>
							</Show>
							<Show
								when={
									searchText().trim() &&
									selectedTypeFilters().size < ALL_ACTIVITY_TYPES.length
								}>
								<span class="text-gray-400">•</span>
								<span class="font-medium text-gray-700">
									matching "{searchText().trim()}"
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
										<button
											class="mt-2 text-purple-600 text-sm hover:text-purple-700"
											data-testid="clear-filters-empty"
											onClick={clearFilters}
											type="button">
											Clear filters
										</button>
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
								const stickyIndex = () =>
									isSticky() ? stickyIndexMap().get(item.id) : undefined;
								return (
									<ActivityRow
										isSticky={isSticky()}
										item={item}
										moderationCallbacks={props.moderationCallbacks}
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
						<button
							class="flex items-center gap-1.5 text-gray-500 text-xs transition-colors hover:text-gray-700"
							onClick={() => setShowPlatformPicker(!showPlatformPicker())}
							type="button">
							<span>Send to:</span>
							<span class="font-medium text-gray-700">{platformSummary()}</span>
							<span class="text-[10px]">
								{showPlatformPicker() ? "^" : "v"}
							</span>
						</button>

						{/* Platform Selection Dropdown */}
						<Show when={showPlatformPicker()}>
							<div class="absolute bottom-full left-0 z-10 mb-1 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
								<div class="mb-2 flex items-center justify-between">
									<span class="font-medium text-gray-700 text-xs">
										Select platforms
									</span>
									<button
										class="text-purple-600 text-xs hover:text-purple-700"
										onClick={selectAllPlatforms}
										type="button">
										Select all
									</button>
								</div>
								<div class="flex flex-wrap gap-1.5">
									<For each={availablePlatforms()}>
										{(platform) => (
											<button
												class={`flex items-center gap-1 rounded-full px-2 py-1 text-xs transition-all ${
													selectedPlatforms().has(platform)
														? `${PLATFORM_COLORS[platform]} text-white`
														: "bg-gray-100 text-gray-600 hover:bg-gray-200"
												}`}
												onClick={() => togglePlatform(platform)}
												type="button">
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
							class={`${input.text} flex-1`}
							onInput={(e) => setChatMessage(e.currentTarget.value)}
							onKeyDown={handleKeyDown}
							placeholder="Send a message to chat..."
							type="text"
							value={chatMessage()}
						/>
						<button
							class={button.primary}
							disabled={!chatMessage().trim()}
							onClick={handleSendMessage}
							type="button">
							Send
						</button>
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
						<button
							class="flex items-center gap-1 rounded-lg px-2 py-1 text-gray-500 text-sm transition-colors hover:bg-gray-100 hover:text-gray-700"
							data-testid="back-to-actions"
							onClick={() => setViewMode("actions")}
							type="button">
							<span>&lt;</span>
							<span>Back to Actions</span>
						</button>
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
						<button
							class={button.secondary}
							data-testid="cancel-poll"
							onClick={() => setViewMode("actions")}
							type="button">
							Cancel
						</button>
						<button
							class={button.primary}
							data-testid="start-poll-button"
							disabled={!isPollFormValid()}
							onClick={handleStartPoll}
							type="button">
							Start Poll
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
							<span>Back to Actions</span>
						</button>
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
						<button
							class={button.secondary}
							data-testid="cancel-giveaway"
							onClick={() => setViewMode("actions")}
							type="button">
							Cancel
						</button>
						<button
							class={button.primary}
							data-testid="start-giveaway-button"
							disabled={!isGiveawayFormValid()}
							onClick={handleStartGiveaway}
							type="button">
							Start Giveaway
						</button>
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
		</div>
	);
}
