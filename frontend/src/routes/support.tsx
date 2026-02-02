import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";
import PublicFooter from "~/components/PublicFooter";
import PublicHeader from "~/components/PublicHeader";
import { useTranslation } from "~/i18n";

export const route = {
	prerender: true,
};

export default function Support() {
	const { t } = useTranslation();

	return (
		<>
			<Title>{t("support.title")} - Streampai</Title>
			<div class="flex min-h-screen flex-col bg-surface">
				<PublicHeader />

				<main class="flex-1 py-12">
					<div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
						<div class="mb-8 text-center">
							<h2 class="mb-4 font-bold text-3xl text-neutral-900">
								{t("support.heading")}
							</h2>
							<p class="text-lg text-neutral-600">{t("support.subheading")}</p>
						</div>

						<div class="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2">
							<div class="rounded-2xl bg-neutral-50 p-6 transition-all hover:bg-neutral-100">
								<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-r from-primary-light to-secondary">
									<svg
										aria-hidden="true"
										class="h-6 w-6 text-white"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24">
										<path
											d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
										/>
									</svg>
								</div>
								<h3 class="mb-2 font-semibold text-neutral-900 text-xl">
									{t("support.documentation")}
								</h3>
								<p class="mb-4 text-neutral-600">
									{t("support.documentationDescription")}
								</p>
								<span class="text-primary-light">
									{t("support.comingSoon")}
								</span>
							</div>

							<div class="rounded-2xl bg-neutral-50 p-6 transition-all hover:bg-neutral-100">
								<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-r from-blue-500 to-cyan-500">
									<svg
										aria-hidden="true"
										class="h-6 w-6 text-white"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24">
										<path
											d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
										/>
									</svg>
								</div>
								<h3 class="mb-2 font-semibold text-neutral-900 text-xl">
									{t("support.faq")}
								</h3>
								<p class="mb-4 text-neutral-600">
									{t("support.faqDescription")}
								</p>
								<span class="text-primary-light">
									{t("support.comingSoon")}
								</span>
							</div>

							<div class="rounded-2xl bg-neutral-50 p-6 transition-all hover:bg-neutral-100">
								<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-r from-green-500 to-emerald-500">
									<svg
										aria-hidden="true"
										class="h-6 w-6 text-white"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24">
										<path
											d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
										/>
									</svg>
								</div>
								<h3 class="mb-2 font-semibold text-neutral-900 text-xl">
									{t("support.discord")}
								</h3>
								<p class="mb-4 text-neutral-600">
									{t("support.discordDescription")}
								</p>
								<span class="text-primary-light">
									{t("support.comingSoon")}
								</span>
							</div>

							<div class="rounded-2xl bg-neutral-50 p-6 transition-all hover:bg-neutral-100">
								<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-r from-orange-500 to-red-500">
									<svg
										aria-hidden="true"
										class="h-6 w-6 text-white"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24">
										<path
											d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
										/>
									</svg>
								</div>
								<h3 class="mb-2 font-semibold text-neutral-900 text-xl">
									{t("support.emailSupport")}
								</h3>
								<p class="mb-4 text-neutral-600">
									{t("support.emailSupportDescription")}
								</p>
								<A
									class="text-primary-light transition-colors hover:text-primary-200"
									href="/contact">
									{t("support.contactUs")}
								</A>
							</div>
						</div>

						<div class="rounded-2xl bg-neutral-50 p-8">
							<h3 class="mb-6 font-semibold text-2xl text-neutral-900">
								{t("support.faqTitle")}
							</h3>

							<div class="space-y-6">
								<div>
									<h4 class="mb-2 font-medium text-lg text-neutral-900">
										{t("support.faqQ1")}
									</h4>
									<p class="text-neutral-600">{t("support.faqA1")}</p>
								</div>

								<div>
									<h4 class="mb-2 font-medium text-lg text-neutral-900">
										{t("support.faqQ2")}
									</h4>
									<p class="text-neutral-600">{t("support.faqA2")}</p>
								</div>

								<div>
									<h4 class="mb-2 font-medium text-lg text-neutral-900">
										{t("support.faqQ3")}
									</h4>
									<p class="text-neutral-600">
										{t("support.faqA3")}{" "}
										<A
											class="text-primary-light hover:text-primary-200"
											href="/privacy">
											{t("support.privacyPolicy")}
										</A>{" "}
										{t("support.faqA3End")}
									</p>
								</div>

								<div>
									<h4 class="mb-2 font-medium text-lg text-neutral-900">
										{t("support.faqQ4")}
									</h4>
									<p class="text-neutral-600">{t("support.faqA4")}</p>
								</div>

								<div>
									<h4 class="mb-2 font-medium text-lg text-neutral-900">
										{t("support.faqQ5")}
									</h4>
									<p class="text-neutral-600">
										{t("support.faqA5").replace(
											"contact us",
											t("support.contactUs"),
										)}
									</p>
								</div>
							</div>
						</div>
					</div>
				</main>

				<PublicFooter />
			</div>
		</>
	);
}
