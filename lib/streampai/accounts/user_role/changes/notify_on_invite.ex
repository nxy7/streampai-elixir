defmodule Streampai.Accounts.UserRole.Changes.NotifyOnInvite do
  @moduledoc false
  use Ash.Resource.Change

  alias Streampai.Accounts.User
  alias Streampai.Notifications.Notification

  @impl true
  def change(changeset, _opts, _context) do
    Ash.Changeset.after_action(changeset, fn _changeset, record ->
      granter = User.get_by_id!(%{id: record.granter_id}, authorize?: false)
      role_name = record.role_type |> to_string() |> String.capitalize()
      content = "You've been invited to be #{role_name} of #{granter.name}'s channel"

      create_notification(record.user_id, content)

      {:ok, record}
    end)
  end

  defp create_notification(user_id, content) do
    Notification
    |> Ash.Changeset.for_create(:create, %{user_id: user_id, content: content}, authorize?: false)
    |> Ash.create()
  end
end
