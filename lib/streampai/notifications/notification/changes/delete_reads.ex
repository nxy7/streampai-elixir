defmodule Streampai.Notifications.Notification.Changes.DeleteReads do
  @moduledoc false
  use Ash.Resource.Change

  alias Streampai.Notifications.NotificationRead

  @impl true
  def change(changeset, _opts, _context) do
    Ash.Changeset.before_action(changeset, fn changeset ->
      notification_id = changeset.data.id

      NotificationRead
      |> Ash.Query.filter(notification_id: notification_id)
      |> Ash.bulk_destroy!(:destroy, %{}, authorize?: false)

      changeset
    end)
  end
end
