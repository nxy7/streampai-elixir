import { Title } from "@solidjs/meta";
import { For, Show, createEffect, createMemo, createSignal } from "solid-js";
import { Skeleton } from "~/components/ui";
import Badge from "~/components/ui/Badge";
import Button from "~/components/ui/Button";
import Card from "~/components/ui/Card";
import { useTranslation } from "~/i18n";
import { getLoginUrl, useCurrentUser } from "~/lib/auth";
import { apiRoutes } from "~/lib/constants";
import { rpcOptions } from "~/lib/csrf";
import { useStreamingAccounts } from "~/lib/useElectric";
import {
	disconnectStreamingAccount,
	getStreamKey,
	regenerateStreamKey,
} from "~/sdk/ash_rpc";
import { text } from "~/styles/design-system";

// Platform configuration
const availablePlatforms = [
	{
		name: "YouTube",
		platform: "google" as const,
		targetPlatform: "youtube" as const,
		bgColor: "bg-red-100",
		textColor: "text-red-600",
	},
	{
		name: "Twitch",
		platform: "twitch" as const,
		targetPlatform: "twitch" as const,
		bgColor: "bg-purple-100",
		textColor: "text-purple-600",
	},
	{
		name: "Facebook",
		platform: "facebook" as const,
		targetPlatform: "facebook" as const,
		bgColor: "bg-blue-100",
		textColor: "text-blue-600",
	},
	{
		name: "Kick",
		platform: "kick" as const,
		targetPlatform: "kick" as const,
		bgColor: "bg-green-100",
		textColor: "text-green-600",
	},
];

// Skeleton for stream page loading state
function StreamPageSkeleton() {
	return (
		<div class="mx-auto max-w-7xl space-y-6">
			{/* Stream Status Card skeleton */}
			<Card>
				<div class="mb-6 flex items-center justify-between">
					<div>
						<Skeleton class="mb-2 h-8 w-40" />
						<Skeleton class="h-4 w-56" />
					</div>
					<Skeleton class="h-6 w-20 rounded-full" />
				</div>

				{/* Stream Metadata skeleton */}
				<div class="mb-6 space-y-4">
					<div>
						<Skeleton class="mb-2 h-4 w-24" />
						<Skeleton class="h-10 w-full rounded-lg" />
					</div>
					<div>
						<Skeleton class="mb-2 h-4 w-20" />
						<Skeleton class="h-20 w-full rounded-lg" />
					</div>
				</div>

				{/* Stream Controls skeleton */}
				<div class="flex items-center space-x-3">
					<Skeleton class="h-10 w-24 rounded-lg" />
					<Skeleton class="h-10 w-36 rounded-lg" />
				</div>
			</Card>

			{/* Platform Connections skeleton */}
			<Card>
				<div class="mb-6">
					<Skeleton class="mb-2 h-6 w-44" />
					<Skeleton class="h-4 w-64" />
				</div>

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
			</Card>
		</div>
	);
}

type StreamStatus = "offline" | "starting" | "live" | "stopping";

// Stream key data type
type StreamKeyData = {
	rtmpsUrl: string;
	rtmpsStreamKey: string;
	srtUrl?: string;
	webRtcUrl?: string;
};

