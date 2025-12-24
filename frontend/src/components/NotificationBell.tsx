import { createSignal, Show, For, createMemo } from "solid-js";
import { useCurrentUser } from "~/lib/auth";
import { useNotificationsWithReadStatus } from "~/lib/useElectric";
import { createLocalStorageSignal } from "~/lib/useLocalStorage";
import { client } from "~/lib/urql";
import { graphql } from "gql.tada";

const MarkNotificationReadMutation = graphql(`
  mutation MarkNotificationRead($input: MarkNotificationReadInput!) {
    markNotificationRead(input: $input) {
      result {
        notificationId
        userId
        seenAt
      }
      errors {
        message
      }
    }
  }
`);

const MarkNotificationUnreadMutation = graphql(`
  mutation MarkNotificationUnread($input: MarkNotificationUnreadInput!) {
    markNotificationUnread(input: $input)
  }
`);

export default function NotificationBell() {
  const { user } = useCurrentUser();
  const userId = createMemo(() => user()?.id);
  const { data: allNotifications, unreadCount } = useNotificationsWithReadStatus(userId);

  const [isOpen, setIsOpen] = createSignal(false);
  const [showUnreadOnly, setShowUnreadOnly] = createLocalStorageSignal("notification-show-unread-only", false);
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
      await client.mutation(MarkNotificationReadMutation, {
        input: { notificationId },
      }, {
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
      await client.mutation(MarkNotificationUnreadMutation, {
        input: { notificationId },
      }, {
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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div class="relative">
      <button
        onClick={() => setIsOpen(!isOpen())}
        class="relative p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
        title="Notifications"
      >
        <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        <Show when={unreadCount() > 0}>
          <span class="absolute -top-1 -right-1 flex items-center justify-center min-w-5 h-5 px-1 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount() > 99 ? "99+" : unreadCount()}
          </span>
        </Show>
      </button>

      <Show when={isOpen()}>
        {/* Backdrop */}
        <div class="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

        {/* Dropdown */}
        <div class="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-gray-900">Notifications</h3>
              <Show when={unreadCount() > 0}>
                <button
                  onClick={handleMarkAllAsRead}
                  class="text-xs text-purple-600 hover:text-purple-700 font-medium"
                >
                  Mark all as read
                </button>
              </Show>
            </div>
            <label class="flex items-center gap-2 mt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showUnreadOnly()}
                onChange={(e) => setShowUnreadOnly(e.currentTarget.checked)}
                class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span class="text-xs text-gray-600">Hide read</span>
            </label>
          </div>

          <div class="max-h-96 overflow-y-auto">
            <Show
              when={notifications().length > 0}
              fallback={
                <div class="px-4 py-8 text-center text-gray-500">
                  <svg class="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  <p class="mt-2 text-sm">
                    {showUnreadOnly() ? "All caught up!" : "No notifications yet"}
                  </p>
                </div>
              }
            >
              <For each={notifications()}>
                {(notification) => (
                  <div
                    class={`px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors ${
                      notification.wasSeen ? "opacity-60" : ""
                    }`}
                  >
                    <div class="flex items-start gap-3">
                      <div class="shrink-0 mt-1">
                        <Show
                          when={!notification.wasSeen}
                          fallback={
                            <div class="w-2 h-2 rounded-full bg-gray-300" />
                          }
                        >
                          <div class="w-2 h-2 rounded-full bg-purple-500" />
                        </Show>
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class={`text-sm ${notification.wasSeen ? "text-gray-500" : "text-gray-900"}`}>
                          {notification.content}
                        </p>
                        <p class="text-xs text-gray-400 mt-1">
                          {formatTimeAgo(notification.inserted_at)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (notification.wasSeen) {
                            handleMarkAsUnread(notification.id);
                          } else {
                            handleMarkAsRead(notification.id);
                          }
                        }}
                        disabled={markingRead() === notification.id}
                        class="shrink-0 p-1 rounded hover:bg-gray-200 transition-colors"
                        title={notification.wasSeen ? "Mark as unread" : "Mark as read"}
                      >
                        <Show
                          when={markingRead() !== notification.id}
                          fallback={
                            <svg class="w-4 h-4 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          }
                        >
                          <Show
                            when={!notification.wasSeen}
                            fallback={
                              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            }
                          >
                            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                          </Show>
                        </Show>
                      </button>
                    </div>
                  </div>
                )}
              </For>
            </Show>
          </div>
        </div>
      </Show>
    </div>
  );
}
