import { Title } from "@solidjs/meta";
import { A, useNavigate, useParams } from "@solidjs/router";
import { createSignal, For, onMount, Show } from "solid-js";
import { Skeleton, SkeletonListItem } from "~/components/ui";
import { useCurrentUser } from "~/lib/auth";
import { getViewerChat, getViewerEvents, listViewers } from "~/sdk/ash_rpc";

const viewerFields: (
	| "viewerId"
	| "userId"
	| "platform"
	| "displayName"
	| "avatarUrl"
	| "channelUrl"
	| "isVerified"
	| "isOwner"
	| "isModerator"
	| "isPatreon"
	| "notes"
	| "aiSummary"
	| "firstSeenAt"
	| "lastSeenAt"
)[] = [
	"viewerId",
	"userId",
	"platform",
	"displayName",
	"avatarUrl",
	"channelUrl",
	"isVerified",
	"isOwner",
	"isModerator",
	"isPatreon",
	"notes",
	"aiSummary",
	"firstSeenAt",
	"lastSeenAt",
];

const chatFields: (
	| "id"
	| "message"
	| "senderUsername"
	| "platform"
	| "senderIsModerator"
	| "senderIsPatreon"
	| "livestreamId"
	| "insertedAt"
)[] = [
	"id",
	"message",
	"senderUsername",
	"platform",
	"senderIsModerator",
	"senderIsPatreon",
	"livestreamId",
	"insertedAt",
];

const eventFields: (
	| "id"
	| "type"
	| "data"
	| "platform"
	| "livestreamId"
	| "insertedAt"
)[] = ["id", "type", "data", "platform", "livestreamId", "insertedAt"];

interface StreamViewer {
	viewerId: string;
	userId: string;
	platform: string;
	displayName: string;
	avatarUrl: string | null;
	channelUrl: string | null;
	isVerified: boolean | null;
	isOwner: boolean | null;
	isModerator: boolean | null;
	isPatreon: boolean | null;
	notes: string | null;
	aiSummary: string | null;
	firstSeenAt: string;
	lastSeenAt: string;
}

interface ChatMessage {
	id: string;
	message: string;
	senderUsername: string;
	platform: string;
	senderIsModerator: boolean | null;
	senderIsPatreon: boolean | null;
	livestreamId: string;
	insertedAt: string;
}

interface StreamEvent {
	id: string;
	type: string;
	data: Record<string, unknown>;
	platform: string | null;
	livestreamId: string;
	insertedAt: string;
}

// Helper functions
const platformBadgeColor = (platform: string) => {
	const colors: Record<string, string> = {
		twitch: "bg-purple-100 text-purple-800",
		youtube: "bg-red-100 text-red-800",
		facebook: "bg-blue-100 text-blue-800",
		kick: "bg-green-100 text-green-800",
	};
	return colors[platform.toLowerCase()] || "bg-gray-100 text-gray-800";
};

const platformName = (platform: string) => {
	const names: Record<string, string> = {
		twitch: "Twitch",
		youtube: "YouTube",
		facebook: "Facebook",
		kick: "Kick",
	};
	return names[platform.toLowerCase()] || platform;
};

const formatDateTime = (datetime: string) => {
	const date = new Date(datetime);
	const now = new Date();
	const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

	if (diffSeconds < 60) return "just now";
	if (diffSeconds < 3600) {
		const minutes = Math.floor(diffSeconds / 60);
		return `${minutes}m ago`;
	}
	if (diffSeconds < 86400) {
		const hours = Math.floor(diffSeconds / 3600);
		return `${hours}h ago`;
	}
	if (diffSeconds < 604800) {
		const days = Math.floor(diffSeconds / 86400);
		return `${days}d ago`;
	}

	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
};

const formatFullDate = (datetime: string) => {
	const date = new Date(datetime);
	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
};

const formatEventData = (event: StreamEvent) => {
	if (!event.data || typeof event.data !== "object") return "—";

	return Object.entries(event.data)
		.map(([key, value]) => `${key}: ${value}`)
		.join(", ");
};

