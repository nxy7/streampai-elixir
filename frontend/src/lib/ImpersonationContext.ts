import { createContext } from "solid-js";

export type Impersonator = {
	id: string;
	email: string;
	name: string | null;
};

export type ImpersonationContextValue = {
	isImpersonating: () => boolean;
	impersonator: () => Impersonator | null;
	isLoading: () => boolean;
	exitImpersonation: () => Promise<void>;
	refresh: () => Promise<void>;
};

export const ImpersonationContext = createContext<ImpersonationContextValue>();
