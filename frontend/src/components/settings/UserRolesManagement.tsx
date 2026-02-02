import { For, Show, createEffect, createSignal } from "solid-js";
import { Alert } from "~/design-system";
import Badge from "~/design-system/Badge";
import Button from "~/design-system/Button";
import Card from "~/design-system/Card";
import { useTranslation } from "~/i18n";
import {
	acceptRoleInvitation,
	declineRoleInvitation,
	getUserByName,
	getUserInfo,
	inviteUserRole,
	revokeUserRole,
} from "~/sdk/ash_rpc";

type UserInfo = { id: string; name: string; displayAvatar: string | null };

interface UserRole {
	id: string;
	user_id: string;
	granter_id: string;
	role_type: string;
	role_status: string;
	granted_at: string;
	accepted_at: string | null;
}

interface UserRolesManagementProps {
	userId: string;
	pendingInvitations: UserRole[];
	myRoles: UserRole[];
	rolesIGranted: UserRole[];
	pendingInvitationsSent: UserRole[];
	isLoading: boolean;
}

const formatRoleType = (roleType: string) => {
	return roleType.charAt(0).toUpperCase() + roleType.slice(1);
};

const formatDate = (dateString: string) => {
	return new Date(dateString).toLocaleDateString();
};

export default function UserRolesManagement(props: UserRolesManagementProps) {
	const { t } = useTranslation();
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

	createEffect(() => {
		const allRoles = [
			...props.pendingInvitations,
			...props.myRoles,
			...props.rolesIGranted,
			...props.pendingInvitationsSent,
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

	const getUserInfoCached = (userId: string): UserInfo | null => {
		return userInfoCache().get(userId) || null;
	};

	const handleInviteUser = async (e: Event) => {
		e.preventDefault();

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

			if (targetUser.id === props.userId) {
				throw new Error("You cannot invite yourself");
			}

			const result = await inviteUserRole({
				input: {
					userId: targetUser.id,
					granterId: props.userId,
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

	return (
		<>
			{/* Pending Invitations Section */}
			<Card variant="ghost">
				<h3 class="mb-6 font-medium text-lg text-neutral-900">
					{t("settings.roleInvitations")}
				</h3>
				<Show
					fallback={
						<div class="py-8 text-center text-neutral-500">
							<svg
								aria-hidden="true"
								class="mx-auto mb-3 h-12 w-12 text-neutral-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
								/>
							</svg>
							<p class="text-sm">{t("settings.noPendingInvitations")}</p>
							<p class="mt-1 text-neutral-400 text-xs">
								{t("settings.invitationsHelp")}
							</p>
						</div>
					}
					when={!props.isLoading && props.pendingInvitations.length > 0}>
					<div class="space-y-3">
						<For each={props.pendingInvitations}>
							{(invitation) => {
								const granterInfo = () =>
									getUserInfoCached(invitation.granter_id);
								return (
									<div class="flex items-center justify-between rounded-lg border border-neutral-200 p-4">
										<div class="flex items-center gap-3">
											<div class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-linear-to-r from-primary-light to-secondary">
												<Show
													fallback={
														<span class="font-bold text-white">
															{granterInfo()?.name?.[0]?.toUpperCase() || "?"}
														</span>
													}
													when={granterInfo()?.displayAvatar}>
													<img
														alt={granterInfo()?.name || "User"}
														class="h-full w-full object-cover"
														src={granterInfo()?.displayAvatar ?? ""}
													/>
												</Show>
											</div>
											<div>
												<p class="font-medium text-neutral-900">
													{granterInfo()?.name || "Loading..."}
												</p>
												<p class="text-neutral-500 text-sm">
													{t("settings.invitedYouAs")}{" "}
													<span class="font-medium text-primary">
														{formatRoleType(invitation.role_type)}
													</span>
												</p>
												<p class="text-neutral-400 text-xs">
													{formatDate(invitation.granted_at)}
												</p>
											</div>
										</div>
										<div class="flex gap-2">
											<Button
												disabled={processingRoleId() === invitation.id}
												onClick={() => handleAcceptInvitation(invitation.id)}
												size="sm"
												type="button"
												variant="success">
												{processingRoleId() === invitation.id
													? "..."
													: t("settings.accept")}
											</Button>
											<Button
												disabled={processingRoleId() === invitation.id}
												onClick={() => handleDeclineInvitation(invitation.id)}
												size="sm"
												type="button"
												variant="secondary">
												{t("settings.decline")}
											</Button>
										</div>
									</div>
								);
							}}
						</For>
					</div>
				</Show>
			</Card>

			{/* My Roles in Other Channels */}
			<Card variant="ghost">
				<h3 class="mb-6 font-medium text-lg text-neutral-900">
					{t("settings.myRolesInChannels")}
				</h3>
				<Show
					fallback={
						<div class="py-8 text-center text-neutral-500">
							<svg
								aria-hidden="true"
								class="mx-auto mb-3 h-12 w-12 text-neutral-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
								/>
							</svg>
							<p class="text-sm">{t("settings.noRolesInChannels")}</p>
							<p class="mt-1 text-neutral-400 text-xs">
								{t("settings.rolesGrantedHelp")}
							</p>
						</div>
					}
					when={!props.isLoading && props.myRoles.length > 0}>
					<div class="space-y-3">
						<For each={props.myRoles}>
							{(role) => {
								const granterInfo = () => getUserInfoCached(role.granter_id);
								return (
									<div class="flex items-center justify-between rounded-lg border border-neutral-200 p-4">
										<div class="flex items-center gap-3">
											<div class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-linear-to-r from-primary-light to-secondary">
												<Show
													fallback={
														<span class="font-bold text-white">
															{granterInfo()?.name?.[0]?.toUpperCase() || "?"}
														</span>
													}
													when={granterInfo()?.displayAvatar}>
													<img
														alt={granterInfo()?.name || "User"}
														class="h-full w-full object-cover"
														src={granterInfo()?.displayAvatar ?? ""}
													/>
												</Show>
											</div>
											<div>
												<p class="font-medium text-neutral-900">
													{granterInfo()?.name || "Loading..."}
													{t("settings.channel")}
												</p>
												<p class="text-neutral-500 text-sm">
													<Badge size="sm" variant="purple">
														{formatRoleType(role.role_type)}
													</Badge>
												</p>
												<p class="mt-1 text-neutral-400 text-xs">
													{t("settings.since")}{" "}
													{formatDate(role.accepted_at || role.granted_at)}
												</p>
											</div>
										</div>
									</div>
								);
							}}
						</For>
					</div>
				</Show>
			</Card>

			{/* Divider */}
			<div class="relative">
				<div class="absolute inset-0 flex items-center">
					<div class="w-full border-neutral-300 border-t" />
				</div>
				<div class="relative flex justify-center text-sm">
					<span class="bg-neutral-50 px-2 text-neutral-500">
						{t("settings.channelManagement")}
					</span>
				</div>
			</div>

			{/* Role Management Section */}
			<Card variant="ghost">
				<h3 class="mb-6 font-medium text-lg text-neutral-900">
					{t("settings.roleManagement")}
				</h3>

				{/* Invite User Form */}
				<div class="mb-6 rounded-lg bg-neutral-50 p-4">
					<h4 class="mb-3 font-medium text-neutral-900">
						{t("settings.inviteUser")}
					</h4>
					<form class="space-y-3" onSubmit={handleInviteUser}>
						<div class="grid grid-cols-1 gap-3 md:grid-cols-3">
							<div>
								<input
									class="w-full rounded-lg bg-surface px-3 py-2 text-sm"
									onInput={(e) => setInviteUsername(e.currentTarget.value)}
									placeholder={t("settings.enterUsername")}
									type="text"
									value={inviteUsername()}
								/>
							</div>
							<div>
								<select
									class="w-full rounded-lg bg-surface px-3 py-2 text-sm"
									onChange={(e) =>
										setInviteRoleType(
											e.currentTarget.value as "moderator" | "manager",
										)
									}
									value={inviteRoleType()}>
									<option value="moderator">{t("settings.moderator")}</option>
									<option value="manager">{t("settings.manager")}</option>
								</select>
							</div>
							<div>
								<Button
									disabled={isInviting()}
									fullWidth
									type="submit"
									variant="primary">
									{isInviting()
										? t("settings.sending")
										: t("settings.sendInvitation")}
								</Button>
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
					<Alert class="mt-4" variant="info">
						<div>
							<p class="font-medium">{t("settings.rolePermissions")}</p>
							<ul class="mt-1 space-y-1 text-xs">
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
					</Alert>
				</div>

				{/* Pending Invitations Sent */}
				<Show
					when={!props.isLoading && props.pendingInvitationsSent.length > 0}>
					<div class="mb-6 space-y-3">
						<h4 class="font-medium text-neutral-700 text-sm">
							{t("settings.pendingInvitations")}
						</h4>
						<For each={props.pendingInvitationsSent}>
							{(role) => {
								const userInfo = () => getUserInfoCached(role.user_id);
								return (
									<div class="flex items-center justify-between rounded-lg border border-yellow-200 bg-yellow-50 p-4">
										<div class="flex items-center gap-3">
											<div class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-linear-to-r from-yellow-400 to-orange-400">
												<Show
													fallback={
														<span class="font-bold text-white">
															{userInfo()?.name?.[0]?.toUpperCase() || "?"}
														</span>
													}
													when={userInfo()?.displayAvatar}>
													<img
														alt={userInfo()?.name || "User"}
														class="h-full w-full object-cover"
														src={userInfo()?.displayAvatar ?? ""}
													/>
												</Show>
											</div>
											<div>
												<p class="font-medium text-neutral-900">
													{userInfo()?.name || "Loading..."}
												</p>
												<p class="text-neutral-500 text-sm">
													<Badge size="sm" variant="warning">
														{formatRoleType(role.role_type)} (
														{t("settings.pending")})
													</Badge>
												</p>
												<p class="mt-1 text-neutral-400 text-xs">
													Invited {formatDate(role.granted_at)}
												</p>
											</div>
										</div>
										<Button
											class="text-red-600 hover:bg-red-50"
											disabled={processingRoleId() === role.id}
											onClick={() => handleRevokeRole(role.id)}
											size="sm"
											type="button"
											variant="ghost">
											{processingRoleId() === role.id
												? "..."
												: t("settings.cancel")}
										</Button>
									</div>
								);
							}}
						</For>
					</div>
				</Show>

				{/* Team Members (Roles I Granted) */}
				<Show
					fallback={
						<Show when={props.pendingInvitationsSent.length === 0}>
							<div class="py-8 text-center text-neutral-500">
								<svg
									aria-hidden="true"
									class="mx-auto mb-3 h-12 w-12 text-neutral-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24">
									<path
										d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
									/>
								</svg>
								<p class="text-sm">{t("settings.noRolesGranted")}</p>
								<p class="mt-1 text-neutral-400 text-xs">
									{t("settings.rolesGrantedToHelp")}
								</p>
							</div>
						</Show>
					}
					when={!props.isLoading && props.rolesIGranted.length > 0}>
					<div class="space-y-3">
						<h4 class="font-medium text-neutral-700 text-sm">
							{t("settings.yourTeam")}
						</h4>
						<For each={props.rolesIGranted}>
							{(role) => {
								const userInfo = () => getUserInfoCached(role.user_id);
								return (
									<div class="flex items-center justify-between rounded-lg border border-neutral-200 p-4">
										<div class="flex items-center gap-3">
											<div class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-linear-to-r from-primary-light to-secondary">
												<Show
													fallback={
														<span class="font-bold text-white">
															{userInfo()?.name?.[0]?.toUpperCase() || "?"}
														</span>
													}
													when={userInfo()?.displayAvatar}>
													<img
														alt={userInfo()?.name || "User"}
														class="h-full w-full object-cover"
														src={userInfo()?.displayAvatar ?? ""}
													/>
												</Show>
											</div>
											<div>
												<p class="font-medium text-neutral-900">
													{userInfo()?.name || "Loading..."}
												</p>
												<p class="text-neutral-500 text-sm">
													<Badge size="sm" variant="purple">
														{formatRoleType(role.role_type)}
													</Badge>
												</p>
												<p class="mt-1 text-neutral-400 text-xs">
													{t("settings.since")}{" "}
													{formatDate(role.accepted_at || role.granted_at)}
												</p>
											</div>
										</div>
										<Button
											class="text-red-600 hover:bg-red-50"
											disabled={processingRoleId() === role.id}
											onClick={() => handleRevokeRole(role.id)}
											size="sm"
											type="button"
											variant="ghost">
											{processingRoleId() === role.id
												? "..."
												: t("settings.revoke")}
										</Button>
									</div>
								);
							}}
						</For>
					</div>
				</Show>
			</Card>
		</>
	);
}
