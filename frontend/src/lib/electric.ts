import type { Row } from "@electric-sql/client";
import { electricCollectionOptions } from "@tanstack/electric-db-collection";
import { createCollection } from "@tanstack/solid-db";
import { API_PATH, getApiBase } from "./constants";
import { persistedElectricCollection } from "./persisted-electric";

// Use the API base URL for Electric sync requests
const getShapesBaseUrl = () => `${getApiBase()}${API_PATH}`;

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
	was_displayed: boolean;
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
	viewer_id: string;
	user_id: string;
	display_name: string;
	notes: string | null;
	ai_summary: string | null;
	first_seen_at: string;
	last_seen_at: string;
	avatar_url: string | null;
	channel_url: string | null;
	is_verified: boolean;
	is_owner: boolean;
	is_moderator: boolean;
	is_patreon: boolean;
	platform: string;
	inserted_at: string;
	updated_at: string;
};

export type UserPreferences = Row & {
	id: string; // User ID (primary key from users table)
	name: string;
	email_notifications: boolean;
	min_donation_amount: number | null;
	max_donation_amount: number | null;
	donation_currency: string;
	default_voice: string | null;
	avatar_url: string | null;
	language_preference: string | null;
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
	content_de: string | null;
	content_pl: string | null;
	content_es: string | null;
	inserted_at: string;
};

export type NotificationRead = Row & {
	user_id: string;
	notification_id: string;
	seen_at: string;
};

export type UserRole = Row & {
	id: string;
	user_id: string;
	granter_id: string;
	role_type: "moderator" | "manager";
	role_status: "pending" | "accepted" | "declined";
	granted_at: string;
	accepted_at: string | null;
	revoked_at: string | null;
	inserted_at: string;
	updated_at: string;
};

export type StreamingAccount = Row & {
	user_id: string;
	platform:
		| "youtube"
		| "twitch"
		| "facebook"
		| "kick"
		| "tiktok"
		| "trovo"
		| "instagram"
		| "rumble";
	extra_data: {
		email?: string;
		name?: string;
		nickname?: string;
		image?: string;
		uid?: string;
	};
	sponsor_count: number | null;
	views_last_30d: number | null;
	follower_count: number | null;
	unique_viewers_last_30d: number | null;
	stats_last_refreshed_at: string | null;
	inserted_at: string;
	updated_at: string;
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

const SHAPES_URL = `${getShapesBaseUrl()}/shapes`;

export const streamEventsCollection = createCollection(
	electricCollectionOptions<StreamEvent>({
		id: "stream_events",
		shapeOptions: {
			url: `${SHAPES_URL}/stream_events`,
		},
		getKey: (item) => item.id,
	}),
);

export const chatMessagesCollection = createCollection(
	electricCollectionOptions<ChatMessage>({
		id: "chat_messages",
		shapeOptions: {
			url: `${SHAPES_URL}/chat_messages`,
		},
		getKey: (item) => item.id,
	}),
);

export const livestreamsCollection = createCollection(
	electricCollectionOptions<Livestream>({
		id: "livestreams",
		shapeOptions: {
			url: `${SHAPES_URL}/livestreams`,
		},
		getKey: (item) => item.id,
	}),
);

export const viewersCollection = createCollection(
	electricCollectionOptions<Viewer>({
		id: "viewers",
		shapeOptions: {
			url: `${SHAPES_URL}/viewers`,
		},
		getKey: (item) => item.viewer_id,
	}),
);

export const userPreferencesCollection = createCollection(
	electricCollectionOptions<UserPreferences>({
		id: "user_preferences",
		shapeOptions: {
			url: `${SHAPES_URL}/user_preferences`,
		},
		getKey: (item) => item.id,
	}),
);

export function createUserPreferencesCollection(userId: string) {
	return createCollection(
		persistedElectricCollection<UserPreferences>({
			id: `user_preferences_${userId}`,
			shapeOptions: {
				url: `${SHAPES_URL}/user_preferences`,
				params: {
					where: `id='${userId}'`,
				},
			},
			getKey: (item) => item.id,
			persist: true,
			userId: () => userId,
		}),
	);
}

export function createUserScopedStreamEventsCollection(userId: string) {
	return createCollection(
		electricCollectionOptions<StreamEvent>({
			id: `stream_events_${userId}`,
			shapeOptions: {
				url: `${SHAPES_URL}/stream_events/${userId}`,
			},
			getKey: (item) => item.id,
		}),
	);
}

export function createUserScopedChatMessagesCollection(userId: string) {
	return createCollection(
		electricCollectionOptions<ChatMessage>({
			id: `chat_messages_${userId}`,
			shapeOptions: {
				url: `${SHAPES_URL}/chat_messages/${userId}`,
			},
			getKey: (item) => item.id,
		}),
	);
}

export function createUserScopedLivestreamsCollection(userId: string) {
	return createCollection(
		persistedElectricCollection<Livestream>({
			id: `livestreams_${userId}`,
			shapeOptions: {
				url: `${SHAPES_URL}/livestreams/${userId}`,
			},
			getKey: (item) => item.id,
			persist: true,
			userId: () => userId,
		}),
	);
}

export function createUserScopedViewersCollection(userId: string) {
	return createCollection(
		electricCollectionOptions<Viewer>({
			id: `viewers_${userId}`,
			shapeOptions: {
				url: `${SHAPES_URL}/viewers/${userId}`,
			},
			getKey: (item) => item.viewer_id,
		}),
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
		}),
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
		}),
	);
}

