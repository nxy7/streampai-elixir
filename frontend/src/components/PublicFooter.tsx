import { Link } from "@tanstack/solid-router";
import Logo from "~/components/Logo";
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
		<footer class="border-neutral-200 border-t bg-neutral-50 py-8">
			<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div class="flex flex-col gap-6 md:flex-row md:gap-8">
					{/* Logo - spans full height on desktop */}
					<Link
						class="flex shrink-0 items-center justify-center md:justify-start"
						to="/">
						<Logo showText size="md" />
					</Link>

					{/* Right section - nav links on top, copyright and language picker at bottom */}
					<div class="flex flex-1 flex-col gap-4">
						{/* Navigation links */}
						<div class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-neutral-600 text-sm md:justify-end">
							<Link
								class="transition-colors hover:text-neutral-900"
								to="/privacy">
								{t("footer.privacy")}
							</Link>
							<Link
								class="transition-colors hover:text-neutral-900"
								to="/terms">
								{t("footer.terms")}
							</Link>
							<Link
								class="transition-colors hover:text-neutral-900"
								to="/support">
								{t("footer.support")}
							</Link>
							<Link
								class="transition-colors hover:text-neutral-900"
								to="/contact">
								{t("footer.contact")}
							</Link>
						</div>

						{/* Bottom row - copyright and language picker */}
						<div class="flex flex-col items-center gap-3 text-neutral-600 text-sm md:flex-row md:justify-end">
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
								class="w-auto border-neutral-200 bg-surface text-neutral-900"
								wrapperClass="shrink-0"
							/>
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
}
