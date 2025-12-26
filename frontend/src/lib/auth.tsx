import {
  createSignal,
  useContext,
  onMount,
  createEffect,
  onCleanup,
  type ParentComponent,
} from "solid-js";
import { BACKEND_URL } from "./constants";
import { AuthContext, type User } from "./AuthContext";
import { getCurrentUser } from "~/sdk/ash_rpc";
import { initPresence, leavePresence } from "./socket";

const currentUserFields = [
  "id",
  "email",
  "name",
  "displayAvatar",
  "hoursStreamedLast30Days",
  "extraData",
  "isModerator",
  "storageQuota",
  "storageUsedPercent",
  "avatarFileId",
  "role",
  "tier",
] as const;

export type { User } from "./AuthContext";

export const AuthProvider: ParentComponent = (props) => {
  const [currentUser, setCurrentUser] = createSignal<User | null>(null);
  const [isLoading, setIsLoading] = createSignal(true);

  async function fetchCurrentUser() {
    setIsLoading(true);
    try {
      const result = await getCurrentUser({
        fields: [...currentUserFields],
        fetchOptions: { credentials: "include" },
      });

      setCurrentUser(result.success && result.data ? (result.data as User) : null);
    } catch (error) {
      console.error("Error fetching current user:", error);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  onMount(() => {
    fetchCurrentUser();
  });

  // Initialize presence when user is authenticated
  createEffect(() => {
    const user = currentUser();
    if (user) {
      // User logged in - join presence
      initPresence();
    } else if (!isLoading()) {
      // User logged out (not just loading) - leave presence
      leavePresence();
    }
  });

  // Cleanup on unmount
  onCleanup(() => {
    leavePresence();
  });

  return (
    <AuthContext.Provider value={{ user: currentUser, isLoading, refresh: fetchCurrentUser }}>
      {props.children}
    </AuthContext.Provider>
  );
};

export function useCurrentUser() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useCurrentUser must be used within an AuthProvider");
  }
  return context;
}

export function getLoginUrl(provider?: string) {
  if (provider) {
    return `${BACKEND_URL}/auth/${provider}`;
  }
  return "/login";
}

export function getLogoutUrl() {
  return `${BACKEND_URL}/auth/sign-out`;
}

export function getDashboardUrl() {
  return "/dashboard";
}
