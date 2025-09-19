defmodule Streampai.Repo.Migrations.ChangeChatMessagesIdToString do
  use Ecto.Migration

  def change do
    # First drop the unique index that references the old UUID column
    drop_if_exists unique_index(:chat_messages, [:livestream_id, :username, :message],
                     name: "chat_messages_unique_message_per_stream_index"
                   )

    # Drop foreign key constraints
    drop constraint(:chat_messages, "chat_messages_user_id_fkey")
    drop constraint(:chat_messages, "chat_messages_livestream_id_fkey")

    # Change the primary key from UUID to string
    execute "ALTER TABLE chat_messages ALTER COLUMN id TYPE text",
            "ALTER TABLE chat_messages ALTER COLUMN id TYPE uuid USING id::uuid"

    # Recreate foreign key constraints
    alter table(:chat_messages) do
      modify :user_id,
             references(:users, column: :id, type: :uuid, name: "chat_messages_user_id_fkey")

      modify :livestream_id,
             references(:livestreams,
               column: :id,
               type: :uuid,
               name: "chat_messages_livestream_id_fkey"
             )
    end
  end
end
