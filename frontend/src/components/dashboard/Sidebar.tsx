import { A } from "@solidjs/router";
import { type Accessor, For, Show } from "solid-js";
import { useTranslation } from "~/i18n";
import { getLogoutUrl } from "~/lib/auth";
import { useTheme } from "~/lib/theme";
import {
	LogoutIcon,
	ModerateIcon,
	type NavSection,
	getAdminSections,
	getNavSections,
} from "./navConfig";

interface SidebarProps {
	currentPage: Accessor<string>;
	isAdmin: boolean;
	isModerator: boolean;
}

export default function Sidebar(props: SidebarProps) {
	const { t } = useTranslation();
	const { theme } = useTheme();
	const navSections = getNavSections();
	const adminSections = getAdminSections();
	const logoSrc = () =>
		theme() === "dark" ? "/images/logo-white.png" : "/images/logo-black.png";

	return (
		<div class="sidebar fixed top-0 bottom-0 left-0 z-40 flex w-72 -translate-x-full flex-col bg-surface-inset text-surface-inset-text md:translate-x-0">
			{/* Header */}
			<div class="flex h-16 shrink-0 items-center px-4">
				<A
					class="flex items-center space-x-2 transition-opacity hover:opacity-80"
					href="/">
					<img alt="Streampai Logo" class="h-8 w-8 shrink-0" src={logoSrc()} />
					<span class="font-bold text-neutral-900 text-xl">Streampai</span>
				</A>
			</div>

			{/* Scrollable nav */}
			<div
				class="flex-1 overflow-y-auto"
				style={{
					"scrollbar-width": "none",
					"-ms-overflow-style": "none",
				}}>
				<nav class="mt-2">
					<For each={navSections}>
						{(section) => (
							<NavSectionGroup
								currentPage={props.currentPage}
								section={section}
							/>
						)}
					</For>

					<Show when={props.isAdmin}>
						<For each={adminSections}>
							{(section) => (
								<NavSectionGroup
									currentPage={props.currentPage}
									section={section}
								/>
							)}
						</For>
					</Show>
				</nav>
			</div>

			{/* Bottom section */}
			<div class="space-y-2 p-4">
				<Show when={props.isModerator}>
					<A
						class="flex w-full items-center rounded-lg p-3 text-surface-inset-text transition-colors hover:bg-blue-600 hover:text-white"
						href="/dashboard/moderate">
						<ModerateIcon />
						<span class="ml-3">{t("dashboardNav.moderate")}</span>
					</A>
				</Show>

				<a
					class="flex w-full items-center rounded-lg p-3 text-surface-inset-text transition-colors hover:bg-red-600 hover:text-white"
					href={getLogoutUrl()}
					rel="external">
					<LogoutIcon />
					<span class="ml-3">{t("nav.signOut")}</span>
				</a>
			</div>
		</div>
	);
}

interface NavSectionGroupProps {
	section: NavSection;
	currentPage: Accessor<string>;
}

function NavSectionGroup(props: NavSectionGroupProps) {
	const { t } = useTranslation();

	return (
		<div class="mb-4 px-4">
			<h3 class="mb-3 font-semibold text-xs uppercase tracking-wider opacity-60">
				{t(props.section.titleKey)}
			</h3>
			<div class="space-y-1">
				<For each={props.section.items}>
					{(item) => {
						const label = () => t(item.labelKey);
						const isActive = () =>
							props.currentPage() === item.url.split("/").pop();

						if (item.comingSoon) {
							return (
								<div
									class="relative flex items-center rounded-lg p-3 opacity-40"
									title={label()}>
									{item.icon}
									<span class="ml-3 whitespace-nowrap">{label()}</span>
									<span class="absolute top-1/2 right-2 -translate-y-1/2 whitespace-nowrap rounded bg-white/10 px-1.5 py-0.5 text-[10px] opacity-60">
										{t("dashboardNav.comingSoon")}
									</span>
								</div>
							);
						}

						return (
							<A
								class={`flex items-center rounded-lg p-3 transition-colors ${
									isActive()
										? "bg-primary text-white"
										: "text-surface-inset-text hover:bg-neutral-200 hover:text-neutral-900"
								}`}
								href={item.url}
								title={label()}>
								{item.icon}
								<span class="ml-3 whitespace-nowrap">{label()}</span>
							</A>
						);
					}}
				</For>
			</div>
		</div>
	);
}

// Mobile sidebar wrapper component
interface MobileSidebarProps extends SidebarProps {
	open: Accessor<boolean>;
	onClose: () => void;
}

export function MobileSidebar(props: MobileSidebarProps) {
	const { t } = useTranslation();
	const { theme } = useTheme();
	const navSections = getNavSections();
	const adminSections = getAdminSections();
	const logoSrc = () =>
		theme() === "dark" ? "/images/logo-white.png" : "/images/logo-black.png";

	return (
		<div
			class={`sidebar fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-y-auto bg-surface-inset text-surface-inset-text transition-all duration-300 ease-in-out ${
				props.open() ? "translate-x-0" : "-translate-x-full"
			} md:hidden`}
			style={{
				"scrollbar-width": "none",
				"-ms-overflow-style": "none",
			}}>
			{/* Sidebar Header */}
			<div class="relative flex items-center justify-center p-4">
				<A
					class="flex items-center space-x-2 transition-opacity hover:opacity-80"
					href="/">
					<img alt="Streampai Logo" class="h-8 w-8" src={logoSrc()} />
					<span class="font-bold text-neutral-900 text-xl">Streampai</span>
				</A>
			</div>

			{/* Main Navigation */}
			<nav class="mt-6 flex-1">
				<For each={navSections}>
					{(section) => (
						<NavSectionGroup
							currentPage={props.currentPage}
							section={section}
						/>
					)}
				</For>

				<Show when={props.isAdmin}>
					<For each={adminSections}>
						{(section) => (
							<NavSectionGroup
								currentPage={props.currentPage}
								section={section}
							/>
						)}
					</For>
				</Show>
			</nav>

			{/* Bottom Logout Section */}
			<div class="space-y-2 p-4">
				<Show when={props.isModerator}>
					<A
						class="flex w-full items-center rounded-lg p-3 text-surface-inset-text transition-colors hover:bg-blue-600 hover:text-white"
						href="/dashboard/moderate">
						<ModerateIcon />
						<span class="ml-3">{t("dashboardNav.moderate")}</span>
					</A>
				</Show>

				<a
					class="flex w-full items-center rounded-lg p-3 text-surface-inset-text transition-colors hover:bg-red-600 hover:text-white"
					href={getLogoutUrl()}
					rel="external">
					<LogoutIcon />
					<span class="ml-3">{t("nav.signOut")}</span>
				</a>
			</div>
		</div>
	);
}
