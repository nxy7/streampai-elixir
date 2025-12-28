import { A } from "@solidjs/router";
import { useTranslation } from "~/i18n";
import LanguageSwitcher from "./LanguageSwitcher";

interface PublicFooterProps {
	/** Whether to show the "Made with love" tagline (for landing page) */
	showTagline?: boolean;
}

export default function PublicFooter(props: PublicFooterProps) {
	const { t } = useTranslation();
	const currentYear = new Date().getFullYear();

	return (
		<footer class="border-white/10 border-t bg-black/40 py-8">
			<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div class="flex flex-col gap-6 md:flex-row md:gap-8">
					{/* Logo - spans full height on desktop */}
					<A
						class="flex shrink-0 items-center justify-center space-x-2 md:justify-start"
						href="/">
						<img
							alt="Streampai Logo"
							class="h-8 w-8"
							src="/images/logo-white.png"
						/>
						<span class="font-bold text-lg text-white">Streampai</span>
					</A>

					{/* Right section - nav links on top, copyright and language picker at bottom */}
					<div class="flex flex-1 flex-col gap-4">
						{/* Navigation links */}
						<div class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-gray-300 text-sm md:justify-end">
							<A class="transition-colors hover:text-white" href="/privacy">
								{t("footer.privacy")}
							</A>
							<A class="transition-colors hover:text-white" href="/terms">
								{t("footer.terms")}
							</A>
							<A class="transition-colors hover:text-white" href="/support">
								{t("footer.support")}
							</A>
							<A class="transition-colors hover:text-white" href="/contact">
								{t("footer.contact")}
							</A>
						</div>

						{/* Bottom row - copyright and language picker */}
						<div class="flex flex-col items-center gap-3 text-gray-400 text-sm md:flex-row md:justify-end">
							<p>
								&copy; {currentYear} {t("footer.copyright")}
								{props.showTagline && (
									<>
										{" "}
										{t("footer.madeWith")} ❤️ {t("footer.forStreamers")}
									</>
								)}
							</p>
							<LanguageSwitcher
								class="w-auto border-white/20 bg-white/10 text-white"
								wrapperClass="shrink-0"
							/>
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
}
