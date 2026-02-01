import { A } from "@solidjs/router";
import { type Accessor, Show } from "solid-js";
import { Breadcrumbs, Skeleton } from "~/design-system";
import { useTranslation } from "~/i18n";
import type { BreadcrumbItem } from "~/lib/BreadcrumbContext";
import type { UserPreferences } from "~/lib/electric";
import NotificationBell from "../NotificationBell";
import { MenuIcon } from "./navConfig";

interface User {
	id: string;
	email: string | null;
	role: string;
	isModerator: boolean;
}

interface UserPreferencesResult {
	data: Accessor<UserPreferences | null | undefined>;
	isLoading: Accessor<boolean>;
}

interface HeaderProps {
	pageTitle: Accessor<string>;
	user: User | null | undefined;
	prefs: UserPreferencesResult;
	onOpenMobileSidebar: () => void;
	breadcrumbItems?: Accessor<BreadcrumbItem[]>;
}

export default function Header(props: HeaderProps) {
	return (
		<header class="sticky top-0 z-30 flex h-16 items-center justify-between border-neutral-200 border-b bg-white px-4 shadow-sm md:px-6">
			{/* Mobile menu button */}
			<button
				class="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 md:hidden"
				onClick={props.onOpenMobileSidebar}
				type="button">
				<MenuIcon />
			</button>

			{/* Page title or breadcrumbs */}
			<Show
				fallback={
					<h1 class="hidden font-semibold text-neutral-900 text-xl md:block">
						{props.pageTitle()}
					</h1>
				}
				when={props.breadcrumbItems && props.breadcrumbItems().length > 0}>
				{(_) => (
					<div class="hidden md:block">
						<Breadcrumbs items={props.breadcrumbItems?.() ?? []} />
					</div>
				)}
			</Show>

			<div class="flex items-center space-x-4">
				<NotificationBell />
				<Show when={props.user}>
					{(user) => <UserSection prefs={props.prefs} user={user()} />}
				</Show>
			</div>
		</header>
	);
}

interface UserSectionProps {
	user: User;
	prefs: UserPreferencesResult;
}

function UserSection(props: UserSectionProps) {
	const { t } = useTranslation();

	return (
		<Show
			fallback={<UserSectionSkeleton />}
			when={!props.prefs.isLoading() || props.prefs.data()}>
			<div class="flex items-center space-x-3">
				<A
					class="flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-primary-light transition-colors hover:bg-primary"
					href="/dashboard/settings"
					title={t("dashboard.goToSettings")}>
					<Show
						fallback={
							<span class="font-medium text-sm text-white">
								{props.prefs.data()?.name?.[0]?.toUpperCase() ||
									props.user.email?.[0]?.toUpperCase() ||
									""}
							</span>
						}
						when={props.prefs.data()?.avatar_url}>
						<img
							alt="User Avatar"
							class="h-full w-full object-cover"
							src={props.prefs.data()?.avatar_url ?? ""}
						/>
					</Show>
				</A>
				<div class="hidden md:block">
					<p class="font-medium text-neutral-900 text-sm">
						{props.prefs.data()?.name || props.user.email || ""}
					</p>
					<p class="text-neutral-500 text-xs">{t("dashboard.freePlan")}</p>
				</div>
			</div>
		</Show>
	);
}

function UserSectionSkeleton() {
	return (
		<div class="flex items-center space-x-3">
			<Skeleton circle class="h-8 w-8" />
			<div class="hidden md:block">
				<Skeleton class="h-4 w-20" />
				<Skeleton class="mt-1 h-3 w-14" />
			</div>
		</div>
	);
}
