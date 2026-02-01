import { Show, createEffect, createSignal } from "solid-js";
import { Skeleton } from "~/design-system";
import Button from "~/design-system/Button";
import { useTranslation } from "~/i18n";
import { getStreamKey, regenerateStreamKey } from "~/sdk/ash_rpc";

type StreamKeyData = {
	rtmpsUrl: string;
	rtmpsStreamKey: string;
	srtUrl?: string;
	webRtcUrl?: string;
};

interface StreamKeyDisplayProps {
	userId: string;
	visible: boolean;
}

export function StreamKeyDisplay(props: StreamKeyDisplayProps) {
	const { t } = useTranslation();
	const [streamKeyData, setStreamKeyData] = createSignal<StreamKeyData | null>(
		null,
	);
	const [isLoadingStreamKey, setIsLoadingStreamKey] = createSignal(false);
	const [isRegenerating, setIsRegenerating] = createSignal(false);
	const [streamKeyError, setStreamKeyError] = createSignal<string | null>(null);
	const [copied, setCopied] = createSignal(false);

	createEffect(() => {
		if (
			props.visible &&
			!streamKeyData() &&
			!isLoadingStreamKey() &&
			!streamKeyError()
		) {
			fetchStreamKey();
		}
	});

	const fetchStreamKey = async () => {
		setIsLoadingStreamKey(true);
		setStreamKeyError(null);
		try {
			const result = await getStreamKey({
				input: { userId: props.userId, orientation: "horizontal" },
				fields: ["data"],
				fetchOptions: { credentials: "include" },
			});
			if (result.success && result.data) {
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
		if (!confirm(t("stream.key.regenerateConfirm"))) {
			return;
		}
		setIsRegenerating(true);
		setStreamKeyError(null);
		try {
			const result = await regenerateStreamKey({
				identity: { userId: props.userId, orientation: "horizontal" },
				fields: ["data"],
				fetchOptions: { credentials: "include" },
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

	return (
		<Show when={props.visible}>
			<div class="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
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
									onClick={fetchStreamKey}
									size="sm"
									variant="ghost">
									{t("stream.key.retry")}
								</Button>
							</div>
						}
						when={!streamKeyError()}>
						<div class="mb-3 flex items-center justify-between">
							<span class="font-medium text-neutral-700 text-sm">
								{t("stream.key.label")}
							</span>
							<div class="flex items-center space-x-2">
								<Button onClick={handleCopyStreamKey} size="sm" variant="ghost">
									{copied() ? t("stream.key.copied") : t("stream.key.copy")}
								</Button>
								<Button
									class="text-red-600 hover:bg-red-50"
									disabled={isRegenerating()}
									onClick={handleRegenerateStreamKey}
									size="sm"
									variant="ghost">
									{isRegenerating()
										? t("stream.key.regenerating")
										: t("stream.key.regenerate")}
								</Button>
							</div>
						</div>

						<Show when={streamKeyData()}>
							{(data) => (
								<>
									<div class="mb-2">
										<span class="mb-1 block text-neutral-500 text-xs">
											{t("stream.key.rtmpUrl")}
										</span>
										<code class="block rounded bg-white px-2 py-1 font-mono text-neutral-900 text-sm">
											{data().rtmpsUrl}
										</code>
									</div>
									<div class="mb-3">
										<span class="mb-1 block text-neutral-500 text-xs">
											{t("stream.key.label")}
										</span>
										<code class="block rounded bg-white px-2 py-1 font-mono text-neutral-600 text-sm">
											{data().rtmpsStreamKey}
										</code>
									</div>

									<Show when={data().srtUrl}>
										<div class="mb-2 border-neutral-200 border-t pt-2">
											<span class="mb-1 block text-neutral-500 text-xs">
												{t("stream.key.srtUrl")}
											</span>
											<code class="block rounded bg-white px-2 py-1 font-mono text-neutral-600 text-xs">
												{data().srtUrl}
											</code>
										</div>
									</Show>

									<p class="mt-3 text-neutral-500 text-xs">
										{t("stream.key.instructions")}
									</p>
								</>
							)}
						</Show>
					</Show>
				</Show>
			</div>
		</Show>
	);
}
