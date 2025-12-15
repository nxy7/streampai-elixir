import { createSignal } from "solid-js";
import { client } from "./urql";
import { graphql, type ResultOf } from "gql.tada";


const CURRENT_USER_QUERY = graphql(`
  query GetCurrentUser {
    currentUser {
      id
      email
      name
      displayAvatar
      hoursStreamedLast30Days
      extraData
      isModerator
      storageQuota
      storageUsedPercent
      avatarFileId
      role
      tier
    }
  }
`);

export type User = NonNullable<ResultOf<typeof CURRENT_USER_QUERY>['currentUser']>;

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
    const result = await client.query(CURRENT_USER_QUERY, {});

    if (result.data?.currentUser) {
      const user = result.data.currentUser;
      setCurrentUser(user);
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
