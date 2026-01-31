import type { Collection, CollectionStatus } from "@tanstack/db";
import { useLiveQuery } from "@tanstack/solid-db";
import type { Accessor } from "solid-js";
import { createMemo } from "solid-js";
import {
	type ActorState,
	type CurrentStreamData,
	type HighlightedMessage,
	type Livestream,
	type Notification,
	type NotificationRead,
	type StreamEvent,
	type StreamingAccount,
	type UserPreferences,
	type UserRole,
	type Viewer,
	type WidgetConfig,
	type WidgetType,
	createCurrentStreamDataCollection,
	createHighlightedMessagesCollection,
	createNotificationReadsCollection,
	createNotificationsCollection,
	createStreamingAccountsCollection,
	createUserPreferencesCollection,
	createUserRolesCollection,
	createUserScopedLivestreamsCollection,
	createUserScopedStreamEventsCollection,
	createUserScopedViewersCollection,
	createWidgetConfigsCollection,
	globalNotificationsCollection,
	livestreamsCollection,
	streamEventsCollection,
	viewersCollection,
} from "./electric";
import { sortByInsertedAt } from "./formatters";

type CollectionFactory<T> = (userId: string) => T;

function createCollectionCache<T>(factory: CollectionFactory<T>) {
	const cache = new Map<string, T>();
	return (userId: string): T => {
		let collection = cache.get(userId);
		if (!collection) {
			collection = factory(userId);
			cache.set(userId, collection);
		}
		return collection;
	};
}

/**
 * Creates a user-scoped hook from a collection factory.
 * Eliminates boilerplate by generating the cache + hook pattern automatically.
 *
 * @param createCollection - Factory function that creates a collection for a userId
 * @returns Hook function that accepts userId accessor and returns live query result with data defaulting to []
 */
function createUserScopedHook<TResult extends object>(
	createCollection: (
		userId: string,
	) => Collection<TResult, string | number, object>,
) {
	const getCollection = createCollectionCache(createCollection);

	return (userId: () => string | undefined) => {
		const query = useOptionalLiveQuery(() => {
			const currentId = userId();
			return currentId ? getCollection(currentId) : undefined;
		});

		return {
			...query,
			data: createMemo(() => query.data ?? []),
		};
	};
}

/**
 * Return type for useOptionalLiveQuery - matches useLiveQuery but with optional collection.
 * Derived from useLiveQuery's return type but adds 'disabled' status and nullable collection.
 */
type OptionalLiveQueryResult<TResult extends object> = Omit<
	ReturnType<typeof useLiveQuery<TResult, string | number, object>>,
	"status" | "collection"
> & {
	status: Accessor<CollectionStatus | "disabled">;
	collection: Accessor<Collection<TResult, string | number, object> | null>;
};

/**
 * Wrapper for useLiveQuery that supports returning undefined from the accessor.
 * The useLiveQuery runtime handles undefined (sets status to 'disabled', returns empty data,
 * makes no network requests), but TypeScript types don't expose this for collection accessors.
 *
 * This wrapper:
 * 1. Accepts accessors that may return undefined
 * 2. Returns properly typed result with 'disabled' status possibility
 * 3. Localizes the type assertion to a single place
 */
function useOptionalLiveQuery<TResult extends object>(
	accessor: () => Collection<TResult, string | number, object> | undefined,
): OptionalLiveQueryResult<TResult> {
	return useLiveQuery(
		accessor as () => Collection<TResult, string | number, object>,
	);
}

function useStreamEvents() {
	return useLiveQuery(() => streamEventsCollection);
}

function _useLivestreams() {
	return useLiveQuery(() => livestreamsCollection);
}

function _useViewers() {
	return useLiveQuery(() => viewersCollection);
}

function _useFilteredStreamEvents(eventType: string) {
	const query = useStreamEvents();
	return {
		...query,
		data: createMemo(() =>
			(query.data ?? []).filter((e) => e.type === eventType),
		),
	};
}

// Cache for user-scoped preferences collection (uses IndexedDB persistence)
const getUserPreferencesCollection = createCollectionCache(
	createUserPreferencesCollection,
);

export function useUserPreferencesForUser(userId: () => string | undefined) {
	const query = useOptionalLiveQuery(() => {
		const currentId = userId();
		return currentId ? getUserPreferencesCollection(currentId) : undefined;
	});

	return {
		...query,
		data: createMemo(() => {
			const id = userId();
			if (!id) return null;
			return (query.data ?? []).find((p) => p.id === id) ?? null;
		}),
	};
}

export const useUserStreamEvents = createUserScopedHook(
	createUserScopedStreamEventsCollection,
);

