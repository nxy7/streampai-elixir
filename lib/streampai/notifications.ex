defmodule Streampai.Notifications do
  @moduledoc """
  Domain for managing user notifications.

  Supports both global notifications (user_id = NULL) and user-specific notifications.
  Uses a separate notification_reads table to track which notifications have been seen.
  """
  use Ash.Domain,
    extensions: [AshAdmin.Domain, AshGraphql.Domain]

  alias Streampai.Notifications.Notification
  alias Streampai.Notifications.NotificationRead

  admin do
    show? true
  end

  graphql do
    queries do
      list Notification, :list_notifications, :list_for_user
      list Notification, :list_global_notifications, :list_global
      list NotificationRead, :list_notification_reads, :list_for_user
    end

    mutations do
      create Notification, :create_notification, :create
      create NotificationRead, :mark_notification_read, :mark_as_read
      destroy Notification, :delete_notification, :destroy
      action NotificationRead, :mark_notification_unread, :mark_as_unread
    end
  end

  resources do
    resource Notification
    resource NotificationRead
  end
end
