import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";
import {
	createEffect,
	createSignal,
	ErrorBoundary,
	For,
	Show,
	Suspense,
} from "solid-js";
import LoadingIndicator from "~/components/LoadingIndicator";
import { getLoginUrl, useCurrentUser } from "~/lib/auth";
import { getChatHistory } from "~/sdk/ash_rpc";
import { badge, card, input, text } from "~/styles/design-system";

type Platform = "twitch" | "youtube" | "facebook" | "kick" | "";
type DateRange = "7days" | "30days" | "3months" | "";

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
				when={user()}
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
								href={getLoginUrl()}
								class="inline-block rounded-lg bg-linear-to-r from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white transition-all hover:from-purple-600 hover:to-pink-600"
							>
								Sign In
							</a>
						</div>
					</div>
				}
			>
				<ErrorBoundary
					fallback={(err) => (
						<div class="mx-auto mt-8 max-w-6xl">
							<div class="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
								Error loading chat messages: {err.message}
							</div>
						</div>
					)}
				>
					<Suspense fallback={<LoadingIndicator />}>
						<ChatHistoryContent
							userId={user()?.id}
							platform={platform}
							setPlatform={setPlatform}
							dateRange={dateRange}
							setDateRange={setDateRange}
							search={search}
							searchInput={searchInput}
							setSearchInput={setSearchInput}
							handleSearch={handleSearch}
						/>
					</Suspense>
				</ErrorBoundary>
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

	const getPlatformBadgeColor = (platformName: string) => {
		const colors = {
			twitch: badge.info,
			youtube: badge.error,
			facebook: badge.info,
			kick: badge.success,
		};
		return (
			colors[platformName.toLowerCase() as keyof typeof colors] || badge.neutral
		);
	};

	return (
		<div class="mx-auto max-w-6xl space-y-6">
			{/* Filters Section */}
			<div class={card.default}>
				<h3 class={`${text.h3} mb-4`}>Filters</h3>

				<div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
					{/* Platform Filter */}
					<div>
						<label class="block font-medium text-gray-700 text-sm">
							Platform
							<select
								class={`mt-2 ${input.select}`}
								value={props.platform()}
								onChange={(e) => {
									props.setPlatform(e.currentTarget.value as Platform);
								}}
							>
								<option value="">All Platforms</option>
								<option value="twitch">Twitch</option>
								<option value="youtube">YouTube</option>
								<option value="facebook">Facebook</option>
								<option value="kick">Kick</option>
							</select>
						</label>
					</div>

					{/* Date Range Filter */}
					<div>
						<label class="block font-medium text-gray-700 text-sm">
							Date Range
							<select
								class={`mt-2 ${input.select}`}
								value={props.dateRange()}
								onChange={(e) => {
									props.setDateRange(e.currentTarget.value as DateRange);
								}}
							>
								<option value="">All Time</option>
								<option value="7days">Last 7 Days</option>
								<option value="30days">Last 30 Days</option>
								<option value="3months">Last 3 Months</option>
							</select>
						</label>
					</div>

					{/* Search */}
					<div>
						<label class="block font-medium text-gray-700 text-sm">
							Search
							<form onSubmit={props.handleSearch}>
								<input
									type="text"
									class={`mt-2 ${input.text}`}
									placeholder="Search messages..."
									value={props.searchInput()}
									onInput={(e) => props.setSearchInput(e.currentTarget.value)}
								/>
							</form>
						</label>
					</div>
				</div>

				{/* Active Filters Summary */}
				<Show when={props.platform() || props.dateRange() || props.search()}>
					<div class="flex items-center gap-2 text-gray-600 text-sm">
						<span class="font-medium">Active filters:</span>
						<Show when={props.platform()}>
							<span class={badge.info}>{props.platform()}</span>
						</Show>
						<Show when={props.dateRange()}>
							<span class={badge.info}>
								{props.dateRange() === "7days" && "Last 7 Days"}
								{props.dateRange() === "30days" && "Last 30 Days"}
								{props.dateRange() === "3months" && "Last 3 Months"}
							</span>
						</Show>
						<Show when={props.search()}>
							<span class={badge.info}>"{props.search()}"</span>
						</Show>
						<button
							type="button"
							class="ml-2 font-medium text-purple-600 text-sm hover:text-purple-700"
							onClick={() => {
								props.setPlatform("");
								props.setDateRange("");
								props.setSearchInput("");
							}}
						>
							Clear all
						</button>
					</div>
				</Show>
			</div>

			{/* Messages List */}
			<div class={card.default}>
				<h3 class={`${text.h3} mb-4`}>Messages</h3>

				<Show
					when={messages().length > 0}
					fallback={
						<div class="py-12 text-center text-gray-500">
							<svg
								aria-hidden="true"
								class="mx-auto mb-4 h-16 w-16 text-gray-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
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
				>
					<div class="space-y-3">
						<For each={messages()}>
							{(msg) => (
								<div class="rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50">
									<div class="flex items-start justify-between gap-3">
										<div class="min-w-0 flex-1">
											{/* Message Header */}
											<div class="mb-2 flex flex-wrap items-center gap-2">
												<Show
													when={msg.viewerId && msg.userId}
													fallback={
														<span class="font-semibold text-gray-900">
															{msg.senderUsername}
														</span>
													}
												>
													<A
														href={`/dashboard/viewers/${msg.viewerId}`}
														class="font-semibold text-purple-600 hover:text-purple-800 hover:underline"
													>
														{msg.senderUsername}
													</A>
												</Show>
												<span class={getPlatformBadgeColor(msg.platform)}>
													{msg.platform}
												</span>
												<Show when={msg.senderIsModerator}>
													<span class={badge.success}>MOD</span>
												</Show>
												<Show when={msg.senderIsPatreon}>
													<span class="inline-flex items-center rounded-full bg-pink-100 px-2.5 py-0.5 font-medium text-pink-800 text-xs">
														Patron
													</span>
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
			</div>
		</div>
	);
}
