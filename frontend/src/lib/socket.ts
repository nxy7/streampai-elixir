import { type Channel, Presence, Socket } from "phoenix";
import { type Accessor, createEffect, createSignal, onCleanup } from "solid-js";
import { API_URL, BASE_URL } from "./constants";

// Socket singleton
let socketInstance: Socket | null = null;
let socketToken: string | null = null;
let tokenFetchPromise: Promise<string | null> | null = null;

// Presence singleton for app-level tracking
let presenceChannel: Channel | null = null;
let presenceInstance: Presence | null = null;
type PresenceListener = (users: PresenceUser[]) => void;
const presenceListeners: Set<PresenceListener> = new Set();
let currentPresenceUsers: PresenceUser[] = [];

/**
 * Fetch a socket token from the backend.
 * This token is used for WebSocket authentication since cookies
 * don't work cross-origin for WebSocket connections.
 */
async function fetchSocketToken(): Promise<string | null> {
	try {
		const response = await fetch(`${API_URL}/rpc/socket-token`, {
			credentials: "include",
		});
		const data = await response.json();
		return data.token || null;
	} catch (error) {
		console.error("[Socket] Failed to fetch socket token:", error);
		return null;
	}
}

/**
 * Get the socket token, fetching it if necessary.
 */
async function getSocketToken(): Promise<string | null> {
	if (socketToken) return socketToken;

	if (!tokenFetchPromise) {
		tokenFetchPromise = fetchSocketToken().then((token) => {
			socketToken = token;
			tokenFetchPromise = null;
			return token;
		});
	}

	return tokenFetchPromise;
}

/**
 * Get or create the Phoenix socket instance.
 * Uses token-based authentication via params.
 */
export function getSocket(): Socket {
	if (!socketInstance) {
		// WebSocket URL uses /api/socket path
		const wsUrl = `${BASE_URL.replace(/^http/, "ws")}/api/socket`;

		socketInstance = new Socket(wsUrl, {
			params: () => ({ token: socketToken }),
		});

		socketInstance.connect();
	}

	return socketInstance;
}

/**
 * Initialize the socket with authentication.
 * Call this once when the app starts or when user logs in.
 */
export async function initSocket(): Promise<Socket> {
	// Fetch token first
	await getSocketToken();

	// Then get/create socket (will use the token we just fetched)
	return getSocket();
}

/**
 * Presence state type
 */
export interface PresenceUser {
	id: string;
	name: string;
	avatar: string | null;
	onlineAt: number;
}

export interface PresenceState {
	[userId: string]: {
		metas: Array<{
			name: string;
			avatar: string | null;
			online_at: number;
			phx_ref: string;
		}>;
	};
}

/**
 * Notify all listeners of presence changes
 */
function notifyPresenceListeners() {
	for (const listener of presenceListeners) {
		listener(currentPresenceUsers);
	}
}

/**
 * Initialize presence tracking for the current user.
 * Call this once when the user is authenticated.
 * Returns a cleanup function to leave the presence channel.
 */
export async function initPresence(): Promise<() => void> {
	// Already connected
	if (presenceChannel) {
		return () => leavePresence();
	}

	const socket = await initSocket();
	presenceChannel = socket.channel("presence:lobby", {});

	// Create presence instance BEFORE joining so it can receive initial state
	presenceInstance = new Presence(presenceChannel);
	presenceInstance.onSync(() => {
		currentPresenceUsers = presenceInstance?.list((id, { metas }) => ({
			id,
			name: metas[0]?.name || "Unknown",
			avatar: metas[0]?.avatar || null,
			onlineAt: metas[0]?.online_at || 0,
		}));
		console.log("[Presence] Synced users:", currentPresenceUsers);
		notifyPresenceListeners();
	});

	presenceChannel
		.join()
		.receive("ok", () => {
			console.log("[Presence] Connected to lobby");
		})
		.receive("error", (resp) => {
			console.error("[Presence] Failed to join lobby:", resp);
		});

	return () => leavePresence();
}

/**
 * Leave the presence channel (e.g., on logout)
 */
export function leavePresence() {
	if (presenceChannel) {
		presenceChannel.leave();
		presenceChannel = null;
		presenceInstance = null;
		currentPresenceUsers = [];
		notifyPresenceListeners();
	}
}

/**
 * Subscribe to presence updates.
 * Returns an unsubscribe function.
 */
export function subscribeToPresence(listener: PresenceListener): () => void {
	presenceListeners.add(listener);
	// Immediately call with current state
	listener(currentPresenceUsers);

	return () => {
		presenceListeners.delete(listener);
	};
}

/**
 * Get current presence users (non-reactive)
 */
export function getPresenceUsers(): PresenceUser[] {
	return currentPresenceUsers;
}

/**
 * Hook for subscribing to presence in a lobby.
 * Returns a reactive signal with current online users.
 * Uses the app-level presence singleton.
 */
export function usePresence() {
	const [users, setUsers] = createSignal<PresenceUser[]>(currentPresenceUsers);

	// Subscribe to presence updates
	const unsubscribe = subscribeToPresence((newUsers) => {
		setUsers(newUsers);
	});

	onCleanup(unsubscribe);

	return { users };
}

/**
 * Parse presence state into PresenceUser array
 */
function parsePresenceList(
	presence: Presence,
	nameField = "name",
	timeField = "online_at",
): PresenceUser[] {
	return presence.list((id, { metas }) => ({
		id,
		name: metas[0]?.[nameField] || "Anonymous",
		avatar: metas[0]?.avatar || null,
		onlineAt: metas[0]?.[timeField] || 0,
	}));
}

/**
 * Hook for subscribing to stream-specific presence (viewer tracking).
 */
export function useStreamPresence(streamId: Accessor<string | undefined>) {
	const [viewers, setViewers] = createSignal<PresenceUser[]>([]);
	const [isConnected, setIsConnected] = createSignal(false);

	let channel: Channel | null = null;
	let presence: Presence | null = null;

	const syncPresence = () => {
		if (!presence) return;
		setViewers(parsePresenceList(presence, "name", "joined_at"));
	};

	createEffect(() => {
		const id = streamId();
		if (!id) return;

		channel?.leave();

		const socket = getSocket();
		channel = socket.channel(`presence:stream:${id}`, {});

		channel
			.join()
			.receive("ok", () => {
				setIsConnected(true);
				console.log(`[Stream Presence] Connected to stream ${id}`);
			})
			.receive("error", (resp) => {
				console.error(`[Stream Presence] Failed to join stream ${id}:`, resp);
			});

		channel.on("presence_state", () => {
			presence = new Presence(channel);
			presence.onSync(syncPresence);
			syncPresence();
		});

		channel.on("presence_diff", () => presence?.onSync(syncPresence));
	});

	onCleanup(() => channel?.leave());

	return {
		viewers,
		viewerCount: () => viewers().length,
		isConnected,
	};
}

/**
 * Disconnect the socket (e.g., on logout)
 */
export function disconnectSocket() {
	if (socketInstance) {
		socketInstance.disconnect();
		socketInstance = null;
	}

	// Clear token so it will be re-fetched on next connection
	socketToken = null;
	tokenFetchPromise = null;
}
