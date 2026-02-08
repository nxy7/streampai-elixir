import { For, Show, Suspense, createEffect } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { Card, Skeleton, Toggle } from "~/design-system";
import Input, { Textarea } from "~/design-system/Input";
import { useTranslation } from "~/i18n";
import { useAuthenticatedUser } from "~/lib/auth";
import { useBreadcrumbs } from "~/lib/BreadcrumbContext";
import { useChatBotConfig } from "~/lib/useElectric";
import { upsertChatBotConfig } from "~/sdk/ash_rpc";

type ChatBotConfigForm = {
	enabled: boolean;
	greeting_enabled: boolean;
	command_prefix: string;
	ai_chat_enabled: boolean;
	ai_personality: string;
	auto_shoutout_enabled: boolean;
	link_protection_enabled: boolean;
	slow_mode_on_raid_enabled: boolean;
};

const defaults: ChatBotConfigForm = {
	enabled: true,
	greeting_enabled: false,
	command_prefix: "!",
	ai_chat_enabled: false,
	ai_personality: "",
	auto_shoutout_enabled: false,
	link_protection_enabled: false,
	slow_mode_on_raid_enabled: false,
};

export default function ChatBotConfigPage() {
	return (
		<Suspense fallback={<ChatBotSkeleton />}>
			<ChatBotConfigPageContent />
		</Suspense>
	);
}

function ChatBotConfigPageContent() {
	const { t } = useTranslation();
	const { user } = useAuthenticatedUser();
	const configQuery = useChatBotConfig(() => user().id);

	useBreadcrumbs(() => [
		{ label: t("sidebar.tools"), href: "/dashboard/tools/timers" },
		{ label: t("dashboardNav.chatBot") },
	]);

	const isLoading = () => {
		const status = configQuery.status() as string;
		return status !== "ready" && status !== "disabled";
	};

	const [form, setForm] = createStore<ChatBotConfigForm>({ ...defaults });

	// Sync store from Electric data
	createEffect(() => {
		const c = configQuery.data();
		if (c) {
			setForm(
				reconcile({
					enabled: c.enabled,
					greeting_enabled: c.greeting_enabled,
					command_prefix: c.command_prefix,
					ai_chat_enabled: c.ai_chat_enabled,
					ai_personality: c.ai_personality ?? "",
					auto_shoutout_enabled: c.auto_shoutout_enabled,
					link_protection_enabled: c.link_protection_enabled,
					slow_mode_on_raid_enabled: c.slow_mode_on_raid_enabled,
				}),
			);
		}
	});

	const saveConfig = async (overrides: Partial<ChatBotConfigForm> = {}) => {
		const merged = { ...form, ...overrides };
		await upsertChatBotConfig({
			input: {
				enabled: merged.enabled,
				greetingEnabled: merged.greeting_enabled,
				commandPrefix: merged.command_prefix,
				aiChatEnabled: merged.ai_chat_enabled,
				aiPersonality: merged.ai_personality,
				autoShoutoutEnabled: merged.auto_shoutout_enabled,
				linkProtectionEnabled: merged.link_protection_enabled,
				slowModeOnRaidEnabled: merged.slow_mode_on_raid_enabled,
			},
		});
	};

	const toggle = async (field: keyof ChatBotConfigForm) => {
		const newValue = !form[field];
		setForm(field, newValue as never);
		await saveConfig({ [field]: newValue });
	};

	return (
		<div class="mx-auto max-w-3xl space-y-4">
			<Show fallback={<ChatBotSkeleton />} when={!isLoading()}>
				{/* Master toggle */}
				<div class="flex items-center justify-between">
					<p class="text-neutral-500 text-sm">{t("chatbot.description")}</p>
					<Toggle checked={form.enabled} onChange={() => toggle("enabled")} />
				</div>

				<Card variant="ghost">
					<div class="divide-y divide-neutral-800/50">
						{/* Stream Greeting */}
						<SettingRow
							checked={form.greeting_enabled}
							description={t("chatbot.greetingDescription")}
							onChange={() => toggle("greeting_enabled")}
							t={t}
							title={t("chatbot.greeting")}
						/>

						{/* Command Prefix & Commands */}
						<div class="space-y-2 p-3">
							<div>
								<h3 class="font-medium">{t("chatbot.commandPrefix")}</h3>
								<p class="text-neutral-400 text-xs">
									{t("chatbot.commandPrefixDescription")}
								</p>
							</div>
							<Input
								class="w-16 bg-surface-inset text-center"
								maxLength={5}
								onBlur={() => saveConfig()}
								onInput={(e) =>
									setForm("command_prefix", e.currentTarget.value)
								}
								type="text"
								value={form.command_prefix}
							/>
							<div class="space-y-1">
								<For
									each={[
										{ cmd: "hi", key: "commandHiDescription" },
										{ cmd: "uptime", key: "commandUptimeDescription" },
										{ cmd: "followage", key: "commandFollowageDescription" },
										{ cmd: "socials", key: "commandSocialsDescription" },
										{ cmd: "lurk", key: "commandLurkDescription" },
										{ cmd: "dice", key: "commandDiceDescription" },
										{ cmd: "quote", key: "commandQuoteDescription" },
										{ cmd: "commands", key: "commandCommandsDescription" },
									]}>
									{(item) => (
										<div class="flex items-center gap-2 rounded border border-neutral-700 bg-neutral-800 px-3 py-2">
											<code class="shrink-0 font-mono font-semibold text-primary text-sm">
												{form.command_prefix}
												{item.cmd}
											</code>
											<span class="text-neutral-400 text-sm">
												{t(`chatbot.${item.key}`)}
											</span>
										</div>
									)}
								</For>
							</div>
						</div>

						{/* AI Chat Participation */}
						<SettingRow
							checked={form.ai_chat_enabled}
							description={t("chatbot.aiChatDescription")}
							experimental
							onChange={() => toggle("ai_chat_enabled")}
							t={t}
							title={t("chatbot.aiChat")}
						/>

						{/* AI Chat Sub-settings */}
						<Show when={form.ai_chat_enabled}>
							<div class="ml-3 space-y-3 border-violet-800/50 border-l-2 py-2 pl-3">
								<Textarea
									class="bg-surface-inset"
									helperText={t("chatbot.aiPersonalityDescription")}
									label={t("chatbot.aiPersonality")}
									maxLength={1000}
									onBlur={() => saveConfig()}
									onInput={(e) =>
										setForm("ai_personality", e.currentTarget.value)
									}
									placeholder={t("chatbot.aiPersonalityPlaceholder")}
									rows={4}
									value={form.ai_personality}
								/>
							</div>
						</Show>

						{/* Auto Shoutout */}
						<SettingRow
							checked={form.auto_shoutout_enabled}
							comingSoon
							description={t("chatbot.autoShoutoutDescription")}
							onChange={() => toggle("auto_shoutout_enabled")}
							t={t}
							title={t("chatbot.autoShoutout")}
						/>

						{/* Link Protection */}
						<SettingRow
							checked={form.link_protection_enabled}
							comingSoon
							description={t("chatbot.linkProtectionDescription")}
							onChange={() => toggle("link_protection_enabled")}
							t={t}
							title={t("chatbot.linkProtection")}
						/>

						{/* Slow Mode on Raid */}
						<SettingRow
							checked={form.slow_mode_on_raid_enabled}
							comingSoon
							description={t("chatbot.slowModeOnRaidDescription")}
							onChange={() => toggle("slow_mode_on_raid_enabled")}
							t={t}
							title={t("chatbot.slowModeOnRaid")}
						/>
					</div>
				</Card>
			</Show>
		</div>
	);
}

