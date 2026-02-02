import {
	HeadContent,
	Outlet,
	Scripts,
	createRootRouteWithContext,
} from "@tanstack/solid-router";
import { Suspense } from "solid-js";
import { HydrationScript } from "solid-js/web";
import "../app.css";
import { ImpersonationBanner } from "~/components/ImpersonationBanner";
import { LocaleSync } from "~/components/LocaleSync";
import { I18nProvider } from "~/i18n";
import { AuthProvider } from "~/lib/auth";
import { ImpersonationProvider } from "~/lib/impersonation";
import { ThemeProvider } from "~/lib/theme";
import { getCurrentUser } from "~/sdk/ash_rpc";

// Define the router context type
// We use a simplified user type for the context since it's for preloading purposes
export interface RouterContext {
	user: { id: string } | null;
}

// Fields to fetch for current user (same as AuthProvider)
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

export const Route = createRootRouteWithContext<RouterContext>()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
		],
		links: [{ rel: "icon", href: "/images/favicon.png", type: "image/png" }],
	}),
	// Fetch user in beforeLoad so it's available to all child routes
	beforeLoad: async () => {
		// Skip on server side (SPA mode still runs beforeLoad during prerender)
		if (typeof window === "undefined") {
			return { user: null };
		}
		try {
			const result = await getCurrentUser({
				fields: [...currentUserFields],
				fetchOptions: { credentials: "include" },
			});
			const userData = result.success && result.data ? result.data : null;
			return {
				user: userData ? { id: userData.id } : null,
			};
		} catch (error) {
			console.error("[Root] Error fetching current user:", error);
			return { user: null };
		}
	},
	component: RootComponent,
	shellComponent: RootShell,
	errorComponent: ({ error, reset }) => {
		console.error("[Root] Unhandled route error:", error);
		return (
			<div class="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
				<div class="text-center">
					<h1 class="mb-2 font-bold text-2xl">Something went wrong</h1>
					<p class="mb-4 text-neutral-400">
						{error instanceof Error ? error.message : String(error)}
					</p>
					<button
						class="rounded-lg bg-primary px-4 py-2 text-sm transition-colors hover:bg-primary-hover"
						onClick={reset}
						type="button">
						Try again
					</button>
				</div>
			</div>
		);
	},
});

function RootShell(props: { children: JSX.Element }) {
	return (
		<html lang="en">
			<head>
				<HydrationScript />
				<HeadContent />
			</head>
			<body>
				<div id="app">{props.children}</div>
				<Scripts />
			</body>
		</html>
	);
}

function RootComponent() {
	return (
		<ThemeProvider>
			<I18nProvider>
				<AuthProvider>
					<ImpersonationProvider>
						<LocaleSync />
						<ImpersonationBanner />
						<Suspense>
							<Outlet />
						</Suspense>
					</ImpersonationProvider>
				</AuthProvider>
			</I18nProvider>
		</ThemeProvider>
	);
}
