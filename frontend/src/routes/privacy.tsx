import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";
import PublicFooter from "~/components/PublicFooter";
import PublicHeader from "~/components/PublicHeader";
import { useTranslation } from "~/i18n";

export const route = {
	prerender: true,
};

export default function Privacy() {
	const { t } = useTranslation();

	return (
		<>
			<Title>{t("privacy.title")} - Streampai</Title>
			<div class="flex min-h-screen flex-col bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900">
				<PublicHeader title={t("privacy.title")} />

				<main class="flex-1 py-12">
					<div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
						<div class="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg">
							<div class="prose prose-invert max-w-none">
								<p class="mb-6 text-gray-300">{t("privacy.lastUpdated")}</p>

								<h2 class="mb-4 font-semibold text-2xl text-white">
									{t("privacy.section1Title")}
								</h2>
								<p class="mb-4 text-gray-300">{t("privacy.section1Intro")}</p>
								<ul class="mb-6 list-disc space-y-2 pl-6 text-gray-300">
									<li>{t("privacy.section1Item1")}</li>
									<li>{t("privacy.section1Item2")}</li>
									<li>{t("privacy.section1Item3")}</li>
									<li>{t("privacy.section1Item4")}</li>
									<li>{t("privacy.section1Item5")}</li>
								</ul>

								<h2 class="mb-4 font-semibold text-2xl text-white">
									{t("privacy.section2Title")}
								</h2>
								<p class="mb-4 text-gray-300">{t("privacy.section2Intro")}</p>
								<ul class="mb-6 list-disc space-y-2 pl-6 text-gray-300">
									<li>{t("privacy.section2Item1")}</li>
									<li>{t("privacy.section2Item2")}</li>
									<li>{t("privacy.section2Item3")}</li>
									<li>{t("privacy.section2Item4")}</li>
									<li>{t("privacy.section2Item5")}</li>
								</ul>

								<h2 class="mb-4 font-semibold text-2xl text-white">
									{t("privacy.section3Title")}
								</h2>
								<p class="mb-4 text-gray-300">{t("privacy.section3Intro")}</p>
								<ul class="mb-6 list-disc space-y-2 pl-6 text-gray-300">
									<li>{t("privacy.section3Item1")}</li>
									<li>{t("privacy.section3Item2")}</li>
									<li>{t("privacy.section3Item3")}</li>
									<li>{t("privacy.section3Item4")}</li>
								</ul>

								<h2 class="mb-4 font-semibold text-2xl text-white">
									{t("privacy.section4Title")}
								</h2>
								<p class="mb-6 text-gray-300">{t("privacy.section4Text")}</p>

								<h2 class="mb-4 font-semibold text-2xl text-white">
									{t("privacy.section5Title")}
								</h2>
								<p class="mb-6 text-gray-300">{t("privacy.section5Text")}</p>

								<h2 class="mb-4 font-semibold text-2xl text-white">
									{t("privacy.section6Title")}
								</h2>
								<p class="mb-6 text-gray-300">{t("privacy.section6Text")}</p>

								<h2 class="mb-4 font-semibold text-2xl text-white">
									{t("privacy.section7Title")}
								</h2>
								<p class="mb-4 text-gray-300">{t("privacy.section7Intro")}</p>
								<ul class="mb-6 list-disc space-y-2 pl-6 text-gray-300">
									<li>{t("privacy.section7Item1")}</li>
									<li>{t("privacy.section7Item2")}</li>
									<li>{t("privacy.section7Item3")}</li>
									<li>{t("privacy.section7Item4")}</li>
									<li>{t("privacy.section7Item5")}</li>
								</ul>

								<h2 class="mb-4 font-semibold text-2xl text-white">
									{t("privacy.section8Title")}
								</h2>
								<p class="mb-6 text-gray-300">{t("privacy.section8Text")}</p>

								<h2 class="mb-4 font-semibold text-2xl text-white">
									{t("privacy.section9Title")}
								</h2>
								<p class="mb-6 text-gray-300">{t("privacy.section9Text")}</p>

								<h2 class="mb-4 font-semibold text-2xl text-white">
									{t("privacy.section10Title")}
								</h2>
								<p class="mb-6 text-gray-300">{t("privacy.section10Text")}</p>

								<h2 class="mb-4 font-semibold text-2xl text-white">
									{t("privacy.section11Title")}
								</h2>
								<p class="text-gray-300">
									{t("privacy.section11Text")}{" "}
									<A
										class="text-purple-400 hover:text-purple-300"
										href="/contact">
										{t("privacy.contactUs")}
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
