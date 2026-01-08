import { For, Show, createSignal } from "solid-js";
import PlatformIcon from "~/components/PlatformIcon";
import { Skeleton } from "~/design-system";
import Button from "~/design-system/Button";
import Card from "~/design-system/Card";
import { text } from "~/design-system/design-system";
import { useTranslation } from "~/i18n";
import { apiRoutes } from "~/lib/constants";
import { disconnectStreamingAccount } from "~/sdk/ash_rpc";

interface PlatformConfig {
	name: string;
	platform: string;
	targetPlatform: string;
}

interface StreamingAccount {
	platform: string;
	extra_data?: { name?: string; nickname?: string };
}

interface PlatformStatus {
	status?: string;
	viewer_count?: number;
}

interface PlatformConnectionsCardProps {
	userId: string;
	availablePlatforms: PlatformConfig[];
	streamingAccounts: StreamingAccount[];
	isLoading: boolean;
	connectedPlatforms: Set<string>;
	platformStatuses: Record<string, PlatformStatus | undefined>;
}

export function PlatformConnectionsCard(props: PlatformConnectionsCardProps) {
	const { t } = useTranslation();
	const [disconnectingPlatform, setDisconnectingPlatform] = createSignal<
		string | null
	>(null);
	const [disconnectError, setDisconnectError] = createSignal<string | null>(
		null,
	);

	const handleDisconnectAccount = async (platform: string) => {
		if (!confirm(t("stream.platforms.disconnectConfirm"))) return;
		setDisconnectingPlatform(platform);
		setDisconnectError(null);
		try {
			const result = await disconnectStreamingAccount({
				identity: {
					userId: props.userId,
					platform: platform as
						| "youtube"
						| "twitch"
						| "facebook"
						| "kick"
						| "tiktok"
						| "trovo"
						| "instagram"
						| "rumble",
				},
				fetchOptions: { credentials: "include" },
			});
			if (!result.success) {
				console.error("Failed to disconnect account:", result.errors);
				setDisconnectError(t("errors.generic"));
			}
		} catch (error) {
			console.error("Failed to disconnect account:", error);
			setDisconnectError(t("errors.generic"));
		} finally {
			setDisconnectingPlatform(null);
		}
	};

	return (
		<Card>
			<div class="mb-6">
				<h3 class={text.h3}>{t("stream.platforms.title")}</h3>
				<p class={text.muted}>{t("stream.platforms.subtitle")}</p>
			</div>

			<Show when={disconnectError()}>
				<div class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800 text-sm">
					{disconnectError()}
				</div>
			</Show>

			<Show
				fallback={
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<For each={[1, 2, 3, 4]}>
							{() => (
								<div class="flex items-center justify-between rounded-lg border border-gray-200 p-4">
									<div class="flex items-center space-x-3">
										<Skeleton class="h-10 w-10 rounded-lg" />
										<div>
											<Skeleton class="mb-1 h-5 w-20" />
											<Skeleton class="h-3 w-24" />
										</div>
									</div>
									<Skeleton class="h-9 w-20 rounded-lg" />
								</div>
							)}
						</For>
					</div>
				}
				when={!props.isLoading}>
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					{/* Connected accounts */}
					<For each={props.streamingAccounts}>
						{(account) => {
							const platformConfig = props.availablePlatforms.find(
								(p) => p.targetPlatform === account.platform,
							);
							const platformStatus = () =>
								props.platformStatuses[account.platform];
							return (
								<div class="flex items-center justify-between rounded-lg border border-gray-200 p-4">
									<div class="flex items-center space-x-3">
										<div class="relative">
											<PlatformIcon platform={account.platform} size="lg" />
											<Show when={platformStatus()}>
												<span
													class={`absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white ${
														platformStatus()?.status === "live"
															? "bg-green-500"
															: platformStatus()?.status === "starting" ||
																	platformStatus()?.status === "stopping"
																? "bg-yellow-500"
																: "bg-red-500"
													}`}
												/>
											</Show>
										</div>
										<div>
											<div class="flex items-center gap-2">
												<span class="font-medium text-gray-900">
													{platformConfig?.name ?? account.platform}
												</span>
												<Show when={platformStatus()?.viewer_count != null}>
													<span class="text-gray-500 text-xs">
														{platformStatus()?.viewer_count === 1
															? `1 ${t("stream.viewer")}`
															: `${platformStatus()?.viewer_count} ${t("stream.viewers")}`}
													</span>
												</Show>
											</div>
											<span class="text-green-600 text-xs">
												{account.extra_data?.name ||
													account.extra_data?.nickname ||
													t("stream.platforms.connected")}
											</span>
										</div>
									</div>
									<Button
										disabled={disconnectingPlatform() === account.platform}
										onClick={() => handleDisconnectAccount(account.platform)}
										size="sm"
										variant="secondary">
										{disconnectingPlatform() === account.platform
											? "..."
											: t("stream.platforms.disconnect")}
									</Button>
								</div>
							);
						}}
					</For>

					{/* Unconnected platforms */}
					<For each={props.availablePlatforms}>
						{(platform) => (
							<Show
								when={!props.connectedPlatforms.has(platform.targetPlatform)}>
								<div class="flex items-center justify-between rounded-lg border border-gray-200 p-4">
									<div class="flex items-center space-x-3">
										<PlatformIcon
											platform={platform.targetPlatform}
											size="lg"
										/>
										<div>
											<div class="font-medium text-gray-900">
												{platform.name}
											</div>
											<span class="text-gray-500 text-xs">
												{t("stream.platforms.notConnected")}
											</span>
										</div>
									</div>
									<Button
										as="a"
										href={apiRoutes.streaming.connect(platform.platform)}
										size="sm">
										{t("stream.platforms.connect")}
									</Button>
								</div>
							</Show>
						)}
					</For>
				</div>
			</Show>
		</Card>
	);
}
