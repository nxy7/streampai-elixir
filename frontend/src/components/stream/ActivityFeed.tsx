import { debounce } from "@solid-primitives/scheduled";
import { createVirtualizer } from "@tanstack/solid-virtual";
import {
	For,
	Show,
	createEffect,
	createMemo,
	createSignal,
	onCleanup,
	onMount,
} from "solid-js";
import { useTranslation } from "~/i18n";
import { ActivityRow } from "./ActivityRow";
import {
	ACTIVITY_ROW_HEIGHT,
	ACTIVITY_TYPE_LABELS,
	ALL_ACTIVITY_TYPES,
	type ActivityItem,
	type ActivityType,
	MAX_ACTIVITIES,
	MAX_STICKY_ITEMS,
	type ModerationCallbacks,
	type ParsedFilters,
	getEventColor,
	getEventIcon,
	isImportantEvent,
	parseSmartFilters,
} from "./types";

interface ActivityFeedProps {
	activities: ActivityItem[];
	stickyDuration?: number;
	moderationCallbacks?: ModerationCallbacks;
	/** Whether to show user avatars or platform icons */
	showAvatars?: boolean;
	/** Optional element to render at the end of the filter bar (e.g. view mode toggle) */
	toolbarEnd?: import("solid-js").JSX.Element;
}

