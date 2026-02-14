import { A, useNavigate, useParams } from "@solidjs/router";
import { For, Show, createMemo, createResource } from "solid-js";
import { Alert, Badge, Card, Skeleton } from "~/design-system";
import { text } from "~/design-system/design-system";
import { useTranslation } from "~/i18n";
import { useAuthenticatedUser } from "~/lib/auth";
import { useBreadcrumbs } from "~/lib/BreadcrumbContext";
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

const chatFields = [
	"id",
	"type",
	{
		data: [
			{
				chatMessage: [
					"message",
					"username",
					"senderChannelId",
					"isModerator",
					"isPatreon",
					"isSentByStreamer",
					"deliveryStatus",
				],
			},
		],
	},
	"platform",
	"livestreamId",
	"insertedAt",
];

const eventFields = [
	"id",
	"type",
	{
		data: [
			{
				donation: [
					"donorName",
					"amount",
					"currency",
					"message",
					"platformDonationId",
					"username",
					"channelId",
					"amountMicros",
					"amountCents",
					"comment",
					"metadata",
				],
				follow: ["username", "displayName"],
				subscription: [
					"username",
					"tier",
					"months",
					"message",
					"channelId",
					"metadata",
				],
				raid: ["raiderName", "viewerCount", "message"],
				platformStarted: ["platform"],
				platformStopped: ["platform"],
			},
		],
	},
	"platform",
	"livestreamId",
	"insertedAt",
];

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
	type: string;
	data: {
		chatMessage: {
			message: string;
			username: string;
			senderChannelId?: string | null;
			isModerator?: boolean | null;
			isPatreon?: boolean | null;
			isSentByStreamer?: boolean | null;
			deliveryStatus?: Record<string, unknown> | null;
		} | null;
	};
	platform: string | null;
	livestreamId: string;
	insertedAt: string;
}

interface StreamEvent {
	id: string;
	type: string;
	data: {
		donation?: {
			donorName: string;
			amount: string;
			currency: string;
			message?: string | null;
			platformDonationId?: string | null;
			username?: string | null;
			channelId?: string | null;
			amountMicros?: string | null;
			amountCents?: number | null;
			comment?: string | null;
			metadata?: Record<string, unknown> | null;
		} | null;
		follow?: {
			username: string;
			displayName?: string | null;
		} | null;
		subscription?: {
			username: string;
			tier: string;
			months?: string | null;
			message?: string | null;
			channelId?: string | null;
			metadata?: Record<string, unknown> | null;
		} | null;
		raid?: {
			raiderName: string;
			viewerCount: string;
			message?: string | null;
		} | null;
		platformStarted?: {
			platform: string;
		} | null;
		platformStopped?: {
			platform: string;
		} | null;
	};
	platform: string | null;
	livestreamId: string;
	insertedAt: string;
}

// Helper functions
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
	const data = event.data;
	if (!data) return "—";

	if (data.donation) {
		return `${data.donation.donorName} donated ${data.donation.amount} ${data.donation.currency}${data.donation.message ? `: ${data.donation.message}` : ""}`;
	}
	if (data.follow) {
		return `${data.follow.displayName || data.follow.username} followed`;
	}
	if (data.subscription) {
		return `${data.subscription.username} subscribed (Tier ${data.subscription.tier})${data.subscription.message ? `: ${data.subscription.message}` : ""}`;
	}
	if (data.raid) {
		return `${data.raid.raiderName} raided with ${data.raid.viewerCount} viewers`;
	}
	if (data.platformStarted) {
		return `Stream started on ${data.platformStarted.platform}`;
	}
	if (data.platformStopped) {
		return `Stream stopped on ${data.platformStopped.platform}`;
	}

	return "—";
};

// Unified activity item for the combined timeline
type UnifiedActivity =
	| { kind: "chat"; item: ChatMessage }
	| { kind: "event"; item: StreamEvent };

const getActivityTimestamp = (activity: UnifiedActivity) =>
	activity.item.insertedAt;

const getActivityLivestreamId = (activity: UnifiedActivity) =>
	activity.item.livestreamId;

const getActivityTypeLabel = (activity: UnifiedActivity): string => {
	if (activity.kind === "chat") return "Chat";
	const data = activity.item.data;
	if (!data) return activity.item.type;
	if (data.donation) return "Donation";
	if (data.follow) return "Follow";
	if (data.subscription) return "Subscription";
	if (data.raid) return "Raid";
	if (data.platformStarted) return "Stream Started";
	if (data.platformStopped) return "Stream Stopped";
	return activity.item.type;
};