// Skeleton for viewer detail page
function ViewerDetailSkeleton() {
	return (
		<div class="space-y-6">
			{/* Header skeleton */}
			<div class="flex items-center justify-between">
				<div class="flex items-center space-x-4">
					<Skeleton class="h-6 w-6" />
					<div class="flex items-center">
						<Skeleton class="h-12 w-12 shrink-0" circle />
						<div class="ml-4 space-y-2">
							<Skeleton class="h-8 w-48" />
							<Skeleton class="h-4 w-24" />
						</div>
					</div>
				</div>
				<div class="flex items-center gap-2">
					<Skeleton class="h-7 w-20 rounded-full" />
					<Skeleton class="h-7 w-24 rounded-full" />
				</div>
			</div>

			{/* Activity Info skeleton */}
			<div class="rounded-lg bg-white p-6 shadow">
				<Skeleton class="mb-4 h-6 w-28" />
				<div class="space-y-3">
					<For each={[1, 2]}>
						{() => (
							<div>
								<Skeleton class="mb-1 h-4 w-20" />
								<Skeleton class="h-4 w-40" />
							</div>
						)}
					</For>
				</div>
			</div>

			{/* Recent Messages skeleton */}
			<div class="rounded-lg border border-gray-200 bg-white shadow-sm">
				<div class="border-gray-200 border-b px-6 py-4">
					<Skeleton class="h-6 w-40" />
				</div>
				<div class="divide-y divide-gray-200">
					<For each={[1, 2, 3, 4, 5]}>
						{() => (
							<div class="p-6">
								<div class="mb-1 flex items-center space-x-2">
									<Skeleton class="h-5 w-16 rounded" />
									<Skeleton class="h-4 w-24" />
								</div>
								<Skeleton class="mt-2 h-4 w-full" />
								<Skeleton class="mt-1 h-4 w-3/4" />
							</div>
						)}
					</For>
				</div>
			</div>

			{/* Recent Events skeleton */}
			<div class="rounded-lg border border-gray-200 bg-white shadow-sm">
				<div class="border-gray-200 border-b px-6 py-4">
					<Skeleton class="h-6 w-32" />
				</div>
				<div class="divide-y divide-gray-200">
					<For each={[1, 2, 3]}>
						{() => (
							<div class="p-6">
								<div class="mb-1 flex items-center space-x-2">
									<Skeleton class="h-5 w-20 rounded" />
									<Skeleton class="h-5 w-16 rounded" />
									<Skeleton class="h-4 w-24" />
								</div>
								<Skeleton class="mt-2 h-4 w-2/3" />
							</div>
						)}
					</For>
				</div>
			</div>
		</div>
	);
}

