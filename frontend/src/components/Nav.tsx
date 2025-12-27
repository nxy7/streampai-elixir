import { A, useLocation } from "@solidjs/router";
import { Show } from "solid-js";
import { useTranslation } from "~/i18n";
import {
	getDashboardUrl,
	getLoginUrl,
	getLogoutUrl,
	useCurrentUser,
} from "~/lib/auth";

export default function Nav() {
	const { t } = useTranslation();
	const location = useLocation();
	const { user, isLoading } = useCurrentUser();

	const active = (path: string) =>
		path === location.pathname
			? "border-sky-600"
			: "border-transparent hover:border-sky-600";

	return (
		<nav class="bg-sky-800">
			<div class="container flex items-center justify-between p-3 text-gray-200">
				<ul class="flex items-center">
					<li class={`border-b-2 ${active("/")} mx-1.5 sm:mx-6`}>
						<A href="/">{t("nav.home")}</A>
					</li>
					<li class={`border-b-2 ${active("/about")} mx-1.5 sm:mx-6`}>
						<A href="/about">{t("nav.about")}</A>
					</li>
				</ul>

				<div class="flex items-center gap-3">
					<Show when={!isLoading()}>
						<Show
							when={user()}
							fallback={
								<div class="flex gap-2">
									<a
										href={getLoginUrl()}
										class="rounded bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700">
										{t("nav.signIn")}
									</a>
									<a
										href={getLoginUrl("google")}
										class="flex items-center gap-2 rounded bg-white px-4 py-2 text-gray-900 transition-colors hover:bg-gray-100">
										<svg aria-hidden="true" class="h-5 w-5" viewBox="0 0 24 24">
											<path
												fill="currentColor"
												d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
											/>
											<path
												fill="currentColor"
												d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
											/>
											<path
												fill="currentColor"
												d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
											/>
											<path
												fill="currentColor"
												d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
											/>
										</svg>
										{t("nav.google")}
									</a>
									<a
										href={getLoginUrl("twitch")}
										class="flex items-center gap-2 rounded bg-purple-500 px-4 py-2 text-white transition-colors hover:bg-purple-600">
										<svg
											aria-hidden="true"
											class="h-5 w-5"
											fill="currentColor"
											viewBox="0 0 24 24">
											<path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
										</svg>
										{t("nav.twitch")}
									</a>
								</div>
							}>
							{(currentUser) => (
								<div class="flex items-center gap-3">
									<span class="text-sm">
										{t("nav.welcome", {
											name: currentUser().name || currentUser().email || "",
										})}
									</span>
									<A
										href={getDashboardUrl()}
										class="rounded bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700">
										{t("nav.dashboard")}
									</A>
									<a
										href={getLogoutUrl()}
										rel="external"
										class="rounded bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700">
										{t("nav.signOut")}
									</a>
								</div>
							)}
						</Show>
					</Show>
				</div>
			</div>
		</nav>
	);
}
