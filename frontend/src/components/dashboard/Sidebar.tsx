import { A } from "@solidjs/router";
import { type Accessor, For, Show } from "solid-js";
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
	collapsed: Accessor<boolean>;
	onToggleCollapse: () => void;
	currentPage: Accessor<string>;
	isAdmin: boolean;
	isModerator: boolean;
}

export default function Sidebar(props: SidebarProps) {
	const { t } = useTranslation();
	const navSections = getNavSections();
	const adminSections = getAdminSections();

	return (
		<div
			class={`sidebar fixed inset-y-0 left-0 z-50 flex flex-col overflow-y-auto bg-gray-900 text-white transition-all duration-300 ease-in-out ${
				props.collapsed() ? "w-20" : "w-64"
			} -translate-x-full md:translate-x-0`}
			style={{
				"scrollbar-width": "none",
				"-ms-overflow-style": "none",
			}}>
			{/* Sidebar Header */}
			<div class="relative flex items-center justify-center border-gray-700 border-b p-4">
				<A
					class="flex items-center space-x-2 transition-opacity hover:opacity-80"
					href="/">
					<img
						alt="Streampai Logo"
						class="h-8 w-8"
						src="/images/logo-white.png"
					/>
					<span
						class={`font-bold text-white text-xl transition-opacity ${
							props.collapsed()
								? "w-0 overflow-hidden opacity-0"
								: "opacity-100"
						}`}>
						Streampai
					</span>
				</A>
				<button
					class="absolute right-2 hidden rounded-lg p-1.5 transition-colors hover:bg-gray-700 md:block"
					onClick={props.onToggleCollapse}
					type="button">
					<svg
						aria-hidden="true"
						class="h-4 w-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24">
						<path
							class={props.collapsed() ? "block" : "hidden"}
							d="M13 5l7 7-7 7M5 5l7 7-7 7"
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
						/>
						<path
							class={props.collapsed() ? "hidden" : "block"}
							d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
						/>
					</svg>
				</button>
			</div>

			{/* Main Navigation */}
			<nav class="mt-6 flex-1">
				<For each={navSections}>
					{(section) => (
						<NavSectionGroup
							collapsed={props.collapsed}
							currentPage={props.currentPage}
							section={section}
						/>
					)}
				</For>

				<Show when={props.isAdmin}>
					<For each={adminSections}>
						{(section) => (
							<NavSectionGroup
								collapsed={props.collapsed}
								currentPage={props.currentPage}
								section={section}
							/>
						)}
					</For>
				</Show>
			</nav>

			{/* Bottom Logout Section */}
			<div class="space-y-2 border-gray-700 border-t p-4">
				<Show when={props.isModerator}>
					<A
						class={`nav-item flex w-full items-center rounded-lg p-3 text-gray-300 transition-colors hover:bg-blue-600 hover:text-white ${
							props.collapsed() ? "justify-center" : ""
						}`}
						href="/dashboard/moderate">
						<ModerateIcon />
						<span
							class={`ml-3 transition-opacity ${
								props.collapsed()
									? "w-0 overflow-hidden opacity-0"
									: "opacity-100"
							}`}>
							{t("dashboardNav.moderate")}
						</span>
					</A>
				</Show>

				<a
					class={`nav-item flex w-full items-center rounded-lg p-3 text-gray-300 transition-colors hover:bg-red-600 hover:text-white ${
						props.collapsed() ? "justify-center" : ""
					}`}
					href={getLogoutUrl()}
					rel="external">
					<LogoutIcon />
					<span
						class={`ml-3 transition-opacity ${
							props.collapsed()
								? "w-0 overflow-hidden opacity-0"
								: "opacity-100"
						}`}>
						{t("nav.signOut")}
					</span>
				</a>
			</div>
		</div>
	);
}

interface NavSectionGroupProps {
	section: NavSection;
	collapsed: Accessor<boolean>;
	currentPage: Accessor<string>;
}

