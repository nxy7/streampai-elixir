import { A } from "@solidjs/router";
import { type Accessor, For, Show } from "solid-js";
import LiveBadge from "~/components/LiveBadge";
import Logo from "~/components/Logo";
import { Button } from "~/design-system";
import { useTranslation } from "~/i18n";
import { getLogoutUrl } from "~/lib/auth";
import {
	LogoutIcon,
	ModerateIcon,
	type NavSection,
	getAdminSections,
	getNavSections,
} from "./navConfig";

interface SidebarProps {
	isAdmin: boolean;
	isLive: Accessor<boolean>;
	isModerator: boolean;
}

export default function Sidebar(props: SidebarProps) {
	const { t } = useTranslation();
	const navSections = getNavSections();
	const adminSections = getAdminSections();

	return (
		<div class="sidebar fixed top-0 bottom-0 left-0 z-40 flex w-72 -translate-x-full flex-col bg-surface-inset text-surface-inset-text md:translate-x-0">
			{/* Header */}
			<div class="flex h-16 shrink-0 items-center px-4">
				<A class="transition-opacity hover:opacity-80" href="/">
					<Logo showText size="md" />
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
							<NavSectionGroup isLive={props.isLive} section={section} />
						)}
					</For>

					<Show when={props.isAdmin}>
						<For each={adminSections}>
							{(section) => (
								<NavSectionGroup isLive={props.isLive} section={section} />
							)}
						</For>
					</Show>
				</nav>
			</div>

			{/* Bottom section */}
			<div class="space-y-2 p-4">
				<Show when={props.isModerator}>
					<Button
						as="link"
						class="justify-start p-3 text-surface-inset-text"
						fullWidth
						href="/dashboard/moderate"
						variant="ghost">
						<ModerateIcon />
						<span class="ml-3">{t("dashboardNav.moderate")}</span>
					</Button>
				</Show>

				<Button
					as="a"
					class="justify-start p-3 text-surface-inset-text"
					fullWidth
					href={getLogoutUrl()}
					variant="ghost">
					<LogoutIcon />
					<span class="ml-3">{t("nav.signOut")}</span>
				</Button>
			</div>
		</div>
	);
}

interface NavSectionGroupProps {
	section: NavSection;
	isLive?: Accessor<boolean>;
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

						const showLiveBadge = () =>
							item.url === "/dashboard/stream" && props.isLive?.();

						return (
							<A
								activeClass="bg-primary text-white"
								class="group relative inline-flex w-full items-center justify-start rounded-lg p-3 font-medium text-surface-inset-text transition-colors"
								end={item.url === "/dashboard"}
								href={item.url}
								inactiveClass="text-surface-inset-text"
								title={label()}>
								{item.icon}
								<span class="ml-3 whitespace-nowrap">{label()}</span>
								<Show when={showLiveBadge()}>
									<LiveBadge class="ml-auto" size="sm" />
								</Show>
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
	const navSections = getNavSections();
	const adminSections = getAdminSections();

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
				<A class="transition-opacity hover:opacity-80" href="/">
					<Logo showText size="md" />
				</A>
			</div>

			{/* Main Navigation */}
			<nav class="mt-6 flex-1">
				<For each={navSections}>
					{(section) => (
						<NavSectionGroup isLive={props.isLive} section={section} />
					)}
				</For>

				<Show when={props.isAdmin}>
					<For each={adminSections}>
						{(section) => (
							<NavSectionGroup isLive={props.isLive} section={section} />
						)}
					</For>
				</Show>
			</nav>

			{/* Bottom Logout Section */}
			<div class="space-y-2 p-4">
				<Show when={props.isModerator}>
					<Button
						as="link"
						class="justify-start p-3 text-surface-inset-text"
						fullWidth
						href="/dashboard/moderate"
						variant="ghost">
						<ModerateIcon />
						<span class="ml-3">{t("dashboardNav.moderate")}</span>
					</Button>
				</Show>

				<Button
					as="a"
					class="justify-start p-3 text-surface-inset-text"
					fullWidth
					href={getLogoutUrl()}
					variant="ghost">
					<LogoutIcon />
					<span class="ml-3">{t("nav.signOut")}</span>
				</Button>
			</div>
		</div>
	);
}
