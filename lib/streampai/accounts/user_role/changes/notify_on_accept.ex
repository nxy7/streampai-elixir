defmodule Streampai.Accounts.UserRole.Changes.NotifyOnAccept do
  @moduledoc false
  use Ash.Resource.Change

  alias Streampai.Accounts.User
  alias Streampai.Notifications.Notification

  @impl true
  def change(changeset, _opts, _context) do
    Ash.Changeset.after_action(changeset, fn _changeset, record ->
      user = User.get_by_id!(%{id: record.user_id}, actor: Streampai.SystemActor.system())
      content = "#{user.name} joined your moderation team"

      create_notification(record.granter_id, content)

      {:ok, record}
    end)
  end

  defp create_notification(user_id, content) do
    Notification
    |> Ash.Changeset.for_create(:create, %{user_id: user_id, content: content})
    |> Ash.create(actor: Streampai.SystemActor.system())
  end
end
