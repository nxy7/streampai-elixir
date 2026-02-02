import { Title } from "@solidjs/meta";
import { useNavigate } from "@solidjs/router";
import { useLiveQuery } from "@tanstack/solid-db";
import { For, Show, createEffect, createMemo, createSignal } from "solid-js";
import { z } from "zod";
import { Alert } from "~/design-system";
import Badge from "~/design-system/Badge";
import Button from "~/design-system/Button";
import Card from "~/design-system/Card";
import { text } from "~/design-system/design-system";
import { useTranslation } from "~/i18n";
import { useCurrentUser } from "~/lib/auth";
import { type AdminUser, getAdminUsersCollection } from "~/lib/electric";
import { startImpersonation } from "~/lib/impersonation";
import { SchemaForm } from "~/lib/schema-form/SchemaForm";
import type { FormMeta } from "~/lib/schema-form/types";
import { usePresence } from "~/lib/socket";
import { grantProAccess, revokeProAccess } from "~/sdk/ash_rpc";

// Schema for Grant PRO form
const grantProSchema = z.object({
	duration: z.enum(["7", "30", "90", "180", "365"]).default("30"),
	reason: z.string().default(""),
});

// Duration labels for display
const durationLabels: Record<string, string> = {
	"7": "7 days",
	"30": "30 days",
	"90": "90 days (3 months)",
	"180": "180 days (6 months)",
	"365": "365 days (1 year)",
};

// Metadata for Grant PRO form UI
const grantProMeta: FormMeta<typeof grantProSchema.shape> = {
	duration: {
		label: "Duration",
		description: "How long the PRO access will last",
		options: durationLabels,
	},
	reason: {
		label: "Reason",
		inputType: "textarea",
		placeholder: "e.g., Beta tester, Partner program, Promotional access...",
		description: "This will be logged for auditing purposes",
	},
};

type GrantProFormValues = z.infer<typeof grantProSchema>;