const getActivityIcon = (activity: UnifiedActivity): string => {
	if (activity.kind === "chat") return "💬";
	const data = activity.item.data;
	if (!data) return "•";
	if (data.donation) return "$";
	if (data.follow) return "+";
	if (data.subscription) return "★";
	if (data.raid) return "⚡";
	if (data.platformStarted) return "▶";
	if (data.platformStopped) return "■";
	return "•";
};

const getActivityColor = (activity: UnifiedActivity): string => {
	if (activity.kind === "chat") return "text-neutral-500";
	const data = activity.item.data;
	if (!data) return "text-neutral-400";
	if (data.donation) return "text-green-600";
	if (data.follow) return "text-blue-500";
	if (data.subscription) return "text-purple-500";
	if (data.raid) return "text-orange-500";
	if (data.platformStarted) return "text-green-500";
	if (data.platformStopped) return "text-red-500";
	return "text-neutral-400";
};

const getActivityContent = (activity: UnifiedActivity): string => {
	if (activity.kind === "chat") {
		return activity.item.data.chatMessage?.message ?? "";
	}
	return formatEventData(activity.item);
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
			<div class="rounded-lg bg-surface p-6 shadow">
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

			{/* Activity timeline skeleton */}
			<div class="rounded-lg border border-neutral-200 bg-surface shadow-sm">
				<div class="border-neutral-200 border-b px-6 py-4">
					<Skeleton class="h-6 w-32" />
				</div>
				<div class="divide-y divide-neutral-100">
					<For each={[1, 2, 3, 4, 5, 6, 7, 8]}>
						{() => (
							<div class="flex items-center gap-2 px-4 py-2">
								<Skeleton class="h-4 w-4 shrink-0 rounded" />
								<Skeleton class="h-4 flex-1" />
								<Skeleton class="h-3 w-14 shrink-0" />
							</div>
						)}
					</For>
				</div>
			</div>
		</div>
	);
}

