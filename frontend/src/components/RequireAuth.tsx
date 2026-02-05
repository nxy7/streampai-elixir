import { Link } from "@tanstack/solid-router";
import { type JSX, Show } from "solid-js";
import { useTranslation } from "~/i18n";
import { getLoginUrl, useCurrentUser } from "~/lib/auth";

interface RequireAuthProps {
	/**
	 * Content to render when user is authenticated
	 */
	children: JSX.Element;
	/**
	 * Message shown below the title explaining why authentication is needed.
	 * Defaults to a generic "sign in to continue" message.
	 */
	message?: string;
	/**
	 * Optional fallback to show while checking auth state.
	 * If not provided, shows nothing during the check.
	 */
	loadingFallback?: JSX.Element;
	/**
	 * Whether auth is still being checked.
	 * When true and loadingFallback is provided, shows the loading state.
	 */
	isLoading?: boolean;
}

/**
 * Component that wraps content requiring authentication.
 * Shows a sign-in prompt when user is not authenticated.
 */
export default function RequireAuth(props: RequireAuthProps) {
	const { t } = useTranslation();
	const { user } = useCurrentUser();

	return (
		<Show fallback={props.loadingFallback} when={!props.isLoading}>
			<Show
				fallback={
					<div class="flex min-h-screen items-center justify-center bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900">
						<div class="py-12 text-center">
							<h2 class="mb-4 font-bold text-2xl text-white">
								{t("dashboard.notAuthenticated")}
							</h2>
							<p class="mb-6 text-neutral-300">
								{props.message ?? t("dashboard.signInToAccess")}
							</p>
							<Link
								class="inline-block rounded-lg bg-linear-to-r from-primary-light to-secondary px-6 py-3 font-semibold text-white transition-all hover:from-primary hover:to-secondary-hover"
								to={getLoginUrl()}>
								{t("nav.signIn")}
							</Link>
						</div>
					</div>
				}
				when={user()}>
				{props.children}
			</Show>
		</Show>
	);
}