export function useRecentUserStreamEvents(
	userId: () => string | undefined,
	limit = 10,
) {
	const query = useUserStreamEvents(userId);
	return createMemo(() => sortByInsertedAt(query.data()).slice(0, limit));
}

export const useUserLivestreams = createUserScopedHook(
	createUserScopedLivestreamsCollection,
);

export function useRecentUserLivestreams(
	userId: () => string | undefined,
	limit = 5,
) {
	const query = useUserLivestreams(userId);
	return createMemo(() => sortByInsertedAt(query.data()).slice(0, limit));
}

export const useUserViewers = createUserScopedHook(
	createUserScopedViewersCollection,
);

export function useDashboardStats(userId: () => string | undefined) {
	const eventsQuery = useUserStreamEvents(userId);
	const viewersQuery = useUserViewers(userId);
	const streamsQuery = useUserLivestreams(userId);

	return {
		totalMessages: createMemo(() => {
			return eventsQuery.data().filter((e) => e.type === "chat_message").length;
		}),
		totalEvents: createMemo(() => eventsQuery.data().length),
		uniqueViewers: createMemo(() => viewersQuery.data().length),
		totalStreams: createMemo(() => streamsQuery.data().length),
		totalDonations: createMemo(() => {
			const events = eventsQuery.data();
			return events
				.filter((e) => e.type === "donation")
				.reduce((sum, e) => sum + (Number(e.data?.amount) || 0), 0);
		}),
		donationCount: createMemo(() => {
			return eventsQuery.data().filter((e) => e.type === "donation").length;
		}),
		followCount: createMemo(() => {
			return eventsQuery.data().filter((e) => e.type === "follow").length;
		}),
	};
}

const useWidgetConfigs = createUserScopedHook(createWidgetConfigsCollection);

export function useWidgetConfig<T = Record<string, unknown>>(
	userId: () => string | undefined,
	widgetType: () => WidgetType,
) {
	const query = useWidgetConfigs(userId);

	return {
		...query,
		data: createMemo(() => {
			if (!userId()) return null;
			const type = widgetType();
			const configs = query.data();
			const config = configs.find((c) => c.type === type);
			return config ? { ...config, config: config.config as T } : null;
		}),
	};
}

export const useNotifications = createUserScopedHook(
	createNotificationsCollection,
);
export const useNotificationReads = createUserScopedHook(
	createNotificationReadsCollection,
);

export type NotificationWithReadStatus = {
	id: string;
	user_id: string | null;
	content: string;
	inserted_at: string;
	wasSeen: boolean;
	seenAt: string | null;
	localizedContent: string;
};

/**
 * Returns notifications with read status and localized content.
 * Localized content is stored directly in notification columns (content_de, content_pl, content_es).
 * If a localization for the given locale exists, it will be used.
 * Otherwise, falls back to the default (English) content.
 */
export function useNotificationsWithReadStatus(
	userId: () => string | undefined,
	locale?: () => string,
): {
	data: () => NotificationWithReadStatus[];
	unreadCount: () => number | null;
	isLoading: () => boolean;
} {
	const notificationsQuery = useNotifications(userId);
	const readsQuery = useNotificationReads(userId);

	const isLoading = createMemo(
		() => notificationsQuery.isLoading() || readsQuery.isLoading(),
	);

	return {
		data: createMemo((): NotificationWithReadStatus[] => {
			const notifications = notificationsQuery.data();
			const reads = readsQuery.data();
			const currentLocale = locale?.() || "en";

			const readMap = new Map(reads.map((r) => [r.notification_id, r.seen_at]));

			const withStatus = notifications.map((n): NotificationWithReadStatus => {
				// Build localizations from notification columns
				const notificationLocs: Record<string, string> = {};
				if (n.content_de) notificationLocs.de = n.content_de;
				if (n.content_pl) notificationLocs.pl = n.content_pl;
				if (n.content_es) notificationLocs.es = n.content_es;

				// Use localized content if available, otherwise fall back to default content
				const localizedContent = notificationLocs[currentLocale] || n.content;

				return {
					id: n.id,
					user_id: n.user_id,
					content: n.content,
					inserted_at: n.inserted_at,
					wasSeen: readMap.has(n.id),
					seenAt: readMap.get(n.id) || null,
					localizedContent,
				};
			});
			return sortByInsertedAt(withStatus);
		}),
		unreadCount: createMemo(() => {
			// Return null while either shape is still loading to prevent blinking
			if (isLoading()) return null;
			const notifications = notificationsQuery.data();
			const reads = readsQuery.data();
			const readIds = new Set(reads.map((r) => r.notification_id));
			return notifications.filter((n) => !readIds.has(n.id)).length;
		}),
		isLoading,
	};
}