export function ActivityFeed(props: ActivityFeedProps) {
	const { t } = useTranslation();
	const [selectedTypeFilters, setSelectedTypeFilters] = createSignal<
		Set<ActivityType>
	>(new Set(ALL_ACTIVITY_TYPES));
	const [searchText, setSearchText] = createSignal("");
	const [showFilters, setShowFilters] = createSignal(false);
	const [stickyItemIds, setStickyItemIds] = createSignal<Set<string>>(
		new Set(),
	);
	const [shouldAutoScroll, setShouldAutoScroll] = createSignal(true);
	let filterContainerRef: HTMLDivElement | undefined;
	let scrollContainerRef: HTMLDivElement | undefined;

	onMount(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				showFilters() &&
				filterContainerRef &&
				!filterContainerRef.contains(e.target as Node)
			) {
				setShowFilters(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		onCleanup(() =>
			document.removeEventListener("mousedown", handleClickOutside),
		);
	});

	const parsedSearchFilters = createMemo(() => parseSmartFilters(searchText()));

	const matchesFilters = (
		item: ActivityItem,
		filters: ParsedFilters,
	): boolean => {
		if (!selectedTypeFilters().has(item.type)) return false;

		const hasAnyFilter =
			filters.user.length > 0 ||
			filters.message.length > 0 ||
			filters.platform.length > 0 ||
			filters.freeText.length > 0;

		if (hasAnyFilter) {
			if (filters.user.length > 0) {
				if (!filters.user.some((u) => item.username.toLowerCase().includes(u)))
					return false;
			}
			if (filters.message.length > 0) {
				if (
					!filters.message.some(
						(m) => item.message?.toLowerCase().includes(m) ?? false,
					)
				)
					return false;
			}
			if (filters.platform.length > 0) {
				if (
					!filters.platform.some((p) => item.platform.toLowerCase().includes(p))
				)
					return false;
			}
			if (filters.freeText.length > 0) {
				if (
					!filters.freeText.some((text) => {
						const lower = text.toLowerCase();
						return (
							item.username.toLowerCase().includes(lower) ||
							(item.message?.toLowerCase().includes(lower) ?? false)
						);
					})
				)
					return false;
			}
		}
		return true;
	};

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
			return timeA - timeB;
		});
		return sorted.slice(-MAX_ACTIVITIES);
	});

	const hasActiveFilters = createMemo(() => {
		return (
			selectedTypeFilters().size !== ALL_ACTIVITY_TYPES.length ||
			searchText().trim().length > 0
		);
	});

	const formatActiveFilters = createMemo(() => {
		const filters = parsedSearchFilters();
		const parts: string[] = [];
		if (filters.user.length > 0) parts.push(`user: ${filters.user.join(", ")}`);
		if (filters.message.length > 0)
			parts.push(`message: ${filters.message.join(", ")}`);
		if (filters.platform.length > 0)
			parts.push(`platform: ${filters.platform.join(", ")}`);
		if (filters.freeText.length > 0)
			parts.push(`"${filters.freeText.join(", ")}"`);
		return parts.join(" + ");
	});

	const toggleTypeFilter = (type: ActivityType) => {
		setSelectedTypeFilters((current) => {
			const newSet = new Set(current);
			if (newSet.has(type)) {
				if (newSet.size > 1) newSet.delete(type);
			} else {
				newSet.add(type);
			}
			return newSet;
		});
	};

	const selectAllTypes = () =>
		setSelectedTypeFilters(new Set(ALL_ACTIVITY_TYPES));

	const clearFilters = () => {
		setSelectedTypeFilters(new Set(ALL_ACTIVITY_TYPES));
		setSearchText("");
	};

	// Sticky items logic
	const computeStickyItems = () => {
		const duration = props.stickyDuration || 120000;
		const now = Date.now();
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
		stickyItems.sort((a, b) => b.time - a.time);
		return new Set(stickyItems.slice(0, MAX_STICKY_ITEMS).map((s) => s.id));
	};

	const updateStickyItems = () => setStickyItemIds(computeStickyItems());
	onMount(updateStickyItems);

	const debouncedUpdate = debounce(updateStickyItems, 100);
	createEffect(() => {
		props.activities;
		debouncedUpdate();
	});

	onMount(() => {
		const interval = setInterval(updateStickyItems, 10000);
		onCleanup(() => clearInterval(interval));
	});

	// Merge consecutive chat messages from the same sender into a single item
	const groupedActivities = createMemo(() => {
		const sorted = sortedActivities();
		if (sorted.length === 0) return [];

		const result: ActivityItem[] = [];
		let current: ActivityItem | null = null;

		for (const item of sorted) {
			if (
				current &&
				item.type === "chat" &&
				current.type === "chat" &&
				(item.isSentByStreamer
					? current.isSentByStreamer
					: !current.isSentByStreamer &&
						current.username === item.username &&
						current.platform === item.platform)
			) {
				// Merge: append message, take latest timestamp & delivery status
				const prev = current as ActivityItem;
				current = {
					...prev,
					message: `${prev.message}\n${item.message ?? ""}`,
					timestamp: item.timestamp,
					deliveryStatus: item.deliveryStatus ?? prev.deliveryStatus,
					id: item.id, // use latest id for keying
				};
			} else {
				if (current) result.push(current);
				current = { ...item };
			}
		}
		if (current) result.push(current);

		return result;
	});

	const latestStreamerMessageId = createMemo(() => {
		const items = groupedActivities();
		for (let i = items.length - 1; i >= 0; i--) {
			if (items[i].isSentByStreamer) return items[i].id;
		}
		return null;
	});

	// Sticky activities extracted for rendering outside the virtualizer
	const stickyActivities = createMemo(() => {
		const ids = stickyItemIds();
		if (ids.size === 0) return [];
		return sortedActivities()
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
	});

	// Virtualizer
	const virtualizer = createVirtualizer({
		get count() {
			return groupedActivities().length;
		},
		getScrollElement: () => scrollContainerRef ?? null,
		estimateSize: () => ACTIVITY_ROW_HEIGHT,
		overscan: 5,
		getItemKey: (index: number) => groupedActivities()[index]?.id ?? index,
	});

	// Auto-scroll
	createEffect(() => {
		const items = groupedActivities();
		if (shouldAutoScroll() && items.length > 0) {
			virtualizer.scrollToIndex(items.length - 1, { align: "end" });
		}
	});

	const handleScroll = () => {
		if (!scrollContainerRef) return;
		const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef;
		setShouldAutoScroll(scrollHeight - scrollTop - clientHeight < 100);
	};

	return (
		<>
			{/* Filter Bar */}
			<div
				class="relative shrink-0 border-neutral-200 border-b px-6 py-2"
				ref={filterContainerRef}>
				<div class="flex items-center gap-2">
					<div class="flex flex-1 items-center gap-2">
						<button
							class={`flex items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors ${
								hasActiveFilters()
									? "bg-primary-100 text-primary-hover"
									: "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
							}`}
							data-testid="filter-toggle"
							onClick={() => setShowFilters(!showFilters())}
							type="button">
							<svg
								aria-hidden="true"
								class="h-3.5 w-3.5"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								viewBox="0 0 24 24">
								<path
									d="M3 4h18M5 9h14M8 14h8M10 19h4"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
							<span>{t("stream.activityFeed.filter")}</span>
							<Show when={hasActiveFilters()}>
								<span class="ml-0.5 rounded-full bg-primary px-1.5 text-[10px] text-white">
									{ALL_ACTIVITY_TYPES.length -
										selectedTypeFilters().size +
										(searchText().trim() ? 1 : 0)}
								</span>
							</Show>
							<svg
								aria-hidden="true"
								class={`h-3 w-3 transition-transform ${showFilters() ? "rotate-180" : ""}`}
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								viewBox="0 0 24 24">
								<path
									d="M19 9l-7 7-7-7"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</button>

						<div class="relative flex-1">
							<input
								class="w-full rounded-lg border border-surface-inset-border bg-surface-inset px-2 py-1 pr-6 text-foreground text-xs placeholder:text-surface-inset-text focus:outline-none focus:ring-1 focus:ring-primary"
								data-testid="search-input"
								onInput={(e) => setSearchText(e.currentTarget.value)}
								placeholder={t("stream.searchByNameOrMessage")}
								type="text"
								value={searchText()}
							/>
							<Show when={searchText()}>
								<button
									aria-label={t("stream.activityFeed.clear")}
									class="absolute top-1/2 right-1.5 -translate-y-1/2 text-surface-inset-text text-xs hover:text-foreground"
									data-testid="clear-search"
									onClick={() => setSearchText("")}
									type="button">
									x
								</button>
							</Show>
						</div>
					</div>
					{props.toolbarEnd}
				</div>

				{/* Expandable filter panel */}
				<Show when={showFilters()}>
					<div class="absolute top-full right-0 left-0 z-20 mt-1 rounded-lg border border-neutral-200 bg-surface p-2 shadow-lg">
						<div class="mb-1.5 flex items-center justify-between">
							<span class="font-medium text-neutral-600 text-xs">
								{t("stream.activityFeed.eventTypes")}
							</span>
							<div class="flex gap-2">
								<button
									class="text-primary text-xs hover:text-primary-hover"
									data-testid="select-all-types"
									onClick={selectAllTypes}
									type="button">
									{t("stream.activityFeed.all")}
								</button>
								<Show when={hasActiveFilters()}>
									<button
										class="text-neutral-500 text-xs hover:text-neutral-700"
										data-testid="clear-filters"
										onClick={clearFilters}
										type="button">
										{t("stream.activityFeed.clear")}
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
												? `${getEventColor(type)} bg-neutral-800`
												: "bg-neutral-200 text-neutral-500 hover:bg-neutral-300"
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
					<div class="mt-1.5 flex flex-wrap items-center gap-1 text-neutral-500 text-xs">
						<span>{t("stream.activityFeed.showing")}</span>
						<Show when={selectedTypeFilters().size < ALL_ACTIVITY_TYPES.length}>
							<span class="font-medium text-neutral-700">
								{[...selectedTypeFilters()]
									.map((type) => ACTIVITY_TYPE_LABELS[type])
									.join(", ")}
							</span>
						</Show>
						<Show when={searchText().trim()}>
							<Show
								when={selectedTypeFilters().size < ALL_ACTIVITY_TYPES.length}>
								<span class="text-neutral-400">&bull;</span>
							</Show>
							<span class="font-medium text-neutral-700">
								{formatActiveFilters()}
							</span>
						</Show>
						<span class="text-neutral-400">
							({sortedActivities().length} events)
						</span>
					</div>
				</Show>
			</div>

			{/* Scrollable Activity List */}
			<div
				class="min-h-0 flex-1 overflow-y-auto"
				onScroll={handleScroll}
				ref={scrollContainerRef}>
				<Show
					fallback={
						<div class="flex h-full items-center justify-center text-neutral-400">
							<div class="text-center">
								<Show
									fallback={
										<>
											<svg
												aria-hidden="true"
												class="mx-auto mb-3 h-10 w-10 text-neutral-300"
												fill="none"
												stroke="currentColor"
												stroke-width="1.5"
												viewBox="0 0 24 24">
												<path
													d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
													stroke-linecap="round"
													stroke-linejoin="round"
												/>
											</svg>
											<div>{t("stream.activityFeed.waitingForActivity")}</div>
										</>
									}
									when={hasActiveFilters()}>
									<svg
										aria-hidden="true"
										class="mx-auto mb-3 h-10 w-10 text-neutral-300"
										fill="none"
										stroke="currentColor"
										stroke-width="1.5"
										viewBox="0 0 24 24">
										<path
											d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
									</svg>
									<div>{t("stream.activityFeed.noEventsMatch")}</div>
									<button
										class="mt-2 text-primary text-sm hover:text-primary-hover"
										data-testid="clear-filters-empty"
										onClick={clearFilters}
										type="button">
										{t("stream.activityFeed.clearFilters")}
									</button>
								</Show>
							</div>
						</div>
					}
					when={sortedActivities().length > 0}>
					{/* Sticky items rendered outside the virtualizer */}
					<For each={stickyActivities()}>
						{(item, index) => (
							<ActivityRow
								isLatestStreamerMessage={latestStreamerMessageId() === item.id}
								isSticky
								item={item}
								moderationCallbacks={props.moderationCallbacks}
								showAvatars={props.showAvatars}
								stickyIndex={index()}
							/>
						)}
					</For>

					{/* Virtualized list */}
					<div
						style={{
							height: `${virtualizer.getTotalSize()}px`,
							width: "100%",
							position: "relative",
						}}>
						<For each={virtualizer.getVirtualItems()}>
							{(virtualRow) => {
								const item = () => groupedActivities()[virtualRow.index];
								return (
									<div
										data-index={virtualRow.index}
										ref={(el) =>
											queueMicrotask(() => virtualizer.measureElement(el))
										}
										style={{
											position: "absolute",
											top: 0,
											left: 0,
											width: "100%",
											transform: `translateY(${virtualRow.start}px)`,
										}}>
										<ActivityRow
											isLatestStreamerMessage={
												latestStreamerMessageId() === item().id
											}
											item={item()}
											moderationCallbacks={props.moderationCallbacks}
											showAvatars={props.showAvatars}
										/>
									</div>
								);
							}}
						</For>
					</div>
				</Show>
			</div>
		</>
	);
}
