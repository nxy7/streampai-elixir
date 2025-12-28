import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";
import {
	ErrorBoundary,
	For,
	Show,
	Suspense,
	createEffect,
	createSignal,
} from "solid-js";
import { Skeleton } from "~/components/ui";
import Badge from "~/components/ui/Badge";
import Card from "~/components/ui/Card";
import Input, { Select } from "~/components/ui/Input";
import { useTranslation } from "~/i18n";
import { getLoginUrl, useCurrentUser } from "~/lib/auth";
import { getChatHistory } from "~/sdk/ash_rpc";
import { text } from "~/styles/design-system";

type Platform = "twitch" | "youtube" | "facebook" | "kick" | "";
type DateRange = "7days" | "30days" | "3months" | "";

// Skeleton for chat history page
function ChatHistorySkeleton() {
	return (
		<div class="mx-auto max-w-6xl space-y-6">
			{/* Filters skeleton */}
			<Card>
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
				<div class="space-y-3">
					<For each={[1, 2, 3, 4, 5, 6, 7, 8]}>
						{() => (
							<div class="rounded-lg border border-gray-200 p-4">
								<div class="mb-2 flex flex-wrap items-center gap-2">
									<Skeleton class="h-5 w-24" />
									<Skeleton class="h-5 w-16 rounded-full" />
									<Skeleton class="h-4 w-32" />
								</div>
								<Skeleton class="h-4 w-full" />
								<Skeleton class="mt-1 h-4 w-2/3" />
							</div>
						)}
					</For>
				</div>
			</Card>
		</div>
	);
}

const chatMessageFields: (
	| "id"
	| "message"
	| "senderUsername"
	| "platform"
	| "senderIsModerator"
	| "senderIsPatreon"
	| "insertedAt"
	| "viewerId"
	| "userId"
)[] = [
	"id",
	"message",
	"senderUsername",
	"platform",
	"senderIsModerator",
	"senderIsPatreon",
	"insertedAt",
	"viewerId",
	"userId",
];

export interface ChatMessage {
	id: string;
	message: string;
	senderUsername: string;
	platform: string;
	senderIsModerator: boolean | null;
	senderIsPatreon: boolean | null;
	insertedAt: string;
	viewerId: string | null;
	userId: string;
}

export default function ChatHistory() {
	const { user } = useCurrentUser();

	const [platform, setPlatform] = createSignal<Platform>("");
	const [dateRange, setDateRange] = createSignal<DateRange>("");
	const [search, setSearch] = createSignal("");
	const [searchInput, setSearchInput] = createSignal("");

	const handleSearch = (e: Event) => {
		e.preventDefault();
		setSearch(searchInput());
	};

	return (
		<>
			<Title>Chat History - Streampai</Title>
			<Show
				fallback={
					<div class="flex min-h-screen items-center justify-center bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900">
						<div class="py-12 text-center">
							<h2 class="mb-4 font-bold text-2xl text-white">
								Not Authenticated
							</h2>
							<p class="mb-6 text-gray-300">
								Please sign in to view chat history.
							</p>
							<a
								class="inline-block rounded-lg bg-linear-to-r from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white transition-all hover:from-purple-600 hover:to-pink-600"
								href={getLoginUrl()}>
								Sign In
							</a>
						</div>
					</div>
				}
				when={user()}>
				{(currentUser) => (
					<ErrorBoundary
						fallback={(err) => (
							<div class="mx-auto mt-8 max-w-6xl">
								<div class="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
									Error loading chat messages: {err.message}
								</div>
							</div>
						)}>
						<Suspense fallback={<ChatHistorySkeleton />}>
							<ChatHistoryContent
								dateRange={dateRange}
								handleSearch={handleSearch}
								platform={platform}
								search={search}
								searchInput={searchInput}
								setDateRange={setDateRange}
								setPlatform={setPlatform}
								setSearchInput={setSearchInput}
								userId={currentUser().id}
							/>
						</Suspense>
					</ErrorBoundary>
				)}
			</Show>
		</>
	);
}

