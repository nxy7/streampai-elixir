import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";
import { Show } from "solid-js";
import { useTranslation } from "~/i18n";
import { useCurrentUser } from "~/lib/auth";

export default function NotFound() {
	const { t } = useTranslation();
	const { user } = useCurrentUser();

	return (
		<>
			<Title>{t("notFound.code")} - Streampai</Title>
			<main class="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900">
				{/* Animated background blobs */}
				<div class="absolute top-20 left-10 h-32 w-32 animate-pulse rounded-full bg-primary-light/20 blur-xl" />
				<div
					class="absolute top-40 right-20 h-48 w-48 animate-pulse rounded-full bg-secondary/20 blur-xl"
					style="animation-delay: 1000ms"
				/>
				<div
					class="absolute bottom-20 left-1/4 h-24 w-24 animate-pulse rounded-full bg-blue-500/20 blur-xl"
					style="animation-delay: 500ms"
				/>
				<div
					class="absolute right-1/3 bottom-40 h-36 w-36 animate-pulse rounded-full bg-indigo-500/20 blur-xl"
					style="animation-delay: 1500ms"
				/>

				<div class="relative z-10 mx-auto max-w-2xl px-4 text-center">
					{/* Logo */}
					<div class="mb-8 flex items-center justify-center space-x-3">
						<img
							alt="Streampai Logo"
							class="h-12 w-12"
							src="/images/logo-white.png"
						/>
						<span class="font-bold text-2xl text-white">Streampai</span>
					</div>

					{/* Cute TV/Monitor illustration with static */}
					<div class="relative mx-auto mb-8 h-48 w-64">
						{/* Monitor body */}
						<div class="absolute inset-0 rounded-2xl border-4 border-white/20 bg-linear-to-br from-neutral-800 to-neutral-900 shadow-2xl">
							{/* Screen with static effect */}
							<div class="relative m-3 h-32 overflow-hidden rounded-lg bg-linear-to-br from-neutral-900 to-neutral-800">
								{/* Static noise animation - CSS pattern */}
								<div class="absolute inset-0 animate-pulse bg-[length:4px_4px] bg-[linear-gradient(45deg,rgba(255,255,255,0.03)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.03)_50%,rgba(255,255,255,0.03)_75%,transparent_75%,transparent)]" />

								{/* 404 on screen */}
								<div class="absolute inset-0 flex items-center justify-center">
									<span class="font-bold text-5xl text-primary-light/80">
										{t("notFound.code")}
									</span>
								</div>

								{/* Screen glare */}
								<div class="absolute top-0 left-0 h-full w-1/2 bg-linear-to-r from-white/5 to-transparent" />
							</div>
						</div>

						{/* Monitor stand */}
						<div class="absolute bottom-0 left-1/2 h-4 w-16 -translate-x-1/2 translate-y-full rounded-b-lg bg-linear-to-b from-neutral-700 to-neutral-800" />
						<div class="absolute bottom-0 left-1/2 h-2 w-24 -translate-x-1/2 translate-y-[calc(100%+16px)] rounded-b-lg bg-linear-to-b from-neutral-700 to-neutral-800" />

						{/* Cute face on monitor - sad expression */}
						<div class="absolute top-16 left-1/2 flex -translate-x-1/2 items-center justify-center space-x-8">
							{/* Left eye - X shape */}
							<div class="relative h-4 w-4">
								<div class="absolute top-1/2 left-0 h-0.5 w-4 -translate-y-1/2 rotate-45 bg-secondary" />
								<div class="absolute top-1/2 left-0 h-0.5 w-4 -translate-y-1/2 -rotate-45 bg-secondary" />
							</div>
							{/* Right eye - X shape */}
							<div class="relative h-4 w-4">
								<div class="absolute top-1/2 left-0 h-0.5 w-4 -translate-y-1/2 rotate-45 bg-secondary" />
								<div class="absolute top-1/2 left-0 h-0.5 w-4 -translate-y-1/2 -rotate-45 bg-secondary" />
							</div>
						</div>
						{/* Sad mouth */}
						<div class="absolute top-24 left-1/2 h-3 w-8 -translate-x-1/2 rounded-t-full border-secondary border-t-2" />

						{/* Decorative antenna */}
						<div class="absolute top-0 left-1/2 h-6 w-1 -translate-x-1/2 -translate-y-full bg-white/30" />
						<div class="absolute top-0 left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-[calc(100%+20px)] rounded-full bg-secondary shadow-[0_0_10px_rgba(236,72,153,0.5)]" />
					</div>

					{/* Error message */}
					<h1 class="mb-4 font-bold text-3xl text-white md:text-4xl">
						{t("notFound.title")}
					</h1>

					<p class="mb-2 text-lg text-primary-200">
						{t("notFound.description")}
					</p>

					<p class="mb-8 text-neutral-400">{t("notFound.suggestion")}</p>

					{/* Action buttons */}
					<div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
						<A
							class="inline-flex items-center justify-center rounded-lg bg-linear-to-r from-primary-light to-secondary px-6 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:from-primary hover:to-secondary-hover hover:shadow-xl"
							href="/">
							<svg
								aria-hidden="true"
								class="mr-2 h-5 w-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
								/>
							</svg>
							{t("notFound.homeButton")}
						</A>

						<Show when={user()}>
							<A
								class="inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/10 px-6 py-3 font-semibold text-white shadow-lg backdrop-blur-sm transition-all hover:bg-white/20"
								href="/dashboard">
								<svg
									aria-hidden="true"
									class="mr-2 h-5 w-5"
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
								{t("notFound.dashboardButton")}
							</A>
						</Show>
					</div>

					{/* Footer hint */}
					<p class="mt-12 text-neutral-500 text-sm">
						{t("notFound.searchHint")}
					</p>
				</div>
			</main>
		</>
	);
}
