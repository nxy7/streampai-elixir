defmodule Streampai.Repo.Migrations.RenameChatMessageColumnsAndAddIndexes do
  use Ecto.Migration

  def change do
    # Rename columns to be more descriptive with sender_ prefix (except platform)
    rename table(:chat_messages), :username, to: :sender_username
    rename table(:chat_messages), :channel_id, to: :sender_channel_id
    rename table(:chat_messages), :is_moderator, to: :sender_is_moderator
    rename table(:chat_messages), :is_patreon, to: :sender_is_patreon

    # Remove updated_at since messages are immutable
    alter table(:chat_messages) do
      remove :updated_at
    end

    # Add indexes for performance
    create index(:chat_messages, [:user_id], name: "idx_chat_messages_user_id")
    create index(:chat_messages, [:livestream_id], name: "idx_chat_messages_livestream_id")
    create index(:chat_messages, [:inserted_at], name: "idx_chat_messages_inserted_at")

    create index(:chat_messages, [:livestream_id, :inserted_at],
             name: "idx_chat_messages_stream_chrono"
           )
  end
end
