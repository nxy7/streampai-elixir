defmodule Streampai.Notifications do
  @moduledoc """
  Domain for managing user notifications.

  Supports both global notifications (user_id = NULL) and user-specific notifications.
  Uses a separate notification_reads table to track which notifications have been seen.
  """
  use Ash.Domain,
    extensions: [AshAdmin.Domain, AshTypescript.Rpc]

  alias Streampai.Notifications.Notification
  alias Streampai.Notifications.NotificationRead

  admin do
    show? true
  end

  typescript_rpc do
    resource Notification do
      rpc_action(:create_notification, :create)
      rpc_action(:delete_notification, :destroy)
    end

    resource NotificationRead do
      rpc_action(:mark_notification_read, :mark_as_read)
      rpc_action(:mark_notification_unread, :mark_as_unread)
    end
  end

  resources do
    resource Notification
    resource NotificationRead
  end
end
