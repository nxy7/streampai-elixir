import { For, Show, createSignal } from "solid-js";
import { input } from "~/design-system/design-system";
import { useTranslation } from "~/i18n";

export interface StreamSettingsFormValues {
  title: string;
  description: string;
  tags: string[];
  thumbnailFileId?: string;
  thumbnailUrl?: string;
}

interface StreamSettingsFormProps {
  /** Current values to populate the form */
  values: StreamSettingsFormValues;
  /** Called on every field change (for controlled/live updates) */
  onChange?: (field: keyof StreamSettingsFormValues, value: unknown) => void;
  /** Called when save button is clicked (for batch updates) */
  onSave?: (values: StreamSettingsFormValues) => void;
  /** Whether to show the save button */
  showSave?: boolean;
  /** Custom save button label (defaults to stream.settings.save) */
  saveLabel?: string;
}

export function StreamSettingsForm(props: StreamSettingsFormProps) {
  const { t } = useTranslation();

  // Internal signals for form state — synced from props on mount
  const [title, setTitle] = createSignal(props.values.title);
  const [description, setDescription] = createSignal(props.values.description);
  const [tags, setTags] = createSignal<string[]>([...props.values.tags]);
  const [thumbnailUrl, setThumbnailUrl] = createSignal<string | undefined>(
    props.values.thumbnailUrl,
  );
  const [thumbnailFileId, setThumbnailFileId] = createSignal<
    string | undefined
  >(props.values.thumbnailFileId);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = createSignal(false);
  const [thumbnailError, setThumbnailError] = createSignal<string | null>(null);

  const updateField = (
    field: keyof StreamSettingsFormValues,
    value: unknown,
  ) => {
    props.onChange?.(field, value);
  };

  const handleTitleInput = (value: string) => {
    setTitle(value);
    updateField("title", value);
  };

  const handleDescriptionInput = (value: string) => {
    setDescription(value);
    updateField("description", value);
  };

  const handleAddTag = (tag: string) => {
    const updated = [...tags(), tag];
    setTags(updated);
    updateField("tags", updated);
  };

  const handleRemoveTag = (index: number) => {
    const updated = tags().filter((_, i) => i !== index);
    setTags(updated);
    updateField("tags", updated);
  };

  const handleThumbnailUpload = async (file: File) => {
    setIsUploadingThumbnail(true);
    setThumbnailError(null);
    try {
      const { requestFileUpload, confirmFileUpload } = await import(
        "~/sdk/ash_rpc"
      );
      const reqResult = await requestFileUpload({
        input: {
          filename: file.name,
          contentType: file.type,
          fileType: "thumbnail",
          estimatedSize: file.size,
        },
        fields: ["id", "uploadUrl", "uploadHeaders", "maxSize"],
        fetchOptions: { credentials: "include" },
      });
      if (!reqResult.success) throw new Error("Failed to get upload URL");
      if (!reqResult.data?.uploadUrl) throw new Error("No upload URL returned");

      const { id: fileId, uploadUrl, uploadHeaders } = reqResult.data;
      const headers: Record<string, string> = {};
      if (uploadHeaders) {
        for (const header of uploadHeaders) {
          headers[header.key as string] = header.value as string;
        }
      }
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers,
        body: file,
      });
      if (!uploadRes.ok)
        throw new Error(`Upload failed: ${uploadRes.statusText}`);

      const confirmRes = await confirmFileUpload({
        identity: fileId,
        fields: ["id", "url"],
        fetchOptions: { credentials: "include" },
      });
      if (!confirmRes.success) throw new Error("Failed to confirm upload");

      setThumbnailFileId(fileId);
      setThumbnailUrl(confirmRes.data?.url ?? undefined);
      updateField("thumbnailFileId", fileId);
      updateField("thumbnailUrl", confirmRes.data?.url ?? undefined);
    } catch (err) {
      console.error("Thumbnail upload error:", err);
      setThumbnailError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploadingThumbnail(false);
    }
  };

  const handleRemoveThumbnail = () => {
    setThumbnailUrl(undefined);
    setThumbnailFileId(undefined);
    updateField("thumbnailFileId", undefined);
    updateField("thumbnailUrl", undefined);
  };

  const handleSave = () => {
    props.onSave?.({
      title: title(),
      description: description(),
      tags: tags(),
      thumbnailFileId: thumbnailFileId(),
      thumbnailUrl: thumbnailUrl(),
    });
  };

  return (
    <div class="space-y-4">
      {/* Title */}
      <div>
        <label class="block font-medium text-neutral-700 text-sm">
          {t("stream.controls.streamTitle")}
          <input
            class={`${input.text} mt-1 w-full !bg-surface-inset`}
            onInput={(e) => handleTitleInput(e.currentTarget.value)}
            placeholder={t("stream.streamTitlePlaceholder")}
            type="text"
            value={title()}
          />
        </label>
      </div>

      {/* Description */}
      <div>
        <label class="block font-medium text-neutral-700 text-sm">
          {t("stream.controls.description")}
          <textarea
            class={`${input.text} mt-1 w-full resize-none !bg-surface-inset`}
            onInput={(e) => handleDescriptionInput(e.currentTarget.value)}
            placeholder={t("stream.streamDescriptionPlaceholder")}
            rows="3"
            value={description()}
          />
        </label>
      </div>

      {/* Tags */}
      <div>
        {/* biome-ignore lint/a11y/noLabelWithoutControl: label wraps the control */}
        <label class="block font-medium text-neutral-700 text-sm">
          {t("stream.controls.tags")}
        </label>
        <div class="mt-1 flex flex-wrap gap-2">
          <For each={tags()}>
            {(tag, i) => (
              <span class="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-0.5 font-medium text-primary-hover text-xs">
                {tag}
                <button
                  class="ml-0.5 text-primary-light hover:text-primary-800"
                  onClick={() => handleRemoveTag(i())}
                  type="button"
                >
                  &times;
                </button>
              </span>
            )}
          </For>
        </div>
        <input
          class={`${input.text} mt-2 w-full !bg-surface-inset`}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.currentTarget.value.trim()) {
              e.preventDefault();
              handleAddTag(e.currentTarget.value.trim());
              e.currentTarget.value = "";
            }
          }}
          placeholder={t("stream.controls.tagsPlaceholder")}
          type="text"
        />
      </div>

      {/* Thumbnail */}
      <div>
        {/* biome-ignore lint/a11y/noLabelWithoutControl: label wraps the control */}
        <label class="block font-medium text-neutral-700 text-sm">
          {t("stream.controls.thumbnail")}
        </label>
        <div class="mt-1">
          <Show
            fallback={
              <label
                class={`flex cursor-pointer items-center justify-center rounded-lg border-2 border-neutral-300 border-dashed p-4 transition-colors ${isUploadingThumbnail() ? "pointer-events-none opacity-50" : "hover:border-primary hover:bg-primary-50"}`}
              >
                <div class="text-center">
                  <Show
                    fallback={
                      <svg
                        aria-hidden="true"
                        class="mx-auto h-8 w-8 text-neutral-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                        />
                      </svg>
                    }
                    when={isUploadingThumbnail()}
                  >
                    <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary-light border-t-transparent" />
                  </Show>
                  <p class="mt-1 text-neutral-500 text-xs">
                    {isUploadingThumbnail()
                      ? t("stream.upload.uploading")
                      : t("stream.upload.clickToUpload")}
                  </p>
                </div>
                <input
                  accept="image/*"
                  class="hidden"
                  disabled={isUploadingThumbnail()}
                  onChange={(e) => {
                    const file = e.currentTarget.files?.[0];
                    if (file) handleThumbnailUpload(file);
                  }}
                  type="file"
                />
              </label>
            }
            when={thumbnailUrl()}
          >
            <div class="relative inline-block">
              <img
                alt="Thumbnail"
                class="h-24 w-auto rounded-lg object-cover"
                src={thumbnailUrl()}
              />
              <button
                aria-label={t("common.delete")}
                class="absolute -top-1.5 -right-1.5 rounded-full bg-red-500 p-0.5 text-white shadow hover:bg-red-600"
                onClick={handleRemoveThumbnail}
                type="button"
              >
                <svg
                  aria-hidden="true"
                  class="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M6 18L18 6M6 6l12 12"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                  />
                </svg>
              </button>
            </div>
          </Show>
          <Show when={thumbnailError()}>
            <p class="mt-1 text-red-600 text-xs">{thumbnailError()}</p>
          </Show>
        </div>
      </div>

      {/* Save Button */}
      <Show when={props.showSave}>
        <div class="flex justify-end">
          <button
            class="rounded-lg bg-primary px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-primary-hover"
            onClick={handleSave}
            type="button"
          >
            {props.saveLabel ?? t("stream.settings.save")}
          </button>
        </div>
      </Show>
    </div>
  );
}
