import {
	type ParentComponent,
	createSignal,
	onMount,
	useContext,
} from "solid-js";
import { API_PATH } from "./constants";
import { getCsrfHeaders } from "./csrf";
import {
	ImpersonationContext,
	type Impersonator,
} from "./ImpersonationContext";

type ImpersonationStatus = {
	impersonating: boolean;
	impersonator: Impersonator | null;
};

// Use current page origin for API requests to work with Caddy proxy
function getApiUrl() {
	if (typeof window !== "undefined") {
		return `${window.location.origin}${API_PATH}`;
	}
	return `http://localhost:4000${API_PATH}`;
}

async function fetchImpersonationStatus(): Promise<ImpersonationStatus> {
	const response = await fetch(`${getApiUrl()}/rpc/impersonation-status`, {
		credentials: "include",
	});

	if (!response.ok) {
		throw new Error("Failed to fetch impersonation status");
	}

	return response.json();
}

async function callExitImpersonation(): Promise<void> {
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
}

export const ImpersonationProvider: ParentComponent = (props) => {
	const [isImpersonating, setIsImpersonating] = createSignal(false);
	const [impersonator, setImpersonator] = createSignal<Impersonator | null>(
		null,
	);
	const [isLoading, setIsLoading] = createSignal(true);

	async function refresh() {
		try {
			const status = await fetchImpersonationStatus();
			setIsImpersonating(status.impersonating);
			setImpersonator(status.impersonator);
		} catch (error) {
			console.error("Error fetching impersonation status:", error);
			setIsImpersonating(false);
			setImpersonator(null);
		} finally {
			setIsLoading(false);
		}
	}

	async function exitImpersonation() {
		try {
			await callExitImpersonation();
			setIsImpersonating(false);
			setImpersonator(null);
			// Reload the page to refresh all user context
			window.location.reload();
		} catch (error) {
			console.error("Error exiting impersonation:", error);
			throw error;
		}
	}

	onMount(() => {
		refresh();
	});

	return (
		<ImpersonationContext.Provider
			value={{
				isImpersonating,
				impersonator,
				isLoading,
				exitImpersonation,
				refresh,
			}}>
			{props.children}
		</ImpersonationContext.Provider>
	);
};

export function useImpersonation() {
	const context = useContext(ImpersonationContext);
	if (!context) {
		throw new Error(
			"useImpersonation must be used within an ImpersonationProvider",
		);
	}
	return context;
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

	// Reload the page to refresh all user context
	window.location.href = "/dashboard";
}