export default function Stream() {
	const { t } = useTranslation();
	const { user, isLoading } = useCurrentUser();
	const streamingAccounts = useStreamingAccounts(() => user()?.id);
	const [streamStatus, setStreamStatus] = createSignal<StreamStatus>("offline");
	const [showStreamKey, setShowStreamKey] = createSignal(false);
	const [disconnectingPlatform, setDisconnectingPlatform] = createSignal<
		string | null
	>(null);

	// Stream key state
	const [streamKeyData, setStreamKeyData] = createSignal<StreamKeyData | null>(
		null,
	);
	const [isLoadingStreamKey, setIsLoadingStreamKey] = createSignal(false);
	const [isRegenerating, setIsRegenerating] = createSignal(false);
	const [streamKeyError, setStreamKeyError] = createSignal<string | null>(null);
	const [copied, setCopied] = createSignal(false);

	const [streamMetadata, setStreamMetadata] = createSignal({
		title: "",
		description: "",
	});

	// Track which platforms are connected
	const connectedPlatforms = createMemo(() => {
		const accounts = streamingAccounts.data();
		return new Set(accounts.map((a) => a.platform));
	});

	// Fetch stream key when showStreamKey becomes true
	createEffect(() => {
		const currentUser = user();
		if (
			showStreamKey() &&
			currentUser &&
			!streamKeyData() &&
			!isLoadingStreamKey() &&
			!streamKeyError()
		) {
			fetchStreamKey(currentUser.id);
		}
	});

	const fetchStreamKey = async (userId: string) => {
		setIsLoadingStreamKey(true);
		setStreamKeyError(null);

		try {
			const result = await getStreamKey({
				input: { userId, orientation: "horizontal" },
				fields: ["data"],
				...rpcOptions(),
			});

			if (result.success && result.data) {
				// RPC returns { data: { data: { rtmps: {...}, srt: {...} } } }
				const liveInput = Array.isArray(result.data)
					? result.data[0]
					: result.data;
				const cloudflareData = liveInput?.data;
				if (cloudflareData?.rtmps) {
					setStreamKeyData({
						rtmpsUrl: cloudflareData.rtmps.url ?? "",
						rtmpsStreamKey: cloudflareData.rtmps.streamKey ?? "",
						srtUrl: cloudflareData.srt?.url,
						webRtcUrl: cloudflareData.webRTC?.url,
					});
				} else {
					setStreamKeyError("Invalid stream key data received");
				}
			} else {
				setStreamKeyError("Failed to fetch stream key");
			}
		} catch (error) {
			console.error("Failed to fetch stream key:", error);
			setStreamKeyError("Failed to fetch stream key");
		} finally {
			setIsLoadingStreamKey(false);
		}
	};

	const handleRegenerateStreamKey = async () => {
		const currentUser = user();
		if (!currentUser) return;

		if (
			!confirm(
				"Are you sure you want to regenerate your stream key? Your old key will stop working immediately.",
			)
		) {
			return;
		}

		setIsRegenerating(true);
		setStreamKeyError(null);

		try {
			const result = await regenerateStreamKey({
				identity: { userId: currentUser.id, orientation: "horizontal" },
				fields: ["data"],
				...rpcOptions(),
			});

			if (result.success && result.data) {
				const cloudflareData = result.data.data;
				if (cloudflareData?.rtmps) {
					setStreamKeyData({
						rtmpsUrl: cloudflareData.rtmps.url ?? "",
						rtmpsStreamKey: cloudflareData.rtmps.streamKey ?? "",
						srtUrl: cloudflareData.srt?.url,
						webRtcUrl: cloudflareData.webRTC?.url,
					});
				} else {
					setStreamKeyError("Failed to regenerate stream key");
				}
			} else {
				setStreamKeyError("Failed to regenerate stream key");
			}
		} catch (error) {
			console.error("Failed to regenerate stream key:", error);
			setStreamKeyError("Failed to regenerate stream key");
		} finally {
			setIsRegenerating(false);
		}
	};

	const handleCopyStreamKey = async () => {
		const data = streamKeyData();
		if (!data) return;

		try {
			await navigator.clipboard.writeText(data.rtmpsStreamKey);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			console.error("Failed to copy stream key:", error);
		}
	};

	const handleStartStream = () => {
		setStreamStatus("starting");
		setTimeout(() => setStreamStatus("live"), 1500);
	};

	const handleStopStream = () => {
		setStreamStatus("stopping");
		setTimeout(() => setStreamStatus("offline"), 1500);
	};

	const handleDisconnectAccount = async (
		platform:
			| "youtube"
			| "twitch"
			| "facebook"
			| "kick"
			| "tiktok"
			| "trovo"
			| "instagram"
			| "rumble",
	) => {
		const currentUser = user();
		if (!currentUser) return;

		setDisconnectingPlatform(platform);
		try {
			const result = await disconnectStreamingAccount({
				identity: { userId: currentUser.id, platform },
				...rpcOptions(),
			});

			if (!result.success) {
				console.error("Failed to disconnect account:", result.errors);
			}
		} finally {
			setDisconnectingPlatform(null);
		}
	};

	return (
		<>
			<Title>Stream - Streampai</Title>
			<Show fallback={<StreamPageSkeleton />} when={!isLoading()}>
				<Show
					fallback={
						<div class="flex min-h-screen items-center justify-center bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900">
							<div class="py-12 text-center">
								<h2 class="mb-4 font-bold text-2xl text-white">
									Not Authenticated
								</h2>
								<p class="mb-6 text-gray-300">
									Please sign in to access the stream page.
								</p>
								<a
									class="inline-block rounded-lg bg-linear-to-r from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white transition-all hover:from-purple-600 hover:to-pink-600"
									href={getLoginUrl()}>
									Sign In
								</a>
							</div>
						</div>
					}
					when={user()}>
					<div class="mx-auto max-w-7xl space-y-6">
						{/* Stream Status Card */}
						<Card>
							<div class="mb-6 flex items-center justify-between">
								<div>
									<h2 class={text.h2}>Stream Controls</h2>
									<p class={text.muted}>Manage your multi-platform stream</p>
								</div>
								<Show
									fallback={
										<Badge variant="neutral">
											{streamStatus().toUpperCase()}
										</Badge>
									}
									when={streamStatus() === "live"}>
									<Badge variant="success">
										<span class="mr-2 animate-pulse">*</span> LIVE
									</Badge>
								</Show>
							</div>

							{/* Stream Metadata */}
							<div class="mb-6 space-y-4">
								<div>
									<label class="block font-medium text-gray-700 text-sm">
										Stream Title
										<input
											class="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-purple-500"
											onInput={(e) =>
												setStreamMetadata((prev) => ({
													...prev,
													title: e.currentTarget.value,
												}))
											}
											placeholder={t("stream.streamTitlePlaceholder")}
											type="text"
											value={streamMetadata().title}
										/>
									</label>
								</div>
								<div>
									<label class="block font-medium text-gray-700 text-sm">
										Description
										<textarea
											class="mt-2 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-purple-500"
											onInput={(e) =>
												setStreamMetadata((prev) => ({
													...prev,
													description: e.currentTarget.value,
												}))
											}
											placeholder={t("stream.streamDescriptionPlaceholder")}
											rows="3"
											value={streamMetadata().description}
										/>
									</label>
								</div>
							</div>

							{/* Stream Controls */}
							<div class="flex items-center space-x-3">
								<Show
									fallback={
										<Button
											disabled={streamStatus() === "stopping"}
											onClick={handleStopStream}
											variant="danger">
											{streamStatus() === "stopping"
												? "Stopping..."
												: "Stop Stream"}
										</Button>
									}
									when={streamStatus() === "offline"}>
									<Button
										disabled={streamStatus() === "starting"}
										onClick={handleStartStream}
										variant="success">
										{streamStatus() === "starting" ? "Starting..." : "Go Live"}
									</Button>
								</Show>
								<Button
									onClick={() => setShowStreamKey(!showStreamKey())}
									variant="secondary">
									{showStreamKey() ? "Hide" : "Show"} Stream Key
								</Button>
							</div>

							{/* Stream Key Display */}
							<Show when={showStreamKey()}>
								<div class="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
									<Show
										fallback={
											<div class="space-y-3">
												<Skeleton class="h-4 w-24" />
												<Skeleton class="h-5 w-full" />
												<Skeleton class="h-5 w-3/4" />
											</div>
										}
										when={!isLoadingStreamKey()}>
										<Show
											fallback={
												<div class="text-center">
													<p class="text-red-600 text-sm">{streamKeyError()}</p>
													<Button
														class="mt-2"
														onClick={() => {
															const currentUser = user();
															if (currentUser) fetchStreamKey(currentUser.id);
														}}
														size="sm"
														variant="ghost">
														Retry
													</Button>
												</div>
											}
											when={!streamKeyError()}>
											<div class="mb-3 flex items-center justify-between">
												<span class="font-medium text-gray-700 text-sm">
													Stream Key
												</span>
												<div class="flex items-center space-x-2">
													<Button
														onClick={handleCopyStreamKey}
														size="sm"
														variant="ghost">
														{copied() ? "Copied!" : "Copy Key"}
													</Button>
													<Button
														class="text-red-600 hover:bg-red-50"
														disabled={isRegenerating()}
														onClick={handleRegenerateStreamKey}
														size="sm"
														variant="ghost">
														{isRegenerating()
															? "Regenerating..."
															: "Regenerate"}
													</Button>
												</div>
											</div>

											<Show when={streamKeyData()}>
												{(data) => (
													<>
														<div class="mb-2">
															<span class="mb-1 block text-gray-500 text-xs">
																RTMP URL
															</span>
															<code class="block rounded bg-white px-2 py-1 font-mono text-gray-900 text-sm">
																{data().rtmpsUrl}
															</code>
														</div>
														<div class="mb-3">
															<span class="mb-1 block text-gray-500 text-xs">
																Stream Key
															</span>
															<code class="block rounded bg-white px-2 py-1 font-mono text-gray-600 text-sm">
																{data().rtmpsStreamKey}
															</code>
														</div>

														<Show when={data().srtUrl}>
															<div class="mb-2 border-gray-200 border-t pt-2">
																<span class="mb-1 block text-gray-500 text-xs">
																	SRT URL (Alternative)
																</span>
																<code class="block rounded bg-white px-2 py-1 font-mono text-gray-600 text-xs">
																	{data().srtUrl}
																</code>
															</div>
														</Show>

														<p class="mt-3 text-gray-500 text-xs">
															Use this RTMP URL and stream key in your streaming
															software (OBS, Streamlabs, etc.)
														</p>
													</>
												)}
											</Show>
										</Show>
									</Show>
								</div>
							</Show>
						</Card>

						{/* Platform Connections */}
						<Card>
							<div class="mb-6">
								<h3 class={text.h3}>Platform Connections</h3>
								<p class={text.muted}>
									Connect your streaming platforms to multicast
								</p>
							</div>

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
								when={!streamingAccounts.isLoading()}>
								<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
									{/* Connected accounts first */}
									<For each={streamingAccounts.data()}>
										{(account) => {
											const platformConfig = availablePlatforms.find(
												(p) => p.targetPlatform === account.platform,
											);
											return (
												<div class="flex items-center justify-between rounded-lg border border-gray-200 p-4">
													<div class="flex items-center space-x-3">
														<div
															class={`flex h-10 w-10 items-center justify-center rounded-lg ${platformConfig?.bgColor ?? "bg-gray-100"}`}>
															<span
																class={`font-bold text-sm ${platformConfig?.textColor ?? "text-gray-600"}`}>
																{platformConfig?.name[0] ??
																	account.platform[0].toUpperCase()}
															</span>
														</div>
														<div>
															<div class="font-medium text-gray-900">
																{platformConfig?.name ?? account.platform}
															</div>
															<span class="text-green-600 text-xs">
																{account.extra_data?.name ||
																	account.extra_data?.nickname ||
																	"Connected"}
															</span>
														</div>
													</div>
													<Button
														disabled={
															disconnectingPlatform() === account.platform
														}
														onClick={() =>
															handleDisconnectAccount(account.platform)
														}
														size="sm"
														variant="secondary">
														{disconnectingPlatform() === account.platform
															? "..."
															: "Disconnect"}
													</Button>
												</div>
											);
										}}
									</For>

									{/* Unconnected platforms */}
									<For each={availablePlatforms}>
										{(platform) => (
											<Show
												when={
													!connectedPlatforms().has(platform.targetPlatform)
												}>
												<div class="flex items-center justify-between rounded-lg border border-gray-200 p-4">
													<div class="flex items-center space-x-3">
														<div
															class={`flex h-10 w-10 items-center justify-center rounded-lg ${platform.bgColor}`}>
															<span
																class={`font-bold text-sm ${platform.textColor}`}>
																{platform.name[0]}
															</span>
														</div>
														<div>
															<div class="font-medium text-gray-900">
																{platform.name}
															</div>
															<span class="text-gray-500 text-xs">
																Not connected
															</span>
														</div>
													</div>
													<Button
														as="a"
														href={apiRoutes.streaming.connect(
															platform.platform,
														)}
														size="sm">
														Connect
													</Button>
												</div>
											</Show>
										)}
									</For>
								</div>
							</Show>
						</Card>

						{/* Stream Statistics (Placeholder) */}
						<Show when={streamStatus() === "live"}>
							<Card>
								<h3 class={`${text.h3} mb-4`}>Live Statistics</h3>
								<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
									<div class="rounded-lg bg-purple-50 p-4 text-center">
										<div class="font-bold text-2xl text-purple-600">0</div>
										<div class="text-gray-600 text-sm">Viewers</div>
									</div>
									<div class="rounded-lg bg-blue-50 p-4 text-center">
										<div class="font-bold text-2xl text-blue-600">0</div>
										<div class="text-gray-600 text-sm">Chat Messages</div>
									</div>
									<div class="rounded-lg bg-green-50 p-4 text-center">
										<div class="font-bold text-2xl text-green-600">00:00</div>
										<div class="text-gray-600 text-sm">Stream Duration</div>
									</div>
								</div>
							</Card>
						</Show>
					</div>
				</Show>
			</Show>
		</>
	);
}
