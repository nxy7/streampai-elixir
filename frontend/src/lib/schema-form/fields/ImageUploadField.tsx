import { Show, createSignal, createUniqueId, onCleanup } from "solid-js";
import { text } from "~/design-system/design-system";
import type { IntrospectedField } from "../types";

/**
 * Result of a successful image upload containing the file ID and preview URL.
 */
export interface ImageUploadResult {
	fileId: string;
	previewUrl: string;
}

/**
 * Async function that handles the 2-step file upload process.
 * Should:
 * 1. Request presigned URL from backend
 * 2. Upload file to storage
 * 3. Confirm upload with backend
 * 4. Return fileId and previewUrl
 */
export type ImageUploadHandler = (file: File) => Promise<ImageUploadResult>;

interface ImageUploadFieldProps {
	field: IntrospectedField;
	/** Current value - either a file ID string or null */
	value: string | null;
	/** Called with the file ID after successful upload */
	onChange: (value: string | null) => void;
	disabled?: boolean;
	/** The upload handler that performs the 2-step upload */
	onUpload?: ImageUploadHandler;
	/** Current preview URL for displaying the image */
	previewUrl?: string | null;
	/** Called when preview URL changes (after upload or clear) */
	onPreviewChange?: (url: string | null) => void;
	/** Accepted file types (default: "image/*") */
	accept?: string;
	/** Maximum file size in bytes (default: 2MB) */
	maxSize?: number;
}

export const ImageUploadField = (props: ImageUploadFieldProps) => {
	const fieldId = createUniqueId();
	const [isUploading, setIsUploading] = createSignal(false);
	const [error, setError] = createSignal<string | null>(null);
	const [localPreview, setLocalPreview] = createSignal<string | null>(null);
	let fileInputRef: HTMLInputElement | undefined;

	const previewUrl = () => props.previewUrl ?? localPreview();
	const accept = () => props.accept ?? "image/*";
	const maxSize = () => props.maxSize ?? 2 * 1024 * 1024; // 2MB default

	// Clean up object URLs on unmount to prevent memory leaks
	onCleanup(() => {
		const preview = localPreview();
		if (preview?.startsWith("blob:")) {
			URL.revokeObjectURL(preview);
		}
	});

	const handleFileSelect = async (e: Event) => {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];

		if (!file) return;

		// Validate file type
		if (!file.type.startsWith("image/")) {
			setError("Please select an image file");
			return;
		}

		// Validate file size
		if (file.size > maxSize()) {
			const maxMB = Math.round(maxSize() / (1024 * 1024));
			setError(`File size must be less than ${maxMB}MB`);
			return;
		}

		setError(null);

		// Create local preview immediately
		const objectUrl = URL.createObjectURL(file);
		setLocalPreview(objectUrl);

		// If no upload handler, just store the preview
		if (!props.onUpload) {
			return;
		}

		setIsUploading(true);

		try {
			const result = await props.onUpload(file);
			// Revoke the temporary object URL now that we have the real URL
			URL.revokeObjectURL(objectUrl);
			props.onChange(result.fileId);
			props.onPreviewChange?.(result.previewUrl);
			setLocalPreview(result.previewUrl);
		} catch (err) {
			console.error("Image upload error:", err);
			setError(err instanceof Error ? err.message : "Upload failed");
			// Clear the preview on error
			setLocalPreview(null);
			URL.revokeObjectURL(objectUrl);
		} finally {
			setIsUploading(false);
			// Reset the input so the same file can be selected again
			if (fileInputRef) {
				fileInputRef.value = "";
			}
		}
	};

	const handleClear = () => {
		props.onChange(null);
		props.onPreviewChange?.(null);
		setLocalPreview(null);
		setError(null);
		if (fileInputRef) {
			fileInputRef.value = "";
		}
	};

	return (
		<div class="space-y-2">
			<label class={text.label} for={fieldId}>
				{props.field.label}
			</label>

			<div class="flex items-start gap-4">
				{/* Preview area */}
				<div class="relative h-24 w-32 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
					<Show
						fallback={
							<div class="flex h-full w-full items-center justify-center text-gray-400">
								<svg
									aria-label="Image placeholder"
									class="h-8 w-8"
									fill="none"
									role="img"
									stroke="currentColor"
									viewBox="0 0 24 24">
									<path
										d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
									/>
								</svg>
							</div>
						}
						when={previewUrl()}>
						<img
							alt={props.field.label}
							class="h-full w-full object-cover"
							src={previewUrl() ?? ""}
						/>
					</Show>

					{/* Loading overlay */}
					<Show when={isUploading()}>
						<div class="absolute inset-0 flex items-center justify-center bg-black/50">
							<div class="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
						</div>
					</Show>
				</div>

				{/* Controls */}
				<div class="flex flex-1 flex-col gap-2">
					<input
						accept={accept()}
						class="hidden"
						disabled={props.disabled || isUploading()}
						id={fieldId}
						onChange={handleFileSelect}
						ref={fileInputRef}
						type="file"
					/>

					<div class="flex gap-2">
						<button
							class={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
								props.disabled || isUploading()
									? "cursor-not-allowed bg-gray-100 text-gray-400"
									: "bg-purple-600 text-white hover:bg-purple-700"
							}`}
							disabled={props.disabled || isUploading()}
							onClick={() => fileInputRef?.click()}
							type="button">
							{isUploading()
								? "Uploading..."
								: previewUrl()
									? "Change"
									: "Upload"}
						</button>

						<Show when={previewUrl() && !isUploading()}>
							<button
								class="rounded-lg border border-gray-300 px-3 py-1.5 text-gray-700 text-sm transition-colors hover:bg-gray-50"
								disabled={props.disabled}
								onClick={handleClear}
								type="button">
								Remove
							</button>
						</Show>
					</div>

					<Show when={props.field.meta.description}>
						<p class="text-gray-500 text-xs">{props.field.meta.description}</p>
					</Show>

					<Show when={error()}>
						<p class="text-red-600 text-xs">{error()}</p>
					</Show>
				</div>
			</div>
		</div>
	);
};
