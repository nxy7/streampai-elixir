import { Title } from "@solidjs/meta";
import { createSignal, createEffect, Show, For } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { useCurrentUser } from "~/lib/auth";
import { useGlobalNotifications, type Notification } from "~/lib/useElectric";
import { client } from "~/lib/urql";
import { graphql } from "gql.tada";
import { button, card, text, badge, input } from "~/styles/design-system";

const CreateNotificationMutation = graphql(`
  mutation CreateNotification($input: CreateNotificationInput!) {
    createNotification(input: $input) {
      result {
        id
        content
        userId
        insertedAt
      }
      errors {
        message
      }
    }
  }
`);

const DeleteNotificationMutation = graphql(`
  mutation DeleteNotification($id: ID!) {
    deleteNotification(id: $id) {
      result {
        id
      }
      errors {
        message
      }
    }
  }
`);

export default function AdminNotifications() {
  const navigate = useNavigate();
  const { user: currentUser, isLoading: authLoading } = useCurrentUser();
  const { data: notifications } = useGlobalNotifications();

  const [error, setError] = createSignal<string | null>(null);
  const [successMessage, setSuccessMessage] = createSignal<string | null>(null);

  const [showCreateModal, setShowCreateModal] = createSignal(false);
  const [notificationContent, setNotificationContent] = createSignal("");
  const [notificationType, setNotificationType] = createSignal<"global" | "user">("global");
  const [targetUserId, setTargetUserId] = createSignal("");
  const [creating, setCreating] = createSignal(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = createSignal(false);
  const [notificationToDelete, setNotificationToDelete] = createSignal<Notification | null>(null);
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
      const input: { content: string; userId?: string } = { content };
      if (notificationType() === "user") {
        input.userId = targetUserId().trim();
      }

      const result = await client.mutation(CreateNotificationMutation, { input }, {
        fetchOptions: { credentials: "include" },
      });

      if (result.error) {
        setError("Failed to create notification. Please try again.");
        console.error("GraphQL error:", result.error);
      } else if (result.data?.createNotification?.errors?.length > 0) {
        setError(result.data.createNotification.errors[0].message || "Failed to create notification");
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
      const result = await client.mutation(DeleteNotificationMutation, {
        id: notification.id,
      }, {
        fetchOptions: { credentials: "include" },
      });

      if (result.error) {
        setError("Failed to delete notification. Please try again.");
        console.error("GraphQL error:", result.error);
      } else if (result.data?.deleteNotification?.errors?.length > 0) {
        setError(result.data.deleteNotification.errors[0].message || "Failed to delete notification");
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
          <div class="flex items-center justify-center min-h-screen">
            <div class="text-gray-500">Loading...</div>
          </div>
        }
      >
        <Show when={currentUser()?.role === "admin"}>
          <div class="max-w-6xl mx-auto space-y-6">
            <Show when={successMessage()}>
              <div class="flex items-start space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <svg class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div class="flex-1">
                  <p class="text-sm text-green-800 font-medium">{successMessage()}</p>
                </div>
                <button onClick={() => setSuccessMessage(null)} class="text-green-500 hover:text-green-700">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </Show>

            <Show when={error()}>
              <div class="flex items-start space-x-3 p-4 bg-red-50 rounded-lg border border-red-200">
                <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div class="flex-1">
                  <p class="text-sm text-red-800 font-medium">{error()}</p>
                </div>
                <button onClick={() => setError(null)} class="text-red-500 hover:text-red-700">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </Show>

            <div class={card.base}>
              <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 class={text.h3}>Notifications</h3>
                  <p class={text.muted}>Create and manage system notifications</p>
                </div>
                <button onClick={openCreateModal} class={button.primary}>
                  Create Notification
                </button>
              </div>

              <div class="overflow-x-auto">
                  <table class="w-full">
                    <thead class="bg-gray-50">
                      <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                      <For each={notifications()}>
                        {(notification) => (
                          <tr class="hover:bg-gray-50">
                            <td class="px-6 py-4">
                              <p class="text-sm text-gray-900 max-w-md truncate">{notification.content}</p>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                              <Show
                                when={notification.user_id}
                                fallback={<span class={badge.info}>Global</span>}
                              >
                                <span class={badge.warning}>User-specific</span>
                              </Show>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(notification.inserted_at).toLocaleString()}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => openDeleteConfirm(notification)}
                                class="text-red-600 hover:text-red-900 hover:underline"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        )}
                      </For>
                    </tbody>
                  </table>

                  <Show when={notifications().length === 0}>
                    <div class="text-center py-12">
                      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      <p class="mt-4 text-sm text-gray-500">No notifications yet</p>
                      <button onClick={openCreateModal} class={`${button.primary} mt-4`}>
                        Create your first notification
                      </button>
                    </div>
                  </Show>
                </div>
            </div>
          </div>

          {/* Create Modal */}
          <Show when={showCreateModal()}>
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
              <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div class="px-6 py-4 border-b border-gray-200">
                  <div class="flex items-center justify-between">
                    <h3 class={text.h3}>Create Notification</h3>
                    <button onClick={closeCreateModal} class="text-gray-400 hover:text-gray-500">
                      <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div class="px-6 py-4 space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Notification Type</label>
                    <select
                      value={notificationType()}
                      onInput={(e) => setNotificationType(e.currentTarget.value as "global" | "user")}
                      class={input.select}
                    >
                      <option value="global">Global (All Users)</option>
                      <option value="user">User-specific</option>
                    </select>
                    <p class={text.helper}>
                      {notificationType() === "global"
                        ? "This notification will be shown to all users"
                        : "This notification will only be shown to a specific user"}
                    </p>
                  </div>

                  <Show when={notificationType() === "user"}>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        User ID <span class="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={targetUserId()}
                        onInput={(e) => setTargetUserId(e.currentTarget.value)}
                        class={input.text}
                        placeholder="Enter user UUID"
                      />
                    </div>
                  </Show>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Content <span class="text-red-500">*</span>
                    </label>
                    <textarea
                      value={notificationContent()}
                      onInput={(e) => setNotificationContent(e.currentTarget.value)}
                      rows={4}
                      class={input.textarea}
                      placeholder="Enter notification message..."
                    />
                  </div>
                </div>

                <div class="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
                  <button onClick={closeCreateModal} class={button.secondary}>
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={creating() || !notificationContent().trim()}
                    class={button.primary}
                  >
                    <Show when={creating()} fallback="Create Notification">
                      Creating...
                    </Show>
                  </button>
                </div>
              </div>
            </div>
          </Show>

          {/* Delete Confirm Modal */}
          <Show when={showDeleteConfirm()}>
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
              <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div class="px-6 py-4 border-b border-gray-200">
                  <div class="flex items-center justify-between">
                    <h3 class={text.h3}>Delete Notification</h3>
                    <button onClick={closeDeleteConfirm} class="text-gray-400 hover:text-gray-500">
                      <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div class="px-6 py-4 space-y-4">
                  <p class={text.body}>Are you sure you want to delete this notification?</p>
                  <div class="bg-gray-50 p-3 rounded-lg">
                    <p class="text-sm text-gray-700">{notificationToDelete()?.content}</p>
                  </div>
                  <p class={text.muted}>This action cannot be undone.</p>
                </div>

                <div class="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
                  <button onClick={closeDeleteConfirm} class={button.secondary}>
                    Cancel
                  </button>
                  <button onClick={handleDelete} disabled={deleting()} class={button.danger}>
                    <Show when={deleting()} fallback="Delete">
                      Deleting...
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
