import { Show } from "solid-js";
import { useTranslation } from "~/i18n";

interface LiveInputPreviewProps {
  liveInputUid: string | null;
  encoderConnected: boolean;
}

/**
 * Shows a live preview of the Cloudflare Live Input stream.
 * Uses the Cloudflare Stream iframe player with LL-HLS for lowest latency (~3s).
 * When the encoder is not connected, shows a placeholder message.
 */
export function LiveInputPreview(props: LiveInputPreviewProps) {
  const { t } = useTranslation();

  const iframeSrc = () => {
    const uid = props.liveInputUid;
    if (!uid) return null;
    return `https://videodelivery.net/${uid}/iframe?autoplay=true&muted=true&loop=false&controls=false&letterboxColor=transparent`;
  };

  return (
    <div
      class="relative aspect-video w-full overflow-hidden rounded-lg"
      style="background-color: var(--color-surface-inset)"
    >
      <Show
        fallback={
          <div class="flex h-full flex-col items-center justify-center gap-3 text-neutral-400">
            <svg
              aria-hidden="true"
              class="h-12 w-12"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              viewBox="0 0 24 24"
            >
              <path
                d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <p class="text-sm">{t("stream.preview.noInput")}</p>
          </div>
        }
        when={props.encoderConnected && iframeSrc()}
      >
        <iframe
          allow="autoplay; fullscreen"
          class="h-full w-full"
          src={iframeSrc() as string}
          style={{ border: "none" }}
          title="Stream Preview"
        />
      </Show>
    </div>
  );
}