export default function ViewerDetail() {
	const params = useParams();
	const navigate = useNavigate();
	const { user: currentUser } = useCurrentUser();

	const [viewer, setViewer] = createSignal<StreamViewer | null>(null);
	const [messages, setMessages] = createSignal<ChatMessage[]>([]);
	const [events, setEvents] = createSignal<StreamEvent[]>([]);
	const [loading, setLoading] = createSignal(true);
	const [error, setError] = createSignal<string | null>(null);

	const viewerId = () => params.id;

	onMount(async () => {
		const user = currentUser();
		if (!user) {
			navigate("/sign-in");
			return;
		}

		const vId = viewerId();
		if (!vId) {
			setError("Invalid viewer ID");
			setLoading(false);
			return;
		}

		try {
			setLoading(true);

			const viewerResult = await listViewers({
				input: { userId: user.id },
				fields: [...viewerFields],
				fetchOptions: { credentials: "include" },
			});

			if (!viewerResult.success) {
				setError("Failed to load viewer data");
				console.error("RPC error:", viewerResult.errors);
				setLoading(false);
				return;
			}

			const foundViewer = viewerResult.data?.find(
				(v: StreamViewer) => v.viewerId === vId,
			);

			if (!foundViewer) {
				setError("Viewer not found");
				setLoading(false);
				return;
			}

			setViewer(foundViewer as StreamViewer);

			const [messagesResult, eventsResult] = await Promise.all([
				getViewerChat({
					input: { viewerId: vId, userId: user.id },
					fields: [...chatFields],
					fetchOptions: { credentials: "include" },
				}),
				getViewerEvents({
					input: { viewerId: vId, userId: user.id },
					fields: [...eventFields],
					fetchOptions: { credentials: "include" },
				}),
			]);

			if (!messagesResult.success) {
				console.error("Error loading messages:", messagesResult.errors);
			} else {
				setMessages((messagesResult.data || []) as ChatMessage[]);
			}

			if (!eventsResult.success) {
				console.error("Error loading events:", eventsResult.errors);
			} else {
				setEvents((eventsResult.data || []) as StreamEvent[]);
			}
		} catch (err) {
			console.error("Error loading viewer details:", err);
			setError("Failed to load viewer details");
		} finally {
			setLoading(false);
		}
	});

	return (
		<>
			<Title>Viewer Details - Streampai</Title>

			<Show when={loading()}>
				<ViewerDetailSkeleton />
			</Show>

			<Show when={error()}>
				<div class="rounded-lg border border-red-200 bg-red-50 p-4">
					<p class="text-red-800">{error()}</p>
					<A
						href="/dashboard/viewers"
						class="mt-2 inline-block text-red-600 underline hover:text-red-800">
						← Back to Viewers
					</A>
				</div>
			</Show>

			<Show when={!loading() && !error() && viewer()}>
				<div class="space-y-6">
					{/* Header */}
					<div class="flex items-center justify-between">
						<div class="flex items-center space-x-4">
							<A
								href="/dashboard/viewers"
								class="text-gray-500 hover:text-gray-700">
								<svg
									aria-hidden="true"
									class="h-6 w-6"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M10 19l-7-7m0 0l7-7m-7 7h18"
									/>
								</svg>
							</A>
							<div class="flex items-center">
								<Show
									when={viewer()?.avatarUrl}
									fallback={
										<div class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-300">
											<span class="font-medium text-gray-600 text-xl">
												{viewer()?.displayName.charAt(0).toUpperCase()}
											</span>
										</div>
									}>
									<img
										class="h-12 w-12 rounded-full"
										src={viewer()?.avatarUrl ?? ""}
										alt={viewer()?.displayName}
									/>
								</Show>
								<div class="ml-4">
									<h1 class="font-bold text-2xl text-gray-900">
										{viewer()?.displayName}
									</h1>
									<Show when={viewer()?.channelUrl}>
										<a
											href={viewer()?.channelUrl ?? ""}
											target="_blank"
											class="text-blue-600 text-sm hover:underline">
											View Channel
										</a>
									</Show>
								</div>
							</div>
						</div>
						<div class="flex items-center gap-2">
							<Show when={viewer()?.isVerified}>
								<span class="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-800 text-sm">
									Verified
								</span>
							</Show>
							<Show when={viewer()?.isOwner}>
								<span class="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 font-medium text-purple-800 text-sm">
									Owner
								</span>
							</Show>
							<Show when={viewer()?.isModerator}>
								<span class="inline-flex items-center rounded-full bg-green-100 px-3 py-1 font-medium text-green-800 text-sm">
									Moderator
								</span>
							</Show>
							<Show when={viewer()?.isPatreon}>
								<span class="inline-flex items-center rounded-full bg-pink-100 px-3 py-1 font-medium text-pink-800 text-sm">
									Patron
								</span>
							</Show>
						</div>
					</div>

					{/* Activity Info */}
					<div class="rounded-lg bg-white p-6 shadow">
						<h3 class="mb-4 font-medium text-gray-900 text-lg">
							Activity Info
						</h3>
						<dl class="space-y-3">
							<div>
								<dt class="font-medium text-gray-500 text-sm">First Seen</dt>
								<dd class="mt-1 text-gray-900 text-sm">
									{formatFullDate(viewer()?.firstSeenAt || "")}
								</dd>
							</div>
							<div>
								<dt class="font-medium text-gray-500 text-sm">Last Seen</dt>
								<dd class="mt-1 text-gray-900 text-sm">
									{formatFullDate(viewer()?.lastSeenAt || "")}
								</dd>
							</div>
							<Show when={viewer()?.notes}>
								<div>
									<dt class="font-medium text-gray-500 text-sm">Notes</dt>
									<dd class="mt-1 text-gray-900 text-sm">{viewer()?.notes}</dd>
								</div>
							</Show>
						</dl>
					</div>

					{/* Recent Messages */}
					<div class="rounded-lg border border-gray-200 bg-white shadow-sm">
						<div class="border-gray-200 border-b px-6 py-4">
							<h3 class="font-medium text-gray-900 text-lg">
								Recent Messages
								<span class="ml-2 text-gray-500 text-sm">
									({messages().length})
								</span>
							</h3>
						</div>
						<Show
							when={messages().length > 0}
							fallback={
								<div class="p-12 text-center">
									<svg
										aria-hidden="true"
										class="mx-auto h-12 w-12 text-gray-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
										/>
									</svg>
									<p class="mt-4 text-gray-500">No messages yet</p>
									<p class="mt-1 text-gray-400 text-sm">
										Messages will appear here once this viewer chats
									</p>
								</div>
							}>
							<div class="divide-y divide-gray-200">
								<For each={messages()}>
									{(message) => (
										<div class="p-6">
											<div class="mb-1 flex items-center space-x-2">
												<Show when={message.platform}>
													<span
														class={`inline-flex items-center rounded px-2 py-0.5 font-medium text-xs ${platformBadgeColor(
															message.platform ?? "",
														)}`}>
														{platformName(message.platform ?? "")}
													</span>
												</Show>
												<Show when={message.senderIsModerator}>
													<span class="inline-flex items-center rounded bg-green-100 px-2 py-0.5 font-medium text-green-800 text-xs">
														Moderator
													</span>
												</Show>
												<Show when={message.livestreamId}>
													<button
														type="button"
														onClick={() =>
															navigate(
																`/dashboard/stream-history/${message.livestreamId}`,
															)
														}
														class="text-blue-600 text-xs hover:underline">
														{formatDateTime(message.insertedAt)}
													</button>
												</Show>
												<Show when={!message.livestreamId}>
													<span class="text-gray-500 text-xs">
														{formatDateTime(message.insertedAt)}
													</span>
												</Show>
											</div>
											<p class="text-gray-600 text-sm">{message.message}</p>
										</div>
									)}
								</For>
							</div>
						</Show>
					</div>

					{/* Recent Events */}
					<div class="rounded-lg border border-gray-200 bg-white shadow-sm">
						<div class="border-gray-200 border-b px-6 py-4">
							<h3 class="font-medium text-gray-900 text-lg">
								Recent Events
								<span class="ml-2 text-gray-500 text-sm">
									({events().length})
								</span>
							</h3>
						</div>
						<Show
							when={events().length > 0}
							fallback={
								<div class="p-12 text-center">
									<svg
										aria-hidden="true"
										class="mx-auto h-12 w-12 text-gray-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
									<p class="mt-4 text-gray-500">No events yet</p>
									<p class="mt-1 text-gray-400 text-sm">
										Events like donations and subscriptions will appear here
									</p>
								</div>
							}>
							<div class="divide-y divide-gray-200">
								<For each={events()}>
									{(event) => (
										<div class="p-6">
											<div class="mb-1 flex items-center space-x-2">
												<span class="inline-flex items-center rounded bg-purple-100 px-2 py-0.5 font-medium text-purple-800 text-xs">
													{event.type}
												</span>
												<Show when={event.platform}>
													<span
														class={`inline-flex items-center rounded px-2 py-0.5 font-medium text-xs ${platformBadgeColor(
															event.platform ?? "",
														)}`}>
														{platformName(event.platform ?? "")}
													</span>
												</Show>
												<Show when={event.livestreamId}>
													<button
														type="button"
														onClick={() =>
															navigate(
																`/dashboard/stream-history/${event.livestreamId}`,
															)
														}
														class="text-blue-600 text-xs hover:underline">
														{formatDateTime(event.insertedAt)}
													</button>
												</Show>
												<Show when={!event.livestreamId}>
													<span class="text-gray-500 text-xs">
														{formatDateTime(event.insertedAt)}
													</span>
												</Show>
											</div>
											<p class="text-gray-600 text-sm">
												{formatEventData(event)}
											</p>
										</div>
									)}
								</For>
							</div>
						</Show>
					</div>
				</div>
			</Show>
		</>
	);
}
