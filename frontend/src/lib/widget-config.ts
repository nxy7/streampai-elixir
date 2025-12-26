import {
	getCurrentUser,
	getWidgetConfig,
	saveWidgetConfig as saveWidgetConfigRpc,
} from "~/sdk/ash_rpc";

interface SaveWidgetConfigParams<T> {
	userId: string;
	type: string;
	config: T;
}

interface LoadWidgetConfigParams {
	userId: string;
	type: string;
}

export async function saveWidgetConfig<T extends Record<string, unknown>>({
	userId,
	type,
	config,
}: SaveWidgetConfigParams<T>) {
	const result = await saveWidgetConfigRpc({
		input: {
			userId,
			type,
			config,
		},
		fields: ["id", "config"],
		fetchOptions: { credentials: "include" },
	});

	return result;
}

export async function loadWidgetConfig<T>({
	userId,
	type,
}: LoadWidgetConfigParams): Promise<T | null> {
	const result = await getWidgetConfig({
		input: { userId, type },
		fields: ["id", "config"],
		fetchOptions: { credentials: "include" },
	});

	if (result.success && result.data?.config) {
		try {
			// Config is already an object from the RPC, no need to parse
			return result.data.config as T;
		} catch (e) {
			console.error("Failed to parse widget config:", e);
			return null;
		}
	}

	return null;
}

export async function getCurrentUserId(): Promise<string | null> {
	const result = await getCurrentUser({
		fields: ["id"],
		fetchOptions: { credentials: "include" },
	});

	return result.success ? result.data?.id || null : null;
}