export default function AdminUsers() {
	const navigate = useNavigate();
	const { user: currentUser, isLoading: authLoading } = useCurrentUser();
	const { users: onlineUsers } = usePresence();
	const { t } = useTranslation();

	// Check if user is admin
	const isAdmin = createMemo(() => currentUser()?.role === "admin");

	// Only create the admin collection when user is confirmed to be an admin
	// The collection is lazily created and cached
	const usersCollection = createMemo(() =>
		isAdmin() ? getAdminUsersCollection() : null,
	);
	const usersQuery = useLiveQuery(
		() => usersCollection() as ReturnType<typeof getAdminUsersCollection>,
	);

	const users = createMemo((): AdminUser[] => {
		if (!isAdmin()) return [];
		const allUsers = (usersQuery.data ?? []) as AdminUser[];
		return allUsers.sort((a, b) => a.email.localeCompare(b.email));
	});

	const isUserOnline = (userId: string) => {
		return onlineUsers().some((u) => u.id === userId);
	};

	const [error, setError] = createSignal<string | null>(null);
	const [successMessage, setSuccessMessage] = createSignal<string | null>(null);

	const [showGrantModal, setShowGrantModal] = createSignal(false);
	const [selectedUser, setSelectedUser] = createSignal<AdminUser | null>(null);
	const [grantFormValues, setGrantFormValues] =
		createSignal<GrantProFormValues>({
			duration: "30",
			reason: "",
		});
	const [grantingPro, setGrantingPro] = createSignal(false);

	const [showRevokeConfirm, setShowRevokeConfirm] = createSignal(false);
	const [userToRevoke, setUserToRevoke] = createSignal<AdminUser | null>(null);
	const [revokingPro, setRevokingPro] = createSignal(false);

	const [impersonatingUserId, setImpersonatingUserId] = createSignal<
		string | null
	>(null);

	const handleImpersonate = async (userId: string) => {
		setImpersonatingUserId(userId);
		setError(null);
		try {
			await startImpersonation(userId);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to start impersonation",
			);
			setImpersonatingUserId(null);
		}
	};

	createEffect(() => {
		const user = currentUser();
		if (!authLoading() && (!user || user.role !== "admin")) {
			navigate("/dashboard");
		}
	});

	const openGrantModal = (user: AdminUser) => {
		setSelectedUser(user);
		setGrantFormValues({ duration: "30", reason: "" });
		setShowGrantModal(true);
		setError(null);
		setSuccessMessage(null);
	};

	const closeGrantModal = () => {
		setShowGrantModal(false);
		setSelectedUser(null);
		setGrantFormValues({ duration: "30", reason: "" });
	};

	const handleGrantPro = async () => {
		const user = selectedUser();
		if (!user) return;

		const formValues = grantFormValues();
		const reason = formValues.reason.trim();
		if (!reason) {
			setError("Please provide a reason for granting PRO access");
			return;
		}

		setGrantingPro(true);
		setError(null);

		try {
			const result = await grantProAccess({
				identity: user.id,
				input: {
					durationDays: parseInt(formValues.duration, 10),
					reason: reason,
				},
				fields: ["id", "tier"],
				fetchOptions: { credentials: "include" },
			});

			if (!result.success) {
				setError(result.errors[0]?.message || "Failed to grant PRO access");
			} else {
				setSuccessMessage(
					`PRO access granted to ${user.email} for ${durationLabels[formValues.duration]}`,
				);
				closeGrantModal();

				setTimeout(() => setSuccessMessage(null), 5000);
			}
		} catch (err) {
			setError("Failed to grant PRO access. Please try again.");
			console.error("Error granting PRO:", err);
		} finally {
			setGrantingPro(false);
		}
	};

	const _openRevokeConfirm = (user: AdminUser) => {
		setUserToRevoke(user);
		setShowRevokeConfirm(true);
		setError(null);
		setSuccessMessage(null);
	};

	const closeRevokeConfirm = () => {
		setShowRevokeConfirm(false);
		setUserToRevoke(null);
	};

	const handleRevokePro = async () => {
		const user = userToRevoke();
		if (!user) return;

		setRevokingPro(true);
		setError(null);

		try {
			const result = await revokeProAccess({
				identity: user.id,
				fields: ["id", "tier"],
				fetchOptions: { credentials: "include" },
			});

			if (!result.success) {
				setError(result.errors[0]?.message || "Failed to revoke PRO access");
			} else {
				setSuccessMessage(`PRO access revoked for ${user.email}`);
				closeRevokeConfirm();

				setTimeout(() => setSuccessMessage(null), 5000);
			}
		} catch (err) {
			setError("Failed to revoke PRO access. Please try again.");
			console.error("Error revoking PRO:", err);
		} finally {
			setRevokingPro(false);
		}
	};

	return (
		<>
			<Title>Users - Admin - Streampai</Title>
			<Show
				fallback={
					<div class="flex min-h-screen items-center justify-center">
						<div class="text-neutral-500">Loading...</div>
					</div>
				}
				when={!authLoading()}>
				<Show when={currentUser()?.role === "admin"}>
					<div class="mx-auto max-w-6xl space-y-6 overflow-x-hidden">
						<Show when={successMessage()}>
							<Alert onClose={() => setSuccessMessage(null)} variant="success">
								{successMessage()}
							</Alert>
						</Show>

						<Show when={error()}>
							<Alert onClose={() => setError(null)} variant="error">
								{error()}
							</Alert>
						</Show>

						<Card variant="ghost">
							<div class="flex items-center justify-between border-neutral-200 border-b px-6 py-4">
								<div>
									<h3 class={text.h3}>All Users</h3>
									<p class={text.muted}>Manage user accounts and PRO access</p>
								</div>
								<div class="flex items-center space-x-2 text-sm">
									<div class="h-2 w-2 rounded-full bg-green-500" />
									<span class="text-neutral-600">
										{onlineUsers().length} online
									</span>
								</div>
							</div>

							<div class="overflow-x-auto">
								<table class="w-full">
									<thead class="bg-neutral-50">
										<tr>
											<th class="px-6 py-3 text-left font-medium text-neutral-500 text-xs uppercase tracking-wider">
												User
											</th>
											<th class="px-6 py-3 text-left font-medium text-neutral-500 text-xs uppercase tracking-wider">
												Email
											</th>
											<th class="px-6 py-3 text-left font-medium text-neutral-500 text-xs uppercase tracking-wider">
												Status
											</th>
											<th class="px-6 py-3 text-left font-medium text-neutral-500 text-xs uppercase tracking-wider">
												Joined
											</th>
											<th class="px-6 py-3 text-left font-medium text-neutral-500 text-xs uppercase tracking-wider">
												Actions
											</th>
										</tr>
									</thead>
									<tbody class="divide-y divide-neutral-200 bg-surface">
										<For each={users()}>
											{(user: AdminUser) => (
												<tr class="bg-surface-inset hover:bg-surface">
													<td class="whitespace-nowrap px-6 py-4">
														<div class="flex items-center">
															<div class="relative">
																<div class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary-light">
																	<Show
																		fallback={
																			<span class="font-medium text-sm text-white">
																				{user.email[0].toUpperCase()}
																			</span>
																		}
																		when={user.avatar_url}>
																		<img
																			alt={user.name}
																			class="h-10 w-10 rounded-full object-cover"
																			src={user.avatar_url ?? ""}
																		/>
																	</Show>
																</div>
																<div
																	class={`absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-surface ${
																		isUserOnline(user.id)
																			? "bg-green-500"
																			: "bg-neutral-400"
																	}`}
																	title={
																		isUserOnline(user.id) ? "Online" : "Offline"
																	}
																/>
															</div>
															<div class="ml-3">
																<Show when={currentUser()?.id === user.id}>
																	<div class="mb-0.5">
																		<Badge variant="info">Current User</Badge>
																	</div>
																</Show>
																<span class="font-medium text-neutral-900 text-sm">
																	{user.name}
																</span>
															</div>
														</div>
													</td>
													<td class="whitespace-nowrap px-6 py-4 text-neutral-900 text-sm">
														{user.email}
													</td>
													<td class="whitespace-nowrap px-6 py-4">
														<Show
															fallback={
																<Badge variant="warning">Pending</Badge>
															}
															when={user.confirmed_at}>
															<Badge variant="success">Confirmed</Badge>
														</Show>
													</td>
													<td class="whitespace-nowrap px-6 py-4 text-neutral-500 text-sm">
														{new Date(user.inserted_at).toLocaleDateString()}
													</td>
													<td class="px-6 py-4 font-medium text-sm">
														<div class="flex items-center gap-2">
															<button
																class="shrink-0 text-green-600 hover:text-green-900 hover:underline"
																onClick={() => openGrantModal(user)}
																type="button">
																PRO
															</button>
															<Show
																when={
																	currentUser()?.id !== user.id &&
																	user.role !== "admin"
																}>
																<button
																	class="shrink-0 text-amber-600 hover:text-amber-900 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
																	disabled={impersonatingUserId() !== null}
																	onClick={() => handleImpersonate(user.id)}
																	title={t("admin.impersonate")}
																	type="button">
																	{impersonatingUserId() === user.id ? (
																		"..."
																	) : (
																		<svg
																			aria-hidden="true"
																			class="h-4 w-4"
																			fill="none"
																			stroke="currentColor"
																			viewBox="0 0 24 24">
																			<path
																				d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
																				stroke-linecap="round"
																				stroke-linejoin="round"
																				stroke-width="2"
																			/>
																		</svg>
																	)}
																</button>
															</Show>
														</div>
													</td>
												</tr>
											)}
										</For>
									</tbody>
								</table>

								<Show when={users().length === 0}>
									<div class="py-12 text-center">
										<svg
											aria-hidden="true"
											class="mx-auto h-12 w-12 text-neutral-400"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24">
											<path
												d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0A9 9 0 1110.5 3.5a9 9 0 018.999 8.499z"
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
											/>
										</svg>
										<p class="mt-4 text-neutral-500 text-sm">No users found</p>
									</div>
								</Show>
							</div>
						</Card>
					</div>

					<Show when={showGrantModal()}>
						<div class="fixed inset-0 z-50 flex items-center justify-center bg-neutral-500 bg-opacity-75">
							<div class="mx-4 w-full max-w-md rounded-lg bg-surface shadow-xl">
								<div class="border-neutral-200 border-b px-6 py-4">
									<div class="flex items-center justify-between">
										<h3 class={text.h3}>Grant PRO Access</h3>
										<button
											class="text-neutral-400 hover:text-neutral-500"
											onClick={closeGrantModal}
											type="button">
											<svg
												aria-hidden="true"
												class="h-6 w-6"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24">
												<path
													d="M6 18L18 6M6 6l12 12"
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
												/>
											</svg>
										</button>
									</div>
								</div>

								<div class="space-y-4 px-6 py-4">
									<div>
										<p class={text.body}>
											Grant PRO access to{" "}
											<span class="font-semibold">{selectedUser()?.email}</span>
										</p>
									</div>

									<SchemaForm
										meta={grantProMeta}
										onChange={(field, value) => {
											setGrantFormValues((prev) => ({
												...prev,
												[field]: value,
											}));
										}}
										schema={grantProSchema}
										values={grantFormValues()}
									/>
								</div>

								<div class="flex justify-end space-x-3 rounded-b-lg bg-neutral-50 px-6 py-4">
									<Button onClick={closeGrantModal} variant="secondary">
										Cancel
									</Button>
									<Button
										disabled={grantingPro() || !grantFormValues().reason.trim()}
										onClick={handleGrantPro}>
										<Show fallback="Grant PRO Access" when={grantingPro()}>
											Granting...
										</Show>
									</Button>
								</div>
							</div>
						</div>
					</Show>

					<Show when={showRevokeConfirm()}>
						<div class="fixed inset-0 z-50 flex items-center justify-center bg-neutral-500 bg-opacity-75">
							<div class="mx-4 w-full max-w-md rounded-lg bg-surface shadow-xl">
								<div class="border-neutral-200 border-b px-6 py-4">
									<div class="flex items-center justify-between">
										<h3 class={text.h3}>Revoke PRO Access</h3>
										<button
											class="text-neutral-400 hover:text-neutral-500"
											onClick={closeRevokeConfirm}
											type="button">
											<svg
												aria-hidden="true"
												class="h-6 w-6"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24">
												<path
													d="M6 18L18 6M6 6l12 12"
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
												/>
											</svg>
										</button>
									</div>
								</div>

								<div class="space-y-4 px-6 py-4">
									<p class={text.body}>
										Are you sure you want to revoke PRO access for{" "}
										<span class="font-semibold">{userToRevoke()?.email}</span>?
									</p>
									<p class={text.muted}>This action cannot be undone.</p>
								</div>

								<div class="flex justify-end space-x-3 rounded-b-lg bg-neutral-50 px-6 py-4">
									<Button onClick={closeRevokeConfirm} variant="secondary">
										Cancel
									</Button>
									<Button
										disabled={revokingPro()}
										onClick={handleRevokePro}
										variant="danger">
										<Show fallback="Revoke PRO" when={revokingPro()}>
											Revoking...
										</Show>
									</Button>
								</div>
							</div>
						</div>
					</Show>
				</Show>
			</Show>
		</>
	);
}
