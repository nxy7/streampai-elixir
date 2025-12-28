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
				<div class="flex flex-col items-center justify-between gap-4 md:flex-row">
					<A class="flex items-center space-x-2" href="/">
						<img
							alt="Streampai Logo"
							class="h-6 w-6"
							src="/images/logo-white.png"
						/>
						<span class="font-bold text-white">Streampai</span>
					</A>
					<div class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-gray-300 text-sm">
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
					<LanguageSwitcher class="border-white/20 bg-white/10 text-white" />
				</div>
				<div class="mt-6 text-center text-gray-400 text-sm">
					<p>
						&copy; {currentYear} {t("footer.copyright")}
						{props.showTagline && (
							<>
								{" "}
								{t("footer.madeWith")} ❤️ {t("footer.forStreamers")}
							</>
						)}
					</p>
				</div>
			</div>
		</footer>
	);
}
