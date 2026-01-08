defmodule Streampai.Repo.Migrations.AddMissingIndexes do
  use Ecto.Migration

  def change do
    # Livestream: optimize get_completed_by_user query (filter user_id, sort started_at DESC)
    create_if_not_exists index(:livestreams, [:user_id, :started_at],
                           name: "idx_livestreams_user_started_at"
                         )

    # ChatMessage: optimize get_for_viewer query (filter viewer_id + user_id)
    create_if_not_exists index(:chat_messages, [:viewer_id, :user_id],
                           name: "idx_chat_messages_viewer_user"
                         )

    # Notification: optimize list_for_user query (filter user_id, sort inserted_at DESC)
    create_if_not_exists index(:notifications, [:user_id, :inserted_at],
                           name: "idx_notifications_user_inserted_at"
                         )
  end
end
