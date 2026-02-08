import { Show } from "solid-js";
import { cn } from "~/design-system/design-system";
import { useTranslation } from "~/i18n";
import { useCurrentUser, useImpersonation } from "~/lib/auth";

/**
 * A floating banner that appears when an admin is impersonating another user.
 * Shows the impersonated user's name and provides an exit button.
 */
export function ImpersonationBanner() {
	const { isImpersonating, exitImpersonation, isLoading } = useImpersonation();
	const { user } = useCurrentUser();
	const { t } = useTranslation();

	const handleExit = async () => {
		try {
			await exitImpersonation();
		} catch (error) {
			console.error("Failed to exit impersonation:", error);
		}
	};

	return (
		<Show when={!isLoading() && isImpersonating()}>
			<div
				class={cn(
					"fixed bottom-4 left-1/2 z-50 -translate-x-1/2",
					"bg-amber-500 text-white",
					"rounded-lg px-4 py-2 shadow-lg",
					"flex items-center gap-3",
					"slide-in-from-bottom-4 animate-in duration-300",
				)}
				role="alert">
				<svg
					aria-hidden="true"
					class="h-5 w-5 shrink-0"
					fill="currentColor"
					viewBox="0 0 20 20">
					<path
						clip-rule="evenodd"
						d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
						fill-rule="evenodd"
					/>
				</svg>
				<span class="font-medium text-sm">
					{t("impersonation.banner", {
						name: user()?.name || user()?.email || "user",
					})}
				</span>
				<button
					class="ml-2 rounded-md bg-white px-3 py-1 font-medium text-amber-700 text-sm hover:bg-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-200 focus-visible:outline-offset-2"
					onClick={handleExit}
					type="button">
					{t("impersonation.exit")}
				</button>
			</div>
		</Show>
	);
}
