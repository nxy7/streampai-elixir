import type { ReactiveMap } from "@solid-primitives/map";
import type { Collection, CollectionStatus } from "@tanstack/db";
import { useLiveQuery } from "@tanstack/solid-db";
import type { Accessor } from "solid-js";
import { createMemo } from "solid-js";
import {
	type ChatMessage,
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
	chatMessagesCollection,
	createNotificationReadsCollection,
	createNotificationsCollection,
	createStreamingAccountsCollection,
	createUserPreferencesCollection,
	createUserRolesCollection,
	createUserScopedChatMessagesCollection,
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

export function useStreamEvents() {
	return useLiveQuery(() => streamEventsCollection);
}

export function useChatMessages() {
	return useLiveQuery(() => chatMessagesCollection);
}

export function useLivestreams() {
	return useLiveQuery(() => livestreamsCollection);
}

export function useViewers() {
	return useLiveQuery(() => viewersCollection);
}

function useFilteredStreamEvents(eventType: string) {
	const query = useStreamEvents();
	return {
		...query,
		data: createMemo(() =>
			(query.data || []).filter((e) => e.type === eventType),
		),
	};
}

export function useDonations() {
	return useFilteredStreamEvents("donation");
}

export function useFollows() {
	return useFilteredStreamEvents("follow");
}

export function useRaids() {
	return useFilteredStreamEvents("raid");
}

export function useCheers() {
	return useFilteredStreamEvents("cheer");
}

export function useTopDonors(limit: number = 10) {
	const query = useDonations();

	return createMemo(() => {
		const donations = query.data();
		const donationsByUser = new Map<
			string,
			{ username: string; total: number; count: number }
		>();

		for (const donation of donations) {
			const username =
				(donation.data?.username as string) || donation.author_id;
			const amount = (donation.data?.amount as number) || 0;

			const existing = donationsByUser.get(username);
			if (existing) {
				existing.total += amount;
				existing.count += 1;
			} else {
				donationsByUser.set(username, { username, total: amount, count: 1 });
			}
		}

		return Array.from(donationsByUser.values())
			.sort((a, b) => b.total - a.total)
			.slice(0, limit);
	});
}

export function useTotalDonations() {
	const query = useDonations();

	return createMemo(() => {
		const donations = query.data();
		return donations.reduce((sum: number, d) => {
			const amount = (d.data?.amount as number) || 0;
			return sum + amount;
		}, 0);
	});
}

export function useRecentEvents(limit: number = 20) {
	const query = useStreamEvents();
	return createMemo(() => sortByInsertedAt(query.data || []).slice(0, limit));
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
			const data = query.data || [];
			return (data as UserPreferences[]).find((p) => p.id === id) || null;
		}),
	};
}

const getUserScopedChatCollection = createCollectionCache(
	createUserScopedChatMessagesCollection,
);
const getUserScopedEventsCollection = createCollectionCache(
	createUserScopedStreamEventsCollection,
);
const getUserScopedLivestreamsCollection = createCollectionCache(
	createUserScopedLivestreamsCollection,
);
const getUserScopedViewersCollection = createCollectionCache(
	createUserScopedViewersCollection,
);

export function useUserChatMessages(userId: () => string | undefined) {
	const query = useOptionalLiveQuery(() => {
		const currentId = userId();
		return currentId ? getUserScopedChatCollection(currentId) : undefined;
	});

	return {
		...query,
		data: createMemo(() => {
			if (!userId()) return [];
			return (query.data || []) as ChatMessage[];
		}),
	};
}

export function useRecentUserChatMessages(
	userId: () => string | undefined,
	limit = 10,
) {
	const query = useUserChatMessages(userId);
	return createMemo(() => sortByInsertedAt(query.data()).slice(0, limit));
}

export function useUserStreamEvents(userId: () => string | undefined) {
	const query = useOptionalLiveQuery(() => {
		const currentId = userId();
		return currentId ? getUserScopedEventsCollection(currentId) : undefined;
	});

	return {
		...query,
		data: createMemo(() => {
			if (!userId()) return [];
			return (query.data || []) as StreamEvent[];
		}),
	};
}

