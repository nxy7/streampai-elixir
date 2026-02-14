import type { Row } from "@electric-sql/client";
import { electricCollectionOptions } from "@tanstack/electric-db-collection";
import { createCollection } from "@tanstack/solid-db";
import { getApiUrl } from "./constants";

export type StreamEvent = Row & {
	id: string;
	type: string;
	data: Record<string, unknown>;
	author_id: string;
	livestream_id: string;
	user_id: string;
	platform: string | null;
	viewer_id: string | null;
	was_displayed: boolean;
	inserted_at: string;
};

export type Livestream = Row & {
	id: string;
	user_id: string;
	title: string | null;
	status: string;
	started_at: string | null;
	ended_at: string | null;
	thumbnail_file_id: string | null;
	thumbnail_url: string | null;
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
	status: "connected" | "needs_reauth";
	inserted_at: string;
	updated_at: string;
};

export type HighlightedMessage = Row & {
	id: string;
	user_id: string;
	chat_message_id: string;
	message: string;
	sender_username: string;
	sender_channel_id: string;
	platform: string;
	viewer_id: string | null;
	highlighted_at: string;
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
	| "eventlist_widget"
	| "message_highlight_widget";

const SHAPES_URL = `${getApiUrl()}/shapes`;

export const streamEventsCollection = createCollection(
	electricCollectionOptions<StreamEvent>({
		id: "stream_events",
		shapeOptions: {
			url: `${SHAPES_URL}/stream_events`,
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
		getKey: (item) => item.viewer_id?.toString(),
	}),
);

export function createUserPreferencesCollection(userId: string) {
	return createCollection(
		electricCollectionOptions<UserPreferences>({
			id: `user_preferences_${userId}`,
			shapeOptions: {
				url: `${SHAPES_URL}/user_preferences/${userId}`,
			},
			getKey: (item) => item.id,
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

export function createUserScopedLivestreamsCollection(userId: string) {
	return createCollection(
		electricCollectionOptions<Livestream>({
			id: `livestreams_${userId}`,
			shapeOptions: {
				url: `${SHAPES_URL}/livestreams/${userId}`,
			},
			getKey: (item) => item.id,
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
			getKey: (item) => item.viewer_id?.toString(),
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
				getKey: (item) => item.id,
			}),
		);
	}
	return adminUsersCollectionCache;
}

export function createWidgetConfigsCollection(userId: string) {
	return createCollection(
		electricCollectionOptions<WidgetConfig>({
			id: `widget_configs_${userId}`,
			shapeOptions: {
				url: `${SHAPES_URL}/widget_configs/${userId}`,
			},
			getKey: (item) => item.id,
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

export const emptyHighlightedMessagesCollection = createCollection(
	electricCollectionOptions<HighlightedMessage>({
		id: "empty_highlighted_messages",
		shapeOptions: {
			url: `${SHAPES_URL}/highlighted_messages/_empty`,
		},
		getKey: (item) => item.id,
	}),
);

export function createHighlightedMessagesCollection(userId: string) {
	return createCollection(
		electricCollectionOptions<HighlightedMessage>({
			id: `highlighted_messages_${userId}`,
			shapeOptions: {
				url: `${SHAPES_URL}/highlighted_messages/${userId}`,
			},
			getKey: (item) => item.id,
		}),
	);
}

export type ActorState = Row & {
	id: string;
	type: string;
	user_id: string;
	data: Record<string, unknown>;
	status: string;
	inserted_at: string;
	updated_at: string;
};

export function createActorStatesCollection(userId: string) {
	return createCollection(
		electricCollectionOptions<ActorState>({
			id: `actor_states_${userId}`,
			shapeOptions: {
				url: `${SHAPES_URL}/actor_states/${userId}`,
			},
			getKey: (item) => item.id,
		}),
	);
}

export type StreamTimerRow = Row & {
	id: string;
	user_id: string;
	label: string;
	content: string;
	interval_seconds: number;
	disabled_at: string | null;
	inserted_at: string;
	updated_at: string;
};

export function createStreamTimersCollection(userId: string) {
	return createCollection(
		electricCollectionOptions<StreamTimerRow>({
			id: `stream_timers_${userId}`,
			shapeOptions: {
				url: `${SHAPES_URL}/stream_timers/${userId}`,
			},
			getKey: (item) => item.id,
		}),
	);
}

export type StreamHookRow = Row & {
	id: string;
	user_id: string;
	name: string;
	enabled: boolean;
	trigger_type: string;
	conditions: Record<string, unknown> | null;
	action_type: string;
	action_config: Record<string, unknown>;
	cooldown_seconds: number;
	last_triggered_at: string | null;
	inserted_at: string;
	updated_at: string;
};

export function createStreamHooksCollection(userId: string) {
	return createCollection(
		electricCollectionOptions<StreamHookRow>({
			id: `stream_hooks_${userId}`,
			shapeOptions: {
				url: `${SHAPES_URL}/stream_hooks/${userId}`,
			},
			getKey: (item) => item.id,
		}),
	);
}

export type StreamHookLogRow = Row & {
	id: string;
	hook_id: string;
	user_id: string;
	stream_event_id: string | null;
	trigger_type: string;
	action_type: string;
	status: string;
	error_message: string | null;
	executed_at: string;
	duration_ms: number | null;
	inserted_at: string;
};

export function createStreamHookLogsCollection(userId: string) {
	return createCollection(
		electricCollectionOptions<StreamHookLogRow>({
			id: `stream_hook_logs_${userId}`,
			shapeOptions: {
				url: `${SHAPES_URL}/stream_hook_logs/${userId}`,
			},
			getKey: (item) => item.id,
		}),
	);
}

export type ChatBotConfigRow = Row & {
	id: string;
	user_id: string;
	enabled: boolean;
	greeting_enabled: boolean;
	greeting_message: string;
	command_prefix: string;
	ai_chat_enabled: boolean;
	ai_personality: string | null;
	ai_bot_name: string;
	ai_provider: string;
	auto_shoutout_enabled: boolean;
	link_protection_enabled: boolean;
	slow_mode_on_raid_enabled: boolean;
	inserted_at: string;
	updated_at: string;
};

export function createChatBotConfigsCollection(userId: string) {
	return createCollection(
		electricCollectionOptions<ChatBotConfigRow>({
			id: `chat_bot_configs_${userId}`,
			shapeOptions: {
				url: `${SHAPES_URL}/chat_bot_configs/${userId}`,
			},
			getKey: (item) => item.id,
		}),
	);
}

export type SupportTicket = Row & {
	id: string;
	subject: string;
	status: "open" | "resolved";
	ticket_type: "support" | "feature_request" | "bug_report";
	user_id: string;
	inserted_at: string;
	updated_at: string;
};

export type SupportMessage = Row & {
	id: string;
	content: string;
	ticket_id: string;
	user_id: string;
	inserted_at: string;
};

export function createSupportTicketsCollection(userId: string) {
	return createCollection(
		electricCollectionOptions<SupportTicket>({
			id: `support_tickets_${userId}`,
			shapeOptions: {
				url: `${SHAPES_URL}/support_tickets/${userId}`,
			},
			getKey: (item) => item.id,
		}),
	);
}

export function createSupportMessagesCollection(ticketId: string) {
	return createCollection(
		electricCollectionOptions<SupportMessage>({
			id: `support_messages_${ticketId}`,
			shapeOptions: {
				url: `${SHAPES_URL}/support_messages/${ticketId}`,
			},
			getKey: (item) => item.id,
		}),
	);
}

// biome-ignore lint/suspicious/noExplicitAny: Complex generic type from createCollection
let adminSupportTicketsCache: any = null;

export function getAdminSupportTicketsCollection() {
	if (!adminSupportTicketsCache) {
		adminSupportTicketsCache = createCollection(
			electricCollectionOptions<SupportTicket>({
				id: "admin_support_tickets",
				shapeOptions: {
					url: `${SHAPES_URL}/admin_support_tickets`,
					fetchClient: (input, init) =>
						fetch(input, { ...init, credentials: "include" }),
				},
				getKey: (item) => item.id,
			}),
		);
	}
	return adminSupportTicketsCache;
}

// biome-ignore lint/suspicious/noExplicitAny: Complex generic type from createCollection
let adminSupportMessagesCache: any = null;

export function getAdminSupportMessagesCollection() {
	if (!adminSupportMessagesCache) {
		adminSupportMessagesCache = createCollection(
			electricCollectionOptions<SupportMessage>({
				id: "admin_support_messages",
				shapeOptions: {
					url: `${SHAPES_URL}/admin_support_messages`,
					fetchClient: (input, init) =>
						fetch(input, { ...init, credentials: "include" }),
				},
				getKey: (item) => item.id,
			}),
		);
	}
	return adminSupportMessagesCache;
}

export type CurrentStreamData = Row & {
	id: string;
	user_id: string;
	status: string;
	stream_data: Record<string, unknown>;
	cloudflare_data: Record<string, unknown>;
	youtube_data: Record<string, unknown>;
	twitch_data: Record<string, unknown>;
	kick_data: Record<string, unknown>;
	active_alert: Record<string, unknown> | null;
	highlighted_message: Record<string, unknown> | null;
	alertbox_state: Record<string, unknown>;
	inserted_at: string;
	updated_at: string;
};

export function createCurrentStreamDataCollection(userId: string) {
	return createCollection(
		electricCollectionOptions<CurrentStreamData>({
			id: `current_stream_data_${userId}`,
			shapeOptions: {
				url: `${SHAPES_URL}/current_stream_data/${userId}`,
			},
			getKey: (item) => item.id,
		}),
	);
}