// Cache for admin users collection - created once when admin logs in
// biome-ignore lint/suspicious/noExplicitAny: Complex generic type from createCollection
let adminUsersCollectionCache: any = null;

export function getAdminUsersCollection() {
	if (!adminUsersCollectionCache) {
		adminUsersCollectionCache = createCollection(
			electricCollectionOptions<AdminUser>({
				id: "admin_users",
				shapeOptions: {
					url: `${SHAPES_URL}/admin_users`,
					fetchClient: (input, init) =>
						fetch(input, { ...init, credentials: "include" }),
				},
				getKey: (item) => item.id as string,
			}),
		);
	}
	return adminUsersCollectionCache;
}

// Empty placeholder collections for fallback when userId is undefined
export const emptyWidgetConfigsCollection = createCollection(
	electricCollectionOptions<WidgetConfig>({
		id: "empty_widget_configs",
		shapeOptions: {
			url: `${SHAPES_URL}/widget_configs/_empty`,
		},
		getKey: (item) => item.id,
	}),
);

export const emptyNotificationsCollection = createCollection(
	electricCollectionOptions<Notification>({
		id: "empty_notifications",
		shapeOptions: {
			url: `${SHAPES_URL}/notifications/_empty`,
		},
		getKey: (item) => item.id,
	}),
);

export const emptyNotificationReadsCollection = createCollection(
	electricCollectionOptions<NotificationRead>({
		id: "empty_notification_reads",
		shapeOptions: {
			url: `${SHAPES_URL}/notification_reads/_empty`,
		},
		getKey: (item) => `${item.user_id}_${item.notification_id}`,
	}),
);

export const emptyUserRolesCollection = createCollection(
	electricCollectionOptions<UserRole>({
		id: "empty_user_roles",
		shapeOptions: {
			url: `${SHAPES_URL}/user_roles/_empty`,
		},
		getKey: (item) => item.id,
	}),
);

export function createWidgetConfigsCollection(userId: string) {
	return createCollection(
		persistedElectricCollection<WidgetConfig>({
			id: `widget_configs_${userId}`,
			shapeOptions: {
				url: `${SHAPES_URL}/widget_configs/${userId}`,
			},
			getKey: (item) => item.id,
			persist: true,
			userId: () => userId,
		}),
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
		}),
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
		}),
	);
}

export const globalNotificationsCollection = createCollection(
	electricCollectionOptions<Notification>({
		id: "global_notifications",
		shapeOptions: {
			url: `${SHAPES_URL}/global_notifications`,
		},
		getKey: (item) => item.id,
	}),
);

export function createUserRolesCollection(userId: string) {
	return createCollection(
		electricCollectionOptions<UserRole>({
			id: `user_roles_${userId}`,
			shapeOptions: {
				url: `${SHAPES_URL}/user_roles/${userId}`,
			},
			getKey: (item) => item.id,
		}),
	);
}

export const emptyStreamingAccountsCollection = createCollection(
	electricCollectionOptions<StreamingAccount>({
		id: "empty_streaming_accounts",
		shapeOptions: {
			url: `${SHAPES_URL}/streaming_accounts/_empty`,
		},
		getKey: (item) => `${item.user_id}_${item.platform}`,
	}),
);

export function createStreamingAccountsCollection(userId: string) {
	return createCollection(
		electricCollectionOptions<StreamingAccount>({
			id: `streaming_accounts_${userId}`,
			shapeOptions: {
				url: `${SHAPES_URL}/streaming_accounts/${userId}`,
			},
			getKey: (item) => `${item.user_id}_${item.platform}`,
		}),
	);
}
