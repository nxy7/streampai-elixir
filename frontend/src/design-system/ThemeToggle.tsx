import { Show } from "solid-js";
import { useTranslation } from "~/i18n";
import { useTheme } from "~/lib/theme";

export default function ThemeToggle() {
	const { theme, toggleTheme } = useTheme();
	const { t } = useTranslation();

	return (
		<button
			aria-label={t("header.toggleTheme")}
			class="group rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
			onClick={(e) => toggleTheme(e)}
			title={t("header.toggleTheme")}
			type="button">
			<Show
				fallback={
					<svg
						aria-hidden="true"
						class="h-5 w-5 transition-transform duration-300 group-hover:rotate-45"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						viewBox="0 0 24 24">
						<path
							d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				}
				when={theme() === "dark"}>
				<svg
					aria-hidden="true"
					class="h-5 w-5 transition-transform duration-300 group-hover:rotate-90"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					viewBox="0 0 24 24">
					<circle cx="12" cy="12" r="5" />
					<path
						d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</Show>
		</button>
	);
}
