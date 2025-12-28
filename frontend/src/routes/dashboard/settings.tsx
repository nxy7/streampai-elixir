import { Title } from "@solidjs/meta";
import { createEffect, createMemo, createSignal, For, Show } from "solid-js";
import LanguageSwitcher from "~/components/LanguageSwitcher";
import StreamingAccountStats from "~/components/StreamingAccountStats";
import { Skeleton } from "~/components/ui";
import Button from "~/components/ui/Button";
import { useTranslation } from "~/i18n";
import { getLoginUrl, useCurrentUser } from "~/lib/auth";
import { apiRoutes } from "~/lib/constants";
import {
	useStreamingAccounts,
	useUserPreferencesForUser,
	useUserRolesData,
} from "~/lib/useElectric";
import {
	acceptRoleInvitation,
	confirmFileUpload,
	declineRoleInvitation,
	disconnectStreamingAccount,
	getUserByName,
	getUserInfo,
	inviteUserRole,
	refreshStreamingAccountStats,
	requestFileUpload,
	revokeUserRole,
	saveDonationSettings,
	toggleEmailNotifications,
	updateAvatar,
	updateName,
} from "~/sdk/ash_rpc";

type UserInfo = { id: string; name: string; displayAvatar: string | null };

// Skeleton for settings page
function SettingsPageSkeleton() {
	return (
		<div class="mx-auto max-w-6xl space-y-6">
			{/* Plan Banner skeleton */}
			<Skeleton class="h-24 w-full rounded-lg" />

			{/* Account Settings skeleton */}
			<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<Skeleton class="mb-6 h-6 w-36" />
				<div class="space-y-6">
					{/* Profile section */}
					<div class="flex items-center space-x-4">
						<Skeleton class="h-16 w-16 shrink-0" circle />
						<div class="flex-1 space-y-2">
							<Skeleton class="h-4 w-32" />
							<Skeleton class="h-9 w-32 rounded-lg" />
						</div>
					</div>
					{/* Display Name */}
					<div class="space-y-2">
						<Skeleton class="h-4 w-24" />
						<div class="flex gap-3">
							<Skeleton class="h-10 flex-1 rounded-lg" />
							<Skeleton class="h-10 w-24 rounded-lg" />
						</div>
					</div>
					{/* Notifications */}
					<div class="flex items-center justify-between">
						<div class="space-y-1">
							<Skeleton class="h-5 w-36" />
							<Skeleton class="h-4 w-64" />
						</div>
						<Skeleton class="h-6 w-12 rounded-full" />
					</div>
				</div>
			</div>

			{/* Donation Settings skeleton */}
			<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<Skeleton class="mb-6 h-6 w-36" />
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<For each={[1, 2, 3, 4]}>
						{() => (
							<div>
								<Skeleton class="mb-2 h-4 w-28" />
								<Skeleton class="h-10 w-full rounded-lg" />
							</div>
						)}
					</For>
				</div>
				<Skeleton class="mt-4 h-10 w-36 rounded-lg" />
			</div>

			{/* Platform Connections skeleton */}
			<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<Skeleton class="mb-6 h-6 w-44" />
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<For each={[1, 2, 3, 4]}>
						{() => (
							<div class="flex items-center justify-between rounded-lg border border-gray-200 p-4">
								<div class="flex items-center space-x-3">
									<Skeleton class="h-10 w-10 rounded-lg" />
									<Skeleton class="h-5 w-20" />
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

export default function Settings() {
	const { t } = useTranslation();
	const { user, isLoading } = useCurrentUser();
	const prefs = useUserPreferencesForUser(() => user()?.id);
	const rolesData = useUserRolesData(() => user()?.id);
	const streamingAccounts = useStreamingAccounts(() => user()?.id);
	const [isUploading, setIsUploading] = createSignal(false);
	const [uploadError, setUploadError] = createSignal<string | null>(null);
	const [uploadSuccess, setUploadSuccess] = createSignal(false);
	let fileInputRef: HTMLInputElement | undefined;

	const [minAmount, setMinAmount] = createSignal<number | null>(null);
	const [maxAmount, setMaxAmount] = createSignal<number | null>(null);
	const [currency, setCurrency] = createSignal("USD");
	const [defaultVoice, setDefaultVoice] = createSignal("random");
	const [isSavingSettings, setIsSavingSettings] = createSignal(false);
	const [saveError, setSaveError] = createSignal<string | null>(null);
	const [saveSuccess, setSaveSuccess] = createSignal(false);

	const [displayName, setDisplayName] = createSignal("");
	const [isUpdatingName, setIsUpdatingName] = createSignal(false);
	const [nameError, setNameError] = createSignal<string | null>(null);
	const [nameSuccess, setNameSuccess] = createSignal(false);

	const [isTogglingNotifications, setIsTogglingNotifications] =
		createSignal(false);

	const [inviteUsername, setInviteUsername] = createSignal("");
	const [inviteRoleType, setInviteRoleType] = createSignal<
		"moderator" | "manager"
	>("moderator");
	const [isInviting, setIsInviting] = createSignal(false);
	const [inviteError, setInviteError] = createSignal<string | null>(null);
	const [inviteSuccess, setInviteSuccess] = createSignal(false);
	const [processingRoleId, setProcessingRoleId] = createSignal<string | null>(
		null,
	);

	const [userInfoCache, setUserInfoCache] = createSignal<Map<string, UserInfo>>(
		new Map(),
	);

	const fetchUserInfo = async (userId: string): Promise<UserInfo | null> => {
		const cached = userInfoCache().get(userId);
		if (cached) return cached;

		try {
			const result = await getUserInfo({
				input: { id: userId },
				fields: ["id", "name", "displayAvatar"],
				fetchOptions: { credentials: "include" },
			});

			if (result.success && result.data) {
				const info: UserInfo = {
					id: result.data.id,
					name: result.data.name,
					displayAvatar: result.data.displayAvatar,
				};
				setUserInfoCache((prev) => new Map(prev).set(userId, info));
				return info;
			}
		} catch (e) {
			console.error("Failed to fetch user info:", e);
		}
		return null;
	};

	const pendingInvitations = createMemo(
		() => rolesData.data().pendingInvitations,
	);
	const myRoles = createMemo(() => rolesData.data().myAcceptedRoles);
	const rolesIGranted = createMemo(() => rolesData.data().rolesIGranted);
	const pendingInvitationsSent = createMemo(
		() => rolesData.data().pendingInvitationsSent,
	);
	const loadingRoles = createMemo(() => rolesData.isLoading());

	createEffect(() => {
		const allRoles = [
			...pendingInvitations(),
			...myRoles(),
			...rolesIGranted(),
			...pendingInvitationsSent(),
		];
		const userIds = new Set<string>();

		for (const role of allRoles) {
			userIds.add(role.user_id);
			userIds.add(role.granter_id);
		}

		for (const userId of userIds) {
			if (!userInfoCache().has(userId)) {
				fetchUserInfo(userId);
			}
		}
	});

	const getUserInfo_cached = (userId: string): UserInfo | null => {
		return userInfoCache().get(userId) || null;
	};

	const [formInitialized, setFormInitialized] = createSignal(false);

	createEffect(() => {
		const data = prefs.data();
		if (data && !formInitialized()) {
			setMinAmount(data.min_donation_amount);
			setMaxAmount(data.max_donation_amount);
			setCurrency(data.donation_currency || "USD");
			setDefaultVoice(data.default_voice || "random");
			setDisplayName(data.name || "");
			setFormInitialized(true);
		}
	});

	const handleSaveDonationSettings = async (e: Event) => {
		e.preventDefault();
		const currentUser = user();
		if (!currentUser) return;

		setIsSavingSettings(true);
		setSaveError(null);
		setSaveSuccess(false);

		try {
			const result = await saveDonationSettings({
				identity: currentUser.id,
				input: {
					minAmount: minAmount() ?? undefined,
					maxAmount: maxAmount() ?? undefined,
					currency: currency(),
					defaultVoice: defaultVoice(),
				},
				fetchOptions: { credentials: "include" },
			});

			if (!result.success) {
				throw new Error(result.errors[0]?.message || "Failed to save settings");
			}

			setSaveSuccess(true);
			setTimeout(() => setSaveSuccess(false), 3000);
		} catch (error) {
			console.error("Save donation settings error:", error);
			setSaveError(
				error instanceof Error ? error.message : "Failed to save settings",
			);
		} finally {
			setIsSavingSettings(false);
		}
	};

	const handleUpdateName = async () => {
		const currentUser = user();
		if (!currentUser) return;

		const name = displayName().trim();
		if (!name) {
			setNameError("Name is required");
			return;
		}

		setIsUpdatingName(true);
		setNameError(null);
		setNameSuccess(false);

		try {
			const result = await updateName({
				identity: currentUser.id,
				input: { name },
				fields: ["id", "name"],
				fetchOptions: { credentials: "include" },
			});

			if (!result.success) {
				throw new Error(result.errors[0]?.message || "Failed to update name");
			}

			setNameSuccess(true);
			setDisplayName("");
			setTimeout(() => setNameSuccess(false), 3000);
		} catch (error) {
			console.error("Update name error:", error);
			setNameError(
				error instanceof Error ? error.message : "Failed to update name",
			);
		} finally {
			setIsUpdatingName(false);
		}
	};

	const handleToggleEmailNotifications = async () => {
		const currentUser = user();
		if (!currentUser) return;

		setIsTogglingNotifications(true);

		try {
			const result = await toggleEmailNotifications({
				identity: currentUser.id,
				fetchOptions: { credentials: "include" },
			});

			if (!result.success) {
				throw new Error(
					result.errors[0]?.message || "Failed to toggle notifications",
				);
			}
		} catch (error) {
			console.error("Toggle notifications error:", error);
		} finally {
			setIsTogglingNotifications(false);
		}
	};

	const handleInviteUser = async (e: Event) => {
		e.preventDefault();
		const currentUser = user();
		if (!currentUser) return;

		const username = inviteUsername().trim();
		if (!username) {
			setInviteError("Please enter a username");
			return;
		}

		setIsInviting(true);
		setInviteError(null);
		setInviteSuccess(false);

		try {
			const lookupResult = await getUserByName({
				input: { name: username },
				fields: ["id", "name", "displayAvatar"],
				fetchOptions: { credentials: "include" },
			});

			if (!lookupResult.success || !lookupResult.data) {
				throw new Error(`User "${username}" not found`);
			}

			const targetUser = lookupResult.data;

			if (targetUser.id === currentUser.id) {
				throw new Error("You cannot invite yourself");
			}

			const result = await inviteUserRole({
				input: {
					userId: targetUser.id,
					granterId: currentUser.id,
					roleType: inviteRoleType(),
				},
				fields: ["id", "roleType", "roleStatus"],
				fetchOptions: { credentials: "include" },
			});

			if (!result.success) {
				throw new Error(
					result.errors[0]?.message || "Failed to send invitation",
				);
			}

			setInviteSuccess(true);
			setInviteUsername("");
			setTimeout(() => setInviteSuccess(false), 3000);
		} catch (error) {
			console.error("Invite error:", error);
			setInviteError(
				error instanceof Error ? error.message : "Failed to send invitation",
			);
		} finally {
			setIsInviting(false);
		}
	};

	const handleAcceptInvitation = async (roleId: string) => {
		setProcessingRoleId(roleId);
		try {
			const result = await acceptRoleInvitation({
				identity: roleId,
				fields: ["id", "roleStatus"],
				fetchOptions: { credentials: "include" },
			});

			if (!result.success) {
				throw new Error(
					result.errors[0]?.message || "Failed to accept invitation",
				);
			}
		} catch (error) {
			console.error("Accept invitation error:", error);
		} finally {
			setProcessingRoleId(null);
		}
	};

	const handleDeclineInvitation = async (roleId: string) => {
		setProcessingRoleId(roleId);
		try {
			const result = await declineRoleInvitation({
				identity: roleId,
				fields: ["id", "roleStatus"],
				fetchOptions: { credentials: "include" },
			});

			if (!result.success) {
				throw new Error(
					result.errors[0]?.message || "Failed to decline invitation",
				);
			}
		} catch (error) {
			console.error("Decline invitation error:", error);
		} finally {
			setProcessingRoleId(null);
		}
	};

	const handleRevokeRole = async (roleId: string) => {
		if (!confirm("Are you sure you want to revoke this role?")) return;

		setProcessingRoleId(roleId);
		try {
			const result = await revokeUserRole({
				identity: roleId,
				fields: ["id", "revokedAt"],
				fetchOptions: { credentials: "include" },
			});

			if (!result.success) {
				throw new Error(result.errors[0]?.message || "Failed to revoke role");
			}
		} catch (error) {
			console.error("Revoke role error:", error);
		} finally {
			setProcessingRoleId(null);
		}
	};

	const formatRoleType = (roleType: string) => {
		return roleType.charAt(0).toUpperCase() + roleType.slice(1);
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString();
	};

	const handleAvatarUpload = async (file: File) => {
		const currentUser = user();
		if (!currentUser) return;

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
				identity: currentUser.id,
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

	const availablePlatforms = [
		{
			name: "YouTube",
			platform: "google" as const,
			targetPlatform: "youtube" as const,
			color: "from-red-600 to-red-700",
		},
		{
			name: "Twitch",
			platform: "twitch" as const,
			targetPlatform: "twitch" as const,
			color: "from-purple-600 to-purple-700",
		},
	];

	const connectedPlatforms = createMemo(() => {
		const accounts = streamingAccounts.data();
		return new Set(accounts.map((a) => a.platform));
	});

	const handleRefreshStats = async (
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

		const result = await refreshStreamingAccountStats({
			identity: { userId: currentUser.id, platform },
			fields: [
				"platform",
				"sponsorCount",
				"viewsLast30d",
				"followerCount",
				"uniqueViewersLast30d",
				"statsLastRefreshedAt",
			],
			fetchOptions: { credentials: "include" },
		});

		if (!result.success) {
			console.error("Failed to refresh stats:", result.errors);
		}
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

		const result = await disconnectStreamingAccount({
			identity: { userId: currentUser.id, platform },
			fetchOptions: { credentials: "include" },
		});

		if (!result.success) {
			console.error("Failed to disconnect account:", result.errors);
		}
	};

	const currencies = ["USD", "EUR", "GBP", "CAD", "AUD"];

	return (
		<>
			<Title>Settings - Streampai</Title>
			<Show when={!isLoading()} fallback={<SettingsPageSkeleton />}>
				<Show
					when={user()}
					fallback={
						<div class="flex min-h-screen items-center justify-center bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900">
							<div class="py-12 text-center">
								<h2 class="mb-4 font-bold text-2xl text-white">
									{t("dashboard.notAuthenticated")}
								</h2>
								<p class="mb-6 text-gray-300">
									{t("dashboard.signInToAccess")}
								</p>
								<a
									href={getLoginUrl()}
									class="inline-block rounded-lg bg-linear-to-r from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white transition-all hover:from-purple-600 hover:to-pink-600">
									{t("nav.signIn")}
								</a>
							</div>
						</div>
					}>
					<div class="mx-auto max-w-6xl space-y-6">
						<div class="rounded-lg bg-linear-to-r from-purple-600 to-pink-600 p-6 text-white shadow-sm">
							<div class="flex items-center justify-between">
								<div>
									<h3 class="mb-2 font-bold text-xl">
										{t("dashboard.freePlan")}
									</h3>
									<p class="text-purple-100">{t("settings.getStarted")}</p>
								</div>
								<button
									type="button"
									class="rounded-lg bg-white px-6 py-2 font-semibold text-purple-600 transition-colors hover:bg-purple-50">
									{t("settings.upgradeToPro")}
								</button>
							</div>
						</div>

						<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
							<h3 class="mb-6 font-medium text-gray-900 text-lg">
								{t("settings.accountSettings")}
							</h3>
							<div class="space-y-6">
								<div>
									<label class="block font-medium text-gray-700 text-sm">
										{t("settings.email")}
										<input
											type="email"
											value={user()?.email || ""}
											class="mt-2 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2"
											readonly
										/>
									</label>
									<p class="mt-1 text-gray-500 text-xs">
										{t("settings.emailCannotChange")}
									</p>
								</div>

								<div>
									<label class="block font-medium text-gray-700 text-sm">
										{t("settings.displayName")}
										<div class="relative mt-2">
											<input
												type="text"
												value={displayName() || prefs.data()?.name || ""}
												onInput={(e) => setDisplayName(e.currentTarget.value)}
												placeholder={t("settings.displayNamePlaceholder")}
												class="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10"
											/>
										</div>
									</label>
									<p class="mt-1 text-gray-500 text-xs">
										{t("settings.displayNameHelp")}
									</p>
									<div class="mt-3 flex items-center gap-3">
										<button
											type="button"
											onClick={handleUpdateName}
											disabled={isUpdatingName()}
											class={`rounded-lg bg-purple-600 px-4 py-2 text-sm text-white transition-colors ${
												isUpdatingName()
													? "cursor-not-allowed opacity-50"
													: "hover:bg-purple-700"
											}`}>
											{isUpdatingName()
												? t("settings.updating")
												: t("settings.updateName")}
										</button>
										<Show when={nameSuccess()}>
											<span class="text-green-600 text-sm">
												{t("settings.nameUpdated")}
											</span>
										</Show>
										<Show when={nameError()}>
											<span class="text-red-600 text-sm">{nameError()}</span>
										</Show>
									</div>
								</div>

								<div>
									<label
										for="avatar-upload"
										class="mb-2 block font-medium text-gray-700 text-sm">
										{t("settings.profileAvatar")}
									</label>
									<div class="flex items-center space-x-4">
										<div class="relative h-20 w-20">
											<div class="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-linear-to-r from-purple-500 to-pink-500">
												<Show
													when={prefs.data()?.avatar_url}
													fallback={
														<span class="font-bold text-2xl text-white">
															{prefs.data()?.name?.[0]?.toUpperCase() || "U"}
														</span>
													}>
													<img
														src={prefs.data()?.avatar_url ?? ""}
														alt="Avatar"
														class="h-full w-full object-cover"
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
												ref={fileInputRef}
												type="file"
												accept="image/*"
												class="hidden"
												id="avatar-upload"
												onChange={handleFileSelect}
											/>
											<button
												type="button"
												onClick={() => fileInputRef?.click()}
												disabled={isUploading()}
												class={`rounded-lg bg-purple-600 px-4 py-2 text-sm text-white transition-colors ${
													isUploading()
														? "cursor-not-allowed opacity-50"
														: "hover:bg-purple-700"
												}`}>
												{isUploading()
													? t("settings.uploading")
													: t("settings.uploadNewAvatar")}
											</button>
											<p class="mt-1 text-gray-500 text-xs">
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

								<div>
									<p class="mb-2 block font-medium text-gray-700 text-sm">
										{t("settings.streamingPlatforms")}
									</p>

									<Show
										when={!streamingAccounts.isLoading()}
										fallback={
											<div class="space-y-2">
												<For each={[1, 2]}>
													{() => (
														<div class="flex items-center justify-between rounded-lg border border-gray-200 p-3">
															<div class="flex items-center space-x-3">
																<Skeleton class="h-10 w-10 rounded-lg" />
																<div class="space-y-1">
																	<Skeleton class="h-4 w-20" />
																	<Skeleton class="h-3 w-16" />
																</div>
															</div>
															<Skeleton class="h-8 w-20 rounded-lg" />
														</div>
													)}
												</For>
											</div>
										}>
										<Show when={streamingAccounts.data().length > 0}>
											<div class="mb-4 space-y-3">
												<For each={streamingAccounts.data()}>
													{(account) => (
														<StreamingAccountStats
															data={{
																platform: account.platform,
																accountName:
																	account.extra_data?.name ||
																	account.extra_data?.nickname ||
																	account.platform,
																accountImage: account.extra_data?.image || null,
																sponsorCount: account.sponsor_count,
																viewsLast30d: account.views_last_30d,
																followerCount: account.follower_count,
																statsLastRefreshedAt:
																	account.stats_last_refreshed_at,
															}}
															onRefresh={() =>
																handleRefreshStats(account.platform)
															}
															onDisconnect={() =>
																handleDisconnectAccount(account.platform)
															}
														/>
													)}
												</For>
											</div>
										</Show>

										<div class="space-y-2">
											<For each={availablePlatforms}>
												{(platform) => (
													<Show
														when={
															!connectedPlatforms().has(platform.targetPlatform)
														}>
														<div class="flex items-center justify-between rounded-lg border border-gray-200 p-3">
															<div class="flex items-center space-x-3">
																<div
																	class={`h-10 w-10 bg-linear-to-r ${platform.color} flex items-center justify-center rounded-lg`}>
																	<span class="font-bold text-sm text-white">
																		{platform.name[0]}
																	</span>
																</div>
																<div>
																	<p class="font-medium text-gray-900">
																		{platform.name}
																	</p>
																	<p class="text-gray-500 text-sm">
																		{t("settings.notConnected")}
																	</p>
																</div>
															</div>
															<Button
																as="a"
																href={apiRoutes.streaming.connect(
																	platform.platform,
																)}
																size="sm">
																{t("settings.connect")}
															</Button>
														</div>
													</Show>
												)}
											</For>
										</div>
									</Show>
								</div>
							</div>
						</div>

						<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
							<h3 class="mb-6 font-medium text-gray-900 text-lg">
								{t("settings.language")}
							</h3>
							<div class="space-y-4">
								<div>
									<label class="block font-medium text-gray-700 text-sm">
										{t("settings.language")}
										<div class="mt-2">
											<LanguageSwitcher class="w-full md:w-48" />
										</div>
									</label>
									<p class="mt-1 text-gray-500 text-xs">
										{t("settings.languageDescription")}
									</p>
								</div>
							</div>
						</div>

						<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
							<h3 class="mb-6 font-medium text-gray-900 text-lg">
								{t("settings.donationPage")}
							</h3>
							<div class="space-y-4">
								<div>
									<label class="block font-medium text-gray-700 text-sm">
										{t("settings.publicDonationUrl")}
										<div class="mt-2 flex items-center space-x-3">
											<input
												type="text"
												value={`${window.location.origin}/u/${
													prefs.data()?.name || ""
												}`}
												class="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2"
												readonly
											/>
											<button
												type="button"
												onClick={() => {
													navigator.clipboard.writeText(
														`${window.location.origin}/u/${
															prefs.data()?.name || ""
														}`,
													);
												}}
												class="rounded-lg bg-purple-600 px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-purple-700">
												{t("settings.copyUrl")}
											</button>
										</div>
									</label>
									<p class="mt-1 text-gray-500 text-xs">
										{t("settings.donationUrlHelp")}
									</p>
								</div>

								<div class="flex items-center justify-between rounded-lg border bg-gray-50 p-3">
									<div class="flex items-center space-x-3">
										<div class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-linear-to-r from-purple-500 to-pink-500">
											<Show
												when={prefs.data()?.avatar_url}
												fallback={
													<span class="font-bold text-white">
														{prefs.data()?.name?.[0]?.toUpperCase() || "U"}
													</span>
												}>
												<img
													src={prefs.data()?.avatar_url ?? ""}
													alt="Avatar"
													class="h-10 w-10 rounded-full object-cover"
												/>
											</Show>
										</div>
										<div>
											<h4 class="font-medium text-gray-900">
												{t("settings.support")} {prefs.data()?.name}
											</h4>
											<p class="text-gray-600 text-sm">
												{t("settings.publicDonationPage")}
											</p>
										</div>
									</div>
									<a
										href={`/u/${prefs.data()?.name || ""}`}
										target="_blank"
										rel="noreferrer"
										class="font-medium text-purple-600 text-sm hover:text-purple-700">
										{t("settings.preview")} →
									</a>
								</div>
							</div>
						</div>

						<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
							<h3 class="mb-6 font-medium text-gray-900 text-lg">
								{t("settings.donationSettings")}
							</h3>
							<form class="space-y-4" onSubmit={handleSaveDonationSettings}>
								<div class="grid gap-4 md:grid-cols-3">
									<div>
										<label class="block font-medium text-gray-700 text-sm">
											{t("settings.minimumAmount")}
											<div class="relative mt-2">
												<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
													<span class="text-gray-500 text-sm">
														{currency()}
													</span>
												</div>
												<input
													type="number"
													placeholder={t("settings.noMinimum")}
													value={minAmount() ?? ""}
													onInput={(e) => {
														const val = e.currentTarget.value;
														setMinAmount(val ? parseInt(val, 10) : null);
													}}
													class="w-full rounded-lg border border-gray-300 py-2 pr-3 pl-12 text-sm focus:border-transparent focus:ring-2 focus:ring-purple-500"
												/>
											</div>
										</label>
										<p class="mt-1 text-gray-500 text-xs">
											{t("settings.leaveEmptyNoMin")}
										</p>
									</div>

									<div>
										<label class="block font-medium text-gray-700 text-sm">
											{t("settings.maximumAmount")}
											<div class="relative mt-2">
												<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
													<span class="text-gray-500 text-sm">
														{currency()}
													</span>
												</div>
												<input
													type="number"
													placeholder={t("settings.noMaximum")}
													value={maxAmount() ?? ""}
													onInput={(e) => {
														const val = e.currentTarget.value;
														setMaxAmount(val ? parseInt(val, 10) : null);
													}}
													class="w-full rounded-lg border border-gray-300 py-2 pr-3 pl-12 text-sm focus:border-transparent focus:ring-2 focus:ring-purple-500"
												/>
											</div>
										</label>
										<p class="mt-1 text-gray-500 text-xs">
											{t("settings.leaveEmptyNoMax")}
										</p>
									</div>

									<div>
										<label class="block font-medium text-gray-700 text-sm">
											{t("settings.currency")}
											<select
												value={currency()}
												onChange={(e) => setCurrency(e.currentTarget.value)}
												class="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-purple-500">
												<For each={currencies}>
													{(curr) => <option value={curr}>{curr}</option>}
												</For>
											</select>
										</label>
									</div>
								</div>

								<div>
									<label class="block font-medium text-gray-700 text-sm">
										{t("settings.defaultTtsVoice")}
										<select
											value={defaultVoice()}
											onChange={(e) => setDefaultVoice(e.currentTarget.value)}
											class="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-purple-500">
											<option value="random">
												{t("settings.randomVoice")}
											</option>
											<option value="google_en_us_male">
												Google TTS - English (US) Male
											</option>
											<option value="google_en_us_female">
												Google TTS - English (US) Female
											</option>
										</select>
									</label>
									<p class="mt-1 text-gray-500 text-xs">
										{t("settings.voiceHelp")}
									</p>
								</div>

								<div class="flex items-start space-x-3 rounded-lg bg-blue-50 p-3">
									<svg
										aria-hidden="true"
										class="mt-0.5 h-5 w-5 shrink-0 text-blue-500"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
									<div class="text-blue-800 text-sm">
										<p class="mb-1 font-medium">
											{t("settings.donationLimitsInfo")}
										</p>
										<ul class="space-y-1 text-blue-700">
											<li>• {t("settings.donationLimitsItem1")}</li>
											<li>• {t("settings.donationLimitsItem2")}</li>
											<li>• {t("settings.donationLimitsItem3")}</li>
											<li>• {t("settings.donationLimitsItem4")}</li>
										</ul>
									</div>
								</div>

								<div class="flex items-center gap-4 pt-4">
									<button
										type="submit"
										disabled={isSavingSettings()}
										class={`rounded-lg bg-purple-600 px-4 py-2 font-medium text-sm text-white transition-colors ${
											isSavingSettings()
												? "cursor-not-allowed opacity-50"
												: "hover:bg-purple-700"
										}`}>
										{isSavingSettings()
											? t("settings.saving")
											: t("settings.saveDonationSettings")}
									</button>
									<Show when={saveSuccess()}>
										<span class="text-green-600 text-sm">
											{t("settings.settingsSaved")}
										</span>
									</Show>
									<Show when={saveError()}>
										<span class="text-red-600 text-sm">{saveError()}</span>
									</Show>
								</div>
							</form>
						</div>

						<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
							<h3 class="mb-6 font-medium text-gray-900 text-lg">
								{t("settings.roleInvitations")}
							</h3>
							<Show
								when={!loadingRoles() && pendingInvitations().length > 0}
								fallback={
									<div class="py-8 text-center text-gray-500">
										<svg
											aria-hidden="true"
											class="mx-auto mb-3 h-12 w-12 text-gray-400"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
											/>
										</svg>
										<p class="text-sm">{t("settings.noPendingInvitations")}</p>
										<p class="mt-1 text-gray-400 text-xs">
											{t("settings.invitationsHelp")}
										</p>
									</div>
								}>
								<div class="space-y-3">
									<For each={pendingInvitations()}>
										{(invitation) => {
											const granterInfo = () =>
												getUserInfo_cached(invitation.granter_id);
											return (
												<div class="flex items-center justify-between rounded-lg border border-gray-200 p-4">
													<div class="flex items-center gap-3">
														<div class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-linear-to-r from-purple-500 to-pink-500">
															<Show
																when={granterInfo()?.displayAvatar}
																fallback={
																	<span class="font-bold text-white">
																		{granterInfo()?.name?.[0]?.toUpperCase() ||
																			"?"}
																	</span>
																}>
																<img
																	src={granterInfo()?.displayAvatar ?? ""}
																	alt={granterInfo()?.name || "User"}
																	class="h-full w-full object-cover"
																/>
															</Show>
														</div>
														<div>
															<p class="font-medium text-gray-900">
																{granterInfo()?.name || "Loading..."}
															</p>
															<p class="text-gray-500 text-sm">
																{t("settings.invitedYouAs")}{" "}
																<span class="font-medium text-purple-600">
																	{formatRoleType(invitation.role_type)}
																</span>
															</p>
															<p class="text-gray-400 text-xs">
																{formatDate(invitation.granted_at)}
															</p>
														</div>
													</div>
													<div class="flex gap-2">
														<button
															type="button"
															onClick={() =>
																handleAcceptInvitation(invitation.id)
															}
															disabled={processingRoleId() === invitation.id}
															class="rounded-lg bg-green-600 px-3 py-1.5 font-medium text-sm text-white transition-colors hover:bg-green-700 disabled:opacity-50">
															{processingRoleId() === invitation.id
																? "..."
																: t("settings.accept")}
														</button>
														<button
															type="button"
															onClick={() =>
																handleDeclineInvitation(invitation.id)
															}
															disabled={processingRoleId() === invitation.id}
															class="rounded-lg bg-gray-200 px-3 py-1.5 font-medium text-gray-700 text-sm transition-colors hover:bg-gray-300 disabled:opacity-50">
															{t("settings.decline")}
														</button>
													</div>
												</div>
											);
										}}
									</For>
								</div>
							</Show>
						</div>

						<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
							<h3 class="mb-6 font-medium text-gray-900 text-lg">
								{t("settings.myRolesInChannels")}
							</h3>
							<Show
								when={!loadingRoles() && myRoles().length > 0}
								fallback={
									<div class="py-8 text-center text-gray-500">
										<svg
											aria-hidden="true"
											class="mx-auto mb-3 h-12 w-12 text-gray-400"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
											/>
										</svg>
										<p class="text-sm">{t("settings.noRolesInChannels")}</p>
										<p class="mt-1 text-gray-400 text-xs">
											{t("settings.rolesGrantedHelp")}
										</p>
									</div>
								}>
								<div class="space-y-3">
									<For each={myRoles()}>
										{(role) => {
											const granterInfo = () =>
												getUserInfo_cached(role.granter_id);
											return (
												<div class="flex items-center justify-between rounded-lg border border-gray-200 p-4">
													<div class="flex items-center gap-3">
														<div class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-linear-to-r from-purple-500 to-pink-500">
															<Show
																when={granterInfo()?.displayAvatar}
																fallback={
																	<span class="font-bold text-white">
																		{granterInfo()?.name?.[0]?.toUpperCase() ||
																			"?"}
																	</span>
																}>
																<img
																	src={granterInfo()?.displayAvatar ?? ""}
																	alt={granterInfo()?.name || "User"}
																	class="h-full w-full object-cover"
																/>
															</Show>
														</div>
														<div>
															<p class="font-medium text-gray-900">
																{granterInfo()?.name || "Loading..."}
																{t("settings.channel")}
															</p>
															<p class="text-gray-500 text-sm">
																<span class="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 font-medium text-purple-800 text-xs">
																	{formatRoleType(role.role_type)}
																</span>
															</p>
															<p class="mt-1 text-gray-400 text-xs">
																{t("settings.since")}{" "}
																{formatDate(
																	role.accepted_at || role.granted_at,
																)}
															</p>
														</div>
													</div>
												</div>
											);
										}}
									</For>
								</div>
							</Show>
						</div>

						<div class="relative">
							<div class="absolute inset-0 flex items-center">
								<div class="w-full border-gray-300 border-t"></div>
							</div>
							<div class="relative flex justify-center text-sm">
								<span class="bg-gray-50 px-2 text-gray-500">
									{t("settings.channelManagement")}
								</span>
							</div>
						</div>

						<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
							<h3 class="mb-6 font-medium text-gray-900 text-lg">
								{t("settings.roleManagement")}
							</h3>

							<div class="mb-6 rounded-lg bg-gray-50 p-4">
								<h4 class="mb-3 font-medium text-gray-900">
									{t("settings.inviteUser")}
								</h4>
								<form class="space-y-3" onSubmit={handleInviteUser}>
									<div class="grid grid-cols-1 gap-3 md:grid-cols-3">
										<div>
											<input
												type="text"
												placeholder={t("settings.enterUsername")}
												value={inviteUsername()}
												onInput={(e) =>
													setInviteUsername(e.currentTarget.value)
												}
												class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
											/>
										</div>
										<div>
											<select
												value={inviteRoleType()}
												onChange={(e) =>
													setInviteRoleType(
														e.currentTarget.value as "moderator" | "manager",
													)
												}
												class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
												<option value="moderator">
													{t("settings.moderator")}
												</option>
												<option value="manager">{t("settings.manager")}</option>
											</select>
										</div>
										<div>
											<button
												type="submit"
												disabled={isInviting()}
												class={`w-full rounded-lg bg-purple-600 px-4 py-2 font-medium text-sm text-white transition-colors ${
													isInviting()
														? "cursor-not-allowed opacity-50"
														: "hover:bg-purple-700"
												}`}>
												{isInviting()
													? t("settings.sending")
													: t("settings.sendInvitation")}
											</button>
										</div>
									</div>
									<Show when={inviteError()}>
										<p class="text-red-600 text-sm">{inviteError()}</p>
									</Show>
									<Show when={inviteSuccess()}>
										<p class="text-green-600 text-sm">
											{t("settings.invitationSent")}
										</p>
									</Show>
								</form>
								<div class="mt-3 rounded-lg bg-blue-50 p-3">
									<div class="flex">
										<svg
											aria-hidden="true"
											class="mr-2 h-5 w-5 shrink-0 text-blue-500"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
										<div class="text-blue-800 text-sm">
											<p class="font-medium">{t("settings.rolePermissions")}</p>
											<ul class="mt-1 space-y-1 text-blue-700 text-xs">
												<li>
													• <strong>{t("settings.moderator")}:</strong>{" "}
													{t("settings.moderatorDesc")}
												</li>
												<li>
													• <strong>{t("settings.manager")}:</strong>{" "}
													{t("settings.managerDesc")}
												</li>
											</ul>
										</div>
									</div>
								</div>
							</div>

							<Show
								when={!loadingRoles() && pendingInvitationsSent().length > 0}>
								<div class="mb-6 space-y-3">
									<h4 class="font-medium text-gray-700 text-sm">
										{t("settings.pendingInvitations")}
									</h4>
									<For each={pendingInvitationsSent()}>
										{(role) => {
											const userInfo = () => getUserInfo_cached(role.user_id);
											return (
												<div class="flex items-center justify-between rounded-lg border border-yellow-200 bg-yellow-50 p-4">
													<div class="flex items-center gap-3">
														<div class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-linear-to-r from-yellow-400 to-orange-400">
															<Show
																when={userInfo()?.displayAvatar}
																fallback={
																	<span class="font-bold text-white">
																		{userInfo()?.name?.[0]?.toUpperCase() ||
																			"?"}
																	</span>
																}>
																<img
																	src={userInfo()?.displayAvatar ?? ""}
																	alt={userInfo()?.name || "User"}
																	class="h-full w-full object-cover"
																/>
															</Show>
														</div>
														<div>
															<p class="font-medium text-gray-900">
																{userInfo()?.name || "Loading..."}
															</p>
															<p class="text-gray-500 text-sm">
																<span class="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 font-medium text-xs text-yellow-800">
																	{formatRoleType(role.role_type)} (
																	{t("settings.pending")})
																</span>
															</p>
															<p class="mt-1 text-gray-400 text-xs">
																Invited {formatDate(role.granted_at)}
															</p>
														</div>
													</div>
													<button
														type="button"
														onClick={() => handleRevokeRole(role.id)}
														disabled={processingRoleId() === role.id}
														class="rounded-lg px-3 py-1.5 font-medium text-red-600 text-sm transition-colors hover:bg-red-50 disabled:opacity-50">
														{processingRoleId() === role.id
															? "..."
															: t("settings.cancel")}
													</button>
												</div>
											);
										}}
									</For>
								</div>
							</Show>

							<Show
								when={!loadingRoles() && rolesIGranted().length > 0}
								fallback={
									<Show when={pendingInvitationsSent().length === 0}>
										<div class="py-8 text-center text-gray-500">
											<svg
												aria-hidden="true"
												class="mx-auto mb-3 h-12 w-12 text-gray-400"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
												/>
											</svg>
											<p class="text-sm">{t("settings.noRolesGranted")}</p>
											<p class="mt-1 text-gray-400 text-xs">
												{t("settings.rolesGrantedToHelp")}
											</p>
										</div>
									</Show>
								}>
								<div class="space-y-3">
									<h4 class="font-medium text-gray-700 text-sm">
										{t("settings.yourTeam")}
									</h4>
									<For each={rolesIGranted()}>
										{(role) => {
											const userInfo = () => getUserInfo_cached(role.user_id);
											return (
												<div class="flex items-center justify-between rounded-lg border border-gray-200 p-4">
													<div class="flex items-center gap-3">
														<div class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-linear-to-r from-purple-500 to-pink-500">
															<Show
																when={userInfo()?.displayAvatar}
																fallback={
																	<span class="font-bold text-white">
																		{userInfo()?.name?.[0]?.toUpperCase() ||
																			"?"}
																	</span>
																}>
																<img
																	src={userInfo()?.displayAvatar ?? ""}
																	alt={userInfo()?.name || "User"}
																	class="h-full w-full object-cover"
																/>
															</Show>
														</div>
														<div>
															<p class="font-medium text-gray-900">
																{userInfo()?.name || "Loading..."}
															</p>
															<p class="text-gray-500 text-sm">
																<span class="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 font-medium text-purple-800 text-xs">
																	{formatRoleType(role.role_type)}
																</span>
															</p>
															<p class="mt-1 text-gray-400 text-xs">
																{t("settings.since")}{" "}
																{formatDate(
																	role.accepted_at || role.granted_at,
																)}
															</p>
														</div>
													</div>
													<button
														type="button"
														onClick={() => handleRevokeRole(role.id)}
														disabled={processingRoleId() === role.id}
														class="rounded-lg px-3 py-1.5 font-medium text-red-600 text-sm transition-colors hover:bg-red-50 disabled:opacity-50">
														{processingRoleId() === role.id
															? "..."
															: t("settings.revoke")}
													</button>
												</div>
											);
										}}
									</For>
								</div>
							</Show>
						</div>

						<Show when={user()}>
							<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
								<h3 class="mb-6 font-medium text-gray-900 text-lg">
									{t("settings.notificationPreferences")}
								</h3>
								<div class="space-y-4">
									<div class="flex items-center justify-between rounded-lg border border-gray-200 p-3">
										<div>
											<p class="font-medium text-gray-900">
												{t("settings.emailNotifications")}
											</p>
											<p class="text-gray-600 text-sm">
												{t("settings.emailNotificationsDesc")}
											</p>
										</div>
										<button
											type="button"
											onClick={handleToggleEmailNotifications}
											disabled={isTogglingNotifications()}
											class={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
												prefs.data()?.email_notifications
													? "bg-purple-600"
													: "bg-gray-300"
											} ${
												isTogglingNotifications()
													? "cursor-not-allowed opacity-50"
													: "cursor-pointer"
											}`}>
											<span
												class={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
													prefs.data()?.email_notifications
														? "translate-x-6"
														: "translate-x-1"
												}`}
											/>
										</button>
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
