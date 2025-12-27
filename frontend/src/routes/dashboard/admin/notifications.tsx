import { Title } from "@solidjs/meta";
import { useNavigate } from "@solidjs/router";
import { createEffect, createSignal, For, Show } from "solid-js";
import Badge from "~/components/ui/Badge";
import Button from "~/components/ui/Button";
import Card from "~/components/ui/Card";
import Input, { Select, Textarea } from "~/components/ui/Input";
import { useCurrentUser } from "~/lib/auth";
import { type Notification, useGlobalNotifications } from "~/lib/useElectric";
import { createNotification, deleteNotification } from "~/sdk/ash_rpc";
import { text } from "~/styles/design-system";

export default function AdminNotifications() {
	const navigate = useNavigate();
	const { user: currentUser, isLoading: authLoading } = useCurrentUser();
	const { data: notifications } = useGlobalNotifications();

	const [error, setError] = createSignal<string | null>(null);
	const [successMessage, setSuccessMessage] = createSignal<string | null>(null);

	const [showCreateModal, setShowCreateModal] = createSignal(false);
	const [notificationContent, setNotificationContent] = createSignal("");
	const [notificationType, setNotificationType] = createSignal<
		"global" | "user"
	>("global");
	const [targetUserId, setTargetUserId] = createSignal("");
	const [creating, setCreating] = createSignal(false);

	const [showDeleteConfirm, setShowDeleteConfirm] = createSignal(false);
	const [notificationToDelete, setNotificationToDelete] =
		createSignal<Notification | null>(null);
	const [deleting, setDeleting] = createSignal(false);

	createEffect(() => {
		const user = currentUser();
		if (!authLoading() && (!user || user.role !== "admin")) {
			navigate("/dashboard");
		}
	});

	const openCreateModal = () => {
		setNotificationContent("");
		setNotificationType("global");
		setTargetUserId("");
		setShowCreateModal(true);
		setError(null);
		setSuccessMessage(null);
	};

	const closeCreateModal = () => {
		setShowCreateModal(false);
		setNotificationContent("");
		setTargetUserId("");
	};

	const handleCreate = async () => {
		const content = notificationContent().trim();
		if (!content) {
			setError("Please enter notification content");
			return;
		}

		if (notificationType() === "user" && !targetUserId().trim()) {
			setError("Please enter a user ID for user-specific notifications");
			return;
		}

		setCreating(true);
		setError(null);

		try {
			const input: { content: string; userId?: string | null } = { content };
			if (notificationType() === "user") {
				input.userId = targetUserId().trim();
			}

			const result = await createNotification({
				input,
				fields: ["id", "content", "userId", "insertedAt"],
				fetchOptions: { credentials: "include" },
			});

			if (!result.success) {
				setError(result.errors[0]?.message || "Failed to create notification");
			} else {
				setSuccessMessage("Notification created successfully!");
				closeCreateModal();
				setTimeout(() => setSuccessMessage(null), 5000);
			}
		} catch (err) {
			setError("Failed to create notification. Please try again.");
			console.error("Error creating notification:", err);
		} finally {
			setCreating(false);
		}
	};

	const openDeleteConfirm = (notification: Notification) => {
		setNotificationToDelete(notification);
		setShowDeleteConfirm(true);
		setError(null);
		setSuccessMessage(null);
	};

	const closeDeleteConfirm = () => {
		setShowDeleteConfirm(false);
		setNotificationToDelete(null);
	};

	const handleDelete = async () => {
		const notification = notificationToDelete();
		if (!notification) return;

		setDeleting(true);
		setError(null);

		try {
			const result = await deleteNotification({
				identity: notification.id,
				fetchOptions: { credentials: "include" },
			});

			if (!result.success) {
				setError(result.errors[0]?.message || "Failed to delete notification");
			} else {
				setSuccessMessage("Notification deleted successfully!");
				closeDeleteConfirm();
				setTimeout(() => setSuccessMessage(null), 5000);
			}
		} catch (err) {
			setError("Failed to delete notification. Please try again.");
			console.error("Error deleting notification:", err);
		} finally {
			setDeleting(false);
		}
	};

	return (
		<>
			<Title>Notifications - Admin - Streampai</Title>
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
							<div class="flex items-start space-x-3 rounded-lg border border-green-200 bg-green-50 p-4">
								<svg
									aria-hidden="true"
									class="mt-0.5 h-5 w-5 shrink-0 text-green-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								<div class="flex-1">
									<p class="font-medium text-green-800 text-sm">
										{successMessage()}
									</p>
								</div>
								<button
									type="button"
									onClick={() => setSuccessMessage(null)}
									class="text-green-500 hover:text-green-700">
									<svg
										aria-hidden="true"
										class="h-5 w-5"
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
						</Show>

						<Show when={error()}>
							<div class="flex items-start space-x-3 rounded-lg border border-red-200 bg-red-50 p-4">
								<svg
									aria-hidden="true"
									class="mt-0.5 h-5 w-5 shrink-0 text-red-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								<div class="flex-1">
									<p class="font-medium text-red-800 text-sm">{error()}</p>
								</div>
								<button
									type="button"
									onClick={() => setError(null)}
									class="text-red-500 hover:text-red-700">
									<svg
										aria-hidden="true"
										class="h-5 w-5"
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
						</Show>

						<Card>
							<div class="flex items-center justify-between border-gray-200 border-b px-6 py-4">
								<div>
									<h3 class={text.h3}>Notifications</h3>
									<p class={text.muted}>
										Create and manage system notifications
									</p>
								</div>
								<Button onClick={openCreateModal}>Create Notification</Button>
							</div>

							<div class="overflow-x-auto">
								<table class="w-full">
									<thead class="bg-gray-50">
										<tr>
											<th class="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
												Content
											</th>
											<th class="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
												Type
											</th>
											<th class="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
												Created
											</th>
											<th class="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
												Actions
											</th>
										</tr>
									</thead>
									<tbody class="divide-y divide-gray-200 bg-white">
										<For each={notifications()}>
											{(notification) => (
												<tr class="hover:bg-gray-50">
													<td class="px-6 py-4">
														<p class="max-w-md truncate text-gray-900 text-sm">
															{notification.content}
														</p>
													</td>
													<td class="whitespace-nowrap px-6 py-4">
														<Show
															when={notification.user_id}
															fallback={<Badge variant="info">Global</Badge>}>
															<Badge variant="warning">User-specific</Badge>
														</Show>
													</td>
													<td class="whitespace-nowrap px-6 py-4 text-gray-500 text-sm">
														{new Date(
															notification.inserted_at,
														).toLocaleString()}
													</td>
													<td class="whitespace-nowrap px-6 py-4 font-medium text-sm">
														<button
															type="button"
															onClick={() => openDeleteConfirm(notification)}
															class="text-red-600 hover:text-red-900 hover:underline">
															Delete
														</button>
													</td>
												</tr>
											)}
										</For>
									</tbody>
								</table>

								<Show when={notifications().length === 0}>
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
												d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
											/>
										</svg>
										<p class="mt-4 text-gray-500 text-sm">
											No notifications yet
										</p>
										<Button onClick={openCreateModal} class="mt-4">
											Create your first notification
										</Button>
									</div>
								</Show>
							</div>
						</Card>
					</div>

					{/* Create Modal */}
					<Show when={showCreateModal()}>
						<div class="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-75">
							<div class="mx-4 w-full max-w-md rounded-lg bg-white shadow-xl">
								<div class="border-gray-200 border-b px-6 py-4">
									<div class="flex items-center justify-between">
										<h3 class={text.h3}>Create Notification</h3>
										<button
											type="button"
											onClick={closeCreateModal}
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
										<label class="mb-2 block font-medium text-gray-700 text-sm">
											Notification Type
											<Select
												value={notificationType()}
												onInput={(e) =>
													setNotificationType(
														e.currentTarget.value as "global" | "user",
													)
												}>
												<option value="global">Global (All Users)</option>
												<option value="user">User-specific</option>
											</Select>
										</label>
										<p class={text.helper}>
											{notificationType() === "global"
												? "This notification will be shown to all users"
												: "This notification will only be shown to a specific user"}
										</p>
									</div>

									<Show when={notificationType() === "user"}>
										<div>
											<label class="mb-2 block font-medium text-gray-700 text-sm">
												User ID <span class="text-red-500">*</span>
												<Input
													type="text"
													value={targetUserId()}
													onInput={(e) =>
														setTargetUserId(e.currentTarget.value)
													}
													placeholder="Enter user UUID"
												/>
											</label>
										</div>
									</Show>

									<div>
										<label class="mb-2 block font-medium text-gray-700 text-sm">
											Content <span class="text-red-500">*</span>
											<Textarea
												value={notificationContent()}
												onInput={(e) =>
													setNotificationContent(e.currentTarget.value)
												}
												rows={4}
												placeholder="Enter notification message..."
											/>
										</label>
									</div>
								</div>

								<div class="flex justify-end space-x-3 rounded-b-lg bg-gray-50 px-6 py-4">
									<Button variant="secondary" onClick={closeCreateModal}>
										Cancel
									</Button>
									<Button
										onClick={handleCreate}
										disabled={creating() || !notificationContent().trim()}>
										<Show when={creating()} fallback="Create Notification">
											Creating...
										</Show>
									</Button>
								</div>
							</div>
						</div>
					</Show>

					{/* Delete Confirm Modal */}
					<Show when={showDeleteConfirm()}>
						<div class="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-75">
							<div class="mx-4 w-full max-w-md rounded-lg bg-white shadow-xl">
								<div class="border-gray-200 border-b px-6 py-4">
									<div class="flex items-center justify-between">
										<h3 class={text.h3}>Delete Notification</h3>
										<button
											type="button"
											onClick={closeDeleteConfirm}
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
										Are you sure you want to delete this notification?
									</p>
									<div class="rounded-lg bg-gray-50 p-3">
										<p class="text-gray-700 text-sm">
											{notificationToDelete()?.content}
										</p>
									</div>
									<p class={text.muted}>This action cannot be undone.</p>
								</div>

								<div class="flex justify-end space-x-3 rounded-b-lg bg-gray-50 px-6 py-4">
									<Button variant="secondary" onClick={closeDeleteConfirm}>
										Cancel
									</Button>
									<Button
										variant="danger"
										onClick={handleDelete}
										disabled={deleting()}>
										<Show when={deleting()} fallback="Delete">
											Deleting...
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
