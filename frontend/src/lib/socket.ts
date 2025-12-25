import { Socket, Channel, Presence } from "phoenix";
import { createSignal, onCleanup, createEffect, Accessor } from "solid-js";
import { BACKEND_URL } from "./constants";

// Socket singleton
let socketInstance: Socket | null = null;
let socketToken: string | null = null;
let tokenFetchPromise: Promise<string | null> | null = null;

/**
 * Fetch a socket token from the backend.
 * This token is used for WebSocket authentication since cookies
 * don't work cross-origin for WebSocket connections.
 */
async function fetchSocketToken(): Promise<string | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/rpc/socket-token`, {
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
    const wsUrl = BACKEND_URL.replace(/^http/, "ws") + "/socket";

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
 * Hook for subscribing to presence in a lobby.
 * Returns a reactive signal with current online users.
 */
export function usePresence() {
  const [users, setUsers] = createSignal<PresenceUser[]>([]);
  const [isConnected, setIsConnected] = createSignal(false);

  let channel: Channel | null = null;
  let presence: Presence | null = null;

  const syncPresence = () => {
    if (!presence) return;

    const state = presence.list((id, { metas }) => ({
      id,
      name: metas[0]?.name || "Unknown",
      avatar: metas[0]?.avatar || null,
      onlineAt: metas[0]?.online_at || 0,
    }));

    setUsers(state);
  };

  // Initialize socket with token, then join presence channel
  initSocket().then((socket) => {
    channel = socket.channel("presence:lobby", {});

    // Create presence instance immediately and set up sync handler
    presence = new Presence(channel);
    presence.onSync(syncPresence);

    channel
      .join()
      .receive("ok", () => {
        setIsConnected(true);
        console.log("[Presence] Connected to lobby");
      })
      .receive("error", (resp) => {
        console.error("[Presence] Failed to join lobby:", resp);
      });
  });

  onCleanup(() => {
    if (channel) {
      channel.leave();
    }
  });

  return { users, isConnected };
}

/**
 * Hook for subscribing to stream-specific presence (viewer tracking).
 */
export function useStreamPresence(streamId: Accessor<string | undefined>) {
  const [viewers, setViewers] = createSignal<PresenceUser[]>([]);
  const [viewerCount, setViewerCount] = createSignal(0);
  const [isConnected, setIsConnected] = createSignal(false);

  let channel: Channel | null = null;
  let presence: Presence | null = null;

  const syncPresence = () => {
    if (!presence) return;

    const state = presence.list((id, { metas }) => ({
      id,
      name: metas[0]?.name || "Anonymous",
      avatar: metas[0]?.avatar || null,
      onlineAt: metas[0]?.joined_at || 0,
    }));

    setViewers(state);
    setViewerCount(state.length);
  };

  createEffect(() => {
    const id = streamId();
    if (!id) return;

    // Cleanup previous channel
    if (channel) {
      channel.leave();
    }

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
      presence = new Presence(channel!);
      presence.onSync(syncPresence);
      syncPresence();
    });

    channel.on("presence_diff", () => {
      if (presence) {
        presence.onSync(syncPresence);
      }
    });
  });

  onCleanup(() => {
    if (channel) {
      channel.leave();
    }
  });

  return { viewers, viewerCount, isConnected };
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
