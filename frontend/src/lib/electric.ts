import { createCollection } from "@tanstack/solid-db";
import { electricCollectionOptions } from "@tanstack/electric-db-collection";
import type { Row } from "@electric-sql/client";
import { BACKEND_URL } from "./constants";

export type StreamEvent = Row & {
  id: string;
  type: string;
  data: Record<string, unknown>;
  data_raw: Record<string, unknown>;
  author_id: string;
  livestream_id: string;
  user_id: string;
  platform: string | null;
  viewer_id: string | null;
  inserted_at: string;
};

export type ChatMessage = Row & {
  id: string;
  message: string;
  platform: string;
  sender_username: string;
  sender_channel_id: string;
  sender_is_moderator: boolean;
  sender_is_patreon: boolean;
  user_id: string;
  livestream_id: string;
  viewer_id: string | null;
  inserted_at: string;
};

export type Livestream = Row & {
  id: string;
  user_id: string;
  title: string | null;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  inserted_at: string;
  updated_at: string;
};

export type Viewer = Row & {
  id: string;
  username: string;
  platform: string;
  user_id: string;
  first_seen_at: string;
  last_seen_at: string;
  message_count: number;
  inserted_at: string;
};

export type UserPreferences = Row & {
  id: string;  // User ID (primary key from users table)
  name: string;
  email_notifications: boolean;
  min_donation_amount: number | null;
  max_donation_amount: number | null;
  donation_currency: string;
  default_voice: string | null;
  avatar_url: string | null;
  inserted_at: string;
  updated_at: string;
};

export type AdminUser = Row & {
  id: string;
  email: string;
  name: string;
  confirmed_at: string | null;
  avatar_url: string | null;
  inserted_at: string;
  updated_at: string;
};

export type WidgetConfig = Row & {
  id: string;
  user_id: string;
  type: string;
  config: Record<string, unknown>;
  inserted_at: string;
  updated_at: string;
};

export type Notification = Row & {
  id: string;
  user_id: string | null;
  content: string;
  inserted_at: string;
};

export type NotificationRead = Row & {
  user_id: string;
  notification_id: string;
  seen_at: string;
};

export type WidgetType =
  | "placeholder_widget"
  | "chat_widget"
  | "alertbox_widget"
  | "viewer_count_widget"
  | "follower_count_widget"
  | "donation_widget"
  | "donation_goal_widget"
  | "top_donors_widget"
  | "follow_widget"
  | "subscriber_widget"
  | "overlay_widget"
  | "alert_widget"
  | "goal_widget"
  | "leaderboard_widget"
  | "timer_widget"
  | "poll_widget"
  | "slider_widget"
  | "giveaway_widget"
  | "eventlist_widget";

const SHAPES_URL = `${BACKEND_URL}/shapes`;

export const streamEventsCollection = createCollection(
  electricCollectionOptions<StreamEvent>({
    id: "stream_events",
    shapeOptions: {
      url: `${SHAPES_URL}/stream_events`,
    },
    getKey: (item) => item.id,
  })
);

export const chatMessagesCollection = createCollection(
  electricCollectionOptions<ChatMessage>({
    id: "chat_messages",
    shapeOptions: {
      url: `${SHAPES_URL}/chat_messages`,
    },
    getKey: (item) => item.id,
  })
);

export const livestreamsCollection = createCollection(
  electricCollectionOptions<Livestream>({
    id: "livestreams",
    shapeOptions: {
      url: `${SHAPES_URL}/livestreams`,
    },
    getKey: (item) => item.id,
  })
);

export const viewersCollection = createCollection(
  electricCollectionOptions<Viewer>({
    id: "viewers",
    shapeOptions: {
      url: `${SHAPES_URL}/viewers`,
    },
    getKey: (item) => item.id,
  })
);

export const userPreferencesCollection = createCollection(
  electricCollectionOptions<UserPreferences>({
    id: "user_preferences",
    shapeOptions: {
      url: `${SHAPES_URL}/user_preferences`,
    },
    getKey: (item) => item.id,
  })
);

export function createUserPreferencesCollection(userId: string) {
  return createCollection(
    electricCollectionOptions<UserPreferences>({
      id: `user_preferences_${userId}`,
      shapeOptions: {
        url: `${SHAPES_URL}/user_preferences`,
        params: {
          where: `id='${userId}'`,
        },
      },
      getKey: (item) => item.id,
    })
  );
}

export function createUserScopedStreamEventsCollection(userId: string) {
  return createCollection(
    electricCollectionOptions<StreamEvent>({
      id: `stream_events_${userId}`,
      shapeOptions: {
        url: `${SHAPES_URL}/stream_events`,
        params: {
          where: `user_id='${userId}'`,
        },
      },
      getKey: (item) => item.id,
    })
  );
}

export function createUserScopedChatMessagesCollection(userId: string) {
  return createCollection(
    electricCollectionOptions<ChatMessage>({
      id: `chat_messages_${userId}`,
      shapeOptions: {
        url: `${SHAPES_URL}/chat_messages`,
        params: {
          where: `user_id='${userId}'`,
        },
      },
      getKey: (item) => item.id,
    })
  );
}

export function createLivestreamChatCollection(livestreamId: string) {
  return createCollection(
    electricCollectionOptions<ChatMessage>({
      id: `chat_${livestreamId}`,
      shapeOptions: {
        url: `${SHAPES_URL}/chat_messages`,
        params: {
          where: `livestream_id='${livestreamId}'`,
        },
      },
      getKey: (item) => item.id,
    })
  );
}

export function createLivestreamEventsCollection(livestreamId: string) {
  return createCollection(
    electricCollectionOptions<StreamEvent>({
      id: `events_${livestreamId}`,
      shapeOptions: {
        url: `${SHAPES_URL}/stream_events`,
        params: {
          where: `livestream_id='${livestreamId}'`,
        },
      },
      getKey: (item) => item.id,
    })
  );
}

export const adminUsersCollection = createCollection(
  electricCollectionOptions<AdminUser>({
    id: "admin_users",
    shapeOptions: {
      url: `${SHAPES_URL}/admin_users`,
      fetchClient: (input, init) =>
        fetch(input, { ...init, credentials: "include" }),
    },
    getKey: (item) => item.id,
  })
);

export function createWidgetConfigsCollection(userId: string) {
  return createCollection(
    electricCollectionOptions<WidgetConfig>({
      id: `widget_configs_${userId}`,
      shapeOptions: {
        url: `${SHAPES_URL}/widget_configs/${userId}`,
      },
      getKey: (item) => item.id,
    })
  );
}

export function createNotificationsCollection(userId: string) {
  return createCollection(
    electricCollectionOptions<Notification>({
      id: `notifications_${userId}`,
      shapeOptions: {
        url: `${SHAPES_URL}/notifications/${userId}`,
      },
      getKey: (item) => item.id,
    })
  );
}

export function createNotificationReadsCollection(userId: string) {
  return createCollection(
    electricCollectionOptions<NotificationRead>({
      id: `notification_reads_${userId}`,
      shapeOptions: {
        url: `${SHAPES_URL}/notification_reads/${userId}`,
      },
      getKey: (item) => `${item.user_id}_${item.notification_id}`,
    })
  );
}

export const globalNotificationsCollection = createCollection(
  electricCollectionOptions<Notification>({
    id: "global_notifications",
    shapeOptions: {
      url: `${SHAPES_URL}/global_notifications`,
    },
    getKey: (item) => item.id,
  })
);
