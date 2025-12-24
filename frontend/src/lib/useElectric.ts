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
  type StreamEvent,
  type ChatMessage,
  type Livestream,
  type Viewer,
  type UserPreferences,
  type WidgetConfig,
  type WidgetType,
  type Notification,
  type NotificationRead,
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
};
