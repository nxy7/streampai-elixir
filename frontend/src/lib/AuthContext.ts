import { createContext } from "solid-js";

export type User = {
	id: string;
	email: string;
	name: string | null;
	displayAvatar: string | null;
	hoursStreamedLast30Days: number | null;
	extraData: unknown;
	isModerator: boolean;
	storageQuota: number | null;
	storageUsedPercent: number | null;
	avatarFileId: string | null;
	role: string;
	tier: string | null;
};

export type AuthContextValue = {
	user: () => User | null;
	isLoading: () => boolean;
	refresh: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue>();
