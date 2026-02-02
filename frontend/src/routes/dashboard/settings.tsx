import { Link, createFileRoute, useSearch } from "@tanstack/solid-router";
import { For, Show, createMemo, createSignal, onMount } from "solid-js";
import LanguageSwitcher from "~/components/LanguageSwitcher";
import {
	AvatarUploadSection,
	DonationSettingsForm,
	PlatformConnectionsPanel,
	UserRolesManagement,
} from "~/components/settings";
import { Button, Card, Skeleton, Toggle } from "~/design-system";
import { useTranslation } from "~/i18n";
import { getLoginUrl, useCurrentUser } from "~/lib/auth";
import { useBreadcrumbs } from "~/lib/BreadcrumbContext";
import { getCsrfHeaders } from "~/lib/csrf";
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
			<Card>
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
			</Card>

			{/* Donation Settings skeleton */}
			<Card>
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
			</Card>

			{/* Platform Connections skeleton */}
			<Card>
				<Skeleton class="mb-6 h-6 w-44" />
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<For each={[1, 2, 3, 4]}>
						{() => (
							<div class="flex items-center justify-between rounded-lg border border-neutral-200 p-4">
								<div class="flex items-center space-x-3">
									<Skeleton class="h-10 w-10 rounded-lg" />
									<Skeleton class="h-5 w-20" />
								</div>
								<Skeleton class="h-9 w-20 rounded-lg" />
							</div>
						)}
					</For>
				</div>
			</Card>
		</div>
	);
}

export const Route = createFileRoute("/dashboard/settings")({
	component: Settings,
	head: () => ({
		meta: [{ title: "Settings - Streampai" }],
	}),
});

