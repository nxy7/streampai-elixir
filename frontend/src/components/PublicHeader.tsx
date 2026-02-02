import { Link } from "@tanstack/solid-router";
import { For, Show, createSignal } from "solid-js";
import Logo from "~/components/Logo";
import { Button, ThemeToggle } from "~/design-system";
import { useTranslation } from "~/i18n";
import { getDashboardUrl, getLoginUrl, useCurrentUser } from "~/lib/auth";

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
	const [mobileMenuOpen, setMobileMenuOpen] = createSignal(false);

	const handleNavClick = (e: MouseEvent, url: string) => {
		if (url.startsWith("#") && typeof document !== "undefined") {
			e.preventDefault();
			const target = document.querySelector(url);
			if (target) {
				target.scrollIntoView({ behavior: "smooth" });
				setMobileMenuOpen(false);
			}
		}
	};

	return (
		<nav class="sticky top-0 z-50 border-neutral-200 border-b bg-surface/95 backdrop-blur-md">
			<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div class="flex items-center justify-between py-4">
					<Link to="/">
						<Logo showText size="md" />
					</Link>

					<div class="hidden items-center space-x-6 md:flex">
						<Show when={props.navItems}>
							<For each={props.navItems}>
								{(item) => (
									<a
										class="text-neutral-600 transition-colors hover:text-neutral-900"
										href={item.url}
										onClick={(e) => handleNavClick(e, item.url)}>
										{t(item.labelKey)}
									</a>
								)}
							</For>
						</Show>
						<ThemeToggle />
						<Show
							fallback={
								<Button
									as="button"
									class="h-9 w-[120px]"
									disabled
									variant="gradient">
									<svg
										aria-hidden="true"
										class="h-4 w-4 animate-spin"
										fill="none"
										viewBox="0 0 24 24">
										<circle
											class="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											stroke-width="4"
										/>
										<path
											class="opacity-75"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
											fill="currentColor"
										/>
									</svg>
								</Button>
							}
							when={!isUserLoading()}>
							<Show
								fallback={
									<Button
										as="link"
										class="h-9 w-[120px]"
										href={getLoginUrl()}
										variant="gradient">
										{t("landing.getStarted")}
									</Button>
								}
								when={user()}>
								<Button
									as="link"
									class="h-9 w-[120px]"
									href={getDashboardUrl()}
									variant="gradient">
									{t("nav.dashboard")}
								</Button>
							</Show>
						</Show>
					</div>

					<div class="flex items-center gap-2 md:hidden">
						<ThemeToggle />
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
											href={item.url}
											onClick={(e) => handleNavClick(e, item.url)}>
											{t(item.labelKey)}
										</a>
									)}
								</For>
							</Show>
							<div class="pt-2">
								<Show
									fallback={
										<Button as="button" disabled fullWidth variant="gradient">
											<svg
												aria-hidden="true"
												class="h-4 w-4 animate-spin"
												fill="none"
												viewBox="0 0 24 24">
												<circle
													class="opacity-25"
													cx="12"
													cy="12"
													r="10"
													stroke="currentColor"
													stroke-width="4"
												/>
												<path
													class="opacity-75"
													d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
													fill="currentColor"
												/>
											</svg>
										</Button>
									}
									when={!isUserLoading()}>
									<Show
										fallback={
											<Button
												as="link"
												fullWidth
												href={getLoginUrl()}
												variant="gradient">
												{t("landing.getStarted")}
											</Button>
										}
										when={user()}>
										<Button
											as="link"
											fullWidth
											href={getDashboardUrl()}
											variant="gradient">
											{t("nav.dashboard")}
										</Button>
									</Show>
								</Show>
							</div>
						</div>
					</div>
				</Show>
			</div>
		</nav>
	);
}
