import { createSignal, useContext, onMount, type ParentComponent } from "solid-js";
import { client } from "./urql";
import { graphql } from "~/lib/graphql";
import { BACKEND_URL } from "./constants";
import { AuthContext, type User } from "./AuthContext";

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

export type { User } from "./AuthContext";

export const AuthProvider: ParentComponent = (props) => {
  const [currentUser, setCurrentUser] = createSignal<User | null>(null);
  const [isLoading, setIsLoading] = createSignal(true);

  async function fetchCurrentUser() {
    setIsLoading(true);
    try {
      const result = await client.query(CURRENT_USER_QUERY, {});

      if (result.data?.currentUser) {
        setCurrentUser(result.data.currentUser as User);
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

  onMount(() => {
    fetchCurrentUser();
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

export function getLoginUrl() {
  return "/login";
}

export function getLogoutUrl() {
  return `${BACKEND_URL}/auth/sign-out`;
}

export function getDashboardUrl() {
  return "/dashboard";
}
