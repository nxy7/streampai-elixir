import { Show, createSignal } from "solid-js";
import { Button } from "~/design-system";
import { useTranslation } from "~/i18n";
import {
	confirmFileUpload,
	requestFileUpload,
	updateAvatar,
} from "~/sdk/ash_rpc";

interface AvatarUploadSectionProps {
	userId: string;
	currentAvatarUrl: string | null | undefined;
	displayName: string | null | undefined;
}

export default function AvatarUploadSection(props: AvatarUploadSectionProps) {
	const { t } = useTranslation();
	const [isUploading, setIsUploading] = createSignal(false);
	const [uploadError, setUploadError] = createSignal<string | null>(null);
	const [uploadSuccess, setUploadSuccess] = createSignal(false);
	let fileInputRef: HTMLInputElement | undefined;

	const handleAvatarUpload = async (file: File) => {
		setIsUploading(true);
		setUploadError(null);
		setUploadSuccess(false);

		try {
			const requestResult = await requestFileUpload({
				input: {
					filename: file.name,
					contentType: file.type,
					fileType: "avatar",
					estimatedSize: file.size,
				},
				fields: ["id", "uploadUrl", "uploadHeaders", "maxSize"],
				fetchOptions: { credentials: "include" },
			});

			if (!requestResult.success) {
				throw new Error(
					requestResult.errors?.[0]?.message || "Failed to get upload URL",
				);
			}

			if (!requestResult.data) {
				throw new Error("Failed to get upload URL");
			}

			const { id: fileId, uploadUrl, uploadHeaders } = requestResult.data;

			if (!uploadUrl) {
				throw new Error("No upload URL returned");
			}

			const headers: Record<string, string> = {};
			if (uploadHeaders) {
				for (const header of uploadHeaders) {
					headers[header.key as string] = header.value as string;
				}
			}

			const uploadResponse = await fetch(uploadUrl, {
				method: "PUT",
				headers,
				body: file,
			});

			if (!uploadResponse.ok) {
				throw new Error(`Upload failed: ${uploadResponse.statusText}`);
			}

			const confirmResult = await confirmFileUpload({
				identity: fileId,
				fetchOptions: { credentials: "include" },
			});

			if (!confirmResult.success) {
				throw new Error(
					confirmResult.errors?.[0]?.message || "Failed to confirm upload",
				);
			}

			const updateResult = await updateAvatar({
				identity: props.userId,
				input: { fileId },
				fields: ["id", "displayAvatar"],
				fetchOptions: { credentials: "include" },
			});

			if (!updateResult.success) {
				throw new Error(
					updateResult.errors[0]?.message || "Failed to update avatar",
				);
			}

			setUploadSuccess(true);
		} catch (error) {
			console.error("Avatar upload error:", error);
			setUploadError(error instanceof Error ? error.message : "Upload failed");
		} finally {
			setIsUploading(false);
		}
	};

	const handleFileSelect = (e: Event) => {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			if (!file.type.startsWith("image/")) {
				setUploadError("Please select an image file");
				return;
			}
			if (file.size > 5 * 1024 * 1024) {
				setUploadError("File size must be less than 5MB");
				return;
			}
			handleAvatarUpload(file);
		}
	};

	return (
		<div>
			<label
				class="mb-2 block font-medium text-neutral-700 text-sm"
				for="avatar-upload">
				{t("settings.profileAvatar")}
			</label>
			<div class="flex items-center space-x-4">
				<div class="relative h-20 w-20">
					<div class="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-linear-to-r from-primary-light to-secondary">
						<Show
							fallback={
								<span class="font-bold text-2xl text-white">
									{props.displayName?.[0]?.toUpperCase() || "U"}
								</span>
							}
							when={props.currentAvatarUrl}>
							<img
								alt="Avatar"
								class="h-full w-full object-cover"
								src={props.currentAvatarUrl ?? ""}
							/>
						</Show>
					</div>
					<Show when={isUploading()}>
						<div class="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
							<div class="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
						</div>
					</Show>
				</div>
				<div class="flex-1">
					<input
						accept="image/*"
						class="hidden"
						id="avatar-upload"
						onChange={handleFileSelect}
						ref={fileInputRef}
						type="file"
					/>
					<Button
						disabled={isUploading()}
						onClick={() => fileInputRef?.click()}
						type="button"
						variant="primary">
						{isUploading()
							? t("settings.uploading")
							: t("settings.uploadNewAvatar")}
					</Button>
					<p class="mt-1 text-neutral-500 text-xs">
						{t("settings.avatarHelp")}
					</p>
					<Show when={uploadError()}>
						<p class="mt-1 text-red-600 text-xs">{uploadError()}</p>
					</Show>
					<Show when={uploadSuccess()}>
						<p class="mt-1 text-green-600 text-xs">
							{t("settings.avatarUpdated")}
						</p>
					</Show>
				</div>
			</div>
		</div>
	);
}
