import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";
import { Show, createSignal } from "solid-js";
import PublicFooter from "~/components/PublicFooter";
import { ThemeToggleIcon } from "~/components/ThemeSwitcher";
import { useTranslation } from "~/i18n";
import { getDashboardUrl, getLoginUrl, useCurrentUser } from "~/lib/auth";

function LandingNavigation() {
	const { t } = useTranslation();
	const { user, isLoading: isUserLoading } = useCurrentUser();
	const [mobileMenuOpen, setMobileMenuOpen] = createSignal(false);

	const navItems = [
		{ url: "#features", labelKey: "landing.features" },
		{ url: "#about", labelKey: "landing.about" },
	];

	return (
		<nav class="relative z-50 border-white/10 border-b bg-black/20">
			<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div class="flex items-center justify-between py-4">
					<div class="flex items-center space-x-2">
						<div class="mb-4 flex items-center space-x-2 md:mb-0">
							<img
								alt="Streampai Logo"
								class="h-8 w-8"
								src="/images/logo-white.png"
							/>
							<span class="font-bold text-white text-xl">Streampai</span>
						</div>
					</div>

					<div class="hidden items-center space-x-6 md:flex">
						{navItems.map((item) => (
							<a
								class="text-gray-300 transition-colors hover:text-white"
								href={item.url}>
								{t(item.labelKey)}
							</a>
						))}
						<ThemeToggleIcon />
						<Show when={!isUserLoading()}>
							<Show
								fallback={
									<a
										class="rounded-lg bg-linear-to-r from-purple-500 to-pink-500 px-6 py-2 text-white transition-all hover:from-purple-600 hover:to-pink-600"
										href={getLoginUrl()}>
										{t("landing.getStarted")}
									</a>
								}
								when={user()}>
								<A
									class="rounded-lg bg-linear-to-r from-purple-500 to-pink-500 px-6 py-2 text-white transition-all hover:from-purple-600 hover:to-pink-600"
									href={getDashboardUrl()}>
									{t("nav.dashboard")}
								</A>
							</Show>
						</Show>
					</div>

					<div class="md:hidden">
						<button
							class="text-gray-300 hover:text-white"
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
					<div class="absolute top-20 right-0 left-0 z-50">
						<div class="mx-4 mt-2 space-y-4 rounded-lg bg-white/10 px-4 py-4 backdrop-blur-md">
							{navItems.map((item) => (
								<a
									class="block py-2 text-gray-300 hover:text-white"
									href={item.url}>
									{t(item.labelKey)}
								</a>
							))}
							<div class="flex items-center gap-2 py-2">
								<span class="text-gray-300 text-sm">{t("settings.theme") || "Theme"}:</span>
								<ThemeToggleIcon />
							</div>
							<Show when={!isUserLoading()}>
								<div class="pt-2">
									<Show
										fallback={
											<a
												class="block w-full rounded-lg bg-linear-to-r from-purple-500 to-pink-500 px-6 py-2 text-center text-white transition-all hover:from-purple-600 hover:to-pink-600"
												href={getLoginUrl()}>
												{t("landing.getStarted")}
											</a>
										}
										when={user()}>
										<A
											class="block w-full rounded-lg bg-linear-to-r from-purple-500 to-pink-500 px-6 py-2 text-center text-white transition-all hover:from-purple-600 hover:to-pink-600"
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

function LandingHero() {
	const { t } = useTranslation();
	const [email, setEmail] = createSignal("");
	const [message, setMessage] = createSignal<string | null>(null);
	const [error, setError] = createSignal<string | null>(null);
	const [loading, setLoading] = createSignal(false);

	const handleNewsletterSignup = async (e: Event) => {
		e.preventDefault();
		setLoading(true);
		setMessage(null);
		setError(null);

		// TODO: Implement newsletter signup via RPC
		setTimeout(() => {
			setMessage(t("landing.newsletterSuccess"));
			setLoading(false);
			setEmail("");
			setTimeout(() => setMessage(null), 7000);
		}, 1000);
	};

	return (
		<section class="relative flex min-h-screen items-center justify-center overflow-hidden">
			<div class="absolute inset-0 bg-linear-to-r from-purple-800/20 to-pink-800/20"></div>
			<div class="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
				<div class="text-center">
					<h1 class="mb-8 font-bold text-5xl text-white md:text-7xl">
						{t("landing.heroTitle1")}{" "}
						<span class="bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
							{t("landing.heroTitle2")}
						</span>
						<br />
						{t("landing.heroTitle3")}
					</h1>

					<div class="mx-auto mb-8 max-w-2xl rounded-2xl border border-yellow-500/30 bg-linear-to-r from-yellow-500/20 to-orange-500/20 p-6 backdrop-blur-lg">
						<div class="mb-4 flex items-center justify-center">
							<svg
								aria-hidden="true"
								class="mr-3 h-8 w-8 text-yellow-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
								/>
							</svg>
							<h2 class="font-bold text-2xl text-yellow-400">
								{t("landing.underConstruction")}
							</h2>
						</div>
						<p class="mb-6 text-center text-lg text-white">
							{t("landing.underConstructionText")}
						</p>

						<form
							class="mx-auto flex max-w-md flex-col gap-3 sm:flex-row"
							onSubmit={handleNewsletterSignup}>
							<input
								class="flex-1 rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-gray-300 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
								onInput={(e) => setEmail(e.currentTarget.value)}
								placeholder={t("landing.emailPlaceholder")}
								required
								type="email"
								value={email()}
							/>
							<button
								class="transform rounded-lg bg-linear-to-r from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white shadow-xl transition-all hover:scale-105 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
								disabled={loading()}
								type="submit">
								{loading() ? t("landing.submitting") : t("landing.notifyMe")}
							</button>
						</form>

						{message() && (
							<div class="mt-3 text-center">
								<p class="font-medium text-green-400 text-sm">✓ {message()}</p>
							</div>
						)}

						{error() && (
							<div class="mt-3 text-center">
								<p class="font-medium text-red-400 text-sm">✗ {error()}</p>
							</div>
						)}
					</div>

					<p class="mx-auto mb-12 max-w-3xl text-gray-300 text-xl leading-relaxed">
						{t("landing.heroDescription")}
					</p>

					<div class="flex flex-wrap items-center justify-center gap-8 opacity-70">
						<div class="flex items-center space-x-3">
							<div class="flex h-8 w-8 items-center justify-center rounded bg-purple-500">
								<svg
									aria-hidden="true"
									class="h-5 w-5 text-white"
									fill="currentColor"
									viewBox="0 0 24 24">
									<path d="M2.149 0L.537 4.119v13.836c0 .44.26.806.684.956L2.149 24h11.983l1.695-4.956c.426-.15.685-.516.685-.956V4.119L14.676 0H2.149zm8.77 4.119v2.836h2.836V4.119h-2.836zm-5.673 0v2.836h2.836V4.119H5.246zm11.346 5.673v2.836h2.836v-2.836h-2.836zm-5.673 0v2.836h2.836v-2.836h-2.836z" />
								</svg>
							</div>
							<span class="font-medium text-white">Twitch</span>
						</div>
						<div class="flex items-center space-x-3">
							<div class="flex h-8 w-8 items-center justify-center rounded bg-red-500">
								<svg
									aria-hidden="true"
									class="h-4 w-6 text-white"
									fill="currentColor"
									viewBox="0 0 24 24">
									<path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
								</svg>
							</div>
							<span class="font-medium text-white">YouTube</span>
						</div>
						<div class="flex items-center space-x-3">
							<div class="flex h-8 w-8 items-center justify-center rounded bg-green-500">
								<span class="font-bold text-sm text-white">K</span>
							</div>
							<span class="font-medium text-white">Kick</span>
						</div>
						<div class="flex items-center space-x-3">
							<div class="flex h-8 w-8 items-center justify-center rounded bg-blue-600">
								<svg
									aria-hidden="true"
									class="h-5 w-5 text-white"
									fill="currentColor"
									viewBox="0 0 24 24">
									<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
								</svg>
							</div>
							<span class="font-medium text-white">Facebook</span>
						</div>
						<div class="flex items-center space-x-3">
							<div class="flex h-8 w-8 items-center justify-center rounded bg-linear-to-r from-purple-500 to-pink-500">
								<svg
									aria-hidden="true"
									class="h-4 w-4 text-white"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24">
									<path
										d="M12 6v6m0 0v6m0-6h6m-6 0H6"
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
									/>
								</svg>
							</div>
							<span class="font-medium text-white">{t("landing.more")}</span>
						</div>
					</div>
				</div>
			</div>

			<div class="absolute top-20 left-10 h-20 w-20 animate-pulse rounded-full bg-purple-500/20 blur-xl"></div>
			<div
				class="absolute top-40 right-20 h-32 w-32 animate-pulse rounded-full bg-pink-500/20 blur-xl"
				style="animation-delay: 1000ms"></div>
			<div
				class="absolute bottom-20 left-1/4 h-16 w-16 animate-pulse rounded-full bg-blue-500/20 blur-xl"
				style="animation-delay: 500ms"></div>
		</section>
	);
}

function LandingFeatures() {
	const { t } = useTranslation();

	return (
		<>
			<section class="bg-black/20 py-24" id="features">
				<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div class="mb-20 text-center">
						<h2 class="mb-6 font-bold text-4xl text-white md:text-5xl">
							{t("landing.featuresTitle1")}{" "}
							<span class="bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
								{t("landing.featuresTitle2")}
							</span>
						</h2>
						<p class="mx-auto max-w-3xl text-gray-300 text-xl">
							{t("landing.featuresSubtitle")}
						</p>
					</div>

					<div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
						<div class="group rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg transition-all hover:bg-white/10">
							<div class="mb-4 flex items-start space-x-4">
								<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-r from-purple-500 to-pink-500">
									<svg
										aria-hidden="true"
										class="h-6 w-6 text-white"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24">
										<path
											d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
										/>
									</svg>
								</div>
								<h3 class="grow font-bold text-white text-xl">
									{t("landing.multiPlatformTitle")}
								</h3>
							</div>
							<p class="text-gray-300 leading-relaxed">
								{t("landing.multiPlatformDescription")}
							</p>
						</div>

						<div class="group rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg transition-all hover:bg-white/10">
							<div class="mb-4 flex items-start space-x-4">
								<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-r from-blue-500 to-cyan-500">
									<svg
										aria-hidden="true"
										class="h-6 w-6 text-white"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24">
										<path
											d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
										/>
									</svg>
								</div>
								<h3 class="grow font-bold text-white text-xl">
									{t("landing.unifiedChatTitle")}
								</h3>
							</div>
							<p class="text-gray-300 leading-relaxed">
								{t("landing.unifiedChatDescription")}
							</p>
						</div>

						<div class="group rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg transition-all hover:bg-white/10">
							<div class="mb-4 flex items-start space-x-4">
								<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-r from-green-500 to-emerald-500">
									<svg
										aria-hidden="true"
										class="h-6 w-6 text-white"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24">
										<path
											d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
										/>
									</svg>
								</div>
								<h3 class="grow font-bold text-white text-xl">
									{t("landing.analyticsTitle")}
								</h3>
							</div>
							<p class="text-gray-300 leading-relaxed">
								{t("landing.analyticsDescription")}
							</p>
						</div>

						<div class="group rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg transition-all hover:bg-white/10">
							<div class="mb-4 flex items-start space-x-4">
								<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-r from-orange-500 to-red-500">
									<svg
										aria-hidden="true"
										class="h-6 w-6 text-white"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24">
										<path
											d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
										/>
									</svg>
								</div>
								<h3 class="grow font-bold text-white text-xl">
									{t("landing.moderationTitle")}
								</h3>
							</div>
							<p class="text-gray-300 leading-relaxed">
								{t("landing.moderationDescription")}
							</p>
						</div>

						<div class="group rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg transition-all hover:bg-white/10">
							<div class="mb-4 flex items-start space-x-4">
								<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-r from-indigo-500 to-purple-500">
									<svg
										aria-hidden="true"
										class="h-6 w-6 text-white"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24">
										<path
											d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
										/>
									</svg>
								</div>
								<h3 class="grow font-bold text-white text-xl">
									{t("landing.widgetsTitle")}
								</h3>
							</div>
							<p class="text-gray-300 leading-relaxed">
								{t("landing.widgetsDescription")}
							</p>
						</div>

						<div class="group rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg transition-all hover:bg-white/10">
							<div class="mb-4 flex items-start space-x-4">
								<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-r from-pink-500 to-rose-500">
									<svg
										aria-hidden="true"
										class="h-6 w-6 text-white"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24">
										<path
											d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
										/>
									</svg>
								</div>
								<h3 class="grow font-bold text-white text-xl">
									{t("landing.teamTitle")}
								</h3>
							</div>
							<p class="text-gray-300 leading-relaxed">
								{t("landing.teamDescription")}
							</p>
						</div>
					</div>
				</div>
			</section>

			<section class="bg-black/30 py-24" id="about">
				<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div class="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
						<div>
							<h2 class="mb-8 font-bold text-4xl text-white md:text-5xl">
								{t("landing.aboutTitle1")}{" "}
								<span class="bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
									{t("landing.aboutTitle2")}
								</span>
							</h2>
							<div class="space-y-6 text-gray-300 text-lg">
								<p>{t("landing.aboutParagraph1")}</p>
								<p>{t("landing.aboutParagraph2")}</p>
								<p>{t("landing.aboutParagraph3")}</p>
							</div>

							<div class="mt-12 grid grid-cols-2 gap-8">
								<div class="text-center">
									<div class="mb-2 font-bold text-3xl text-purple-400">5+</div>
									<div class="text-gray-300">
										{t("landing.platformIntegrations")}
									</div>
								</div>
								<div class="text-center">
									<div class="mb-2 font-bold text-3xl text-pink-400">99.9%</div>
									<div class="text-gray-300">{t("landing.uptime")}</div>
								</div>
							</div>
						</div>

						<div class="relative">
							<div class="rounded-2xl border border-white/10 bg-linear-to-br from-purple-500/20 to-pink-500/20 p-8 backdrop-blur-lg">
								<div class="space-y-6">
									<div class="flex items-center space-x-4">
										<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-r from-green-500 to-emerald-500">
											<svg
												aria-hidden="true"
												class="h-6 w-6 text-white"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24">
												<path
													d="M5 13l4 4L19 7"
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
												/>
											</svg>
										</div>
										<div>
											<h4 class="font-semibold text-white">
												{t("landing.realTimeSync")}
											</h4>
											<p class="text-gray-300">
												{t("landing.realTimeSyncDescription")}
											</p>
										</div>
									</div>

									<div class="flex items-center space-x-4">
										<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-r from-blue-500 to-cyan-500">
											<svg
												aria-hidden="true"
												class="h-6 w-6 text-white"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24">
												<path
													d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
												/>
											</svg>
										</div>
										<div>
											<h4 class="font-semibold text-white">
												{t("landing.advancedAnalytics")}
											</h4>
											<p class="text-gray-300">
												{t("landing.advancedAnalyticsDescription")}
											</p>
										</div>
									</div>

									<div class="flex items-center space-x-4">
										<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-r from-purple-500 to-pink-500">
											<svg
												aria-hidden="true"
												class="h-6 w-6 text-white"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24">
												<path
													d="M13 10V3L4 14h7v7l9-11h-7z"
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
												/>
											</svg>
										</div>
										<div>
											<h4 class="font-semibold text-white">
												{t("landing.aiPoweredGrowth")}
											</h4>
											<p class="text-gray-300">
												{t("landing.aiPoweredGrowthDescription")}
											</p>
										</div>
									</div>
								</div>
							</div>

							<div class="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-linear-to-r from-purple-500/30 to-pink-500/30 blur-2xl"></div>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}

function LandingCTA() {
	const { t } = useTranslation();

	return (
		<section class="bg-linear-to-r from-purple-600/20 to-pink-600/20 py-24">
			<div class="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
				<h2 class="mb-6 font-bold text-4xl text-white md:text-5xl">
					{t("landing.ctaTitle")}
				</h2>
				<p class="text-gray-300 text-xl">{t("landing.ctaSubtitle")}</p>
			</div>
		</section>
	);
}

export default function Home() {
	return (
		<>
			<Title>Streampai - Multi-Platform Streaming Solution</Title>
			<div class="min-h-screen bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900">
				<LandingNavigation />
				<LandingHero />
				<LandingFeatures />
				<LandingCTA />
				<PublicFooter showTagline />
			</div>
		</>
	);
}
