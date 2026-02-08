import { A } from "@solidjs/router";
import { useLiveQuery } from "@tanstack/solid-db";
import {
	ErrorBoundary,
	For,
	Show,
	Suspense,
	createMemo,
	createSignal,
} from "solid-js";
import { Select, Skeleton } from "~/design-system";
import Badge from "~/design-system/Badge";
import Card from "~/design-system/Card";
import { cn, text } from "~/design-system/design-system";
import Input from "~/design-system/Input";
import { useTranslation } from "~/i18n";
import { useAuthenticatedUser } from "~/lib/auth";
import { useBreadcrumbs } from "~/lib/BreadcrumbContext";
import {
	type StreamEvent,
	createUserScopedStreamEventsCollection,
} from "~/lib/electric";

type Platform = "twitch" | "youtube" | "facebook" | "kick" | "";
type DateRange = "7days" | "30days" | "3months" | "";

// Chat message data stored in stream_events.data column
// The data is stored with map_with_tag storage, so it has a type field plus the actual fields
interface ChatMessageData {
	type: "chat_message";
	message: string;
	username: string;
	sender_channel_id?: string;
	is_moderator?: boolean;
	is_patreon?: boolean;
	is_sent_by_streamer?: boolean;
	delivery_status?: Record<string, unknown>;
	emotes?: Array<Record<string, unknown>>;
}

// Skeleton for chat history page
function ChatHistorySkeleton() {
	return (
		<div class="mx-auto max-w-6xl space-y-6">
			{/* Filters skeleton */}
			<Card variant="ghost">
				<Skeleton class="mb-4 h-6 w-20" />
				<div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
					<For each={[1, 2, 3]}>
						{() => (
							<div>
								<Skeleton class="mb-2 h-4 w-20" />
								<Skeleton class="h-10 w-full rounded-lg" />
							</div>
						)}
					</For>
				</div>
			</Card>

			{/* Messages skeleton */}
			<Card>
				<Skeleton class="mb-4 h-6 w-24" />
				<div class="space-y-1">
					<For each={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]}>
						{() => (
							<div class="flex items-center gap-3 rounded px-3 py-2">
								<Skeleton class="h-4 w-12" />
								<Skeleton class="h-5 w-20" />
								<Skeleton class="h-4 w-48 flex-1" />
							</div>
						)}
					</For>
				</div>
			</Card>
		</div>
	);
}

export default function ChatHistory() {
	const { t } = useTranslation();
	const { user } = useAuthenticatedUser();

	useBreadcrumbs(() => [
		{ label: t("sidebar.streaming"), href: "/dashboard/stream" },
		{ label: t("dashboardNav.chatHistory") },
	]);

	const [platform, setPlatform] = createSignal<Platform>("");
	const [dateRange, setDateRange] = createSignal<DateRange>("");
	const [search, setSearch] = createSignal("");

	return (
		<ErrorBoundary
			fallback={(err) => (
				<div class="mx-auto mt-8 max-w-6xl">
					<div class="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
						{t("chatHistory.messages.errorLoading")} {err.message}
					</div>
				</div>
			)}>
			<Suspense fallback={<ChatHistorySkeleton />}>
				<ChatHistoryContent
					dateRange={dateRange}
					platform={platform}
					search={search}
					setDateRange={setDateRange}
					setPlatform={setPlatform}
					setSearch={setSearch}
					userId={user().id}
				/>
			</Suspense>
		</ErrorBoundary>
	);
}

