import { createSignal } from "solid-js";
import { currentUser as getCurrentUser } from "~/sdk/ash_rpc";

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  displayAvatar?: string | null;
  tier?: string | null;
  isModerator?: boolean;
}

const [currentUser, setCurrentUser] = createSignal<User | null>(null);
const [isLoading, setIsLoading] = createSignal(true);

export function useCurrentUser() {
  return {
    user: currentUser,
    isLoading,
    refresh: fetchCurrentUser,
  };
}

export async function fetchCurrentUser() {
  setIsLoading(true);
  try {
    const result = await getCurrentUser({
      fields: ["id", "email", "name", "displayAvatar", 'extraData' ],
      fetchOptions: { credentials: "include" },
    });

    if (result.success && result.data) {
      setCurrentUser({
        id: result.data.id,
        email: result.data.email,
        name: result.data.name,
        role: "user",
        displayAvatar: result.data.displayAvatar,
        tier: null,
      });
    } else {
      setCurrentUser(null);
    }
  } catch (error) {
    console.error("Error fetching current user:", error);
    setCurrentUser(null);
  } finally {
    setIsLoading(false);
  }
}

export function getLoginUrl(provider?: "google" | "twitch") {
  const baseUrl = "http://localhost:4000";
  if (provider) {
    return `${baseUrl}/auth/user/${provider}`;
  }
  return `${baseUrl}/auth/sign-in`;
}

export function getLogoutUrl() {
  return "http://localhost:4000/auth/sign-out";
}

export function getDashboardUrl() {
  return "/dashboard";
}

// Initialize on module load (client-side only)
if (typeof window !== "undefined") {
  fetchCurrentUser();
}
