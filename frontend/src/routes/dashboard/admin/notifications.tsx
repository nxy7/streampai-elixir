import { Title } from "@solidjs/meta";
import { useNavigate } from "@solidjs/router";
import { For, Index, Show, createEffect, createSignal } from "solid-js";
import Badge from "~/design-system/Badge";
import Button from "~/design-system/Button";
import Card from "~/design-system/Card";
import { text } from "~/design-system/design-system";
import Input, { Select, Textarea } from "~/design-system/Input";
import {
	LOCALE_NAMES,
	type Locale,
	SUPPORTED_LOCALES,
	useTranslation,
} from "~/i18n";
import { useCurrentUser } from "~/lib/auth";
import { type Notification, useGlobalNotifications } from "~/lib/useElectric";
import { createNotification, deleteNotification } from "~/sdk/ash_rpc";

type LocalizationEntry = {
	locale: Locale;
	content: string;
};

export default function AdminNotifications() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { user: currentUser, isLoading: authLoading } = useCurrentUser();
	const { data: notifications, isLoading: notificationsLoading } =
		useGlobalNotifications();

	const [error, setError] = createSignal<string | null>(null);
	const [successMessage, setSuccessMessage] = createSignal<string | null>(null);

	const [showCreateModal, setShowCreateModal] = createSignal(false);
	const [notificationContent, setNotificationContent] = createSignal("");
	const [notificationType, setNotificationType] = createSignal<
		"global" | "user"
	>("global");
	const [targetUserId, setTargetUserId] = createSignal("");
	const [creating, setCreating] = createSignal(false);
	const [showLocalizations, setShowLocalizations] = createSignal(false);
	const [localizations, setLocalizations] = createSignal<LocalizationEntry[]>(
		[],
	);

	// Get locales that haven't been added yet (excluding 'en' as it's the default content)
	const availableLocales = () =>
		SUPPORTED_LOCALES.filter(
			(locale) =>
				locale !== "en" && !localizations().some((l) => l.locale === locale),
		);

	const addLocalization = (locale: Locale) => {
		setLocalizations([...localizations(), { locale, content: "" }]);
	};

	const removeLocalization = (locale: Locale) => {
		setLocalizations(localizations().filter((l) => l.locale !== locale));
	};

	const updateLocalizationContent = (locale: Locale, content: string) => {
		setLocalizations(
			localizations().map((l) => (l.locale === locale ? { ...l, content } : l)),
		);
	};

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
		setLocalizations([]);
		setShowLocalizations(false);
		setShowCreateModal(true);
		setError(null);
		setSuccessMessage(null);
	};

	const closeCreateModal = () => {
		setShowCreateModal(false);
		setNotificationContent("");
		setTargetUserId("");
		setLocalizations([]);
		setShowLocalizations(false);
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
			// Build input with localization columns
			const input: {
				content: string;
				userId?: string | null;
				contentDe?: string | null;
				contentPl?: string | null;
				contentEs?: string | null;
			} = { content };

			if (notificationType() === "user") {
				input.userId = targetUserId().trim();
			}

			// Map localizations to columns
			for (const loc of localizations()) {
				const trimmedContent = loc.content.trim();
				if (trimmedContent) {
					if (loc.locale === "de") input.contentDe = trimmedContent;
					if (loc.locale === "pl") input.contentPl = trimmedContent;
					if (loc.locale === "es") input.contentEs = trimmedContent;
				}
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
				fallback={
					<div class="flex min-h-screen items-center justify-center">
						<div class="text-neutral-500">Loading...</div>
					</div>
				}
				when={!authLoading()}>
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
										d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
									/>
								</svg>
								<div class="flex-1">
									<p class="font-medium text-green-800 text-sm">
										{successMessage()}
									</p>
								</div>
								<button
									class="text-green-500 hover:text-green-700"
									onClick={() => setSuccessMessage(null)}
									type="button">
									<svg
										aria-hidden="true"
										class="h-5 w-5"
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
										d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
									/>
								</svg>
								<div class="flex-1">
									<p class="font-medium text-red-800 text-sm">{error()}</p>
								</div>
								<button
									class="text-red-500 hover:text-red-700"
									onClick={() => setError(null)}
									type="button">
									<svg
										aria-hidden="true"
										class="h-5 w-5"
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
						</Show>

						<Card variant="ghost">
							<div class="flex items-center justify-between border-neutral-200 border-b px-6 py-4">
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
									<thead class="bg-neutral-50">
										<tr>
											<th class="px-6 py-3 text-left font-medium text-neutral-500 text-xs uppercase tracking-wider">
												Content
											</th>
											<th class="px-6 py-3 text-left font-medium text-neutral-500 text-xs uppercase tracking-wider">
												Type
											</th>
											<th class="px-6 py-3 text-left font-medium text-neutral-500 text-xs uppercase tracking-wider">
												Created
											</th>
											<th class="px-6 py-3 text-left font-medium text-neutral-500 text-xs uppercase tracking-wider">
												Actions
											</th>
										</tr>
									</thead>
									<tbody class="divide-y divide-neutral-200 bg-surface">
										<Show
											fallback={
												<For each={[1, 2, 3]}>
													{() => (
														<tr class="animate-pulse">
															<td class="px-6 py-4">
																<div class="h-4 w-3/4 rounded bg-neutral-200" />
															</td>
															<td class="px-6 py-4">
																<div class="h-5 w-16 rounded bg-neutral-200" />
															</td>
															<td class="px-6 py-4">
																<div class="h-4 w-32 rounded bg-neutral-200" />
															</td>
															<td class="px-6 py-4">
																<div class="h-4 w-12 rounded bg-neutral-200" />
															</td>
														</tr>
													)}
												</For>
											}
											when={!notificationsLoading()}>
											<For each={notifications()}>
												{(notification) => (
													<tr class="bg-surface-inset hover:bg-surface">
														<td class="px-6 py-4">
															<p class="max-w-md truncate text-neutral-900 text-sm">
																{notification.content}
															</p>
														</td>
														<td class="whitespace-nowrap px-6 py-4">
															<Show
																fallback={<Badge variant="info">Global</Badge>}
																when={notification.user_id}>
																<Badge variant="warning">User-specific</Badge>
															</Show>
														</td>
														<td class="whitespace-nowrap px-6 py-4 text-neutral-500 text-sm">
															{new Date(
																notification.inserted_at,
															).toLocaleString()}
														</td>
														<td class="whitespace-nowrap px-6 py-4 font-medium text-sm">
															<button
																class="text-red-600 hover:text-red-900 hover:underline"
																onClick={() => openDeleteConfirm(notification)}
																type="button">
																Delete
															</button>
														</td>
													</tr>
												)}
											</For>
										</Show>
									</tbody>
								</table>

								<Show
									when={
										!notificationsLoading() && notifications().length === 0
									}>
									<div class="py-12 text-center">
										<svg
											aria-hidden="true"
											class="mx-auto h-12 w-12 text-neutral-400"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24">
											<path
												d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
											/>
										</svg>
										<p class="mt-4 text-neutral-500 text-sm">
											No notifications yet
										</p>
										<Button class="mt-4" onClick={openCreateModal}>
											Create your first notification
										</Button>
									</div>
								</Show>
							</div>
						</Card>
					</div>

					{/* Create Modal */}
					<Show when={showCreateModal()}>
						<div class="fixed inset-0 z-50 flex items-center justify-center bg-neutral-500 bg-opacity-75">
							<div class="mx-4 w-full max-w-md rounded-lg bg-surface shadow-xl">
								<div class="border-neutral-200 border-b px-6 py-4">
									<div class="flex items-center justify-between">
										<h3 class={text.h3}>Create Notification</h3>
										<button
											class="text-neutral-400 hover:text-neutral-500"
											onClick={closeCreateModal}
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
										<label
											class="mb-2 block font-medium text-neutral-700 text-sm"
											for="notification-type">
											Notification Type
										</label>
										<Select
											id="notification-type"
											onInput={(e) =>
												setNotificationType(
													e.currentTarget.value as "global" | "user",
												)
											}
											value={notificationType()}>
											<option value="global">Global (All Users)</option>
											<option value="user">User-specific</option>
										</Select>
										<p class={text.helper}>
											{notificationType() === "global"
												? "This notification will be shown to all users"
												: "This notification will only be shown to a specific user"}
										</p>
									</div>

									<Show when={notificationType() === "user"}>
										<div>
											<label
												class="mb-2 block font-medium text-neutral-700 text-sm"
												for="target-user-id">
												User ID <span class="text-red-500">*</span>
											</label>
											<Input
												id="target-user-id"
												onInput={(e) => setTargetUserId(e.currentTarget.value)}
												placeholder={t("admin.enterUserUuid")}
												type="text"
												value={targetUserId()}
											/>
										</div>
									</Show>

									<div>
										<label
											class="mb-2 block font-medium text-neutral-700 text-sm"
											for="notification-content">
											Content (English - Default){" "}
											<span class="text-red-500">*</span>
										</label>
										<Textarea
											id="notification-content"
											onInput={(e) =>
												setNotificationContent(e.currentTarget.value)
											}
											placeholder={t("admin.enterNotificationMessage")}
											rows={3}
											value={notificationContent()}
										/>
									</div>

									{/* Localizations Section */}
									<div class="border-neutral-200 border-t pt-4">
										<button
											class="flex w-full items-center justify-between text-left"
											onClick={() => setShowLocalizations(!showLocalizations())}
											type="button">
											<span class="font-medium text-neutral-700 text-sm">
												Translations (Optional)
											</span>
											<svg
												aria-hidden="true"
												class={`h-5 w-5 text-neutral-500 transition-transform ${showLocalizations() ? "rotate-180" : ""}`}
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24">
												<path
													d="M19 9l-7 7-7-7"
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
												/>
											</svg>
										</button>
										<p class={`${text.helper} mt-1`}>
											Add translations for users with different language
											preferences
										</p>

										<Show when={showLocalizations()}>
											<div class="mt-3 space-y-3">
												{/* Existing localizations */}
												<Index each={localizations()}>
													{(loc, _index) => (
														<div class="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
															<div class="mb-2 flex items-center justify-between">
																<span class="font-medium text-neutral-700 text-sm">
																	{LOCALE_NAMES[loc().locale]}
																</span>
																<button
																	class="text-red-500 hover:text-red-700"
																	onClick={() =>
																		removeLocalization(loc().locale)
																	}
																	title="Remove translation"
																	type="button">
																	<svg
																		aria-hidden="true"
																		class="h-4 w-4"
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
															<Textarea
																onInput={(e) =>
																	updateLocalizationContent(
																		loc().locale,
																		e.currentTarget.value,
																	)
																}
																placeholder={`Enter ${LOCALE_NAMES[loc().locale]} translation...`}
																rows={2}
																value={loc().content}
															/>
														</div>
													)}
												</Index>

												{/* Add new localization */}
												<Show when={availableLocales().length > 0}>
													<div class="flex items-center gap-2">
														<Select
															onChange={(e) => {
																const locale = e.currentTarget.value as Locale;
																if (locale) {
																	addLocalization(locale);
																	e.currentTarget.value = "";
																}
															}}>
															<option value="">Add translation...</option>
															<For each={availableLocales()}>
																{(locale) => (
																	<option value={locale}>
																		{LOCALE_NAMES[locale]}
																	</option>
																)}
															</For>
														</Select>
													</div>
												</Show>

												<Show when={availableLocales().length === 0}>
													<p class="text-center text-neutral-500 text-sm">
														All available languages have been added
													</p>
												</Show>
											</div>
										</Show>
									</div>
								</div>

								<div class="flex justify-end space-x-3 rounded-b-lg bg-neutral-50 px-6 py-4">
									<Button onClick={closeCreateModal} variant="secondary">
										Cancel
									</Button>
									<Button
										disabled={creating() || !notificationContent().trim()}
										onClick={handleCreate}>
										<Show fallback="Create Notification" when={creating()}>
											Creating...
										</Show>
									</Button>
								</div>
							</div>
						</div>
					</Show>

					{/* Delete Confirm Modal */}
					<Show when={showDeleteConfirm()}>
						<div class="fixed inset-0 z-50 flex items-center justify-center bg-neutral-500 bg-opacity-75">
							<div class="mx-4 w-full max-w-md rounded-lg bg-surface shadow-xl">
								<div class="border-neutral-200 border-b px-6 py-4">
									<div class="flex items-center justify-between">
										<h3 class={text.h3}>Delete Notification</h3>
										<button
											class="text-neutral-400 hover:text-neutral-500"
											onClick={closeDeleteConfirm}
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
										Are you sure you want to delete this notification?
									</p>
									<div class="rounded-lg bg-neutral-50 p-3">
										<p class="text-neutral-700 text-sm">
											{notificationToDelete()?.content}
										</p>
									</div>
									<p class={text.muted}>This action cannot be undone.</p>
								</div>

								<div class="flex justify-end space-x-3 rounded-b-lg bg-neutral-50 px-6 py-4">
									<Button onClick={closeDeleteConfirm} variant="secondary">
										Cancel
									</Button>
									<Button
										disabled={deleting()}
										onClick={handleDelete}
										variant="danger">
										<Show fallback="Delete" when={deleting()}>
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
