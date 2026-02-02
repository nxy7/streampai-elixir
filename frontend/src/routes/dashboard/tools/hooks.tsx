import { Title } from "@solidjs/meta";
import { For } from "solid-js";
import Card from "~/design-system/Card";
import { button } from "~/design-system/design-system";
import { useTranslation } from "~/i18n";
import { useBreadcrumbs } from "~/lib/BreadcrumbContext";

const triggers = [
	{ key: "triggerDonation" as const, icon: "💰" },
	{ key: "triggerFollow" as const, icon: "👋" },
	{ key: "triggerRaid" as const, icon: "⚔️" },
	{ key: "triggerSubscription" as const, icon: "⭐" },
	{ key: "triggerStreamStart" as const, icon: "🔴" },
	{ key: "triggerStreamEnd" as const, icon: "⏹️" },
	{ key: "triggerChatMessage" as const, icon: "💬" },
];

const actions = [
	{ key: "actionDiscordMessage" as const, icon: "🟣" },
	{ key: "actionChatMessage" as const, icon: "💬" },
	{ key: "actionWebhook" as const, icon: "🔗" },
	{ key: "actionObsScene" as const, icon: "🎬" },
	{ key: "actionPlaySound" as const, icon: "🔊" },
	{ key: "actionEmail" as const, icon: "📧" },
];

export default function HooksPage() {
	const { t } = useTranslation();

	useBreadcrumbs(() => [
		{ label: t("sidebar.tools"), href: "/dashboard/tools/timers" },
		{ label: t("dashboardNav.hooks") },
	]);

	return (
		<div class="mx-auto max-w-6xl space-y-6">
			<Title>Hooks | Streampai</Title>

			{/* Header */}
			<div class="flex items-center justify-between">
				<p class="text-neutral-500">{t("hooks.description")}</p>
				<button
					class={`${button.primary} whitespace-nowrap`}
					disabled
					title={t("hooks.comingSoonBadge")}
					type="button">
					{t("hooks.createHook")}
				</button>
			</div>

			{/* How it works */}
			<Card>
				<h2 class="mb-4 font-semibold text-lg">{t("hooks.howItWorks")}</h2>
				<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
					<div class="flex flex-col items-center p-5 text-center">
						<div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-2xl">
							⚡
						</div>
						<h3 class="font-semibold">{t("hooks.step1Title")}</h3>
						<p class="mt-1 text-neutral-500 text-sm">
							{t("hooks.step1Description")}
						</p>
					</div>
					<div class="flex flex-col items-center p-5 text-center">
						<div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10 text-2xl">
							🔄
						</div>
						<h3 class="font-semibold">{t("hooks.step2Title")}</h3>
						<p class="mt-1 text-neutral-500 text-sm">
							{t("hooks.step2Description")}
						</p>
					</div>
					<div class="flex flex-col items-center p-5 text-center">
						<div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 text-2xl">
							🎯
						</div>
						<h3 class="font-semibold">{t("hooks.step3Title")}</h3>
						<p class="mt-1 text-neutral-500 text-sm">
							{t("hooks.step3Description")}
						</p>
					</div>
				</div>
			</Card>

			{/* Triggers and Actions side by side */}
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
				{/* Triggers */}
				<Card>
					<h2 class="mb-1 font-semibold text-lg">{t("hooks.triggers")}</h2>
					<p class="mb-4 text-neutral-500 text-sm">
						{t("hooks.triggersDescription")}
					</p>
					<div class="space-y-2">
						<For each={triggers}>
							{(trigger) => (
								<div class="flex items-center gap-3 p-3">
									<span class="text-lg">{trigger.icon}</span>
									<span class="text-sm">{t(`hooks.${trigger.key}`)}</span>
								</div>
							)}
						</For>
					</div>
				</Card>

				{/* Actions */}
				<Card>
					<h2 class="mb-1 font-semibold text-lg">{t("hooks.actions")}</h2>
					<p class="mb-4 text-neutral-500 text-sm">
						{t("hooks.actionsDescription")}
					</p>
					<div class="space-y-2">
						<For each={actions}>
							{(action) => (
								<div class="flex items-center gap-3 p-3">
									<span class="text-lg">{action.icon}</span>
									<span class="text-sm">{t(`hooks.${action.key}`)}</span>
								</div>
							)}
						</For>
					</div>
				</Card>
			</div>

			{/* Coming soon notice */}
			<Card>
				<div class="flex items-center gap-3">
					<span class="rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary text-xs">
						{t("hooks.comingSoonBadge")}
					</span>
					<p class="text-neutral-500 text-sm">
						{t("hooks.comingSoonDescription")}
					</p>
				</div>
			</Card>
		</div>
	);
}