function NavSectionGroup(props: NavSectionGroupProps) {
	const { t } = useTranslation();

	return (
		<div class="mb-8 px-4">
			<h3
				class={`mb-3 font-semibold text-gray-400 text-xs uppercase tracking-wider transition-opacity ${
					props.collapsed() ? "h-0 overflow-hidden opacity-0" : "opacity-100"
				}`}>
				{t(props.section.titleKey)}
			</h3>
			<div class="space-y-2">
				<For each={props.section.items}>
					{(item) => {
						const label = () => t(item.labelKey);
						const isActive = () =>
							props.currentPage() === item.url.split("/").pop();

						return (
							<A
								class={`nav-item flex items-center rounded-lg p-3 transition-colors ${
									isActive()
										? "bg-purple-600 text-white"
										: "text-gray-300 hover:bg-gray-700 hover:text-white"
								} ${props.collapsed() ? "justify-center" : ""}`}
								href={item.url}
								title={label()}>
								{item.icon}
								<span
									class={`ml-3 transition-opacity ${
										props.collapsed()
											? "w-0 overflow-hidden opacity-0"
											: "opacity-100"
									}`}>
									{label()}
								</span>
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
			class={`sidebar fixed inset-y-0 left-0 z-50 flex w-64 flex-col overflow-y-auto bg-gray-900 text-white transition-all duration-300 ease-in-out ${
				props.open() ? "translate-x-0" : "-translate-x-full"
			} md:hidden`}
			style={{
				"scrollbar-width": "none",
				"-ms-overflow-style": "none",
			}}>
			{/* Sidebar Header */}
			<div class="relative flex items-center justify-center border-gray-700 border-b p-4">
				<A
					class="flex items-center space-x-2 transition-opacity hover:opacity-80"
					href="/">
					<img
						alt="Streampai Logo"
						class="h-8 w-8"
						src="/images/logo-white.png"
					/>
					<span class="font-bold text-white text-xl">Streampai</span>
				</A>
			</div>

			{/* Main Navigation */}
			<nav class="mt-6 flex-1">
				<For each={navSections}>
					{(section) => (
						<MobileNavSectionGroup
							currentPage={props.currentPage}
							section={section}
						/>
					)}
				</For>

				<Show when={props.isAdmin}>
					<For each={adminSections}>
						{(section) => (
							<MobileNavSectionGroup
								currentPage={props.currentPage}
								section={section}
							/>
						)}
					</For>
				</Show>
			</nav>

			{/* Bottom Logout Section */}
			<div class="space-y-2 border-gray-700 border-t p-4">
				<Show when={props.isModerator}>
					<A
						class="nav-item flex w-full items-center rounded-lg p-3 text-gray-300 transition-colors hover:bg-blue-600 hover:text-white"
						href="/dashboard/moderate">
						<ModerateIcon />
						<span class="ml-3">{t("dashboardNav.moderate")}</span>
					</A>
				</Show>

				<a
					class="nav-item flex w-full items-center rounded-lg p-3 text-gray-300 transition-colors hover:bg-red-600 hover:text-white"
					href={getLogoutUrl()}
					rel="external">
					<LogoutIcon />
					<span class="ml-3">{t("nav.signOut")}</span>
				</a>
			</div>
		</div>
	);
}

interface MobileNavSectionGroupProps {
	section: NavSection;
	currentPage: Accessor<string>;
}

function MobileNavSectionGroup(props: MobileNavSectionGroupProps) {
	const { t } = useTranslation();

	return (
		<div class="mb-8 px-4">
			<h3 class="mb-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">
				{t(props.section.titleKey)}
			</h3>
			<div class="space-y-2">
				<For each={props.section.items}>
					{(item) => {
						const label = () => t(item.labelKey);
						const isActive = () =>
							props.currentPage() === item.url.split("/").pop();

						return (
							<A
								class={`nav-item flex items-center rounded-lg p-3 transition-colors ${
									isActive()
										? "bg-purple-600 text-white"
										: "text-gray-300 hover:bg-gray-700 hover:text-white"
								}`}
								href={item.url}
								title={label()}>
								{item.icon}
								<span class="ml-3">{label()}</span>
							</A>
						);
					}}
				</For>
			</div>
		</div>
	);
}
