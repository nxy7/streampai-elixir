import { For, Show, createMemo } from "solid-js";
import PlatformIcon from "~/components/PlatformIcon";
import StreamingAccountStats from "~/components/StreamingAccountStats";
import { Skeleton } from "~/design-system";
import Button from "~/design-system/Button";
import { useTranslation } from "~/i18n";
import { apiRoutes } from "~/lib/constants";
import {
	disconnectStreamingAccount,
	refreshStreamingAccountStats,
} from "~/sdk/ash_rpc";

type Platform =
	| "youtube"
	| "twitch"
	| "facebook"
	| "kick"
	| "tiktok"
	| "trovo"
	| "instagram"
	| "rumble";

interface StreamingAccount {
	platform: Platform;
	extra_data?: {
		name?: string;
		nickname?: string;
		image?: string;
	} | null;
	sponsor_count: number | null;
	views_last_30d: number | null;
	follower_count: number | null;
	unique_viewers_last_30d: number | null;
	stats_last_refreshed_at: string | null;
	status?: "connected" | "needs_reauth";
}

interface PlatformConnectionsPanelProps {
	userId: string;
	accounts: StreamingAccount[];
	isLoading: boolean;
}

const AVAILABLE_PLATFORMS = [
	{
		name: "YouTube",
		platform: "google" as const,
		targetPlatform: "youtube" as const,
	},
	{
		name: "Twitch",
		platform: "twitch" as const,
		targetPlatform: "twitch" as const,
	},
];

export default function PlatformConnectionsPanel(
	props: PlatformConnectionsPanelProps,
) {
	const { t } = useTranslation();

	const connectedPlatforms = createMemo(() => {
		return new Set((props.accounts ?? []).map((a) => a.platform));
	});

	const handleRefreshStats = async (platform: Platform) => {
		// Work around type inference issue in generated SDK - fields parameter is inferred as never[]
		const fields: string[] = [
			"platform",
			"sponsorCount",
			"viewsLast30d",
			"followerCount",
			"uniqueViewersLast30d",
			"statsLastRefreshedAt",
		];
		const result = await refreshStreamingAccountStats({
			identity: { userId: props.userId, platform },
			// biome-ignore lint/suspicious/noExplicitAny: Type coercion for RPC fields array
			fields: fields as any,
			fetchOptions: { credentials: "include" },
		});

		if (!result.success) {
			console.error("Failed to refresh stats:", result.errors);
		}
	};

	const handleDisconnectAccount = async (platform: Platform) => {
		const result = await disconnectStreamingAccount({
			identity: { userId: props.userId, platform },
			fetchOptions: { credentials: "include" },
		});

		if (!result.success) {
			console.error("Failed to disconnect account:", result.errors);
		}
	};

	return (
		<div>
			<p class="mb-2 block font-medium text-neutral-700 text-sm">
				{t("settings.streamingPlatforms")}
			</p>

			<Show
				fallback={
					<div class="space-y-2">
						<For each={[1, 2]}>
							{() => (
								<div class="flex items-center justify-between rounded-lg border border-neutral-200 p-3">
									<div class="flex items-center space-x-3">
										<Skeleton class="h-10 w-10 rounded-lg" />
										<div class="space-y-1">
											<Skeleton class="h-4 w-20" />
											<Skeleton class="h-3 w-16" />
										</div>
									</div>
									<Skeleton class="h-8 w-20 rounded-lg" />
								</div>
							)}
						</For>
					</div>
				}
				when={!props.isLoading}>
				<Show when={props.accounts?.length > 0}>
					<div class="mb-4 space-y-3">
						<For each={props.accounts}>
							{(account) => {
								const platformInfo = () =>
									AVAILABLE_PLATFORMS.find(
										(p) => p.targetPlatform === account.platform,
									);
								return (
									<Show
										fallback={
											<StreamingAccountStats
												data={{
													platform: account.platform,
													accountName:
														account.extra_data?.name ||
														account.extra_data?.nickname ||
														account.platform,
													accountImage: account.extra_data?.image || null,
													sponsorCount: account.sponsor_count,
													viewsLast30d: account.views_last_30d,
													followerCount: account.follower_count,
													uniqueViewersLast30d: account.unique_viewers_last_30d,
													statsLastRefreshedAt: account.stats_last_refreshed_at,
												}}
												onDisconnect={() =>
													handleDisconnectAccount(account.platform)
												}
												onRefresh={() => handleRefreshStats(account.platform)}
											/>
										}
										when={account.status === "needs_reauth"}>
										<div class="flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950">
											<div class="flex items-center space-x-3">
												<PlatformIcon platform={account.platform} size="lg" />
												<div>
													<p class="font-medium text-neutral-900">
														{platformInfo()?.name ?? account.platform}
													</p>
													<p class="text-amber-700 text-sm dark:text-amber-400">
														{t("settings.needsReauth")}
													</p>
												</div>
											</div>
											<Button
												as="a"
												class="bg-amber-600 text-white"
												href={apiRoutes.streaming.connect(
													platformInfo()?.platform ?? account.platform,
												)}
												size="sm"
												variant="secondary">
												{t("stream.platforms.reconnect")}
											</Button>
										</div>
									</Show>
								);
							}}
						</For>
					</div>
				</Show>

				<div class="space-y-2">
					<For each={AVAILABLE_PLATFORMS}>
						{(platform) => (
							<Show when={!connectedPlatforms()?.has(platform.targetPlatform)}>
								<div class="flex items-center justify-between rounded-lg border border-neutral-200 p-3">
									<div class="flex items-center space-x-3">
										<PlatformIcon
											platform={platform.targetPlatform}
											size="lg"
										/>
										<div>
											<p class="font-medium text-neutral-900">
												{platform.name}
											</p>
											<p class="text-neutral-500 text-sm">
												{t("settings.notConnected")}
											</p>
										</div>
									</div>
									<Button
										as="a"
										href={apiRoutes.streaming.connect(platform.platform)}
										size="sm">
										{t("settings.connect")}
									</Button>
								</div>
							</Show>
						)}
					</For>
				</div>
			</Show>
		</div>
	);
}
