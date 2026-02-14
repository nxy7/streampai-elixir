import Hls from "hls.js";
import { Show, createEffect, createSignal, onCleanup } from "solid-js";
import { useTranslation } from "~/i18n";

interface LiveInputPreviewProps {
	previewHlsUrl: string | null;
	encoderConnected: boolean;
}

/**
 * Shows a live preview of the stream using hls.js.
 * Works with both Cloudflare HLS manifests and self-hosted Membrane HLS output.
 * When the encoder is not connected, shows a placeholder message.
 */
export function LiveInputPreview(props: LiveInputPreviewProps) {
	const { t } = useTranslation();
	let videoRef: HTMLVideoElement | undefined;
	let hlsInstance: Hls | null = null;
	const [loading, setLoading] = createSignal(false);

	const shouldPlay = () => props.encoderConnected && !!props.previewHlsUrl;

	function destroyHls() {
		if (hlsInstance) {
			hlsInstance.destroy();
			hlsInstance = null;
		}
		setLoading(false);
	}

	createEffect(() => {
		const url = props.previewHlsUrl;
		const connected = props.encoderConnected;

		if (!connected || !url || !videoRef) {
			destroyHls();
			return;
		}

		// Native HLS support (Safari)
		if (videoRef.canPlayType("application/vnd.apple.mpegurl")) {
			destroyHls();
			videoRef.src = url;
			videoRef.play().catch(() => {});
			return;
		}

		// hls.js for other browsers
		if (Hls.isSupported()) {
			destroyHls();
			setLoading(true);
			// The pipeline needs a few seconds to produce the first HLS segments
			// after the encoder connects. By default hls.js does NOT retry on 404
			// (4xx treated as unrecoverable), so we use a custom shouldRetry.
			const retryOn404 = {
				maxNumRetry: 30,
				retryDelayMs: 2000,
				maxRetryDelayMs: 8000,
				shouldRetry: () => true,
			};
			const hls = new Hls({
				liveSyncDurationCount: 3,
				liveMaxLatencyDurationCount: 6,
				enableWorker: true,
				manifestLoadPolicy: {
					default: {
						maxTimeToFirstByteMs: 10000,
						maxLoadTimeMs: 20000,
						timeoutRetry: retryOn404,
						errorRetry: retryOn404,
					},
				},
			});
			hls.loadSource(url);
			hls.attachMedia(videoRef);
			hls.on(Hls.Events.MANIFEST_PARSED, () => {
				setLoading(false);
				videoRef?.play().catch(() => {});
			});
			hlsInstance = hls;
		}
	});

	onCleanup(() => destroyHls());

	return (
		<div
			class="relative aspect-video w-full overflow-hidden rounded-lg"
			style="background-color: var(--color-surface-inset)">
			<Show
				fallback={
					<div class="flex h-full flex-col items-center justify-center gap-3 text-neutral-400">
						<svg
							aria-hidden="true"
							class="h-12 w-12"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							viewBox="0 0 24 24">
							<path
								d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
						<p class="text-sm">{t("stream.preview.noInput")}</p>
					</div>
				}
				when={shouldPlay()}>
				<Show when={loading()}>
					<div class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-neutral-400">
						<svg
							aria-hidden="true"
							class="h-8 w-8 animate-spin"
							fill="none"
							viewBox="0 0 24 24">
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							/>
							<path
								class="opacity-75"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
								fill="currentColor"
							/>
						</svg>
						<p class="text-sm">{t("stream.preview.loading")}</p>
					</div>
				</Show>
				<video
					autoplay
					class="h-full w-full object-contain"
					muted
					playsinline
					ref={videoRef}
				/>
			</Show>
		</div>
	);
}
