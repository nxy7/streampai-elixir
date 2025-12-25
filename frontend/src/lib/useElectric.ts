import { useLiveQuery } from "@tanstack/solid-db";
import { createMemo } from "solid-js";
import {
  streamEventsCollection,
  chatMessagesCollection,
  livestreamsCollection,
  viewersCollection,
  userPreferencesCollection,
  createWidgetConfigsCollection,
  createNotificationsCollection,
  createNotificationReadsCollection,
  globalNotificationsCollection,
  createUserRolesCollection,
  createUserScopedStreamEventsCollection,
  createUserScopedChatMessagesCollection,
  createUserScopedLivestreamsCollection,
  createUserScopedViewersCollection,
  type StreamEvent,
  type ChatMessage,
  type Livestream,
  type Viewer,
  type UserPreferences,
  type WidgetConfig,
  type WidgetType,
  type Notification,
  type NotificationRead,
  type UserRole,
} from "./electric";

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

export function useDonations() {
  const query = useStreamEvents();

  return {
    ...query,
    data: createMemo(() => {
      const data = query.data || [];
      return data.filter((e) => e.type === "donation");
    }),
  };
}

export function useFollows() {
  const query = useStreamEvents();

  return {
    ...query,
    data: createMemo(() => {
      const data = query.data || [];
      return data.filter((e) => e.type === "follow");
    }),
  };
}

export function useRaids() {
  const query = useStreamEvents();

  return {
    ...query,
    data: createMemo(() => {
      const data = query.data || [];
      return data.filter((e) => e.type === "raid");
    }),
  };
}

export function useCheers() {
  const query = useStreamEvents();

  return {
    ...query,
    data: createMemo(() => {
      const data = query.data || [];
      return data.filter((e) => e.type === "cheer");
    }),
  };
}

