import { Link } from "@tanstack/solid-router";
import { Show, createSignal } from "solid-js";
import { useTranslation } from "~/i18n";

interface QuickActionsPanelProps {
	onTestAlert: () => void;
}

export default function QuickActionsPanel(props: QuickActionsPanelProps) {
	const { t } = useTranslation();
	const [isExpanded, setIsExpanded] = createSignal(false);

	return (
		<div class="fixed right-4 bottom-20 z-50" data-testid="quick-actions-panel">
			<Show when={isExpanded()}>
				<div class="absolute right-0 bottom-14 min-w-[200px] animate-fade-in rounded-xl border border-neutral-200 bg-surface p-3 shadow-xl">
					<div class="space-y-2">
						<button
							class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-neutral-700 transition-colors hover:bg-primary-50 hover:text-primary-hover"
							onClick={props.onTestAlert}
							type="button">
							<svg
								aria-hidden="true"
								class="h-5 w-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
								/>
							</svg>
							<span class="font-medium text-sm">
								{t("dashboard.testAlert")}
							</span>
						</button>
						<Link
							class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-neutral-700 transition-colors hover:bg-primary-50 hover:text-primary-hover"
							to="/dashboard/widgets">
							<svg
								aria-hidden="true"
								class="h-5 w-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z"
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
								/>
							</svg>
							<span class="font-medium text-sm">{t("dashboard.widgets")}</span>
						</Link>
						<Link
							class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-neutral-700 transition-colors hover:bg-green-50 hover:text-green-700"
							to="/dashboard/stream">
							<svg
								aria-hidden="true"
								class="h-5 w-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
								/>
							</svg>
							<span class="font-medium text-sm">{t("dashboard.goLive")}</span>
						</Link>
						<Link
							class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-neutral-700 transition-colors hover:bg-neutral-100"
							to="/dashboard/settings">
							<svg
								aria-hidden="true"
								class="h-5 w-5"
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
							<span class="font-medium text-sm">
								{t("dashboardNav.settings")}
							</span>
						</Link>
					</div>
				</div>
			</Show>
			<button
				class={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-300 ${
					isExpanded()
						? "rotate-45 bg-neutral-300 text-neutral-700"
						: "bg-primary text-white hover:bg-primary-hover"
				}`}
				onClick={() => setIsExpanded(!isExpanded())}
				type="button">
				<svg
					aria-hidden="true"
					class="h-5 w-5"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24">
					<path
						d="M12 4v16m8-8H4"
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
					/>
				</svg>
			</button>
		</div>
	);
}