function ChatBotSkeleton() {
	return (
		<>
			{/* Master toggle skeleton */}
			<div class="flex items-center justify-between">
				<Skeleton class="h-4 w-64" />
				<Skeleton class="h-6 w-11 rounded-full" />
			</div>

			{/* Settings card skeleton */}
			<Card variant="ghost">
				<div class="divide-y divide-neutral-800/50">
					<div class="flex items-center justify-between p-3">
						<div class="space-y-1">
							<Skeleton class="h-5 w-32" />
							<Skeleton class="h-3 w-48" />
						</div>
						<Skeleton class="h-6 w-11 rounded-full" />
					</div>
					<div class="space-y-2 p-3">
						<div class="space-y-1">
							<Skeleton class="h-5 w-28" />
							<Skeleton class="h-3 w-40" />
						</div>
						<Skeleton class="h-10 w-16" />
						<Skeleton class="h-10 w-full" />
					</div>
					<div class="flex items-center justify-between p-3">
						<div class="space-y-1">
							<Skeleton class="h-5 w-40" />
							<Skeleton class="h-3 w-56" />
						</div>
						<Skeleton class="h-6 w-11 rounded-full" />
					</div>
					<div class="flex items-center justify-between p-3">
						<div class="space-y-1">
							<Skeleton class="h-5 w-28" />
							<Skeleton class="h-3 w-52" />
						</div>
						<Skeleton class="h-6 w-11 rounded-full" />
					</div>
					<div class="flex items-center justify-between p-3">
						<div class="space-y-1">
							<Skeleton class="h-5 w-32" />
							<Skeleton class="h-3 w-56" />
						</div>
						<Skeleton class="h-6 w-11 rounded-full" />
					</div>
					<div class="flex items-center justify-between p-3">
						<div class="space-y-1">
							<Skeleton class="h-5 w-36" />
							<Skeleton class="h-3 w-48" />
						</div>
						<Skeleton class="h-6 w-11 rounded-full" />
					</div>
				</div>
			</Card>
		</>
	);
}

function SettingRow(props: {
	title: string;
	description: string;
	checked: boolean;
	onChange: () => void;
	comingSoon?: boolean;
	experimental?: boolean;
	t: (key: string) => string;
}) {
	return (
		<div class="flex items-center justify-between p-3">
			<div>
				<div class="flex items-center gap-2">
					<h3 class="font-medium">{props.title}</h3>
					{props.comingSoon && (
						<span class="rounded-full bg-neutral-700 px-1.5 py-0.5 text-[10px] text-neutral-400">
							{props.t("chatbot.comingSoon")}
						</span>
					)}
					{props.experimental && (
						<span class="rounded-full bg-violet-900/50 px-1.5 py-0.5 text-[10px] text-violet-400">
							{props.t("chatbot.experimental")}
						</span>
					)}
				</div>
				<p class="text-neutral-400 text-xs">{props.description}</p>
			</div>
			<Toggle checked={props.checked} onChange={props.onChange} />
		</div>
	);
}