export function useTopDonors(limit: number = 10) {
  const query = useDonations();

  return createMemo(() => {
    const donations = query.data();
    const donationsByUser = new Map<string, { username: string; total: number; count: number }>();

    for (const donation of donations) {
      const username = (donation.data?.username as string) || donation.author_id;
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

  return createMemo(() => {
    const data = query.data || [];
    return [...data]
      .sort((a, b) => new Date(b.inserted_at).getTime() - new Date(a.inserted_at).getTime())
      .slice(0, limit);
  });
}

export function useUserPreferences() {
  return useLiveQuery(() => userPreferencesCollection);
}

export function useUserPreferencesForUser(userId: () => string | undefined) {
  const query = useLiveQuery(() => userPreferencesCollection);

  return {
    ...query,
    data: createMemo(() => {
      const id = userId();
      if (!id) return null;
      const data = query.data || [];
      return data.find((p) => p.id === id) || null;
    }),
  };
}

// Cache for user-scoped collections
const userScopedChatCollections = new Map<string, ReturnType<typeof createUserScopedChatMessagesCollection>>();
const userScopedEventsCollections = new Map<string, ReturnType<typeof createUserScopedStreamEventsCollection>>();
const userScopedLivestreamsCollections = new Map<string, ReturnType<typeof createUserScopedLivestreamsCollection>>();
const userScopedViewersCollections = new Map<string, ReturnType<typeof createUserScopedViewersCollection>>();

function getUserScopedChatCollection(userId: string) {
  let collection = userScopedChatCollections.get(userId);
  if (!collection) {
    collection = createUserScopedChatMessagesCollection(userId);
    userScopedChatCollections.set(userId, collection);
  }
  return collection;
}

function getUserScopedEventsCollection(userId: string) {
  let collection = userScopedEventsCollections.get(userId);
  if (!collection) {
    collection = createUserScopedStreamEventsCollection(userId);
    userScopedEventsCollections.set(userId, collection);
  }
  return collection;
}

function getUserScopedLivestreamsCollection(userId: string) {
  let collection = userScopedLivestreamsCollections.get(userId);
  if (!collection) {
    collection = createUserScopedLivestreamsCollection(userId);
    userScopedLivestreamsCollections.set(userId, collection);
  }
  return collection;
}

function getUserScopedViewersCollection(userId: string) {
  let collection = userScopedViewersCollections.get(userId);
  if (!collection) {
    collection = createUserScopedViewersCollection(userId);
    userScopedViewersCollections.set(userId, collection);
  }
  return collection;
}

export function useUserChatMessages(userId: () => string | undefined) {
  const query = useLiveQuery(() => {
    const currentId = userId();
    if (!currentId) return null;
    return getUserScopedChatCollection(currentId);
  });

  return {
    ...query,
    data: createMemo(() => {
      if (!userId()) return [];
      return query.data || [];
    }),
  };
}

export function useRecentUserChatMessages(userId: () => string | undefined, limit = 10) {
  const query = useUserChatMessages(userId);

  return createMemo(() => {
    const messages = query.data();
    return [...messages]
      .sort((a, b) => new Date(b.inserted_at).getTime() - new Date(a.inserted_at).getTime())
      .slice(0, limit);
  });
}

export function useUserStreamEvents(userId: () => string | undefined) {
  const query = useLiveQuery(() => {
    const currentId = userId();
    if (!currentId) return null;
    return getUserScopedEventsCollection(currentId);
  });

  return {
    ...query,
    data: createMemo(() => {
      if (!userId()) return [];
      return query.data || [];
    }),
  };
}

export function useRecentUserStreamEvents(userId: () => string | undefined, limit = 10) {
  const query = useUserStreamEvents(userId);

  return createMemo(() => {
    const events = query.data();
    return [...events]
      .sort((a, b) => new Date(b.inserted_at).getTime() - new Date(a.inserted_at).getTime())
      .slice(0, limit);
  });
}

export function useUserLivestreams(userId: () => string | undefined) {
  const query = useLiveQuery(() => {
    const currentId = userId();
    if (!currentId) return null;
    return getUserScopedLivestreamsCollection(currentId);
  });

  return {
    ...query,
    data: createMemo(() => {
      if (!userId()) return [];
      return query.data || [];
    }),
  };
}

export function useRecentUserLivestreams(userId: () => string | undefined, limit = 5) {
  const query = useUserLivestreams(userId);

  return createMemo(() => {
    const streams = query.data();
    return [...streams]
      .sort((a, b) => new Date(b.inserted_at).getTime() - new Date(a.inserted_at).getTime())
      .slice(0, limit);
  });
}

export function useUserViewers(userId: () => string | undefined) {
  const query = useLiveQuery(() => {
    const currentId = userId();
    if (!currentId) return null;
    return getUserScopedViewersCollection(currentId);
  });

  return {
    ...query,
    data: createMemo(() => {
      if (!userId()) return [];
      return query.data || [];
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

// Cache for widget config collections by user ID
const widgetConfigCollections = new Map<string, ReturnType<typeof createWidgetConfigsCollection>>();

function getWidgetConfigsCollection(userId: string) {
  let collection = widgetConfigCollections.get(userId);
  if (!collection) {
    collection = createWidgetConfigsCollection(userId);
    widgetConfigCollections.set(userId, collection);
  }
  return collection;
}

export function useWidgetConfigs(userId: () => string | undefined) {
  const query = useLiveQuery(() => {
    const currentId = userId();
    if (!currentId) return null;
    return getWidgetConfigsCollection(currentId);
  });

  return {
    ...query,
    data: createMemo(() => {
      if (!userId()) return [];
      return query.data || [];
    }),
  };
}

export function useWidgetConfig<T = Record<string, unknown>>(
  userId: () => string | undefined,
  widgetType: () => WidgetType
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

// Cache for notification collections by user ID
const notificationCollections = new Map<string, ReturnType<typeof createNotificationsCollection>>();
const notificationReadCollections = new Map<string, ReturnType<typeof createNotificationReadsCollection>>();

function getNotificationsCollection(userId: string) {
  let collection = notificationCollections.get(userId);
  if (!collection) {
    collection = createNotificationsCollection(userId);
    notificationCollections.set(userId, collection);
  }
  return collection;
}

function getNotificationReadsCollection(userId: string) {
  let collection = notificationReadCollections.get(userId);
  if (!collection) {
    collection = createNotificationReadsCollection(userId);
    notificationReadCollections.set(userId, collection);
  }
  return collection;
}

export function useNotifications(userId: () => string | undefined) {
  const query = useLiveQuery(() => {
    const currentId = userId();
    if (!currentId) return null;
    return getNotificationsCollection(currentId);
  });

  return {
    ...query,
    data: createMemo(() => {
      if (!userId()) return [];
      return query.data || [];
    }),
  };
}

export function useNotificationReads(userId: () => string | undefined) {
  const query = useLiveQuery(() => {
    const currentId = userId();
    if (!currentId) return null;
    return getNotificationReadsCollection(currentId);
  });

  return {
    ...query,
    data: createMemo(() => {
      if (!userId()) return [];
      return query.data || [];
    }),
  };
}

export type NotificationWithReadStatus = Notification & {
  wasSeen: boolean;
  seenAt: string | null;
};

export function useNotificationsWithReadStatus(userId: () => string | undefined): {
  data: () => NotificationWithReadStatus[];
  unreadCount: () => number;
} {
  const notificationsQuery = useNotifications(userId);
  const readsQuery = useNotificationReads(userId);

  return {
    data: createMemo((): NotificationWithReadStatus[] => {
      const notifications = notificationsQuery.data();
      const reads = readsQuery.data();
      const readMap = new Map(reads.map((r) => [r.notification_id, r.seen_at]));

      return notifications
        .map((n): NotificationWithReadStatus => ({
          ...n,
          wasSeen: readMap.has(n.id),
          seenAt: readMap.get(n.id) || null,
        }))
        .sort((a, b) => new Date(b.inserted_at).getTime() - new Date(a.inserted_at).getTime());
    }),
    unreadCount: createMemo(() => {
      const notifications = notificationsQuery.data();
      const reads = readsQuery.data();
      const readIds = new Set(reads.map((r) => r.notification_id));
      return notifications.filter((n) => !readIds.has(n.id)).length;
    }),
  };
}

export function useGlobalNotifications() {
  const query = useLiveQuery(() => globalNotificationsCollection);

  return {
    ...query,
    data: createMemo(() => {
      const data = query.data || [];
      return [...data].sort(
        (a, b) => new Date(b.inserted_at).getTime() - new Date(a.inserted_at).getTime()
      );
    }),
  };
}

// Cache for user roles collection by user ID
const userRolesCollections = new Map<string, ReturnType<typeof createUserRolesCollection>>();

function getUserRolesCollection(userId: string) {
  let collection = userRolesCollections.get(userId);
  if (!collection) {
    collection = createUserRolesCollection(userId);
    userRolesCollections.set(userId, collection);
  }
  return collection;
}

export function useUserRoles(userId: () => string | undefined) {
  const query = useLiveQuery(() => {
    const currentId = userId();
    if (!currentId) return null;
    return getUserRolesCollection(currentId);
  });

  return {
    ...query,
    data: createMemo(() => {
      if (!userId()) return [];
      return query.data || [];
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
        return { pendingInvitations: [], myAcceptedRoles: [], rolesIGranted: [], pendingInvitationsSent: [] };
      }

      return {
        // Invitations sent to me that are pending
        pendingInvitations: roles.filter(
          (r) => r.user_id === currentUserId && r.role_status === "pending"
        ),
        // Roles I have (accepted) in other channels
        myAcceptedRoles: roles.filter(
          (r) => r.user_id === currentUserId && r.role_status === "accepted"
        ),
        // Roles I've granted to others (accepted)
        rolesIGranted: roles.filter(
          (r) => r.granter_id === currentUserId && r.role_status === "accepted"
        ),
        // Pending invitations I've sent to others
        pendingInvitationsSent: roles.filter(
          (r) => r.granter_id === currentUserId && r.role_status === "pending"
        ),
      };
    }),
    isLoading: () => !rolesQuery.data,
  };
}

export {
  type StreamEvent,
  type ChatMessage,
  type Livestream,
  type Viewer,
  type UserPreferences,
  type WidgetConfig,
  type WidgetType,
  type Notification,
  type NotificationRead,
  type UserRole,
};
