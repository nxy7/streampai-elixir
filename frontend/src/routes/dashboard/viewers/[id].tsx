import { Title } from "@solidjs/meta";
import { A, useNavigate, useParams } from "@solidjs/router";
import { For, Show, createSignal, onMount } from "solid-js";
import { Skeleton } from "~/components/ui";
import Badge from "~/components/ui/Badge";
import Card from "~/components/ui/Card";
import { useCurrentUser } from "~/lib/auth";
import { getViewerChat, getViewerEvents, listViewers } from "~/sdk/ash_rpc";
import { text } from "~/styles/design-system";

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
const getPlatformBadgeVariant = (
	platform: string,
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
	return variants[platform.toLowerCase()] || "neutral";
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
						<Skeleton circle class="h-12 w-12 shrink-0" />
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
						class="mt-2 inline-block text-red-600 underline hover:text-red-800"
						href="/dashboard/viewers">
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
								class="text-gray-500 hover:text-gray-700"
								href="/dashboard/viewers">
								<svg
									aria-hidden="true"
									class="h-6 w-6"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24">
									<path
										d="M10 19l-7-7m0 0l7-7m-7 7h18"
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
									/>
								</svg>
							</A>
							<div class="flex items-center">
								<Show
									fallback={
										<div class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-300 dark:bg-gray-600">
											<span class="font-medium text-gray-600 text-xl">
												{viewer()?.displayName.charAt(0).toUpperCase()}
											</span>
										</div>
									}
									when={viewer()?.avatarUrl}>
									<img
										alt={viewer()?.displayName}
										class="h-12 w-12 rounded-full"
										src={viewer()?.avatarUrl ?? ""}
									/>
								</Show>
								<div class="ml-4">
									<h1 class="font-bold text-2xl text-theme-primary">
										{viewer()?.displayName}
									</h1>
									<Show when={viewer()?.channelUrl}>
										<a
											class="text-blue-600 text-sm hover:underline"
											href={viewer()?.channelUrl ?? ""}
											target="_blank">
											View Channel
										</a>
									</Show>
								</div>
							</div>
						</div>
						<div class="flex items-center gap-2">
							<Show when={viewer()?.isVerified}>
								<Badge variant="info">Verified</Badge>
							</Show>
							<Show when={viewer()?.isOwner}>
								<Badge variant="info">Owner</Badge>
							</Show>
							<Show when={viewer()?.isModerator}>
								<Badge variant="success">Moderator</Badge>
							</Show>
							<Show when={viewer()?.isPatreon}>
								<Badge variant="warning">Patron</Badge>
							</Show>
						</div>
					</div>

					{/* Activity Info */}
					<Card class="p-6">
						<h3 class={`${text.h3} mb-4`}>Activity Info</h3>
						<dl class="space-y-3">
							<div>
								<dt class="font-medium text-theme-tertiary text-sm">First Seen</dt>
								<dd class="mt-1 text-theme-primary text-sm">
									{formatFullDate(viewer()?.firstSeenAt || "")}
								</dd>
							</div>
							<div>
								<dt class="font-medium text-theme-tertiary text-sm">Last Seen</dt>
								<dd class="mt-1 text-theme-primary text-sm">
									{formatFullDate(viewer()?.lastSeenAt || "")}
								</dd>
							</div>
							<Show when={viewer()?.notes}>
								<div>
									<dt class="font-medium text-theme-tertiary text-sm">Notes</dt>
									<dd class="mt-1 text-theme-primary text-sm">{viewer()?.notes}</dd>
								</div>
							</Show>
						</dl>
					</Card>

					{/* Recent Messages */}
					<Card>
						<div class="border-gray-200 border-b px-6 py-4">
							<h3 class={text.h3}>
								Recent Messages
								<span class={`${text.muted} ml-2 text-sm`}>
									({messages().length})
								</span>
							</h3>
						</div>
						<Show
							fallback={
								<div class="p-12 text-center">
									<svg
										aria-hidden="true"
										class="mx-auto h-12 w-12 text-gray-400"
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
									<p class="mt-4 text-gray-500">No messages yet</p>
									<p class="mt-1 text-theme-muted text-sm">
										Messages will appear here once this viewer chats
									</p>
								</div>
							}
							when={messages().length > 0}>
							<div class="divide-y divide-gray-200">
								<For each={messages()}>
									{(message) => (
										<div class="p-6">
											<div class="mb-1 flex items-center space-x-2">
												<Show when={message.platform}>
													<Badge
														variant={getPlatformBadgeVariant(
															message.platform ?? "",
														)}>
														{platformName(message.platform ?? "")}
													</Badge>
												</Show>
												<Show when={message.senderIsModerator}>
													<Badge variant="success">Moderator</Badge>
												</Show>
												<Show when={message.livestreamId}>
													<button
														class="text-blue-600 text-xs hover:underline"
														onClick={() =>
															navigate(
																`/dashboard/stream-history/${message.livestreamId}`,
															)
														}
														type="button">
														{formatDateTime(message.insertedAt)}
													</button>
												</Show>
												<Show when={!message.livestreamId}>
													<span class="text-theme-tertiary text-xs">
														{formatDateTime(message.insertedAt)}
													</span>
												</Show>
											</div>
											<p class="text-theme-secondary text-sm">{message.message}</p>
										</div>
									)}
								</For>
							</div>
						</Show>
					</Card>

					{/* Recent Events */}
					<Card>
						<div class="border-gray-200 border-b px-6 py-4">
							<h3 class={text.h3}>
								Recent Events
								<span class={`${text.muted} ml-2 text-sm`}>
									({events().length})
								</span>
							</h3>
						</div>
						<Show
							fallback={
								<div class="p-12 text-center">
									<svg
										aria-hidden="true"
										class="mx-auto h-12 w-12 text-gray-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24">
										<path
											d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
										/>
									</svg>
									<p class="mt-4 text-gray-500">No events yet</p>
									<p class="mt-1 text-theme-muted text-sm">
										Events like donations and subscriptions will appear here
									</p>
								</div>
							}
							when={events().length > 0}>
							<div class="divide-y divide-gray-200">
								<For each={events()}>
									{(event) => (
										<div class="p-6">
											<div class="mb-1 flex items-center space-x-2">
												<Badge variant="info">{event.type}</Badge>
												<Show when={event.platform}>
													<Badge
														variant={getPlatformBadgeVariant(
															event.platform ?? "",
														)}>
														{platformName(event.platform ?? "")}
													</Badge>
												</Show>
												<Show when={event.livestreamId}>
													<button
														class="text-blue-600 text-xs hover:underline"
														onClick={() =>
															navigate(
																`/dashboard/stream-history/${event.livestreamId}`,
															)
														}
														type="button">
														{formatDateTime(event.insertedAt)}
													</button>
												</Show>
												<Show when={!event.livestreamId}>
													<span class="text-theme-tertiary text-xs">
														{formatDateTime(event.insertedAt)}
													</span>
												</Show>
											</div>
											<p class="text-theme-secondary text-sm">
												{formatEventData(event)}
											</p>
										</div>
									)}
								</For>
							</div>
						</Show>
					</Card>
				</div>
			</Show>
		</>
	);
}
