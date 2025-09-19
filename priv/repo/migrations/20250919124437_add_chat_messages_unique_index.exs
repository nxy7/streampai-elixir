defmodule Streampai.Repo.Migrations.AddChatMessagesUniqueIndex do
  use Ecto.Migration

  def change do
    create unique_index(:chat_messages, [:livestream_id, :username, :message, :inserted_at],
                        name: "chat_messages_unique_message_per_stream_index")
  end
end
