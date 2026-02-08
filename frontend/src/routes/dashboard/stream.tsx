import { useSearchParams } from "@solidjs/router";
import {
	For,
	Show,
	Suspense,
	createEffect,
	createMemo,
	createSignal,
	onCleanup,
} from "solid-js";
import PlatformIcon from "~/components/PlatformIcon";
import { LiveInputPreview } from "~/components/stream/LiveInputPreview";
import LiveStatusBadge from "~/components/stream/LiveStatusBadge";
import { LiveStreamControlCenter } from "~/components/stream/LiveStreamControlCenter";
import { PlatformConnectionsCard } from "~/components/stream/PlatformConnectionsCard";
import { StreamKeyDisplay } from "~/components/stream/StreamKeyDisplay";
import { StreamSettingsForm } from "~/components/stream/StreamSettingsForm";
import type {
	ActivityItem,
	ActivityType,
	Platform,
	StreamControlsSettings,
	StreamMetadata,
} from "~/components/stream/types";
import { Skeleton } from "~/design-system";
import Badge from "~/design-system/Badge";
import Button from "~/design-system/Button";
import Card from "~/design-system/Card";
import { text } from "~/design-system/design-system";
import { useTranslation } from "~/i18n";
import { useAuthenticatedUser } from "~/lib/auth";
import { useBreadcrumbs } from "~/lib/BreadcrumbContext";

import {
	useStreamActor,
	useStreamTimers,
	useStreamingAccounts,
	useUserStreamEvents,
	useUserViewers,
} from "~/lib/useElectric";
import { createLocalStorageStore } from "~/lib/useLocalStorage";
import {
	goLive,
	sendStreamMessage,
	stopStream,
	togglePlatform,
	updateStreamMetadata,
} from "~/sdk/ash_rpc";

