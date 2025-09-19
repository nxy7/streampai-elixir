defmodule Streampai.Repo.Migrations.UpdateChatMessagesUniqueIndex do
  use Ecto.Migration

  def change do
    drop unique_index(:chat_messages, [:livestream_id, :username, :message, :inserted_at],
           name: "chat_messages_unique_message_per_stream_index"
         )

    create unique_index(:chat_messages, [:livestream_id, :username, :message],
             name: "chat_messages_unique_message_per_stream_index"
           )
  end
end
