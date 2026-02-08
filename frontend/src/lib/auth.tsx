import {
	type ParentComponent,
	createEffect,
	createResource,
	onCleanup,
	useContext,
} from "solid-js";
import { isServer } from "solid-js/web";
import { type Impersonator, SessionContext, type User } from "./AuthContext";
import { getApiUrl } from "./constants";
import { getCsrfHeaders } from "./csrf";
import { initPresence, leavePresence } from "./socket";

export type { Impersonator, User } from "./AuthContext";

type SessionStatus = {
	user: User | null;
	impersonation: {
		active: boolean;
		impersonator: Impersonator | null;
	};
};

async function fetchSessionStatus(): Promise<SessionStatus> {
	try {
		const response = await fetch(`${getApiUrl()}/rpc/session-status`, {
			credentials: "include",
		});

		if (!response.ok) {
			return {
				user: null,
				impersonation: { active: false, impersonator: null },
			};
		}

		return response.json();
	} catch {
		return {
			user: null,
			impersonation: { active: false, impersonator: null },
		};
	}
}

export const AuthProvider: ParentComponent = (props) => {
	const [sessionResource, { refetch }] = createResource(
		() => !isServer,
		fetchSessionStatus,
	);

	const session = () => sessionResource.latest ?? null;
	const user = () => session()?.user ?? null;
	const impersonator = () => session()?.impersonation?.impersonator ?? null;
	const isLoading = () => sessionResource.loading;
	const refresh = async () => {
		await refetch();
	};

	// Initialize presence when user is authenticated
	createEffect(() => {
		const u = user();
		if (u) {
			initPresence();
		} else if (!isLoading()) {
			leavePresence();
		}
	});

	// Cleanup on unmount
	onCleanup(() => {
		leavePresence();
	});

	return (
		<SessionContext.Provider value={{ user, impersonator, isLoading, refresh }}>
			{props.children}
		</SessionContext.Provider>
	);
};

export function useSession() {
	const context = useContext(SessionContext);
	if (!context) {
		throw new Error("useSession must be used within an AuthProvider");
	}
	return context;
}

export function useCurrentUser() {
	const session = useSession();
	return {
		user: session.user,
		isLoading: session.isLoading,
		refresh: session.refresh,
	};
}

/**
 * Use inside authenticated routes (e.g. dashboard) where user is guaranteed to exist.
 * Throws if called before auth is resolved.
 */
export function useAuthenticatedUser() {
	const session = useSession();
	const user = () => {
		const u = session.user();
		if (!u) throw new Error("useAuthenticatedUser: no authenticated user");
		return u;
	};
	return { user, refresh: session.refresh };
}

export function useImpersonation() {
	const session = useSession();
	return {
		isImpersonating: () => session.impersonator() != null,
		impersonator: session.impersonator,
		isLoading: session.isLoading,
		exitImpersonation,
		refresh: session.refresh,
	};
}

export async function exitImpersonation(): Promise<void> {
	const response = await fetch(`${getApiUrl()}/rpc/impersonation/stop`, {
		method: "POST",
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
			...getCsrfHeaders(),
		},
	});

	if (!response.ok) {
		throw new Error("Failed to exit impersonation");
	}

	window.location.reload();
}

/**
 * Start impersonating a user. Call this from admin pages.
 */
export async function startImpersonation(userId: string): Promise<void> {
	const response = await fetch(
		`${getApiUrl()}/rpc/impersonation/start/${userId}`,
		{
			method: "POST",
			credentials: "include",
			headers: {
				"Content-Type": "application/json",
				...getCsrfHeaders(),
			},
		},
	);

	if (!response.ok) {
		const data = await response.json();
		throw new Error(data.error || "Failed to start impersonation");
	}

	window.location.href = "/dashboard";
}

export function getLoginUrl(provider?: string) {
	if (provider) {
		return `${getApiUrl()}/auth/${provider}`;
	}
	return "/login";
}

export function getLogoutUrl() {
	return `${getApiUrl()}/auth/sign-out`;
}

export function getDashboardUrl() {
	return "/dashboard";
}