export function useRecentUserStreamEvents(
	userId: () => string | undefined,
	limit = 10,
) {
	const query = useUserStreamEvents(userId);
	return createMemo(() => sortByInsertedAt(query.data()).slice(0, limit));
}

export function useUserLivestreams(userId: () => string | undefined) {
	const query = useOptionalLiveQuery(() => {
		const currentId = userId();
		return currentId
			? getUserScopedLivestreamsCollection(currentId)
			: undefined;
	});

	return {
		...query,
		data: createMemo(() => {
			if (!userId()) return [];
			return (query.data || []) as Livestream[];
		}),
	};
}

export function useRecentUserLivestreams(
	userId: () => string | undefined,
	limit = 5,
) {
	const query = useUserLivestreams(userId);
	return createMemo(() => sortByInsertedAt(query.data()).slice(0, limit));
}

export function useUserViewers(userId: () => string | undefined) {
	const query = useOptionalLiveQuery(() => {
		const currentId = userId();
		return currentId ? getUserScopedViewersCollection(currentId) : undefined;
	});

	return {
		...query,
		data: createMemo(() => {
			if (!userId()) return [];
			return (query.data || []) as Viewer[];
		}),
	};
}

export function useDashboardStats(userId: () => string | undefined) {
	const chatQuery = useUserChatMessages(userId);
	const eventsQuery = useUserStreamEvents(userId);
	const viewersQuery = useUserViewers(userId);
	const streamsQuery = useUserLivestreams(userId);

	return {
		totalMessages: createMemo(() => chatQuery.data().length),
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

const getWidgetConfigsCollection = createCollectionCache(
	createWidgetConfigsCollection,
);

export function useWidgetConfigs(userId: () => string | undefined) {
	const query = useOptionalLiveQuery(() => {
		const currentId = userId();
		return currentId ? getWidgetConfigsCollection(currentId) : undefined;
	});

	return {
		...query,
		data: createMemo(() => {
			if (!userId()) return [];
			return (query.data || []) as WidgetConfig[];
		}),
	};
}

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

const getNotificationsCollection = createCollectionCache(
	createNotificationsCollection,
);
const getNotificationReadsCollection = createCollectionCache(
	createNotificationReadsCollection,
);

export function useNotifications(userId: () => string | undefined) {
	const query = useOptionalLiveQuery(() => {
		const currentId = userId();
		return currentId ? getNotificationsCollection(currentId) : undefined;
	});

	return {
		...query,
		data: createMemo(() => {
			if (!userId()) return [];
			return (query.data || []) as Notification[];
		}),
	};
}

export function useNotificationReads(userId: () => string | undefined) {
	const query = useOptionalLiveQuery(() => {
		const currentId = userId();
		return currentId ? getNotificationReadsCollection(currentId) : undefined;
	});

	return {
		...query,
		data: createMemo(() => {
			if (!userId()) return [];
			return (query.data || []) as NotificationRead[];
		}),
	};
}

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
		data: createMemo(() => sortByInsertedAt(query.data || [])),
	};
}

const getUserRolesCollection = createCollectionCache(createUserRolesCollection);

export function useUserRoles(userId: () => string | undefined) {
	const query = useOptionalLiveQuery(() => {
		const currentId = userId();
		return currentId ? getUserRolesCollection(currentId) : undefined;
	});

	return {
		...query,
		data: createMemo(() => {
			if (!userId()) return [];
			return (query.data || []) as UserRole[];
		}),
	};
}

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

const getStreamingAccountsCollection = createCollectionCache(
	createStreamingAccountsCollection,
);

export function useStreamingAccounts(userId: () => string | undefined) {
	const query = useOptionalLiveQuery(() => {
		const currentId = userId();
		return currentId ? getStreamingAccountsCollection(currentId) : undefined;
	});

	return {
		...query,
		data: createMemo(() => {
			if (!userId()) return [];
			return (query.data || []) as StreamingAccount[];
		}),
	};
}

export type {
	StreamEvent,
	ChatMessage,
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