export default function ViewerDetail() {
	const params = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { user: currentUser } = useAuthenticatedUser();
	const { t } = useTranslation();

	const viewerId = () => params.id;

	const [viewer] = createResource(
		() => {
			const u = currentUser();
			const vId = viewerId();
			if (!u?.id || !vId) return null;
			return { userId: u.id, viewerId: vId } as const;
		},
		async (params) => {
			const viewerResult = await listViewers({
				input: { userId: params.userId },
				fields: [...viewerFields],
				fetchOptions: { credentials: "include" },
			});

			if (!viewerResult.success) {
				throw new Error("Failed to load viewer data");
			}

			const foundViewer = viewerResult.data?.find(
				(v: StreamViewer) => v.viewerId === params.viewerId,
			);

			if (!foundViewer) {
				throw new Error("Viewer not found");
			}

			return foundViewer as StreamViewer;
		},
	);

	const [messages] = createResource(
		() => {
			const u = currentUser();
			const vId = viewerId();
			if (!u?.id || !vId) return null;
			return { userId: u.id, viewerId: vId } as const;
		},
		async (params) => {
			const result = await getViewerChat({
				input: { viewerId: params.viewerId, userId: params.userId },
				// biome-ignore lint/suspicious/noExplicitAny: field type mismatch with generated SDK
				fields: chatFields as any,
				fetchOptions: { credentials: "include" },
			});

			if (!result.success) {
				console.error("Error loading messages:", result.errors);
				return [];
			}

			return (result.data || []) as unknown as ChatMessage[];
		},
	);

	const [events] = createResource(
		() => {
			const u = currentUser();
			const vId = viewerId();
			if (!u?.id || !vId) return null;
			return { userId: u.id, viewerId: vId } as const;
		},
		async (params) => {
			const result = await getViewerEvents({
				input: { viewerId: params.viewerId, userId: params.userId },
				// biome-ignore lint/suspicious/noExplicitAny: field type mismatch with generated SDK
				fields: eventFields as any,
				fetchOptions: { credentials: "include" },
			});

			if (!result.success) {
				console.error("Error loading events:", result.errors);
				return [];
			}

			return (result.data || []) as unknown as StreamEvent[];
		},
	);

	// Merge messages and events into a single sorted timeline
	const timeline = createMemo<UnifiedActivity[]>(() => {
		const chatItems: UnifiedActivity[] = (messages() ?? []).map((m) => ({
			kind: "chat" as const,
			item: m,
		}));
		// Filter out chat_message events - they're already in the chat data
		const eventItems: UnifiedActivity[] = (events() ?? [])
			.filter((e) => e.type !== "chat_message")
			.map((e) => ({
				kind: "event" as const,
				item: e,
			}));
		return [...chatItems, ...eventItems].sort(
			(a, b) =>
				new Date(getActivityTimestamp(b)).getTime() -
				new Date(getActivityTimestamp(a)).getTime(),
		);
	});

	// Register breadcrumbs via context
	useBreadcrumbs(() => [
		{ label: t("dashboardNav.viewers"), href: "/dashboard/viewers" },
		{ label: viewer()?.displayName ?? t("common.loading") },
	]);

	return (
		<>
			<Show when={viewer.loading}>
				<ViewerDetailSkeleton />
			</Show>

			<Show when={viewer.error}>
				<Alert variant="error">
					<p>{viewer.error?.message}</p>
					<A class="mt-2 inline-block underline" href="/dashboard/viewers">
						← Back to Viewers
					</A>
				</Alert>
			</Show>

			<Show when={!viewer.loading && !viewer.error && viewer()}>
				<div class="space-y-6">
					{/* Header */}
					<div class="flex items-center justify-between">
						<div class="flex items-center space-x-4">
							<div class="flex items-center">
								<Show
									fallback={
										<div class="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-300">
											<span class="font-medium text-neutral-600 text-xl">
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
									<h1 class="font-bold text-2xl text-neutral-900">
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
								<dt class="font-medium text-neutral-500 text-sm">First Seen</dt>
								<dd class="mt-1 text-neutral-900 text-sm">
									{formatFullDate(viewer()?.firstSeenAt || "")}
								</dd>
							</div>
							<div>
								<dt class="font-medium text-neutral-500 text-sm">Last Seen</dt>
								<dd class="mt-1 text-neutral-900 text-sm">
									{formatFullDate(viewer()?.lastSeenAt || "")}
								</dd>
							</div>
							<Show when={viewer()?.notes}>
								<div>
									<dt class="font-medium text-neutral-500 text-sm">Notes</dt>
									<dd class="mt-1 text-neutral-900 text-sm">
										{viewer()?.notes}
									</dd>
								</div>
							</Show>
						</dl>
					</Card>

					{/* Activity Timeline */}
					<Card>
						<div class="border-neutral-200 border-b px-6 py-4">
							<h3 class={text.h3}>
								Activity
								<span class={`${text.muted} ml-2 text-sm`}>
									({timeline().length})
								</span>
							</h3>
						</div>
						<Show
							fallback={
								<div class="p-12 text-center">
									<svg
										aria-hidden="true"
										class="mx-auto h-12 w-12 text-neutral-400"
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
									<p class="mt-4 text-neutral-500">No activity yet</p>
									<p class="mt-1 text-neutral-400 text-sm">
										Messages, donations, and other events will appear here
									</p>
								</div>
							}
							when={timeline().length > 0}>
							<div class="divide-y divide-neutral-100">
								<For each={timeline()}>
									{(activity) => {
										const livestreamId = getActivityLivestreamId(activity);
										const content = getActivityContent(activity);
										const timestamp = getActivityTimestamp(activity);
										const isChat = activity.kind === "chat";

										return (
											<div class="flex items-start gap-2 px-4 py-2">
												<span
													class={`mt-px shrink-0 text-xs ${getActivityColor(activity)}`}>
													{getActivityIcon(activity)}
												</span>

												<div class="min-w-0 flex-1">
													<div class="flex items-baseline gap-1.5">
														<Show when={!isChat}>
															<span
																class={`font-medium text-xs ${getActivityColor(activity)}`}>
																{getActivityTypeLabel(activity)}
															</span>
														</Show>
														<span
															class={`flex-1 truncate text-sm ${isChat ? "text-foreground" : "text-neutral-600"}`}>
															{content || "—"}
														</span>
														<Show when={livestreamId}>
															<button
																class="shrink-0 text-neutral-400 text-xs hover:text-blue-500 hover:underline"
																onClick={() =>
																	navigate(
																		`/dashboard/stream-history/${livestreamId}`,
																	)
																}
																type="button">
																{formatDateTime(timestamp)}
															</button>
														</Show>
														<Show when={!livestreamId}>
															<span class="shrink-0 text-neutral-400 text-xs">
																{formatDateTime(timestamp)}
															</span>
														</Show>
													</div>
												</div>
											</div>
										);
									}}
								</For>
							</div>
						</Show>
					</Card>
				</div>
			</Show>
		</>
	);
}