export function useGlobalNotifications() {
	const query = useLiveQuery(() => globalNotificationsCollection);
	return {
		...query,
		data: createMemo(() => sortByInsertedAt(query.data ?? [])),
	};
}

export const useUserRoles = createUserScopedHook(createUserRolesCollection);

export type UserRolesData = {
	pendingInvitations: UserRole[];
	myAcceptedRoles: UserRole[];
	rolesIGranted: UserRole[];
	pendingInvitationsSent: UserRole[];
};

export function useUserRolesData(userId: () => string | undefined): {
	data: () => UserRolesData;
	isLoading: () => boolean;
} {
	const rolesQuery = useUserRoles(userId);

	return {
		data: createMemo((): UserRolesData => {
			const roles = rolesQuery.data();
			const currentUserId = userId();

			if (!currentUserId) {
				return {
					pendingInvitations: [],
					myAcceptedRoles: [],
					rolesIGranted: [],
					pendingInvitationsSent: [],
				};
			}

			return {
				// Invitations sent to me that are pending
				pendingInvitations: roles.filter(
					(r) => r.user_id === currentUserId && r.role_status === "pending",
				),
				// Roles I have (accepted) in other channels
				myAcceptedRoles: roles.filter(
					(r) => r.user_id === currentUserId && r.role_status === "accepted",
				),
				// Roles I've granted to others (accepted)
				rolesIGranted: roles.filter(
					(r) => r.granter_id === currentUserId && r.role_status === "accepted",
				),
				// Pending invitations I've sent to others
				pendingInvitationsSent: roles.filter(
					(r) => r.granter_id === currentUserId && r.role_status === "pending",
				),
			};
		}),
		isLoading: () => !rolesQuery.data,
	};
}

export const useStreamingAccounts = createUserScopedHook(
	createStreamingAccountsCollection,
);

export function useHighlightedMessage(userId: () => string | undefined) {
	const getHighlightedMessagesCollection = createCollectionCache(
		createHighlightedMessagesCollection,
	);
	const query = useOptionalLiveQuery(() => {
		const currentId = userId();
		return currentId ? getHighlightedMessagesCollection(currentId) : undefined;
	});

	return {
		...query,
		data: createMemo(() => {
			if (!userId()) return null;
			const messages = (query.data ?? []) as HighlightedMessage[];
			// Return the first (and should be only) highlighted message, or null
			return messages.length > 0 ? messages[0] : null;
		}),
	};
}

export function useStreamActor(userId: () => string | undefined) {
	const getCurrentStreamDataCollection = createCollectionCache(
		createCurrentStreamDataCollection,
	);
	const query = useOptionalLiveQuery(() => {
		const currentId = userId();
		return currentId ? getCurrentStreamDataCollection(currentId) : undefined;
	});

	const streamData = createMemo(() => {
		const rows = query.data ?? [];
		return (rows as CurrentStreamData[])[0] ?? null;
	});

	return {
		...query,
		data: streamData,
		encoderConnected: () =>
			streamData()?.cloudflare_data?.input_streaming === true,
		streamStatus: () => streamData()?.status ?? "idle",
		livestreamId: () =>
			(streamData()?.stream_data?.livestream_id as string) ?? null,
		liveInputUid: () =>
			(streamData()?.cloudflare_data?.live_input_uid as string) ?? null,
		platformStatuses: () => {
			const row = streamData();
			if (!row) return {} as Record<string, PlatformStatusData>;
			const result: Record<string, PlatformStatusData> = {};
			if (row.youtube_data && Object.keys(row.youtube_data).length > 0) {
				result.youtube = row.youtube_data as unknown as PlatformStatusData;
			}
			if (row.twitch_data && Object.keys(row.twitch_data).length > 0) {
				result.twitch = row.twitch_data as unknown as PlatformStatusData;
			}
			if (row.kick_data && Object.keys(row.kick_data).length > 0) {
				result.kick = row.kick_data as unknown as PlatformStatusData;
			}
			return result;
		},
	};
}

interface PlatformStatusData {
	status: "starting" | "live" | "stopping" | "error";
	started_at?: string;
	error_message?: string;
	error_at?: string;
	viewer_count?: number;
	title?: string;
	category?: string;
}

export type {
	ActorState,
	CurrentStreamData,
	StreamEvent,
	HighlightedMessage,
	Livestream,
	Viewer,
	UserPreferences,
	WidgetConfig,
	WidgetType,
	Notification,
	NotificationRead,
	UserRole,
	StreamingAccount,
};
