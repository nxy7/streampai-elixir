import { For } from "solid-js";
import { useTranslation } from "~/i18n";
import type { StreamActionCallbacks } from "./types";

interface StreamActionsPanelProps extends StreamActionCallbacks {
	onOpenWidget?: (widget: "poll" | "giveaway") => void;
}

export function StreamActionsPanel(props: StreamActionsPanelProps) {
	const { t } = useTranslation();

	const handlePollClick = () => {
		props.onOpenWidget?.("poll");
	};

	const handleGiveawayClick = () => {
		props.onOpenWidget?.("giveaway");
	};

	const actions = [
		{
			id: "poll",
			icon: "[?]",
			title: t("stream.actions.startPoll"),
			description: t("stream.actions.startPollDescription"),
			color: "bg-blue-500",
			hoverColor: "hover:bg-blue-600",
			onClick: handlePollClick,
			enabled: true,
		},
		{
			id: "giveaway",
			icon: "[*]",
			title: t("stream.actions.startGiveaway"),
			description: t("stream.actions.startGiveawayDescription"),
			color: "bg-green-500",
			hoverColor: "hover:bg-green-600",
			onClick: handleGiveawayClick,
			enabled: true,
		},
		{
			id: "timers",
			icon: "[~]",
			title: t("stream.actions.modifyTimers"),
			description: t("stream.actions.modifyTimersDescription"),
			color: "bg-orange-500",
			hoverColor: "hover:bg-orange-600",
			onClick: props.onModifyTimers,
			enabled: !!props.onModifyTimers,
		},
		{
			id: "settings",
			icon: "[=]",
			title: t("stream.actions.streamSettings"),
			description: t("stream.actions.streamSettingsDescription"),
			color: "bg-primary-light",
			hoverColor: "hover:bg-primary",
			onClick: props.onChangeStreamSettings,
			enabled: !!props.onChangeStreamSettings,
		},
	];

	return (
		<div class="flex h-full flex-col">
			<div class="mb-4">
				<h3 class="font-semibold text-lg text-neutral-900">
					{t("stream.actions.title")}
				</h3>
				<p class="text-neutral-500 text-sm">{t("stream.actions.subtitle")}</p>
			</div>

			<div class="grid gap-3">
				<For each={actions}>
					{(action) => (
						<button
							class={`flex items-center gap-4 rounded-lg border border-neutral-200 bg-surface p-4 text-left transition-all hover:border-neutral-300 hover:shadow-md ${
								action.enabled
									? "cursor-pointer"
									: "cursor-not-allowed opacity-60"
							}`}
							data-testid={`action-${action.id}`}
							disabled={!action.enabled}
							onClick={action.onClick}
							type="button">
							<div
								class={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-white text-xl ${action.color} ${action.enabled ? action.hoverColor : ""}`}>
								{action.icon}
							</div>
							<div class="min-w-0 flex-1">
								<div class="font-medium text-neutral-900">{action.title}</div>
								<div class="text-neutral-500 text-sm">{action.description}</div>
							</div>
							<div class="shrink-0 text-neutral-400">&gt;</div>
						</button>
					)}
				</For>
			</div>

			<div class="mt-auto pt-4">
				<div class="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-center text-neutral-500 text-sm">
					{t("stream.actions.moreComingSoon")}
				</div>
			</div>
		</div>
	);
}
