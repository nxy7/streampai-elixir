import { For, Show, createSignal } from "solid-js";
import { Skeleton } from "~/design-system";
import { badge, button, input, text } from "~/design-system/design-system";
import { useTranslation } from "~/i18n";
import {
	STREAM_CATEGORIES,
	type StreamKeyData,
	type StreamMetadata,
} from "./types";

interface PreStreamSettingsProps {
	metadata: StreamMetadata;
	onMetadataChange: (metadata: StreamMetadata) => void;
	streamKeyData?: StreamKeyData;
	onShowStreamKey?: () => void;
	showStreamKey?: boolean;
	isLoadingStreamKey?: boolean;
	onCopyStreamKey?: () => void;
	copied?: boolean;
}

export function PreStreamSettings(props: PreStreamSettingsProps) {
	const { t } = useTranslation();
	const [tagInput, setTagInput] = createSignal("");

	const addTag = () => {
		const tag = tagInput().trim();
		if (tag && !props.metadata.tags.includes(tag)) {
			props.onMetadataChange({
				...props.metadata,
				tags: [...props.metadata.tags, tag],
			});
			setTagInput("");
		}
	};

	const removeTag = (tagToRemove: string) => {
		props.onMetadataChange({
			...props.metadata,
			tags: props.metadata.tags.filter((t) => t !== tagToRemove),
		});
	};

	return (
		<div class="space-y-6">
			{/* Stream Configuration Header */}
			<div class="flex items-center justify-between">
				<div>
					<h2 class={text.h2}>Stream Settings</h2>
					<p class={text.muted}>Configure your stream before going live</p>
				</div>
				<span class={badge.neutral}>OFFLINE</span>
			</div>

			{/* Stream Metadata Form */}
			<div class="space-y-4">
				{/* Title */}
				<div>
					<label class={text.label}>
						Stream Title
						<input
							class={`${input.text} mt-1`}
							onInput={(e) =>
								props.onMetadataChange({
									...props.metadata,
									title: e.currentTarget.value,
								})
							}
							placeholder={t("stream.streamTitlePlaceholder")}
							type="text"
							value={props.metadata.title}
						/>
					</label>
				</div>

				{/* Description */}
				<div>
					<label class={text.label}>
						Description
						<textarea
							class={`${input.textarea} mt-1`}
							onInput={(e) =>
								props.onMetadataChange({
									...props.metadata,
									description: e.currentTarget.value,
								})
							}
							placeholder={t("stream.streamDescriptionPlaceholder")}
							rows="3"
							value={props.metadata.description}
						/>
					</label>
				</div>

				{/* Category */}
				<div>
					<label class={text.label}>
						Category
						<select
							class={`${input.select} mt-1`}
							onChange={(e) =>
								props.onMetadataChange({
									...props.metadata,
									category: e.currentTarget.value,
								})
							}
							value={props.metadata.category}>
							<option value="">Select a category...</option>
							<For each={STREAM_CATEGORIES}>
								{(cat) => <option value={cat}>{cat}</option>}
							</For>
						</select>
					</label>
				</div>

				{/* Tags */}
				<div>
					<label class={text.label}>
						Tags
						<div class="mt-1 flex gap-2">
							<input
								class={input.text}
								onInput={(e) => setTagInput(e.currentTarget.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										addTag();
									}
								}}
								placeholder={t("stream.addTagPlaceholder")}
								type="text"
								value={tagInput()}
							/>
							<button class={button.secondary} onClick={addTag} type="button">
								Add
							</button>
						</div>
					</label>
					<Show when={props.metadata.tags.length > 0}>
						<div class="mt-2 flex flex-wrap gap-2">
							<For each={props.metadata.tags}>
								{(tag) => (
									<span class="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-purple-800 text-sm">
										{tag}
										<button
											class="hover:text-purple-600"
											onClick={() => removeTag(tag)}
											type="button">
											x
										</button>
									</span>
								)}
							</For>
						</div>
					</Show>
				</div>

				{/* Thumbnail placeholder */}
				<div>
					<span class={text.label}>Thumbnail</span>
					<div class="mt-1 flex h-32 items-center justify-center rounded-lg border-2 border-gray-300 border-dashed bg-gray-50">
						<div class="text-center text-gray-500">
							<div class="mb-1 text-2xl">[img]</div>
							<div class="text-sm">Click to upload thumbnail</div>
						</div>
					</div>
				</div>
			</div>

			{/* Stream Key Info Box */}
			<div class="rounded-lg border border-amber-200 bg-amber-50 p-4">
				<div class="flex items-start gap-3">
					<div class="text-amber-600 text-xl">[i]</div>
					<div class="flex-1">
						<h4 class="font-medium text-amber-800">
							Ready to start streaming?
						</h4>
						<p class="mt-1 text-amber-700 text-sm">
							Configure your streaming software (OBS, Streamlabs, etc.) with the
							stream key below, then start streaming to go live.
						</p>
						<button
							class={`${button.secondary} mt-3`}
							onClick={props.onShowStreamKey}
							type="button">
							{props.showStreamKey ? "Hide Stream Key" : "Show Stream Key"}
						</button>
					</div>
				</div>
			</div>

			{/* Stream Key Display */}
			<Show when={props.showStreamKey}>
				<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
					<Show
						fallback={
							<div class="space-y-3">
								<Skeleton class="h-4 w-24" />
								<Skeleton class="h-5 w-full" />
								<Skeleton class="h-5 w-3/4" />
							</div>
						}
						when={!props.isLoadingStreamKey}>
						<Show
							fallback={
								<div class="text-center text-gray-500">
									No stream key available
								</div>
							}
							when={props.streamKeyData}>
							{(data) => (
								<>
									<div class="mb-3 flex items-center justify-between">
										<span class="font-medium text-gray-700 text-sm">
											Stream Key
										</span>
										<button
											class={`${button.ghost} text-sm`}
											onClick={props.onCopyStreamKey}
											type="button">
											{props.copied ? "Copied!" : "Copy Key"}
										</button>
									</div>
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
								</>
							)}
						</Show>
					</Show>
				</div>
			</Show>
		</div>
	);
}
