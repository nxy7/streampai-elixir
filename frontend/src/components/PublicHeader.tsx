import { A } from "@solidjs/router";
import { For, Show, createSignal } from "solid-js";
import { useTranslation } from "~/i18n";
import { getDashboardUrl, getLoginUrl, useCurrentUser } from "~/lib/auth";
import { useTheme } from "~/lib/theme";

interface NavItem {
	url: string;
	labelKey: string;
}

interface PublicHeaderProps {
	navItems?: NavItem[];
}

export default function PublicHeader(props: PublicHeaderProps) {
	const { t } = useTranslation();
	const { user, isLoading: isUserLoading } = useCurrentUser();
	const { theme, toggleTheme } = useTheme();
	const [mobileMenuOpen, setMobileMenuOpen] = createSignal(false);

	return (
		<nav class="sticky top-0 z-50 border-neutral-200 border-b bg-surface/80 backdrop-blur-md">
			<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div class="flex items-center justify-between py-4">
					<A class="flex items-center space-x-2" href="/">
						<img
							alt="Streampai Logo"
							class="hidden h-8 w-8 dark:block"
							src="/images/logo-white.png"
						/>
						<img
							alt="Streampai Logo"
							class="block h-8 w-8 dark:hidden"
							src="/images/logo-black.png"
						/>
						<span class="font-bold text-neutral-900 text-xl">Streampai</span>
					</A>

					<div class="hidden items-center space-x-6 md:flex">
						<Show when={props.navItems}>
							<For each={props.navItems}>
								{(item) => (
									<a
										class="text-neutral-600 transition-colors hover:text-neutral-900"
										href={item.url}>
										{t(item.labelKey)}
									</a>
								)}
							</For>
						</Show>
						<button
							aria-label={t("header.toggleTheme")}
							class="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
							onClick={(e) => toggleTheme(e)}
							type="button">
							<Show
								fallback={
									<svg
										aria-hidden="true"
										class="h-5 w-5"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										viewBox="0 0 24 24">
										<path
											d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
									</svg>
								}
								when={theme() === "dark"}>
								<svg
									aria-hidden="true"
									class="h-5 w-5"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									viewBox="0 0 24 24">
									<circle cx="12" cy="12" r="5" />
									<path
										d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
							</Show>
						</button>
						<Show when={!isUserLoading()}>
							<Show
								fallback={
									<a
										class="rounded-lg bg-linear-to-r from-primary-light to-secondary px-6 py-2 text-white transition-all hover:from-primary hover:to-secondary-hover"
										href={getLoginUrl()}>
										{t("landing.getStarted")}
									</a>
								}
								when={user()}>
								<A
									class="rounded-lg bg-linear-to-r from-primary-light to-secondary px-6 py-2 text-white transition-all hover:from-primary hover:to-secondary-hover"
									href={getDashboardUrl()}>
									{t("nav.dashboard")}
								</A>
							</Show>
						</Show>
					</div>

					<div class="flex items-center gap-2 md:hidden">
						<button
							aria-label={t("header.toggleTheme")}
							class="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
							onClick={(e) => toggleTheme(e)}
							type="button">
							<Show
								fallback={
									<svg
										aria-hidden="true"
										class="h-5 w-5"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										viewBox="0 0 24 24">
										<path
											d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
									</svg>
								}
								when={theme() === "dark"}>
								<svg
									aria-hidden="true"
									class="h-5 w-5"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									viewBox="0 0 24 24">
									<circle cx="12" cy="12" r="5" />
									<path
										d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
							</Show>
						</button>
						<button
							class="text-neutral-600 hover:text-neutral-900"
							onClick={() => setMobileMenuOpen(!mobileMenuOpen())}
							type="button">
							<svg
								aria-hidden="true"
								class="h-6 w-6"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									d="M4 6h16M4 12h16M4 18h16"
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
								/>
							</svg>
						</button>
					</div>
				</div>

				<Show when={mobileMenuOpen()}>
					<div class="absolute top-16 right-0 left-0 z-50">
						<div class="mx-4 mt-2 space-y-4 rounded-lg bg-surface px-4 py-4 shadow-lg">
							<Show when={props.navItems}>
								<For each={props.navItems}>
									{(item) => (
										<a
											class="block py-2 text-neutral-600 hover:text-neutral-900"
											href={item.url}>
											{t(item.labelKey)}
										</a>
									)}
								</For>
							</Show>
							<Show when={!isUserLoading()}>
								<div class="pt-2">
									<Show
										fallback={
											<a
												class="block w-full rounded-lg bg-linear-to-r from-primary-light to-secondary px-6 py-2 text-center text-white transition-all hover:from-primary hover:to-secondary-hover"
												href={getLoginUrl()}>
												{t("landing.getStarted")}
											</a>
										}
										when={user()}>
										<A
											class="block w-full rounded-lg bg-linear-to-r from-primary-light to-secondary px-6 py-2 text-center text-white transition-all hover:from-primary hover:to-secondary-hover"
											href={getDashboardUrl()}>
											{t("nav.dashboard")}
										</A>
									</Show>
								</div>
							</Show>
						</div>
					</div>
				</Show>
			</div>
		</nav>
	);
}
