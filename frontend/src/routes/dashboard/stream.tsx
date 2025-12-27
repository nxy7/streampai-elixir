import { Title } from "@solidjs/meta";
import { createSignal, For, Show } from "solid-js";
import Button from "~/components/ui/Button";
import { Skeleton } from "~/components/ui";
import { getLoginUrl, useCurrentUser } from "~/lib/auth";
import { apiRoutes } from "~/lib/constants";
import { badge, button, card, text } from "~/styles/design-system";

// Skeleton for stream page loading state
function StreamPageSkeleton() {
	return (
		<div class="mx-auto max-w-7xl space-y-6">
			{/* Stream Status Card skeleton */}
			<div class={card.default}>
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
			</div>

			{/* Platform Connections skeleton */}
			<div class={card.default}>
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
			</div>
		</div>
	);
}

type PlatformConnection = {
	platform: string;
	connected: boolean;
	username?: string;
};

type StreamStatus = "offline" | "starting" | "live" | "stopping";

export default function Stream() {
	const { user, isLoading } = useCurrentUser();
	const [streamStatus, setStreamStatus] = createSignal<StreamStatus>("offline");
	const [showStreamKey, setShowStreamKey] = createSignal(false);
	const [platformConnections, setPlatformConnections] = createSignal<
		PlatformConnection[]
	>([
		{ platform: "Twitch", connected: false },
		{ platform: "YouTube", connected: false },
		{ platform: "Facebook", connected: false },
		{ platform: "Kick", connected: false },
	]);

	const [streamMetadata, setStreamMetadata] = createSignal({
		title: "",
		description: "",
	});

	const handleStartStream = () => {
		setStreamStatus("starting");
		setTimeout(() => setStreamStatus("live"), 1500);
	};

	const handleStopStream = () => {
		setStreamStatus("stopping");
		setTimeout(() => setStreamStatus("offline"), 1500);
	};

	const togglePlatformConnection = (platform: string) => {
		setPlatformConnections((prev) =>
			prev.map((conn) =>
				conn.platform === platform
					? { ...conn, connected: !conn.connected }
					: conn,
			),
		);
	};

	return (
		<>
			<Title>Stream - Streampai</Title>
			<Show when={!isLoading()} fallback={<StreamPageSkeleton />}>
				<Show
					when={user()}
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
									href={getLoginUrl()}
									class="inline-block rounded-lg bg-linear-to-r from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white transition-all hover:from-purple-600 hover:to-pink-600">
									Sign In
								</a>
							</div>
						</div>
					}>
					<div class="mx-auto max-w-7xl space-y-6">
						{/* Stream Status Card */}
						<div class={card.default}>
							<div class="mb-6 flex items-center justify-between">
								<div>
									<h2 class={text.h2}>Stream Controls</h2>
									<p class={text.muted}>Manage your multi-platform stream</p>
								</div>
								<Show
									when={streamStatus() === "live"}
									fallback={
										<span class={badge.neutral}>
											{streamStatus().toUpperCase()}
										</span>
									}>
									<span class={badge.success}>
										<span class="mr-2 animate-pulse">●</span> LIVE
									</span>
								</Show>
							</div>

							{/* Stream Metadata */}
							<div class="mb-6 space-y-4">
								<div>
									<label class="block font-medium text-gray-700 text-sm">
										Stream Title
										<input
											type="text"
											class="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-purple-500"
											placeholder="Enter your stream title..."
											value={streamMetadata().title}
											onInput={(e) =>
												setStreamMetadata((prev) => ({
													...prev,
													title: e.currentTarget.value,
												}))
											}
										/>
									</label>
								</div>
								<div>
									<label class="block font-medium text-gray-700 text-sm">
										Description
										<textarea
											class="mt-2 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-purple-500"
											rows="3"
											placeholder="Describe your stream..."
											value={streamMetadata().description}
											onInput={(e) =>
												setStreamMetadata((prev) => ({
													...prev,
													description: e.currentTarget.value,
												}))
											}
										/>
									</label>
								</div>
							</div>

							{/* Stream Controls */}
							<div class="flex items-center space-x-3">
								<Show
									when={streamStatus() === "offline"}
									fallback={
										<button
											type="button"
											class={button.danger}
											onClick={handleStopStream}
											disabled={streamStatus() === "stopping"}>
											{streamStatus() === "stopping"
												? "Stopping..."
												: "Stop Stream"}
										</button>
									}>
									<button
										type="button"
										class={button.success}
										onClick={handleStartStream}
										disabled={streamStatus() === "starting"}>
										{streamStatus() === "starting" ? "Starting..." : "Go Live"}
									</button>
								</Show>
								<button
									type="button"
									class={button.secondary}
									onClick={() => setShowStreamKey(!showStreamKey())}>
									{showStreamKey() ? "Hide" : "Show"} Stream Key
								</button>
							</div>

							{/* Stream Key Display */}
							<Show when={showStreamKey()}>
								<div class="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
									<div class="mb-2 flex items-center justify-between">
										<span class="font-medium text-gray-700 text-sm">
											Stream Key
										</span>
										<button type="button" class={`${button.ghost} text-sm`}>
											Copy
										</button>
									</div>
									<code class="font-mono text-gray-900 text-sm">
										rtmps://live.streampai.com/live
									</code>
									<div class="mt-2">
										<code class="font-mono text-gray-600 text-sm">
											sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
										</code>
									</div>
									<p class="mt-2 text-gray-500 text-xs">
										Use this RTMP URL and stream key in your streaming software
										(OBS, Streamlabs, etc.)
									</p>
								</div>
							</Show>
						</div>

						{/* Platform Connections */}
						<div class={card.default}>
							<div class="mb-6">
								<h3 class={text.h3}>Platform Connections</h3>
								<p class={text.muted}>
									Connect your streaming platforms to multicast
								</p>
							</div>

							<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
								<For each={platformConnections()}>
									{(conn) => (
										<div class="flex items-center justify-between rounded-lg border border-gray-200 p-4">
											<div class="flex items-center space-x-3">
												<div
													class={
														"flex h-10 w-10 items-center justify-center rounded-lg" +
														(conn.platform === "Twitch"
															? "bg-purple-100"
															: conn.platform === "YouTube"
																? "bg-red-100"
																: conn.platform === "Facebook"
																	? "bg-blue-100"
																	: "bg-green-100")
													}>
													<svg
														aria-hidden="true"
														class={
															"h-5 w-5" +
															(conn.platform === "Twitch"
																? "text-purple-600"
																: conn.platform === "YouTube"
																	? "text-red-600"
																	: conn.platform === "Facebook"
																		? "text-blue-600"
																		: "text-green-600")
														}
														fill="currentColor"
														viewBox="0 0 24 24">
														<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
													</svg>
												</div>
												<div>
													<div class="font-medium text-gray-900">
														{conn.platform}
													</div>
													<Show
														when={conn.connected}
														fallback={
															<span class="text-gray-500 text-xs">
																Not connected
															</span>
														}>
														<span class="text-green-600 text-xs">
															Connected
														</span>
													</Show>
												</div>
											</div>
											<Show
												when={conn.connected}
												fallback={
													<Button
														as="a"
														href={apiRoutes.streaming.connect(conn.platform)}
														size="sm">
														Connect
													</Button>
												}>
												<Button
													variant="secondary"
													size="sm"
													onClick={() =>
														togglePlatformConnection(conn.platform)
													}>
													Disconnect
												</Button>
											</Show>
										</div>
									)}
								</For>
							</div>
						</div>

						{/* Stream Statistics (Placeholder) */}
						<Show when={streamStatus() === "live"}>
							<div class={card.default}>
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
							</div>
						</Show>
					</div>
				</Show>
			</Show>
		</>
	);
}
