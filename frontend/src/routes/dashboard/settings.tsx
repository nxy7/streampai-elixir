import { Title } from "@solidjs/meta";
import { For, Show, createEffect, createMemo, createSignal } from "solid-js";
import LanguageSwitcher from "~/components/LanguageSwitcher";
import {
	AvatarUploadSection,
	DonationSettingsForm,
	PlatformConnectionsPanel,
	UserRolesManagement,
} from "~/components/settings";
import { Skeleton } from "~/components/ui";
import { useTranslation } from "~/i18n";
import { getLoginUrl, useCurrentUser } from "~/lib/auth";
import {
	useStreamingAccounts,
	useUserPreferencesForUser,
	useUserRolesData,
} from "~/lib/useElectric";
import { toggleEmailNotifications, updateName } from "~/sdk/ash_rpc";

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
						<Skeleton circle class="h-16 w-16 shrink-0" />
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

	const [displayName, setDisplayName] = createSignal("");
	const [isUpdatingName, setIsUpdatingName] = createSignal(false);
	const [nameError, setNameError] = createSignal<string | null>(null);
	const [nameSuccess, setNameSuccess] = createSignal(false);
	const [isTogglingNotifications, setIsTogglingNotifications] =
		createSignal(false);

	const [formInitialized, setFormInitialized] = createSignal(false);

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
		const data = prefs.data();
		if (data && !formInitialized()) {
			setDisplayName(data.name || "");
			setFormInitialized(true);
		}
	});

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

	return (
		<>
			<Title>Settings - Streampai</Title>
			<Show fallback={<SettingsPageSkeleton />} when={!isLoading()}>
				<Show
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
									class="inline-block rounded-lg bg-linear-to-r from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white transition-all hover:from-purple-600 hover:to-pink-600"
									href={getLoginUrl()}>
									{t("nav.signIn")}
								</a>
							</div>
						</div>
					}
					when={user()}>
					<div class="mx-auto max-w-6xl space-y-6">
						{/* Plan Banner */}
						<div class="rounded-lg bg-linear-to-r from-purple-600 to-pink-600 p-6 text-white shadow-sm">
							<div class="flex items-center justify-between">
								<div>
									<h3 class="mb-2 font-bold text-xl">
										{t("dashboard.freePlan")}
									</h3>
									<p class="text-purple-100">{t("settings.getStarted")}</p>
								</div>
								<button
									class="rounded-lg bg-white px-6 py-2 font-semibold text-purple-600 transition-colors hover:bg-purple-50"
									type="button">
									{t("settings.upgradeToPro")}
								</button>
							</div>
						</div>

						{/* Account Settings */}
						<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
							<h3 class="mb-6 font-medium text-gray-900 text-lg">
								{t("settings.accountSettings")}
							</h3>
							<div class="space-y-6">
								{/* Email (read-only) */}
								<div>
									<label class="block font-medium text-gray-700 text-sm">
										{t("settings.email")}
										<input
											class="mt-2 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2"
											readonly
											type="email"
											value={user()?.email || ""}
										/>
									</label>
									<p class="mt-1 text-gray-500 text-xs">
										{t("settings.emailCannotChange")}
									</p>
								</div>

								{/* Display Name */}
								<div>
									<label class="block font-medium text-gray-700 text-sm">
										{t("settings.displayName")}
										<div class="relative mt-2">
											<input
												class="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10"
												onInput={(e) => setDisplayName(e.currentTarget.value)}
												placeholder={t("settings.displayNamePlaceholder")}
												type="text"
												value={displayName() || prefs.data()?.name || ""}
											/>
										</div>
									</label>
									<p class="mt-1 text-gray-500 text-xs">
										{t("settings.displayNameHelp")}
									</p>
									<div class="mt-3 flex items-center gap-3">
										<button
											class={`rounded-lg bg-purple-600 px-4 py-2 text-sm text-white transition-colors ${
												isUpdatingName()
													? "cursor-not-allowed opacity-50"
													: "hover:bg-purple-700"
											}`}
											disabled={isUpdatingName()}
											onClick={handleUpdateName}
											type="button">
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

								{/* Avatar Upload */}
								<AvatarUploadSection
									currentAvatarUrl={prefs.data()?.avatar_url}
									displayName={prefs.data()?.name}
									userId={user()?.id || ""}
								/>

								{/* Platform Connections */}
								<PlatformConnectionsPanel
									accounts={streamingAccounts.data()}
									isLoading={streamingAccounts.isLoading()}
									userId={user()?.id || ""}
								/>
							</div>
						</div>

						{/* Language Settings */}
						<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
							<h3 class="mb-6 font-medium text-gray-900 text-lg">
								{t("settings.language")}
							</h3>
							<div class="space-y-4">
								<div>
									<span class="block font-medium text-gray-700 text-sm">
										{t("settings.language")}
									</span>
									<div class="mt-2">
										<LanguageSwitcher class="w-full md:w-48" />
									</div>
									<p class="mt-1 text-gray-500 text-xs">
										{t("settings.languageDescription")}
									</p>
								</div>
							</div>
						</div>

						{/* Donation Page */}
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
												class="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2"
												readonly
												type="text"
												value={`${window.location.origin}/u/${
													prefs.data()?.name || ""
												}`}
											/>
											<button
												class="rounded-lg bg-purple-600 px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-purple-700"
												onClick={() => {
													navigator.clipboard.writeText(
														`${window.location.origin}/u/${
															prefs.data()?.name || ""
														}`,
													);
												}}
												type="button">
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
												fallback={
													<span class="font-bold text-white">
														{prefs.data()?.name?.[0]?.toUpperCase() || "U"}
													</span>
												}
												when={prefs.data()?.avatar_url}>
												<img
													alt="Avatar"
													class="h-10 w-10 rounded-full object-cover"
													src={prefs.data()?.avatar_url ?? ""}
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
										class="font-medium text-purple-600 text-sm hover:text-purple-700"
										href={`/u/${prefs.data()?.name || ""}`}
										rel="noreferrer"
										target="_blank">
										{t("settings.preview")} →
									</a>
								</div>
							</div>
						</div>

						{/* Donation Settings Form */}
						<DonationSettingsForm
							initialCurrency={prefs.data()?.donation_currency}
							initialDefaultVoice={prefs.data()?.default_voice}
							initialMaxAmount={prefs.data()?.max_donation_amount}
							initialMinAmount={prefs.data()?.min_donation_amount}
							userId={user()?.id || ""}
						/>

						{/* User Roles Management */}
						<UserRolesManagement
							isLoading={loadingRoles()}
							myRoles={myRoles()}
							pendingInvitations={pendingInvitations()}
							pendingInvitationsSent={pendingInvitationsSent()}
							rolesIGranted={rolesIGranted()}
							userId={user()?.id || ""}
						/>

						{/* Notification Preferences */}
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
											class={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
												prefs.data()?.email_notifications
													? "bg-purple-600"
													: "bg-gray-300"
											} ${
												isTogglingNotifications()
													? "cursor-not-allowed opacity-50"
													: "cursor-pointer"
											}`}
											disabled={isTogglingNotifications()}
											onClick={handleToggleEmailNotifications}
											type="button">
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