// Platform configuration
const availablePlatforms = [
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
	{
		name: "Facebook",
		platform: "facebook" as const,
		targetPlatform: "facebook" as const,
	},
	{
		name: "Kick",
		platform: "kick" as const,
		targetPlatform: "kick" as const,
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
							<div class="flex items-center justify-between rounded-lg border border-neutral-200 p-4">
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

export default function Stream() {
	return (
		<Suspense fallback={<StreamPageSkeleton />}>
			<StreamContent />
		</Suspense>
	);
}

function StreamContent() {
	const { t } = useTranslation();
	const { user } = useAuthenticatedUser();

	useBreadcrumbs(() => [
		{ label: t("sidebar.streaming"), href: "/dashboard/stream" },
		{ label: t("dashboardNav.stream") },
	]);

	const streamingAccounts = useStreamingAccounts(() => user().id);
	const streamActor = useStreamActor(() => user().id);
	const streamEvents = useUserStreamEvents(() => user().id);
	const viewers = useUserViewers(() => user().id);
	const streamTimersQuery = useStreamTimers(() => user().id);
	const streamTimers = () =>
		(streamTimersQuery.data() ?? []).map((row) => ({
			id: row.id,
			label: row.label,
			content: row.content,
			intervalSeconds: row.interval_seconds,
			disabledAt: row.disabled_at ?? null,
		}));
	const encoderConnected = () => streamActor.encoderConnected();
	const [isStarting, setIsStarting] = createSignal(false);
	const [isStopping, setIsStopping] = createSignal(false);
	const [streamError, setStreamError] = createSignal<string | null>(null);

	// Clear optimistic flags when Electric delivers a definitive state.
	// This prevents stale flags from overriding the real DB state.
	createEffect(() => {
		const actorStatus = streamActor.streamStatus();
		if (actorStatus === "streaming") {
			setIsStarting(false);
		}
		if (actorStatus === "idle" || actorStatus === "error") {
			setIsStarting(false);
			setIsStopping(false);
		}
	});

	// Derive stream status from Electric actor state + optimistic flags.
	// Electric state always takes priority. Optimistic flags are fallback
	// to bridge the gap between RPC response and Electric sync delivery.
	const streamStatus = (): StreamStatus => {
		const actorStatus = streamActor.streamStatus();
		// Electric state takes priority — once synced, it's the source of truth
		if (actorStatus === "streaming") return "live";
		if (actorStatus === "stopping") return "stopping";
		// Optimistic flags for the brief window before Electric delivers
		if (isStarting()) return "starting";
		if (isStopping()) return "stopping";
		return "offline";
	};
	const [showStreamKey, setShowStreamKey] = createSignal(false);

	const [streamMetadata, setStreamMetadata] =
		createLocalStorageStore<StreamMetadata>("stream-settings", {
			title: "",
			description: "",
			category: "",
			tags: [],
		});
	const [controlSettings, setControlSettings] =
		createLocalStorageStore<StreamControlsSettings>(
			"stream-controls-settings",
			{ showAvatars: true },
		);
	const [searchParams, setSearchParams] = useSearchParams();
	const isFullscreen = () => searchParams.fullscreen === "true";
	const toggleFullscreen = () =>
		setSearchParams({ fullscreen: isFullscreen() ? undefined : "true" });
	const [streamDuration, setStreamDuration] = createSignal(0);

	// Compute stream duration from backend started_at timestamp (synced via Electric)
	createEffect(() => {
		const startedAt = streamActor.data()?.stream_data?.started_at as
			| string
			| undefined;
		if (streamStatus() === "live" && startedAt) {
			const startTime = new Date(startedAt).getTime();
			const update = () =>
				setStreamDuration(Math.floor((Date.now() - startTime) / 1000));
			update();
			const interval = setInterval(update, 1000);
			onCleanup(() => clearInterval(interval));
		} else {
			setStreamDuration(0);
		}
	});

	// Build viewer avatar lookup from Electric-synced viewers
	const viewerAvatarMap = createMemo(() => {
		const map = new Map<string, string>();
		for (const v of viewers.data() ?? []) {
			if (v.avatar_url) {
				map.set(v.viewer_id, v.avatar_url);
			}
		}
		return map;
	});

	// Build activity feed from Electric-synced stream events (chat messages are dual-written as stream events)
	const activities = createMemo<ActivityItem[]>(() => {
		const EVENT_TYPE_MAP: Record<string, ActivityType> = {
			chat_message: "chat",
			donation: "donation",
			follow: "follow",
			subscription: "subscription",
			raid: "raid",
			cheer: "cheer",
		};

		const avatars = viewerAvatarMap();
		return (streamEvents.data() ?? [])
			.filter((ev) => ev.type in EVENT_TYPE_MAP)
			.map((ev) => {
				const isChatMessage = ev.type === "chat_message";
				const data = ev.data as Record<string, unknown> | undefined;
				const isSentByStreamer =
					isChatMessage && ((data?.is_sent_by_streamer as boolean) ?? false);
				return {
					id: ev.id,
					type: EVENT_TYPE_MAP[ev.type] as ActivityType,
					username:
						(data?.username as string) ??
						(data?.sender_username as string) ??
						"Unknown",
					message: data?.message as string | undefined,
					amount: data?.amount as number | undefined,
					currency: data?.currency as string | undefined,
					platform: ev.platform ?? "unknown",
					timestamp: ev.inserted_at,
					isImportant: !isChatMessage && ev.type !== "follow",
					viewerId: ev.viewer_id ?? undefined,
					isSentByStreamer: isChatMessage ? isSentByStreamer : undefined,
					avatarUrl: isSentByStreamer
						? (user().displayAvatar ?? undefined)
						: ev.viewer_id
							? avatars.get(ev.viewer_id)
							: undefined,
					deliveryStatus: isChatMessage
						? (data?.delivery_status as Record<string, string> | undefined)
						: undefined,
				};
			})
			.sort((a, b) => {
				const timeA = new Date(a.timestamp).getTime();
				const timeB = new Date(b.timestamp).getTime();
				return timeA - timeB;
			});
	});

	// Track which platforms are connected
	const connectedPlatforms = createMemo(() => {
		const accounts = streamingAccounts.data() ?? [];
		return new Set(accounts.map((a) => a.platform));
	});

	const handleStartStream = async () => {
		const currentUser = user();
		if (!currentUser) return;

		setIsStarting(true);
		setStreamError(null);
		try {
			const result = await goLive({
				input: {
					userId: currentUser.id,
					title: streamMetadata.title || undefined,
					description: streamMetadata.description || undefined,
					platforms: streamMetadata.enabledPlatforms ?? [],
					metadata: {
						tags: streamMetadata.tags?.length ? streamMetadata.tags : undefined,
						thumbnail_file_id: streamMetadata.thumbnailFileId || undefined,
					},
				},
				fetchOptions: { credentials: "include" },
			});

			if (!result.success) {
				console.error("Failed to start stream:", result.errors);
				setStreamError(t("errors.generic"));
				setIsStarting(false);
			} else {
				setTimeout(() => setIsStarting(false), 30_000);
			}
		} catch (error) {
			console.error("Failed to start stream:", error);
			setStreamError(t("errors.generic"));
			setIsStarting(false);
		}
	};

	const handleStopStream = async () => {
		const currentUser = user();
		if (!currentUser) return;

		setIsStopping(true);
		setStreamError(null);
		try {
			const result = await stopStream({
				input: { userId: currentUser.id },
				fetchOptions: { credentials: "include" },
			});

			if (!result.success) {
				console.error("Failed to stop stream:", result.errors);
				setStreamError(t("errors.generic"));
				setIsStopping(false);
			} else {
				setTimeout(() => setIsStopping(false), 30_000);
			}
		} catch (error) {
			console.error("Failed to stop stream:", error);
			setStreamError(t("errors.generic"));
			setIsStopping(false);
		}
	};

	return (
		<Show
			fallback={<StreamPageSkeleton />}
			when={streamActor.status() === "ready"}>
			<div class="mx-auto max-w-7xl space-y-6">
				{/* Stream Status Card */}
				<Card
					class={
						isFullscreen()
							? "!fixed !inset-0 !z-[9999] !m-0 !rounded-none flex flex-col overflow-auto"
							: ""
					}
					padding="none">
					<div class="mb-4 flex items-center justify-between px-6 pt-6">
						<div class="flex items-center gap-4">
							<h2 class={text.h2}>{t("stream.controls.title")}</h2>
							<Show
								when={
									streamStatus() !== "live" && streamStatus() !== "starting"
								}>
								<Badge variant="neutral">{streamStatus().toUpperCase()}</Badge>
							</Show>
						</div>
						<div class="flex items-center gap-3">
							<Show
								when={
									streamStatus() === "live" || streamStatus() === "starting"
								}>
								<LiveStatusBadge
									duration={streamDuration()}
									isStopping={streamStatus() === "stopping"}
									onStopStream={handleStopStream}
									platforms={
										streamActor.platformStatuses() as Record<
											string,
											{
												status?: string;
												viewer_count?: number;
												url?: string;
											}
										>
									}
									stopLabel={t("stream.controls.stopStream")}
									stoppingLabel={t("stream.controls.stopping")}
								/>
							</Show>
							<Button
								onClick={toggleFullscreen}
								size="sm"
								title={
									isFullscreen()
										? t("stream.exitFullscreen")
										: t("stream.fullscreen")
								}
								variant="ghost">
								<Show
									fallback={
										<svg
											aria-hidden="true"
											class="h-5 w-5"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
											viewBox="0 0 24 24">
											<path
												d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4"
												stroke-linecap="round"
												stroke-linejoin="round"
											/>
										</svg>
									}
									when={isFullscreen()}>
									<svg
										aria-hidden="true"
										class="h-5 w-5"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										viewBox="0 0 24 24">
										<path
											d="M8 4v4H4M16 4v4h4M8 20v-4H4M16 20v-4h4"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
									</svg>
								</Show>
							</Button>
						</div>
					</div>

					{/* Error Banner */}
					<Show when={streamError()}>
						<div class="mx-6 mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3">
							<p class="text-red-800 text-sm">{streamError()}</p>
							<button
								aria-label={t("common.close")}
								class="text-red-500 hover:text-red-700"
								onClick={() => setStreamError(null)}
								type="button">
								<svg
									aria-hidden="true"
									class="h-4 w-4"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									viewBox="0 0 24 24">
									<path
										d="M6 18L18 6M6 6l12 12"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
							</button>
						</div>
					</Show>

					{/* During Stream - Live Control Center */}
					<Show
						when={streamStatus() === "live" || streamStatus() === "starting"}>
						<div
							class={
								isFullscreen() ? "min-h-0 flex-1" : "h-[400px] md:h-[600px]"
							}>
							<LiveStreamControlCenter
								activities={activities()}
								allConnectedPlatforms={
									(streamingAccounts.data() ?? []).map(
										(a) => a.platform,
									) as Platform[]
								}
								connectedPlatforms={
									Object.keys(streamActor.platformStatuses()) as Platform[]
								}
								controlSettings={controlSettings}
								currentDescription={
									streamActor.data()?.stream_data?.description as
										| string
										| undefined
								}
								currentTags={
									streamActor.data()?.stream_data?.tags as string[] | undefined
								}
								currentThumbnailUrl={streamMetadata.thumbnailUrl}
								currentTitle={
									streamActor.data()?.stream_data?.title as string | undefined
								}
								isStopping={streamStatus() === "stopping"}
								onControlSettingsChange={(field, value) =>
									setControlSettings(
										field as keyof StreamControlsSettings,
										value as never,
									)
								}
								onSendMessage={(message, platforms) => {
									const currentUser = user();
									if (!currentUser) return;
									sendStreamMessage({
										input: {
											userId: currentUser.id,
											message,
											platforms: platforms.length ? platforms : undefined,
										},
										fetchOptions: { credentials: "include" },
									});
								}}
								onStopStream={handleStopStream}
								onTogglePlatform={(platform, enabled) => {
									const currentUser = user();
									if (!currentUser) return;
									togglePlatform({
										input: {
											userId: currentUser.id,
											platform,
											enabled,
										},
										fetchOptions: { credentials: "include" },
									});
								}}
								onUpdateMetadata={(metadata) => {
									const currentUser = user();
									if (!currentUser) return;
									updateStreamMetadata({
										input: {
											userId: currentUser.id,
											...metadata,
										},
										fetchOptions: { credentials: "include" },
									});
								}}
								platformStatuses={streamActor.platformStatuses()}
								streamDuration={streamDuration()}
								streamStartedAt={
									(streamActor.data()?.stream_data?.started_at as
										| string
										| null) ?? null
								}
								timers={streamTimers()}
								viewerCount={Object.values(
									streamActor.platformStatuses() as Record<
										string,
										{ viewer_count?: number }
									>,
								).reduce((sum, info) => sum + (info?.viewer_count ?? 0), 0)}
							/>
						</div>
					</Show>

					{/* Before Stream - Metadata & Controls */}
					<Show
						when={
							streamStatus() === "offline" || streamStatus() === "stopping"
						}>
						<div class="px-6 pb-6">
							{/* Live Input Preview */}
							<div class="mb-6">
								<LiveInputPreview
									encoderConnected={encoderConnected()}
									liveInputUid={streamActor.liveInputUid()}
								/>
							</div>

							{/* Stream Metadata */}
							<div class="mb-6">
								<StreamSettingsForm
									onChange={(field, value) => {
										setStreamMetadata(
											field as keyof StreamMetadata,
											value as never,
										);
									}}
									values={{
										title: streamMetadata.title,
										description: streamMetadata.description,
										tags: streamMetadata.tags ?? [],
										thumbnailFileId: streamMetadata.thumbnailFileId,
										thumbnailUrl: streamMetadata.thumbnailUrl,
									}}
								/>
							</div>

							{/* Platform Selection */}
							<Show when={streamingAccounts.data()?.length > 0}>
								<div class="mb-6">
									{/* biome-ignore lint/a11y/noLabelWithoutControl: label wraps the control */}
									<label class="block font-medium text-neutral-700 text-sm">
										{t("stream.controls.platforms")}
									</label>
									<div class="mt-2 flex flex-wrap gap-3">
										<For each={streamingAccounts.data()}>
											{(account) => {
												const platformConfig = availablePlatforms.find(
													(p) => p.targetPlatform === account.platform,
												);
												const isEnabled = () => {
													const enabled = streamMetadata.enabledPlatforms;
													if (!enabled) return true; // undefined = all selected by default
													return enabled.includes(account.platform);
												};
												const toggle = () => {
													const current = streamMetadata.enabledPlatforms;
													const allPlatforms = (
														streamingAccounts.data() ?? []
													).map((a) => a.platform);
													if (!current) {
														// First toggle from default (all enabled): remove this one
														setStreamMetadata(
															"enabledPlatforms",
															allPlatforms.filter(
																(p) => p !== account.platform,
															),
														);
													} else if (isEnabled()) {
														setStreamMetadata(
															"enabledPlatforms",
															current.filter((p) => p !== account.platform),
														);
													} else {
														setStreamMetadata("enabledPlatforms", [
															...current,
															account.platform,
														]);
													}
												};
												return (
													<button
														class={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
															isEnabled()
																? "bg-surface-inset text-surface-inset-text"
																: "bg-surface-inset text-surface-inset-text opacity-40"
														}`}
														onClick={toggle}
														type="button">
														<PlatformIcon
															platform={account.platform}
															size="sm"
														/>
														<span>
															{platformConfig?.name ?? account.platform}
														</span>
														<div
															class={`h-4 w-4 rounded border transition-colors ${
																isEnabled()
																	? "border-primary bg-primary"
																	: "border-neutral-300 bg-surface"
															}`}>
															<Show when={isEnabled()}>
																<svg
																	aria-hidden="true"
																	class="h-4 w-4 text-white"
																	fill="none"
																	stroke="currentColor"
																	stroke-width="3"
																	viewBox="0 0 24 24">
																	<path
																		d="M5 13l4 4L19 7"
																		stroke-linecap="round"
																		stroke-linejoin="round"
																	/>
																</svg>
															</Show>
														</div>
													</button>
												);
											}}
										</For>
									</div>
								</div>
							</Show>

							{/* Stream Controls */}
							<div class="flex items-center space-x-3">
								<Show
									fallback={
										<Button
											disabled={streamStatus() === "stopping"}
											onClick={handleStopStream}
											variant="danger">
											{streamStatus() === "stopping"
												? t("stream.controls.stopping")
												: t("stream.controls.stopStream")}
										</Button>
									}
									when={streamStatus() === "offline"}>
									<Button
										disabled={
											streamStatus() === "starting" || !encoderConnected()
										}
										onClick={handleStartStream}
										title={
											!encoderConnected()
												? t("stream.encoder.connectFirst")
												: undefined
										}
										variant="success">
										{streamStatus() === "starting"
											? t("stream.controls.starting")
											: t("stream.controls.goLive")}
									</Button>
								</Show>
								<Button
									onClick={() => setShowStreamKey(!showStreamKey())}
									variant="secondary">
									{showStreamKey()
										? t("stream.key.hide")
										: t("stream.key.show")}
								</Button>
							</div>

							{/* Stream Key Display */}
							<StreamKeyDisplay userId={user().id} visible={showStreamKey()} />
						</div>
					</Show>
				</Card>

				{/* Platform Connections */}
				<PlatformConnectionsCard
					availablePlatforms={availablePlatforms}
					connectedPlatforms={connectedPlatforms()}
					isLoading={streamingAccounts.isLoading()}
					platformStatuses={streamActor.platformStatuses()}
					streamingAccounts={streamingAccounts.data()}
					userId={user().id}
				/>
			</div>
		</Show>
	);
}