function Settings() {
	const { t } = useTranslation();
	const { user, isLoading } = useCurrentUser();
	const prefs = useUserPreferencesForUser(() => user()?.id);

	useBreadcrumbs(() => [
		{ label: t("sidebar.account"), href: "/dashboard/settings" },
		{ label: t("dashboardNav.settings") },
	]);
	const rolesData = useUserRolesData(() => user()?.id);
	const streamingAccounts = useStreamingAccounts(() => user()?.id);

	const [displayName, setDisplayName] = createSignal("");
	const [isUpdatingName, setIsUpdatingName] = createSignal(false);
	const [nameError, setNameError] = createSignal<string | null>(null);
	const [nameSuccess, setNameSuccess] = createSignal(false);
	const [isTogglingNotifications, setIsTogglingNotifications] =
		createSignal(false);
	const [isCheckingOut, setIsCheckingOut] = createSignal(false);
	const [showPlanSelection, setShowPlanSelection] = createSignal(false);
	const [paymentSuccess, setPaymentSuccess] = createSignal(false);
	const [paymentPending, setPaymentPending] = createSignal(false);
	const searchParams = useSearch({ strict: false }) as () => Record<
		string,
		unknown
	>;
	const settingsNavigate = Route.useNavigate();

	onMount(() => {
		if (searchParams()?.payment === "success") {
			setPaymentSuccess(true);
			settingsNavigate({
				search: (prev: Record<string, unknown>) => ({
					...prev,
					payment: undefined,
				}),
			});
			setTimeout(() => setPaymentSuccess(false), 5000);
		} else if (searchParams()?.payment === "pending") {
			setPaymentPending(true);
			settingsNavigate({
				search: (prev: Record<string, unknown>) => ({
					...prev,
					payment: undefined,
				}),
			});
			setTimeout(() => setPaymentPending(false), 8000);
		}
	});

	const handleUpgrade = async (plan: "monthly" | "yearly") => {
		setIsCheckingOut(true);
		try {
			const res = await fetch("/api/rpc/paddle/checkout", {
				method: "POST",
				credentials: "include",
				headers: { ...getCsrfHeaders(), "Content-Type": "application/json" },
				body: JSON.stringify({ plan }),
			});
			if (res.ok) {
				const { checkout_url } = await res.json();
				window.location.href = checkout_url;
			} else {
				console.error("Failed to create checkout:", await res.text());
				setIsCheckingOut(false);
			}
		} catch (e) {
			console.error("Failed to create checkout:", e);
			setIsCheckingOut(false);
		}
	};

	const pendingInvitations = createMemo(
		() => rolesData.data()?.pendingInvitations,
	);
	const myRoles = createMemo(() => rolesData.data()?.myAcceptedRoles);
	const rolesIGranted = createMemo(() => rolesData.data()?.rolesIGranted);
	const pendingInvitationsSent = createMemo(
		() => rolesData.data()?.pendingInvitationsSent,
	);
	const loadingRoles = createMemo(() => rolesData.isLoading());

	const handleUpdateName = async () => {
		const currentUser = user();
		if (!currentUser) return;

		const name = (displayName() || prefs.data()?.name || "").trim();
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
		<Show fallback={<SettingsPageSkeleton />} when={!isLoading()}>
			<Show
				fallback={
					<div class="flex min-h-screen items-center justify-center bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900">
						<div class="py-12 text-center">
							<h2 class="mb-4 font-bold text-2xl text-white">
								{t("dashboard.notAuthenticated")}
							</h2>
							<p class="mb-6 text-neutral-300">
								{t("dashboard.signInToAccess")}
							</p>
							<Link
								class="inline-block rounded-lg bg-linear-to-r from-primary-light to-secondary px-6 py-3 font-semibold text-white transition-all hover:from-primary hover:to-secondary-hover"
								to={getLoginUrl()}>
								{t("nav.signIn")}
							</Link>
						</div>
					</div>
				}
				when={user()}>
				<div class="mx-auto max-w-6xl space-y-6">
					{/* Payment Success Banner */}
					<Show when={paymentSuccess()}>
						<div class="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
							<p class="font-medium">{t("settings.paymentSuccess")}</p>
						</div>
					</Show>
					<Show when={paymentPending()}>
						<div class="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
							<p class="font-medium">{t("settings.paymentPending")}</p>
						</div>
					</Show>

					{/* Plan Banner */}
					<Card
						class="bg-linear-to-r from-primary to-secondary-hover text-white shadow-sm"
						glow
						variant="ghost">
						<div class="flex items-center justify-between">
							<div>
								<h3 class="mb-2 font-bold text-xl">
									{t("dashboard.freePlan")}
								</h3>
								<p class="text-white/80">{t("settings.getStarted")}</p>
							</div>
							<Button
								class="!bg-white !text-primary px-6 py-2 font-semibold"
								disabled={isCheckingOut()}
								onClick={() => setShowPlanSelection(!showPlanSelection())}
								variant="secondary">
								{isCheckingOut()
									? t("settings.redirecting")
									: t("settings.upgradeToPro")}
							</Button>
						</div>
						<Show when={showPlanSelection()}>
							<div class="mt-4 flex gap-3">
								<button
									class="flex-1 rounded-lg bg-white/20 p-3 text-left transition-colors hover:bg-white/30"
									disabled={isCheckingOut()}
									onClick={() => handleUpgrade("monthly")}
									type="button">
									<p class="font-semibold">{t("settings.monthlyPlan")}</p>
									<p class="text-sm text-white/80">
										{t("settings.monthlyPrice")}
									</p>
								</button>
								<button
									class="flex-1 rounded-lg bg-white/20 p-3 text-left transition-colors hover:bg-white/30"
									disabled={isCheckingOut()}
									onClick={() => handleUpgrade("yearly")}
									type="button">
									<p class="font-semibold">{t("settings.yearlyPlan")}</p>
									<p class="text-sm text-white/80">
										{t("settings.yearlyPrice")}
									</p>
								</button>
							</div>
						</Show>
					</Card>

					{/* Account Settings */}
					<Card variant="ghost">
						<h3 class="mb-6 font-medium text-lg text-neutral-900">
							{t("settings.accountSettings")}
						</h3>
						<div class="space-y-6">
							{/* Email (read-only) */}
							<div>
								<label class="block font-medium text-neutral-700 text-sm">
									{t("settings.email")}
									<input
										class="mt-2 w-full rounded-lg bg-surface px-3 py-2"
										disabled
										type="email"
										value={user()?.email || ""}
									/>
								</label>
								<p class="mt-1 text-neutral-500 text-xs">
									{t("settings.emailCannotChange")}
								</p>
							</div>

							{/* Display Name */}
							<div>
								<label class="block font-medium text-neutral-700 text-sm">
									{t("settings.displayName")}
									<div class="relative mt-2">
										<input
											class="w-full rounded-lg bg-surface px-3 py-2 pr-10"
											onInput={(e) => setDisplayName(e.currentTarget.value)}
											placeholder={t("settings.displayNamePlaceholder")}
											type="text"
											value={displayName() || prefs.data()?.name || ""}
										/>
									</div>
								</label>
								<p class="mt-1 text-neutral-500 text-xs">
									{t("settings.displayNameHelp")}
								</p>
								<div class="mt-3 flex items-center gap-3">
									<Button
										disabled={isUpdatingName()}
										onClick={handleUpdateName}
										size="sm"
										variant="primary">
										{isUpdatingName()
											? t("settings.updating")
											: t("settings.updateName")}
									</Button>
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
					</Card>

					{/* Donation Page */}
					<Card variant="ghost">
						<h3 class="mb-6 font-medium text-lg text-neutral-900">
							{t("settings.donationPage")}
						</h3>
						<div class="space-y-4">
							<div>
								<label class="block font-medium text-neutral-700 text-sm">
									{t("settings.publicDonationUrl")}
									<div class="mt-2 flex items-center space-x-3">
										<input
											class="flex-1 rounded-lg bg-surface px-3 py-2"
											readonly
											type="text"
											value={`${window.location.origin}/u/${
												prefs.data()?.name || ""
											}`}
										/>
										<Button
											onClick={() => {
												navigator.clipboard.writeText(
													`${window.location.origin}/u/${
														prefs.data()?.name || ""
													}`,
												);
											}}
											size="sm"
											variant="primary">
											{t("settings.copyUrl")}
										</Button>
									</div>
								</label>
								<p class="mt-1 text-neutral-500 text-xs">
									{t("settings.donationUrlHelp")}
								</p>
							</div>

							<div class="flex items-center justify-between rounded-lg bg-neutral-50 p-3">
								<div class="flex items-center space-x-3">
									<div class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-linear-to-r from-primary-light to-secondary">
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
										<h4 class="font-medium text-neutral-900">
											{t("settings.support")} {prefs.data()?.name}
										</h4>
										<p class="text-neutral-600 text-sm">
											{t("settings.publicDonationPage")}
										</p>
									</div>
								</div>
								<Link
									class="font-medium text-primary text-sm hover:text-primary-hover"
									params={{ username: prefs.data()?.name || "" }}
									rel="noreferrer"
									target="_blank"
									to="/u/$username">
									{t("settings.preview")} →
								</Link>
							</div>
						</div>
					</Card>

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
						<Card variant="ghost">
							<h3 class="mb-6 font-medium text-lg text-neutral-900">
								{t("settings.notificationPreferences")}
							</h3>
							<div class="space-y-4">
								<div class="flex items-center justify-between rounded-lg bg-surface-inset p-3">
									<div>
										<p class="font-medium text-neutral-900">
											{t("settings.emailNotifications")}
										</p>
										<p class="text-neutral-600 text-sm">
											{t("settings.emailNotificationsDesc")}
										</p>
									</div>
									<Toggle
										aria-label={t("settings.emailNotifications")}
										checked={prefs.data()?.email_notifications ?? false}
										disabled={isTogglingNotifications()}
										onChange={handleToggleEmailNotifications}
									/>
								</div>
							</div>
						</Card>
					</Show>

					{/* Language Settings */}
					<Card variant="ghost">
						<h3 class="mb-6 font-medium text-lg text-neutral-900">
							{t("settings.language")}
						</h3>
						<div class="space-y-4">
							<div>
								<span class="block font-medium text-neutral-700 text-sm">
									{t("settings.language")}
								</span>
								<div class="mt-2">
									<Show
										fallback={
											<Skeleton class="h-10 w-full rounded-lg md:w-48" />
										}
										when={prefs.data()}>
										<LanguageSwitcher
											class="w-full md:w-48"
											valueFromDb={() => prefs.data()?.language_preference}
										/>
									</Show>
								</div>
								<p class="mt-1 text-neutral-500 text-xs">
									{t("settings.languageDescription")}
								</p>
							</div>
						</div>
					</Card>
				</div>
			</Show>
		</Show>
	);
}