function ChatHistoryContent(props: {
	userId: string;
	platform: () => Platform;
	setPlatform: (p: Platform) => void;
	dateRange: () => DateRange;
	setDateRange: (d: DateRange) => void;
	search: () => string;
	setSearch: (s: string) => void;
}) {
	const { t } = useTranslation();

	// Use ElectricSQL for real-time updates
	const collection = createMemo(() =>
		createUserScopedStreamEventsCollection(props.userId),
	);
	const query = useLiveQuery(() => collection());

	// Filter and sort messages client-side
	const messages = createMemo(() => {
		const data = query() ?? [];

		// Filter to only chat messages
		let filtered = data.filter((event) => event.type === "chat_message");

		// Apply platform filter
		const platformFilter = props.platform();
		if (platformFilter) {
			filtered = filtered.filter(
				(event) => event.platform?.toLowerCase() === platformFilter,
			);
		}

		// Apply date range filter
		const dateRangeFilter = props.dateRange();
		if (dateRangeFilter) {
			const now = new Date();
			let cutoff: Date;
			switch (dateRangeFilter) {
				case "7days":
					cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
					break;
				case "30days":
					cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
					break;
				case "3months":
					cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
					break;
			}
			filtered = filtered.filter(
				(event) => new Date(event.inserted_at) >= cutoff,
			);
		}

		// Apply search filter
		const searchFilter = props.search().toLowerCase();
		if (searchFilter) {
			filtered = filtered.filter((event) => {
				const chatData = event.data as unknown as ChatMessageData;
				const message = chatData?.message?.toLowerCase() ?? "";
				const username = chatData?.username?.toLowerCase() ?? "";
				return (
					message.includes(searchFilter) || username.includes(searchFilter)
				);
			});
		}

		// Sort by date, newest first
		return filtered.sort(
			(a, b) =>
				new Date(b.inserted_at).getTime() - new Date(a.inserted_at).getTime(),
		);
	});

	const formatTime = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
	};

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		if (date.toDateString() === today.toDateString()) {
			return "Today";
		}
		if (date.toDateString() === yesterday.toDateString()) {
			return "Yesterday";
		}
		return date.toLocaleDateString([], {
			month: "short",
			day: "numeric",
			year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
		});
	};

	// Group messages by date
	const groupedMessages = createMemo(() => {
		const groups: Map<string, StreamEvent[]> = new Map();
		for (const msg of messages()) {
			const dateKey = new Date(msg.inserted_at).toDateString();
			if (!groups.has(dateKey)) {
				groups.set(dateKey, []);
			}
			groups.get(dateKey)?.push(msg);
		}
		return Array.from(groups.entries());
	});

	const getPlatformColor = (platformName: string) => {
		const colors: Record<string, string> = {
			twitch: "text-purple-400",
			youtube: "text-red-400",
			facebook: "text-blue-400",
			kick: "text-green-400",
		};
		return colors[platformName.toLowerCase()] || "text-neutral-400";
	};

	const getPlatformBadgeVariant = (
		platformName: string,
	): "info" | "error" | "success" | "warning" | "neutral" => {
		const variants: Record<
			string,
			"info" | "error" | "success" | "warning" | "neutral"
		> = {
			twitch: "info",
			youtube: "error",
			facebook: "info",
			kick: "success",
		};
		return variants[platformName.toLowerCase()] || "neutral";
	};

	return (
		<div class="mx-auto max-w-6xl space-y-6">
			{/* Filters Section */}
			<Card variant="ghost">
				<h3 class={`${text.h3} mb-4`}>{t("chatHistory.filters.title")}</h3>

				<div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
					{/* Platform Filter */}
					<Select
						label={t("chatHistory.filters.platform")}
						onChange={(value) => props.setPlatform(value as Platform)}
						options={[
							{ value: "", label: t("chatHistory.filters.allPlatforms") },
							{ value: "twitch", label: "Twitch" },
							{ value: "youtube", label: "YouTube" },
							{ value: "facebook", label: "Facebook" },
							{ value: "kick", label: "Kick" },
						]}
						value={props.platform()}
					/>

					{/* Date Range Filter */}
					<Select
						label={t("chatHistory.filters.dateRange")}
						onChange={(value) => props.setDateRange(value as DateRange)}
						options={[
							{ value: "", label: t("chatHistory.filters.allTime") },
							{ value: "7days", label: t("chatHistory.filters.last7Days") },
							{ value: "30days", label: t("chatHistory.filters.last30Days") },
							{ value: "3months", label: t("chatHistory.filters.last3Months") },
						]}
						value={props.dateRange()}
					/>

					{/* Search - instant filtering since it's all client-side */}
					<Input
						label={t("chatHistory.filters.search")}
						onInput={(e) => props.setSearch(e.currentTarget.value)}
						placeholder={t("chatHistory.searchPlaceholder")}
						type="text"
						value={props.search()}
					/>
				</div>

				{/* Active Filters Summary */}
				<Show when={props.platform() || props.dateRange() || props.search()}>
					<div class="flex items-center gap-2 text-neutral-600 text-sm">
						<span class="font-medium">
							{t("chatHistory.filters.activeFilters")}
						</span>
						<Show when={props.platform()}>
							<Badge variant="info">{props.platform()}</Badge>
						</Show>
						<Show when={props.dateRange()}>
							<Badge variant="info">
								{props.dateRange() === "7days" &&
									t("chatHistory.filters.last7Days")}
								{props.dateRange() === "30days" &&
									t("chatHistory.filters.last30Days")}
								{props.dateRange() === "3months" &&
									t("chatHistory.filters.last3Months")}
							</Badge>
						</Show>
						<Show when={props.search()}>
							<Badge variant="info">"{props.search()}"</Badge>
						</Show>
						<button
							class="ml-2 font-medium text-primary text-sm hover:text-primary-hover"
							onClick={() => {
								props.setPlatform("");
								props.setDateRange("");
								props.setSearch("");
							}}
							type="button">
							{t("chatHistory.filters.clearAll")}
						</button>
					</div>
				</Show>
			</Card>

			{/* Messages List */}
			<Card class="overflow-hidden">
				<div class="mb-4 flex items-center justify-between">
					<h3 class={text.h3}>{t("chatHistory.messages.title")}</h3>
					<Show when={messages().length > 0}>
						<span class="text-neutral-500 text-sm">
							{messages().length} messages
						</span>
					</Show>
				</div>

				<Show
					fallback={
						<div class="py-12 text-center text-neutral-500">
							<svg
								aria-hidden="true"
								class="mx-auto mb-4 h-16 w-16 text-neutral-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
								/>
							</svg>
							<p class="font-medium text-lg text-neutral-700">
								{t("chatHistory.messages.noMessages")}
							</p>
							<p class="mt-2 text-neutral-500 text-sm">
								{props.platform() || props.dateRange() || props.search()
									? t("chatHistory.messages.adjustFilters")
									: t("chatHistory.messages.connectAccounts")}
							</p>
						</div>
					}
					when={messages().length > 0}>
					<div class="-mx-6 -mb-6 max-h-[600px] overflow-y-auto">
						<For each={groupedMessages()}>
							{([dateKey, dayMessages]) => (
								<>
									{/* Date separator */}
									<div class="sticky top-0 z-10 bg-surface-secondary/80 px-6 py-2 backdrop-blur-sm">
										<span class="font-medium text-neutral-500 text-xs uppercase tracking-wide">
											{formatDate(dateKey)}
										</span>
									</div>

									{/* Messages for this date */}
									<div class="space-y-0.5 px-3">
										<For each={dayMessages}>
											{(msg) => {
												// Data is stored with map_with_tag: fields are directly on data object
												const chatData = msg.data as unknown as ChatMessageData;
												const isStreamer = chatData?.is_sent_by_streamer;

												return (
													<div
														class={cn(
															"group flex items-baseline gap-2 rounded px-3 py-1 transition-colors hover:bg-surface-secondary",
															isStreamer && "bg-primary/5",
														)}>
														{/* Timestamp */}
														<span class="w-12 shrink-0 font-mono text-neutral-400 text-xs tabular-nums">
															{formatTime(msg.inserted_at)}
														</span>

														{/* Username */}
														<Show
															fallback={
																<span
																	class={cn(
																		"shrink-0 font-semibold text-sm",
																		isStreamer
																			? "text-primary"
																			: getPlatformColor(msg.platform ?? ""),
																	)}>
																	{chatData?.username ?? "Unknown"}
																</span>
															}
															when={msg.viewer_id}>
															<A
																class={cn(
																	"shrink-0 font-semibold text-sm hover:underline",
																	isStreamer
																		? "text-primary hover:text-primary-hover"
																		: getPlatformColor(msg.platform ?? ""),
																)}
																href={`/dashboard/viewers/${msg.viewer_id?.toString() ?? ""}`}>
																{chatData?.username ?? "Unknown"}
															</A>
														</Show>

														{/* Badges */}
														<Show
															when={
																msg.platform && !chatData?.is_sent_by_streamer
															}>
															<Badge
																class="!py-0 !text-[10px]"
																variant={getPlatformBadgeVariant(
																	msg.platform ?? "",
																)}>
																{msg.platform}
															</Badge>
														</Show>
														<Show when={chatData?.is_moderator}>
															<Badge
																class="!py-0 !text-[10px]"
																variant="success">
																MOD
															</Badge>
														</Show>
														<Show when={chatData?.is_patreon}>
															<Badge
																class="!py-0 !text-[10px]"
																variant="warning">
																Patron
															</Badge>
														</Show>

														{/* Message */}
														<span class="min-w-0 flex-1 break-words text-foreground text-sm">
															{chatData?.message}
														</span>
													</div>
												);
											}}
										</For>
									</div>
								</>
							)}
						</For>
					</div>
				</Show>
			</Card>
		</div>
	);
}
