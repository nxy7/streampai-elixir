import { createFileRoute } from "@tanstack/solid-router";
import { For, Show, createEffect, createSignal } from "solid-js";
import { Card, Skeleton, Toggle } from "~/design-system";
import Input, { Textarea } from "~/design-system/Input";
import { useTranslation } from "~/i18n";
import { useCurrentUser } from "~/lib/auth";
import { useBreadcrumbs } from "~/lib/BreadcrumbContext";
import { useChatBotConfig } from "~/lib/useElectric";
import { upsertChatBotConfig } from "~/sdk/ash_rpc";

export const Route = createFileRoute("/dashboard/tools/chatbot")({
	component: ChatBotConfigPage,
	head: () => ({
		meta: [{ title: "Chat Bot - Streampai" }],
	}),
});

function ChatBotConfigPage() {
	const { t } = useTranslation();
	const { user } = useCurrentUser();
	const configQuery = useChatBotConfig(() => user()?.id);

	useBreadcrumbs(() => [
		{ label: t("sidebar.tools"), href: "/dashboard/tools/timers" },
		{ label: t("dashboardNav.chatBot") },
	]);

	const [enabled, setEnabled] = createSignal(true);
	const [greetingEnabled, setGreetingEnabled] = createSignal(false);
	const [commandPrefix, setCommandPrefix] = createSignal("!");
	const [aiChatEnabled, setAiChatEnabled] = createSignal(false);
	const [aiPersonality, setAiPersonality] = createSignal("");
	const [autoShoutoutEnabled, setAutoShoutoutEnabled] = createSignal(false);
	const [linkProtectionEnabled, setLinkProtectionEnabled] = createSignal(false);
	const [slowModeOnRaidEnabled, setSlowModeOnRaidEnabled] = createSignal(false);
	const [initialized, setInitialized] = createSignal(false);

	// Check if we're still loading (status is not yet 'ready')
	const isLoading = () => {
		const status = configQuery.status() as string;
		return status !== "ready" && status !== "disabled";
	};

	// Ready to show content when loaded (either with data or confirmed no data)
	const isReady = () =>
		!isLoading() && (initialized() || configQuery.data() === null);

	// Sync local state from Electric data
	createEffect(() => {
		const config = configQuery.data();
		if (config && !initialized()) {
			setEnabled(config.enabled);
			setGreetingEnabled(config.greeting_enabled);
			setCommandPrefix(config.command_prefix);
			setAiChatEnabled(config.ai_chat_enabled);
			setAiPersonality(config.ai_personality ?? "");
			setAutoShoutoutEnabled(config.auto_shoutout_enabled);
			setLinkProtectionEnabled(config.link_protection_enabled);
			setSlowModeOnRaidEnabled(config.slow_mode_on_raid_enabled);
			setInitialized(true);
		}
		// If loaded but no config exists, also mark as initialized to use defaults
		if (!isLoading() && config === null && !initialized()) {
			setInitialized(true);
		}
	});

	const saveConfig = async (overrides: Record<string, unknown> = {}) => {
		await upsertChatBotConfig({
			input: {
				enabled: enabled(),
				greetingEnabled: greetingEnabled(),
				commandPrefix: commandPrefix(),
				aiChatEnabled: aiChatEnabled(),
				aiPersonality: aiPersonality(),
				autoShoutoutEnabled: autoShoutoutEnabled(),
				linkProtectionEnabled: linkProtectionEnabled(),
				slowModeOnRaidEnabled: slowModeOnRaidEnabled(),
				...overrides,
			},
		});
	};

	const toggleSetting = async (
		setter: (v: boolean) => void,
		current: boolean,
		field: string,
	) => {
		setter(!current);
		await saveConfig({ [field]: !current });
	};

	return (
		<div class="mx-auto max-w-3xl space-y-4">
			<Show fallback={<ChatBotSkeleton />} when={isReady()}>
				{/* Master toggle */}
				<div class="flex items-center justify-between">
					<p class="text-neutral-500 text-sm">{t("chatbot.description")}</p>
					<Toggle
						checked={enabled()}
						onChange={() => toggleSetting(setEnabled, enabled(), "enabled")}
					/>
				</div>

				<Card variant="ghost">
					<div class="divide-y divide-neutral-800/50">
						{/* Stream Greeting */}
						<SettingRow
							checked={greetingEnabled()}
							description={t("chatbot.greetingDescription")}
							onChange={() =>
								toggleSetting(
									setGreetingEnabled,
									greetingEnabled(),
									"greetingEnabled",
								)
							}
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
								onInput={(e) => setCommandPrefix(e.currentTarget.value)}
								type="text"
								value={commandPrefix()}
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
												{commandPrefix()}
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
							checked={aiChatEnabled()}
							description={t("chatbot.aiChatDescription")}
							experimental
							onChange={() =>
								toggleSetting(
									setAiChatEnabled,
									aiChatEnabled(),
									"aiChatEnabled",
								)
							}
							t={t}
							title={t("chatbot.aiChat")}
						/>

						{/* AI Chat Sub-settings */}
						<Show when={aiChatEnabled()}>
							<div class="ml-3 space-y-3 border-violet-800/50 border-l-2 py-2 pl-3">
								{/* Personality */}
								<Textarea
									class="bg-surface-inset"
									helperText={t("chatbot.aiPersonalityDescription")}
									label={t("chatbot.aiPersonality")}
									maxLength={1000}
									onBlur={() => saveConfig()}
									onInput={(e) => setAiPersonality(e.currentTarget.value)}
									placeholder={t("chatbot.aiPersonalityPlaceholder")}
									rows={4}
									value={aiPersonality()}
								/>
							</div>
						</Show>

						{/* Auto Shoutout */}
						<SettingRow
							checked={autoShoutoutEnabled()}
							comingSoon
							description={t("chatbot.autoShoutoutDescription")}
							onChange={() =>
								toggleSetting(
									setAutoShoutoutEnabled,
									autoShoutoutEnabled(),
									"autoShoutoutEnabled",
								)
							}
							t={t}
							title={t("chatbot.autoShoutout")}
						/>

						{/* Link Protection */}
						<SettingRow
							checked={linkProtectionEnabled()}
							comingSoon
							description={t("chatbot.linkProtectionDescription")}
							onChange={() =>
								toggleSetting(
									setLinkProtectionEnabled,
									linkProtectionEnabled(),
									"linkProtectionEnabled",
								)
							}
							t={t}
							title={t("chatbot.linkProtection")}
						/>

						{/* Slow Mode on Raid */}
						<SettingRow
							checked={slowModeOnRaidEnabled()}
							comingSoon
							description={t("chatbot.slowModeOnRaidDescription")}
							onChange={() =>
								toggleSetting(
									setSlowModeOnRaidEnabled,
									slowModeOnRaidEnabled(),
									"slowModeOnRaidEnabled",
								)
							}
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
					{/* Setting rows */}
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
