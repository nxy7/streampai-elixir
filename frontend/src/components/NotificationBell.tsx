import { createMemo, createSignal, For, Show } from "solid-js";
import { useI18n } from "~/i18n";
import { useCurrentUser } from "~/lib/auth";
import { formatTimeAgo } from "~/lib/formatters";
import { useNotificationsWithReadStatus } from "~/lib/useElectric";
import { createLocalStorageSignal } from "~/lib/useLocalStorage";
import { markNotificationRead, markNotificationUnread } from "~/sdk/ash_rpc";

export default function NotificationBell() {
	const { user } = useCurrentUser();
	const { locale } = useI18n();
	const userId = createMemo(() => user()?.id);
	// Pass the current locale to get localized notification content
	const { data: allNotifications, unreadCount, isLoading } =
		useNotificationsWithReadStatus(userId, locale);

	const [isOpen, setIsOpen] = createSignal(false);
	const [showUnreadOnly, setShowUnreadOnly] = createLocalStorageSignal(
		"notification-show-unread-only",
		false,
	);
	const [markingRead, setMarkingRead] = createSignal<string | null>(null);

	const notifications = createMemo(() => {
		const all = allNotifications();
		if (showUnreadOnly()) {
			return all.filter((n) => !n.wasSeen);
		}
		return all;
	});

	const handleMarkAsRead = async (notificationId: string) => {
		setMarkingRead(notificationId);
		try {
			await markNotificationRead({
				input: { notificationId },
				fields: ["notificationId", "userId", "seenAt"],
				fetchOptions: { credentials: "include" },
			});
		} catch (err) {
			console.error("Error marking notification as read:", err);
		} finally {
			setMarkingRead(null);
		}
	};

	const handleMarkAsUnread = async (notificationId: string) => {
		setMarkingRead(notificationId);
		try {
			await markNotificationUnread({
				input: { notificationId },
				fetchOptions: { credentials: "include" },
			});
		} catch (err) {
			console.error("Error marking notification as unread:", err);
		} finally {
			setMarkingRead(null);
		}
	};

	const handleMarkAllAsRead = async () => {
		const unreadNotifications = notifications().filter((n) => !n.wasSeen);
		for (const notification of unreadNotifications) {
			await handleMarkAsRead(notification.id);
		}
	};

	return (
		<div class="relative">
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen())}
				class="relative rounded-lg p-2 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
				title="Notifications">
				<svg
					aria-hidden="true"
					class="h-6 w-6 text-gray-600"
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
				<Show when={unreadCount() || undefined}>
					{(count) => (
						<span class="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 font-bold text-white text-xs">
							{count() > 99 ? "99+" : count()}
						</span>
					)}
				</Show>
			</button>

			<Show when={isOpen()}>
				{/* Backdrop */}
				<button
					type="button"
					class="fixed inset-0 z-40"
					onClick={() => setIsOpen(false)}
					aria-label="Close notifications"
				/>

				{/* Dropdown */}
				<div class="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
					<div class="border-gray-200 border-b px-4 py-3">
						<div class="flex items-center justify-between">
							<h3 class="font-semibold text-gray-900">Notifications</h3>
							<Show when={unreadCount() || undefined}>
								<button
									type="button"
									onClick={handleMarkAllAsRead}
									class="font-medium text-purple-600 text-xs hover:text-purple-700">
									Mark all as read
								</button>
							</Show>
						</div>
						<label class="mt-2 flex cursor-pointer items-center gap-2">
							<input
								type="checkbox"
								checked={showUnreadOnly()}
								onChange={(e) => setShowUnreadOnly(e.currentTarget.checked)}
								class="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
							/>
							<span class="text-gray-600 text-xs">Hide read</span>
						</label>
					</div>

					<div class="max-h-96 overflow-y-auto">
						<Show
							when={!isLoading()}
							fallback={
								<div class="px-4 py-3">
									<For each={[1, 2, 3]}>
										{() => (
											<div class="flex animate-pulse items-start gap-3 py-3">
												<div class="mt-1 h-2 w-2 shrink-0 rounded-full bg-gray-200" />
												<div class="min-w-0 flex-1">
													<div class="h-4 w-3/4 rounded bg-gray-200" />
													<div class="mt-2 h-3 w-1/4 rounded bg-gray-200" />
												</div>
											</div>
										)}
									</For>
								</div>
							}>
							<Show
								when={notifications().length > 0}
								fallback={
								<div class="px-4 py-8 text-center text-gray-500">
									<svg
										aria-hidden="true"
										class="mx-auto h-12 w-12 text-gray-300"
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
									<p class="mt-2 text-sm">
										{showUnreadOnly()
											? "All caught up!"
											: "No notifications yet"}
									</p>
								</div>
							}>
							<For each={notifications()}>
								{(notification) => (
									<div
										class={`border-gray-100 border-b px-4 py-3 transition-colors last:border-b-0 hover:bg-gray-50 ${
											notification.wasSeen ? "opacity-60" : ""
										}`}>
										<div class="flex items-start gap-3">
											<div class="mt-1 shrink-0">
												<Show
													when={!notification.wasSeen}
													fallback={
														<div class="h-2 w-2 rounded-full bg-gray-300" />
													}>
													<div class="h-2 w-2 rounded-full bg-purple-500" />
												</Show>
											</div>
											<div class="min-w-0 flex-1">
												<p
													class={`text-sm ${notification.wasSeen ? "text-gray-500" : "text-gray-900"}`}>
													{notification.localizedContent}
												</p>
												<p class="mt-1 text-gray-400 text-xs">
													{formatTimeAgo(notification.inserted_at)}
												</p>
											</div>
											<button
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													if (notification.wasSeen) {
														handleMarkAsUnread(notification.id);
													} else {
														handleMarkAsRead(notification.id);
													}
												}}
												disabled={markingRead() === notification.id}
												class="shrink-0 rounded p-1 transition-colors hover:bg-gray-200"
												title={
													notification.wasSeen
														? "Mark as unread"
														: "Mark as read"
												}>
												<Show
													when={markingRead() !== notification.id}
													fallback={
														<svg
															aria-hidden="true"
															class="h-4 w-4 animate-spin text-gray-400"
															fill="none"
															viewBox="0 0 24 24">
															<circle
																class="opacity-25"
																cx="12"
																cy="12"
																r="10"
																stroke="currentColor"
																stroke-width="4"
															/>
															<path
																class="opacity-75"
																fill="currentColor"
																d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
															/>
														</svg>
													}>
													<Show
														when={!notification.wasSeen}
														fallback={
															<svg
																aria-hidden="true"
																class="h-4 w-4 text-gray-400"
																fill="none"
																stroke="currentColor"
																viewBox="0 0 24 24">
																<path
																	stroke-linecap="round"
																	stroke-linejoin="round"
																	stroke-width="2"
																	d="M12 6v6m0 0v6m0-6h6m-6 0H6"
																/>
															</svg>
														}>
														<svg
															aria-hidden="true"
															class="h-4 w-4 text-gray-400"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24">
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M5 13l4 4L19 7"
															/>
														</svg>
													</Show>
												</Show>
											</button>
										</div>
									</div>
								)}
							</For>
							</Show>
						</Show>
					</div>
				</div>
			</Show>
		</div>
	);
}
