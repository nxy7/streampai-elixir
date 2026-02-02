import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";
import PublicFooter from "~/components/PublicFooter";
import PublicHeader from "~/components/PublicHeader";
import { useTranslation } from "~/i18n";

export const route = {
	prerender: true,
};

export default function Terms() {
	const { t } = useTranslation();

	return (
		<>
			<Title>{t("terms.title")} - Streampai</Title>
			<div class="flex min-h-screen flex-col bg-surface">
				<PublicHeader />

				<main class="flex-1 py-12">
					<div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
						<div class="rounded-2xl bg-neutral-50 p-8">
							<div class="prose prose-invert max-w-none">
								<p class="mb-6 text-neutral-600">{t("terms.lastUpdated")}</p>

								<h2 class="mb-4 font-semibold text-2xl text-neutral-900">
									{t("terms.section1Title")}
								</h2>
								<p class="mb-6 text-neutral-600">{t("terms.section1Text")}</p>

								<h2 class="mb-4 font-semibold text-2xl text-neutral-900">
									{t("terms.section2Title")}
								</h2>
								<p class="mb-6 text-neutral-600">{t("terms.section2Text")}</p>

								<h2 class="mb-4 font-semibold text-2xl text-neutral-900">
									{t("terms.section3Title")}
								</h2>
								<p class="mb-6 text-neutral-600">{t("terms.section3Text")}</p>

								<h2 class="mb-4 font-semibold text-2xl text-neutral-900">
									{t("terms.section4Title")}
								</h2>
								<p class="mb-4 text-neutral-600">{t("terms.section4Intro")}</p>
								<ul class="mb-6 list-disc space-y-2 pl-6 text-neutral-600">
									<li>{t("terms.section4Item1")}</li>
									<li>{t("terms.section4Item2")}</li>
									<li>{t("terms.section4Item3")}</li>
									<li>{t("terms.section4Item4")}</li>
									<li>{t("terms.section4Item5")}</li>
								</ul>

								<h2 class="mb-4 font-semibold text-2xl text-neutral-900">
									{t("terms.section5Title")}
								</h2>
								<p class="mb-6 text-neutral-600">{t("terms.section5Text")}</p>

								<h2 class="mb-4 font-semibold text-2xl text-neutral-900">
									{t("terms.section6Title")}
								</h2>
								<p class="mb-6 text-neutral-600">{t("terms.section6Text")}</p>

								<h2 class="mb-4 font-semibold text-2xl text-neutral-900">
									{t("terms.section7Title")}
								</h2>
								<p class="mb-6 text-neutral-600">{t("terms.section7Text")}</p>

								<h2 class="mb-4 font-semibold text-2xl text-neutral-900">
									{t("terms.section8Title")}
								</h2>
								<p class="mb-6 text-neutral-600">{t("terms.section8Text")}</p>

								<h2 class="mb-4 font-semibold text-2xl text-neutral-900">
									{t("terms.section9Title")}
								</h2>
								<p class="mb-6 text-neutral-600">{t("terms.section9Text")}</p>

								<h2 class="mb-4 font-semibold text-2xl text-neutral-900">
									{t("terms.section10Title")}
								</h2>
								<p class="text-neutral-600">
									{t("terms.section10Text")}{" "}
									<A
										class="text-primary-light hover:text-primary-200"
										href="/contact">
										{t("terms.contactUs")}
									</A>
									.
								</p>
							</div>
						</div>
					</div>
				</main>

				<PublicFooter />
			</div>
		</>
	);
}
