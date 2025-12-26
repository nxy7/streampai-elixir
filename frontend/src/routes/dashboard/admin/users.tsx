import { Title } from "@solidjs/meta";
import { useNavigate } from "@solidjs/router";
import { useLiveQuery } from "@tanstack/solid-db";
import { createEffect, createMemo, createSignal, For, Show } from "solid-js";
import { Alert } from "~/components/ui";
import { useCurrentUser } from "~/lib/auth";
import { type AdminUser, getAdminUsersCollection } from "~/lib/electric";
import { usePresence } from "~/lib/socket";
import { grantProAccess, revokeProAccess } from "~/sdk/ash_rpc";
import { badge, button, card, input, text } from "~/styles/design-system";

export default function AdminUsers() {
	const navigate = useNavigate();
	const { user: currentUser, isLoading: authLoading } = useCurrentUser();
	const { users: onlineUsers } = usePresence();

	// Check if user is admin
	const isAdmin = createMemo(() => currentUser()?.role === "admin");

	// Only create the admin collection when user is confirmed to be an admin
	// The collection is lazily created and cached
	const usersQuery = useLiveQuery(() => {
		if (!isAdmin()) {
			// Return undefined when not admin - useLiveQuery handles this gracefully
			return undefined as unknown as ReturnType<typeof getAdminUsersCollection>;
		}
		return getAdminUsersCollection();
	});

	const users = createMemo(() => {
		if (!isAdmin()) return [];
		const allUsers = usersQuery.data ?? [];
		return allUsers.sort((a, b) => a.email.localeCompare(b.email));
	});

	const isUserOnline = (userId: string) => {
		return onlineUsers().some((u) => u.id === userId);
	};

	const [error, setError] = createSignal<string | null>(null);
	const [successMessage, setSuccessMessage] = createSignal<string | null>(null);

	const [showGrantModal, setShowGrantModal] = createSignal(false);
	const [selectedUser, setSelectedUser] = createSignal<AdminUser | null>(null);
	const [grantDuration, setGrantDuration] = createSignal("30");
	const [grantReason, setGrantReason] = createSignal("");
	const [grantingPro, setGrantingPro] = createSignal(false);

	const [showRevokeConfirm, setShowRevokeConfirm] = createSignal(false);
	const [userToRevoke, setUserToRevoke] = createSignal<AdminUser | null>(null);
	const [revokingPro, setRevokingPro] = createSignal(false);

	createEffect(() => {
		const user = currentUser();
		if (!authLoading() && (!user || user.role !== "admin")) {
			navigate("/dashboard");
		}
	});

	const openGrantModal = (user: AdminUser) => {
		setSelectedUser(user);
		setGrantDuration("30");
		setGrantReason("");
		setShowGrantModal(true);
		setError(null);
		setSuccessMessage(null);
	};

	const closeGrantModal = () => {
		setShowGrantModal(false);
		setSelectedUser(null);
		setGrantReason("");
	};

	const handleGrantPro = async () => {
		const user = selectedUser();
		if (!user) return;

		const reason = grantReason().trim();
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
					durationDays: parseInt(grantDuration(), 10),
					reason: reason,
				},
				fields: ["id", "tier"],
				fetchOptions: { credentials: "include" },
			});

			if (!result.success) {
				setError(result.errors[0]?.message || "Failed to grant PRO access");
			} else {
				setSuccessMessage(
					`PRO access granted to ${user.email} for ${grantDuration()} days`,
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
				when={!authLoading()}
				fallback={
					<div class="flex min-h-screen items-center justify-center">
						<div class="text-gray-500">Loading...</div>
					</div>
				}>
				<Show when={currentUser()?.role === "admin"}>
					<div class="mx-auto max-w-6xl space-y-6">
						<Show when={successMessage()}>
							<Alert variant="success" onClose={() => setSuccessMessage(null)}>
								{successMessage()}
							</Alert>
						</Show>

						<Show when={error()}>
							<Alert variant="error" onClose={() => setError(null)}>
								{error()}
							</Alert>
						</Show>

						<div class={card.base}>
							<div class="flex items-center justify-between border-gray-200 border-b px-6 py-4">
								<div>
									<h3 class={text.h3}>All Users</h3>
									<p class={text.muted}>Manage user accounts and PRO access</p>
								</div>
								<div class="flex items-center space-x-2 text-sm">
									<div class="h-2 w-2 rounded-full bg-green-500" />
									<span class="text-gray-600">
										{onlineUsers().length} online
									</span>
								</div>
							</div>

							<div class="overflow-x-auto">
								<table class="w-full">
									<thead class="bg-gray-50">
										<tr>
											<th class="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
												User
											</th>
											<th class="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
												Email
											</th>
											<th class="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
												Status
											</th>
											<th class="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
												Joined
											</th>
											<th class="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
												Actions
											</th>
										</tr>
									</thead>
									<tbody class="divide-y divide-gray-200 bg-white">
										<For each={users()}>
											{(user) => (
												<tr
													class={
														currentUser()?.id === user.id
															? "bg-purple-50"
															: "hover:bg-gray-50"
													}>
													<td class="whitespace-nowrap px-6 py-4">
														<div class="flex items-center">
															<div class="relative">
																<div class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-purple-500">
																	<Show
																		when={user.avatar_url}
																		fallback={
																			<span class="font-medium text-sm text-white">
																				{user.email[0].toUpperCase()}
																			</span>
																		}>
																		<img
																			src={user.avatar_url ?? ""}
																			alt={user.name}
																			class="h-10 w-10 rounded-full object-cover"
																		/>
																	</Show>
																</div>
																<div
																	class={`absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-white ${
																		isUserOnline(user.id)
																			? "bg-green-500"
																			: "bg-gray-400"
																	}`}
																	title={
																		isUserOnline(user.id) ? "Online" : "Offline"
																	}
																/>
															</div>
															<div class="ml-3">
																<div class="flex items-center space-x-2">
																	<span class="font-medium text-gray-900 text-sm">
																		{user.name}
																	</span>
																	<Show when={currentUser()?.id === user.id}>
																		<span class={badge.info}>Current User</span>
																	</Show>
																</div>
															</div>
														</div>
													</td>
													<td class="whitespace-nowrap px-6 py-4 text-gray-900 text-sm">
														{user.email}
													</td>
													<td class="whitespace-nowrap px-6 py-4">
														<Show
															when={user.confirmed_at}
															fallback={
																<span class={badge.warning}>Pending</span>
															}>
															<span class={badge.success}>Confirmed</span>
														</Show>
													</td>
													<td class="whitespace-nowrap px-6 py-4 text-gray-500 text-sm">
														{new Date(user.inserted_at).toLocaleDateString()}
													</td>
													<td class="whitespace-nowrap px-6 py-4 font-medium text-sm">
														<div class="flex items-center space-x-3">
															<button
																type="button"
																onClick={() => openGrantModal(user)}
																class="text-green-600 hover:text-green-900 hover:underline">
																Grant PRO
															</button>
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
											class="mx-auto h-12 w-12 text-gray-400"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0A9 9 0 1110.5 3.5a9 9 0 018.999 8.499z"
											/>
										</svg>
										<p class="mt-4 text-gray-500 text-sm">No users found</p>
									</div>
								</Show>
							</div>
						</div>
					</div>

					<Show when={showGrantModal()}>
						<div class="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-75">
							<div class="mx-4 w-full max-w-md rounded-lg bg-white shadow-xl">
								<div class="border-gray-200 border-b px-6 py-4">
									<div class="flex items-center justify-between">
										<h3 class={text.h3}>Grant PRO Access</h3>
										<button
											type="button"
											onClick={closeGrantModal}
											class="text-gray-400 hover:text-gray-500">
											<svg
												aria-hidden="true"
												class="h-6 w-6"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M6 18L18 6M6 6l12 12"
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

									<div>
										<label class="mb-2 block font-medium text-gray-700 text-sm">
											Duration
											<select
												value={grantDuration()}
												onInput={(e) => setGrantDuration(e.currentTarget.value)}
												class={input.select}>
												<option value="7">7 days</option>
												<option value="30">30 days</option>
												<option value="90">90 days (3 months)</option>
												<option value="180">180 days (6 months)</option>
												<option value="365">365 days (1 year)</option>
											</select>
										</label>
									</div>

									<div>
										<label class="block font-medium text-gray-700 text-sm">
											Reason <span class="text-red-500">*</span>
											<textarea
												value={grantReason()}
												onInput={(e) => setGrantReason(e.currentTarget.value)}
												rows={3}
												class={`mt-2 ${input.textarea}`}
												placeholder="e.g., Beta tester, Partner program, Promotional access..."
											/>
										</label>
										<p class={text.helper}>
											This will be logged for auditing purposes
										</p>
									</div>
								</div>

								<div class="flex justify-end space-x-3 rounded-b-lg bg-gray-50 px-6 py-4">
									<button
										type="button"
										onClick={closeGrantModal}
										class={button.secondary}>
										Cancel
									</button>
									<button
										type="button"
										onClick={handleGrantPro}
										disabled={grantingPro() || !grantReason().trim()}
										class={button.primary}>
										<Show when={grantingPro()} fallback="Grant PRO Access">
											Granting...
										</Show>
									</button>
								</div>
							</div>
						</div>
					</Show>

					<Show when={showRevokeConfirm()}>
						<div class="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-75">
							<div class="mx-4 w-full max-w-md rounded-lg bg-white shadow-xl">
								<div class="border-gray-200 border-b px-6 py-4">
									<div class="flex items-center justify-between">
										<h3 class={text.h3}>Revoke PRO Access</h3>
										<button
											type="button"
											onClick={closeRevokeConfirm}
											class="text-gray-400 hover:text-gray-500">
											<svg
												aria-hidden="true"
												class="h-6 w-6"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M6 18L18 6M6 6l12 12"
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

								<div class="flex justify-end space-x-3 rounded-b-lg bg-gray-50 px-6 py-4">
									<button
										type="button"
										onClick={closeRevokeConfirm}
										class={button.secondary}>
										Cancel
									</button>
									<button
										type="button"
										onClick={handleRevokePro}
										disabled={revokingPro()}
										class={button.danger}>
										<Show when={revokingPro()} fallback="Revoke PRO">
											Revoking...
										</Show>
									</button>
								</div>
							</div>
						</div>
					</Show>
				</Show>
			</Show>
		</>
	);
}
