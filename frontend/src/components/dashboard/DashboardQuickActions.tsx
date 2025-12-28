import { A } from "@solidjs/router";
import { useTranslation } from "~/i18n";

export default function DashboardQuickActions() {
	const { t } = useTranslation();

	return (
		<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
			<A
				class="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-purple-200 hover:shadow-md"
				href="/dashboard/widgets">
				<div class="flex items-center gap-4">
					<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-r from-indigo-500 to-purple-500 transition-transform group-hover:scale-105">
						<svg
							aria-hidden="true"
							class="h-6 w-6 text-white"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
							/>
						</svg>
					</div>
					<div>
						<h3 class="font-semibold text-gray-900">
							{t("dashboard.widgets")}
						</h3>
						<p class="text-gray-500 text-sm">
							{t("dashboard.customizeOverlays")}
						</p>
					</div>
				</div>
			</A>

			<A
				class="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-purple-200 hover:shadow-md"
				href="/dashboard/analytics">
				<div class="flex items-center gap-4">
					<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-r from-green-500 to-emerald-500 transition-transform group-hover:scale-105">
						<svg
							aria-hidden="true"
							class="h-6 w-6 text-white"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
							/>
						</svg>
					</div>
					<div>
						<h3 class="font-semibold text-gray-900">
							{t("dashboardNav.analytics")}
						</h3>
						<p class="text-gray-500 text-sm">{t("dashboard.viewStats")}</p>
					</div>
				</div>
			</A>

			<A
				class="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-purple-200 hover:shadow-md"
				href="/dashboard/settings">
				<div class="flex items-center gap-4">
					<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-r from-pink-500 to-rose-500 transition-transform group-hover:scale-105">
						<svg
							aria-hidden="true"
							class="h-6 w-6 text-white"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
							/>
							<path
								d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
							/>
						</svg>
					</div>
					<div>
						<h3 class="font-semibold text-gray-900">
							{t("dashboardNav.settings")}
						</h3>
						<p class="text-gray-500 text-sm">
							{t("dashboard.configureAccount")}
						</p>
					</div>
				</div>
			</A>
		</div>
	);
}
