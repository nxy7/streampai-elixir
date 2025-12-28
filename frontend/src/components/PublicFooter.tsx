import { A } from "@solidjs/router";
import { useTranslation } from "~/i18n";
import LanguageSwitcher from "./LanguageSwitcher";
import { ThemeToggleIcon } from "./ThemeSwitcher";

interface PublicFooterProps {
	/** Whether to show the "Made with love" tagline (for landing page) */
	showTagline?: boolean;
}

export default function PublicFooter(props: PublicFooterProps) {
	const { t } = useTranslation();
	const currentYear = new Date().getFullYear();

	return (
		<footer class="border-theme border-t bg-theme-surface py-8">
			<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				{/* Top row: Logo (full height) and nav links */}
				<div class="flex flex-col items-center justify-between gap-6 md:flex-row md:items-stretch">
					<A class="flex items-center space-x-3" href="/">
						<img
							alt="Streampai Logo"
							class="h-10 w-10 dark:hidden"
							src="/images/logo-black.png"
						/>
						<img
							alt="Streampai Logo"
							class="hidden h-10 w-10 dark:block"
							src="/images/logo-white.png"
						/>
						<span class="font-bold text-theme-primary text-2xl">Streampai</span>
					</A>
					<div class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-theme-secondary text-sm">
						<A class="transition-colors hover:text-purple-600 dark:hover:text-purple-400" href="/privacy">
							{t("footer.privacy")}
						</A>
						<A class="transition-colors hover:text-purple-600 dark:hover:text-purple-400" href="/terms">
							{t("footer.terms")}
						</A>
						<A class="transition-colors hover:text-purple-600 dark:hover:text-purple-400" href="/support">
							{t("footer.support")}
						</A>
						<A class="transition-colors hover:text-purple-600 dark:hover:text-purple-400" href="/contact">
							{t("footer.contact")}
						</A>
					</div>
				</div>

				{/* Bottom row: Copyright, theme toggle, and language picker */}
				<div class="mt-6 flex flex-col items-center justify-between gap-4 border-theme-subtle border-t pt-6 md:flex-row">
					<p class="text-theme-tertiary text-sm">
						&copy; {currentYear} {t("footer.copyright")}
						{props.showTagline && (
							<>
								{" "}
								{t("footer.madeWith")} ❤️ {t("footer.forStreamers")}
							</>
						)}
					</p>
					<div class="flex items-center gap-2">
						<ThemeToggleIcon />
						<LanguageSwitcher class="border-theme bg-theme-tertiary text-theme-primary" />
					</div>
				</div>
			</div>
		</footer>
	);
}