function ChatHistoryContent(props: {
	userId: string;
	platform: () => Platform;
	setPlatform: (p: Platform) => void;
	dateRange: () => DateRange;
	setDateRange: (d: DateRange) => void;
	search: () => string;
	searchInput: () => string;
	setSearchInput: (s: string) => void;
	handleSearch: (e: Event) => void;
}) {
	const { t } = useTranslation();
	const [messages, setMessages] = createSignal<ChatMessage[]>([]);
	const [_isLoading, setIsLoading] = createSignal(true);

	const loadMessages = async () => {
		setIsLoading(true);
		const result = await getChatHistory({
			input: {
				userId: props.userId,
				platform: props.platform() || undefined,
				dateRange: props.dateRange() || undefined,
				search: props.search() || undefined,
			},
			fields: [...chatMessageFields],
			fetchOptions: { credentials: "include" },
		});

		if (result.success && result.data) {
			setMessages(result.data as ChatMessage[]);
		} else {
			setMessages([]);
		}
		setIsLoading(false);
	};

	// Load messages on mount and when filters change
	createEffect(() => {
		// Track reactive dependencies
		props.platform();
		props.dateRange();
		props.search();
		loadMessages();
	});

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleString();
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
			<Card>
				<h3 class={`${text.h3} mb-4`}>Filters</h3>

				<div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
					{/* Platform Filter */}
					<div>
						<label
							class="block font-medium text-gray-700 text-sm"
							for="chat-platform-filter">
							Platform
						</label>
						<Select
							class="mt-2"
							id="chat-platform-filter"
							onChange={(e) => {
								props.setPlatform(e.currentTarget.value as Platform);
							}}
							value={props.platform()}>
							<option value="">All Platforms</option>
							<option value="twitch">Twitch</option>
							<option value="youtube">YouTube</option>
							<option value="facebook">Facebook</option>
							<option value="kick">Kick</option>
						</Select>
					</div>

					{/* Date Range Filter */}
					<div>
						<label
							class="block font-medium text-gray-700 text-sm"
							for="chat-date-range">
							Date Range
						</label>
						<Select
							class="mt-2"
							id="chat-date-range"
							onChange={(e) => {
								props.setDateRange(e.currentTarget.value as DateRange);
							}}
							value={props.dateRange()}>
							<option value="">All Time</option>
							<option value="7days">Last 7 Days</option>
							<option value="30days">Last 30 Days</option>
							<option value="3months">Last 3 Months</option>
						</Select>
					</div>

					{/* Search */}
					<div>
						<label
							class="block font-medium text-gray-700 text-sm"
							for="chat-search">
							Search
						</label>
						<form onSubmit={props.handleSearch}>
							<Input
								class="mt-2"
								id="chat-search"
								onInput={(e) => props.setSearchInput(e.currentTarget.value)}
								placeholder={t("chatHistory.searchPlaceholder")}
								type="text"
								value={props.searchInput()}
							/>
						</form>
					</div>
				</div>

				{/* Active Filters Summary */}
				<Show when={props.platform() || props.dateRange() || props.search()}>
					<div class="flex items-center gap-2 text-gray-600 text-sm">
						<span class="font-medium">Active filters:</span>
						<Show when={props.platform()}>
							<Badge variant="info">{props.platform()}</Badge>
						</Show>
						<Show when={props.dateRange()}>
							<Badge variant="info">
								{props.dateRange() === "7days" && "Last 7 Days"}
								{props.dateRange() === "30days" && "Last 30 Days"}
								{props.dateRange() === "3months" && "Last 3 Months"}
							</Badge>
						</Show>
						<Show when={props.search()}>
							<Badge variant="info">"{props.search()}"</Badge>
						</Show>
						<button
							class="ml-2 font-medium text-purple-600 text-sm hover:text-purple-700"
							onClick={() => {
								props.setPlatform("");
								props.setDateRange("");
								props.setSearchInput("");
							}}
							type="button">
							Clear all
						</button>
					</div>
				</Show>
			</Card>

			{/* Messages List */}
			<Card>
				<h3 class={`${text.h3} mb-4`}>Messages</h3>

				<Show
					fallback={
						<div class="py-12 text-center text-gray-500">
							<svg
								aria-hidden="true"
								class="mx-auto mb-4 h-16 w-16 text-gray-400"
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
							<p class="font-medium text-gray-700 text-lg">
								No chat messages found
							</p>
							<p class="mt-2 text-gray-500 text-sm">
								{props.platform() || props.dateRange() || props.search()
									? "Try adjusting your filters or search criteria"
									: "Connect your streaming accounts to see chat messages"}
							</p>
						</div>
					}
					when={messages().length > 0}>
					<div class="space-y-3">
						<For each={messages()}>
							{(msg) => (
								<div class="rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50">
									<div class="flex items-start justify-between gap-3">
										<div class="min-w-0 flex-1">
											{/* Message Header */}
											<div class="mb-2 flex flex-wrap items-center gap-2">
												<Show
													fallback={
														<span class="font-semibold text-gray-900">
															{msg.senderUsername}
														</span>
													}
													when={msg.viewerId && msg.userId}>
													<A
														class="font-semibold text-purple-600 hover:text-purple-800 hover:underline"
														href={`/dashboard/viewers/${msg.viewerId}`}>
														{msg.senderUsername}
													</A>
												</Show>
												<Badge variant={getPlatformBadgeVariant(msg.platform)}>
													{msg.platform}
												</Badge>
												<Show when={msg.senderIsModerator}>
													<Badge variant="success">MOD</Badge>
												</Show>
												<Show when={msg.senderIsPatreon}>
													<Badge variant="warning">Patron</Badge>
												</Show>
												<span class={text.muted}>
													{formatDate(msg.insertedAt as string)}
												</span>
											</div>

											{/* Message Content */}
											<p class="wrap-break-word text-gray-700">{msg.message}</p>
										</div>
									</div>
								</div>
							)}
						</For>
					</div>
				</Show>
			</Card>
		</div>
	);
}
